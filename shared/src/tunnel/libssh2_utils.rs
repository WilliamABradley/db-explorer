use super::types::{SSHTunnelAuthenticationMethod, SSHTunnelConfiguration, SSHTunnelPortForward};

use super::async_session::SshSession;
use crate::logger::*;
use crate::RUNTIME;
use async_executor::{Executor, LocalExecutor, Task};
use async_io::Async;
use async_ssh2_lite::SessionConfiguration;
use easy_parallel::Parallel;
use futures::executor::block_on;
use futures::future::FutureExt;
use futures::select;
use futures::{AsyncReadExt, AsyncWriteExt};
use futures_lite::{pin, stream::StreamExt};
use std::env;
use std::io::{Error, ErrorKind, Result};
use std::net::{SocketAddr, TcpListener, TcpStream, ToSocketAddrs};
use std::sync::Arc;
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

/* pub async fn legacy_run_port_forward(
  session: &SshSession,
  remote_host: &String,
  remote_port: u16,
  local_addr: SocketAddr,
) -> Result<()> {
  let mut receivers = vec![];
  let (listener_task_sender, receiver) = async_channel::unbounded();
  receivers.push(receiver);
  let (forwarder_task_sender, receiver) = async_channel::unbounded();
  receivers.push(receiver);

  let mut channel = configure_forward_channel(session, remote_host, remote_port).await?;

  let listener_task: Task<Result<()>> = ex.clone().spawn(async move {
    let listener = Async::<TcpListener>::bind(local_addr)?;
    let (mut read_stream, _) = listener.accept().await?;

    let forwarder_task: Task<Result<()>> = ex.clone().spawn(async move {
      let mut buf_channel = vec![0; 2048];
      let mut buf_read_stream = vec![0; 2048];

      loop {
        log(LogData::Debug("Loop begin".into()));
        select! {
          ret_read_stream = read_stream.read(&mut buf_read_stream).fuse() => match ret_read_stream {
            Ok(n) if n == 0 => {
              log(LogData::Debug("read_stream read 0".into()));
              break
            },
            Ok(n) => {
              log(LogData::Debug(format!("read_stream read {}", n)));
              channel.write(&buf_read_stream[..n]).await.map(|_| ()).map_err(|err| {
                log(LogData::Error(format!(
                  "channel write failed, err {:?}", err
                )));
                err
              })?
            },
            Err(err) =>  {
              log(LogData::Error(format!(
                "read_stream read failed, err {:?}", err
              )));
              return Err(err);
            }
          },
          ret_channel = channel.read(&mut buf_channel).fuse() => match ret_channel {
            Ok(n) if n == 0 => {
              log(LogData::Debug("channel read 0".into()));
              break
            },
            Ok(n) => {
              log(LogData::Debug(format!("channel read {}", n)));
              read_stream.write(&buf_channel[..n]).await.map(|_| ()).map_err(|err| {
                log(LogData::Error(format!(
                  "read_stream write failed, err {:?}", err
                )));
                err
              })?
            },
            Err(err) => {
              log(LogData::Error(format!(
                "channel read failed, err {:?}", err
              )));
              return Err(err);
            }
          },
        }
      }
      forwarder_task_sender
        .send("Closed Port Forward")
        .await
        .unwrap();
      Ok(())
    });
    forwarder_task.detach();
    listener_task_sender.send("Closed Listener").await.unwrap();
    Ok(())
  });

  log(LogData::Debug("Starting listener task".into()));
  listener_task.await.map_err(|err| {
    log(LogData::Error(format!(
      "listener_task run failed, err {:?}",
      err
    )));
    err
  })?;

  log(LogData::Debug("Processing receivers".into()));
  for receiver in receivers {
    let msg = receiver.recv().await.unwrap();
    log(LogData::Debug(format!("{}", msg)));
  }

  return Result::Ok(());
} */

/* async fn run(
  ex: Arc<Executor<'_>>,
  session: SSHTunnelConfiguration,
  target: SSHTunnelPortForward,
) -> Result<()> {
  let addr = env::args()
    .nth(1)
    .unwrap_or_else(|| env::var("ADDR").unwrap_or_else(|_| "127.0.0.1:22".to_owned()));
  let username = env::args()
    .nth(2)
    .unwrap_or_else(|| env::var("USERNAME").unwrap_or_else(|_| "root".to_owned()));
  let bastion_addr = env::args()
    .nth(3)
    .unwrap_or_else(|| env::var("BASTION_ADDR").unwrap_or_else(|_| "127.0.0.1:22".to_owned()));
  let bastion_username = env::args()
    .nth(4)
    .unwrap_or_else(|| env::var("BASTION_USERNAME").unwrap_or_else(|_| "root".to_owned()));

  let addr = format!("{}:{}", target.remote_host, target.remote_port)
    .to_socket_addrs()
    .unwrap()
    .next()
    .unwrap();
  let bastion_addr = format!("{}:{}", configuration.host, configuration.port)
    .to_socket_addrs()
    .unwrap()
    .next()
    .unwrap();

  //
  let mut receivers = vec![];
  let (listener_task_sender, receiver) = async_channel::unbounded();
  receivers.push(receiver);
  let (forwarder_task_sender, receiver) = async_channel::unbounded();
  receivers.push(receiver);

  let listener_task: Task<io::Result<()>> = ex.clone().spawn(async move {
        let bastion_stream = Async::<TcpStream>::connect(bastion_addr).await?;

        let mut bastion_session = AsyncSession::new(bastion_stream, None)?;

        bastion_session.handshake().await?;

        bastion_session
            .userauth_agent(bastion_username.as_ref())
            .await?;

        if !bastion_session.authenticated() {
            return Err(bastion_session
                .last_error()
                .and_then(|err| Some(Error::from(err)))
                .unwrap_or(Error::new(
                    ErrorKind::Other,
                    "bastion unknown userauth error",
                )));
        }

        let mut channel = bastion_session.channel_session().await?;
        channel.exec("hostname").await?;
        let mut s = String::new();
        channel.read_to_string(&mut s).await?;
        println!("bastion hostname: {}", s);
        channel.close().await?;
        println!("bastion channel exit_status: {}", channel.exit_status()?);

        let mut channel = bastion_session
            .channel_direct_tcpip(addr.ip().to_string().as_ref(), addr.port(), None)
            .await?;

        //
        let (forward_stream_s, mut read_stream) = {
          let listen_addr = TcpListener::bind(format!("localhost:{}", target.local_port))
          .unwrap()
          .local_addr()
          .unwrap();
          let listener = Async::<TcpListener>::bind(listen_addr)?;
          let stream_s = Async::<TcpStream>::connect(listen_addr).await?;

          let (stream_r,_) = listener.accept().await.unwrap();

          (stream_s, stream_r)
        };

        let forwarder_task: Task<io::Result<()>> = ex.clone().spawn(async move {
            let mut buf_channel = vec![0; 2048];
            let mut buf_read_stream = vec![0; 2048];

            loop {
                select! {
                    ret_read_stream = read_stream.read(&mut buf_read_stream).fuse() => match ret_read_stream {
                        Ok(n) if n == 0 => {
                            println!("read_stream read 0");
                            break
                        },
                        Ok(n) => {
                            println!("read_stream read {}", n);
                            channel.write(&buf_read_stream[..n]).await.map(|_| ()).map_err(|err| {
                                eprintln!("channel write failed, err {:?}", err);
                                err
                            })?
                        },
                        Err(err) =>  {
                            eprintln!("read_stream read failed, err {:?}", err);

                            return Err(err);
                        }
                    },
                    ret_channel = channel.read(&mut buf_channel).fuse() => match ret_channel {
                        Ok(n) if n == 0 => {
                            println!("channel read 0");
                            break
                        },
                        Ok(n) => {
                            println!("channel read {}", n);
                            read_stream.write(&buf_channel[..n]).await.map(|_| ()).map_err(|err| {
                                eprintln!("read_stream write failed, err {:?}", err);
                                err
                            })?
                        },
                        Err(err) => {
                            eprintln!("channel read failed, err {:?}", err);

                            return Err(err);
                        }
                    },
                }
            }

            forwarder_task_sender.send("done_with_forward").await.unwrap();

            Ok(())
        });
        forwarder_task.detach();

        //
        let mut session = AsyncSession::new(forward_stream_s, None)?;
        session.handshake().await?;

        session.userauth_agent(username.as_ref()).await?;

        if !session.authenticated() {
            return Err(session
                .last_error()
                .and_then(|err| Some(Error::from(err)))
                .unwrap_or(Error::new(
                    ErrorKind::Other,
                    "unknown userauth error",
                )));
        }

        let mut channel = session.channel_session().await?;
        channel.exec("hostname").await?;
        let mut s = String::new();
        channel.read_to_string(&mut s).await?;
        println!("hostname: {}", s);
        channel.close().await?;
        println!("channel exit_status: {}", channel.exit_status()?);

        session.disconnect(None, "foo", None).await?;

        listener_task_sender.send("done_with_main").await.unwrap();

        Ok(())
    });

  //
  listener_task.await.map_err(|err| {
    eprintln!("listener_task run failed, err {:?}", err);

    err
  })?;

  for receiver in receivers {
    let msg = receiver.recv().await.unwrap();
    println!("{}", msg);
  }

  Ok(())
}
 */
