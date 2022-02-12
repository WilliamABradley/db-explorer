use super::types::{SSHTunnelAuthenticationMethod, SSHTunnelConfiguration};

use super::async_session::SshSession;
use crate::logger::*;
use crate::RUNTIME;
use async_io::Async;
use async_ssh2_lite::SessionConfiguration;
use futures::future::FutureExt;
use futures::{AsyncReadExt, AsyncWriteExt};
use std::io::{Error, ErrorKind, Result};
use std::net::{SocketAddr, TcpListener, TcpStream, ToSocketAddrs};
use tokio::sync::{oneshot, oneshot::Receiver};

pub type AsyncSession = async_ssh2_lite::AsyncSession<TcpStream>;
pub type AsyncChannel = async_ssh2_lite::AsyncChannel<TcpStream>;

#[derive(Debug)]
pub enum SshForwarderEnd {
  /// Failed to connect to local TCP listener.
  LocalConnectFail(Error),
  /// Local TCP stream reached EOF.
  LocalReadEof,
  /// IO error when writing data to SSH channel.
  ///
  /// This may happen due to any of:
  ///
  /// * SSH connection breaking, e.g. due to timeout or flakey connection.
  /// * Target host closing the connection, and how that propagates through
  ///   the SSH channel.
  LocalToChannelWriteErr(Error),
  /// IO error when reading from local TCP stream.
  LocalReadErr(Error),
  /// Read from SSH channel reached EOF.
  ChannelReadEof,
  /// IO error when writing data to local TCP stream.
  ///
  /// This happens when the local connection is closed when data is still
  /// being written.
  ChannelToLocalWriteErr(Error),
  /// IO error when reading from SSH channel.
  ChannelReadErr(Error),
}

pub async fn configure_session(config: &SSHTunnelConfiguration) -> Result<SshSession> {
  let addr = format!("{}:{}", config.host, config.port)
    .to_socket_addrs()
    .unwrap()
    .next()
    .unwrap();

  let mut session_configuration = SessionConfiguration::new();
  session_configuration.set_compress(true);

  let stream = Async::<TcpStream>::connect(addr).await?;
  let mut session = AsyncSession::new(stream, Some(session_configuration))?;
  session.handshake().await?;

  let _ = match &config.authentication_method {
    SSHTunnelAuthenticationMethod::Agent => {
      session.userauth_agent(&config.username).await?;
    }
    SSHTunnelAuthenticationMethod::Password(pass) => {
      session.userauth_password(&config.username, &pass).await?;
    }
    SSHTunnelAuthenticationMethod::PublicKey {
      private_key,
      passphrase,
    } => {
      let mut passphrase_data: Option<&str> = None;
      if passphrase.is_some() {
        passphrase_data = Some(passphrase.as_ref().unwrap());
      }
      session
        .userauth_pubkey_memory(&config.username, None, &private_key, passphrase_data)
        .await?;
    }
  };

  if !session.authenticated() {
    return Err(
      session
        .last_error()
        .and_then(|err| Some(Error::from(err)))
        .unwrap_or(Error::new(ErrorKind::Other, "Authentication Failed")),
    );
  }

  return Result::Ok(SshSession(session));
}

pub async fn configure_forward_channel(
  session: &SshSession,
  remote_host: &String,
  remote_port: u16,
) -> Result<AsyncChannel> {
  let target_addr = format!("{}:{}", remote_host, remote_port)
    .to_socket_addrs()
    .unwrap()
    .next()
    .unwrap();

  let channel = session
    .channel_direct_tcpip(
      target_addr.ip().to_string().as_ref(),
      target_addr.port(),
      None,
    )
    .await?;

  return Result::Ok(channel);
}

// based on ssh_jumper.
async fn spawn_channel_streamers<'tunnel>(
  local_socket: SocketAddr,
  mut jump_host_channel: AsyncChannel,
) -> Result<(SocketAddr, Receiver<SshForwarderEnd>)> {
  let local_socket_addr = TcpListener::bind(local_socket)?.local_addr()?;
  let local_socket_listener = Async::<TcpListener>::bind(local_socket_addr)?;
  let (ssh_forwarder_tx, ssh_forwarder_rx) = oneshot::channel::<SshForwarderEnd>();

  let spawn_join_handle = tokio::task::spawn(async move {
    let _detached_task = tokio::task::spawn(async move {
      let mut buf_jump_host_channel = vec![0; 2048];
      let mut buf_forward_stream_r = vec![0; 2048];

      match local_socket_listener.accept().await {
        Ok((mut forward_stream_r, _)) => loop {
          futures::select! {
              ret_forward_stream_r = forward_stream_r.read(&mut buf_forward_stream_r).fuse() => match ret_forward_stream_r {
                  Ok(0) => {
                      let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::LocalReadEof);
                      break;
                  },
                  Ok(n) => {
                      if let Err(e) = jump_host_channel.write(&buf_forward_stream_r[..n]).await.map(|_| ()).map_err(|err| {
                          err
                      }) {
                          let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::LocalToChannelWriteErr(e));
                          break;
                      }
                  },
                  Err(e) => {
                      let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::LocalReadErr(e));
                      break;
                  }
              },
              ret_jump_host_channel = jump_host_channel.read(&mut buf_jump_host_channel).fuse() => match ret_jump_host_channel {
                  Ok(0) => {
                      let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::ChannelReadEof);
                      break;
                  },
                  Ok(n) => {
                      if let Err(e) = forward_stream_r.write(&buf_jump_host_channel[..n]).await.map(|_| ()).map_err(|err| {
                          err
                      }) {
                          let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::ChannelToLocalWriteErr(e));
                          break;
                      }
                  },
                  Err(e) => {
                      let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::ChannelReadErr(e));
                      break;
                  }
              },
          }
        },
        Err(e) => {
          let _send_result = ssh_forwarder_tx.send(SshForwarderEnd::LocalConnectFail(e));
        }
      }
    });
  });

  log(LogData::Debug("Awaiting join handle".into()));
  spawn_join_handle.await?;
  log(LogData::Debug("Exited join handle".into()));

  Ok((local_socket_addr, ssh_forwarder_rx))
}

pub async fn run_port_forward(
  session: &SshSession,
  remote_host: &String,
  remote_port: u16,
  local_addr: SocketAddr,
) -> Result<()> {
  log(LogData::Debug("Configuring forward channel".into()));
  let channel = configure_forward_channel(session, remote_host, remote_port).await?;

  log(LogData::Debug("Spawning Tunnel".into()));
  RUNTIME.spawn(spawn_channel_streamers(local_addr, channel));
  return Result::Ok(());
}
