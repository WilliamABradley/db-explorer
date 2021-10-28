use super::*;
use crate::logger::*;
use async_executor::{Executor, LocalExecutor, Task};
use async_trait::async_trait;
use futures::select;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use ssh2::{Channel, Session};
use std::collections::HashMap;
use std::net::{Shutdown, TcpListener, TcpStream};

lazy_static! {
  static ref _CONFIGS: Mutex<HashMap<i32, SSHTunnelConfiguration>> = Mutex::new(HashMap::new());
  static ref _INSTANCES: Mutex<HashMap<i32, SSH2TunnelDriverConnection>> =
    Mutex::new(HashMap::new());
}

#[derive(Debug)]
pub struct SSH2TunnelDriver;

struct SSH2TunnelDriverConnection {
  tcp: TcpStream,
  session: Mutex<Session>,
}

impl SSH2TunnelDriver {
  async fn open_client(&self, id: &i32) -> Result<(), DriverError> {
    let configs = _CONFIGS.lock().await;
    if !configs.contains_key(id) {
      return Result::Err(DriverError::NoConnectionError(
        DriverManagerUnknownConnection {
          connection_type: "Postgres".into(),
          connection_id: *id,
        },
      ));
    }
    let configuration = &configs[id];
    drop(&configs);

    log(LogData::Info(format!(
      "Connecting to {}@{}:{} via {}",
      configuration.username,
      configuration.host,
      configuration.port,
      configuration.authentication_method,
    )));

    let tcp = TcpStream::connect(format!("{}:{}", configuration.host, configuration.port))?;
    let mut session = Session::new()?;

    session.set_tcp_stream(tcp.try_clone()?);
    session.set_compress(true);
    session.handshake()?;

    let _ = match &configuration.authentication_method {
      SSHTunnelAuthenticationMethod::Agent => {
        session.userauth_agent(&configuration.username)?;
      }
      SSHTunnelAuthenticationMethod::Password(pass) => {
        session.userauth_password(&configuration.username, &pass)?;
      }
      SSHTunnelAuthenticationMethod::PublicKey {
        private_key,
        passphrase,
      } => {
        let mut passphrase_data: Option<&str> = None;
        if passphrase.is_some() {
          passphrase_data = Some(passphrase.as_ref().unwrap());
        }
        session.userauth_pubkey_memory(
          &configuration.username,
          None,
          &private_key,
          passphrase_data,
        )?;
      }
    };

    if !session.authenticated() {
      return Result::Err(DriverError::Error("Authentication Failed".into()));
    }

    let instance = SSH2TunnelDriverConnection {
      tcp: tcp,
      session: Mutex::new(session),
    };

    let mut instances = _INSTANCES.lock().await;
    instances.insert(*id, instance);

    return Result::Ok(());
  }

  async fn close_client(&self, id: &i32) -> Result<(), DriverError> {
    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(id) {
      return Result::Err(DriverError::NoConnectionError(
        DriverManagerUnknownConnection {
          connection_type: "ssh2".into(),
          connection_id: *id,
        },
      ));
    }
    let connection = &instances[id];
    drop(&instances);

    let session = connection.session.lock().await;

    let session_disconnect_res = session.disconnect(None, "Closed", None);
    let tcp_shutdown_res = connection.tcp.shutdown(Shutdown::Both);

    if session_disconnect_res.is_err() {
      return Result::Err(DriverError::Error(format!(
        "{}",
        session_disconnect_res.err().unwrap()
      )));
    }

    if tcp_shutdown_res.is_err() {
      return Result::Err(DriverError::Error(format!(
        "{}",
        tcp_shutdown_res.err().unwrap()
      )));
    }

    return Result::Ok(());
  }

  async fn handle_incoming(
    &self,
    id: &i32,
    remote_host: &str,
    remote_port: u16,
    forward_stream_r: &TcpStream,
  ) -> Result<(), DriverError> {
    let instances = _INSTANCES.lock().await;
    let connection = &instances[id];
    drop(&instances);

    let session = connection.session.lock().await;

    let mut bastion_channel = session.channel_direct_tcpip(remote_host, remote_port, None)?;

    let task_with_forward: Task<Result<(), DriverError>> = ex.clone().spawn(async move {
      let mut buf_bastion_channel = vec![0; 2048];
      let mut buf_forward_stream_r = vec![0; 2048];

      loop {
          select! {
              ret_forward_stream_r = forward_stream_r.read(&mut buf_forward_stream_r).fuse() => match ret_forward_stream_r {
                  Ok(n) if n == 0 => {
                      println!("forward_stream_r read 0");
                      break
                  },
                  Ok(n) => {
                      println!("forward_stream_r read {}", n);
                      bastion_channel.write(&buf_forward_stream_r[..n]).await.map(|_| ()).map_err(|err| {
                          eprintln!("bastion_channel write failed, err {:?}", err);
                          err
                      })?
                  },
                  Err(err) =>  {
                      eprintln!("forward_stream_r read failed, err {:?}", err);

                      return Err(err);
                  }
              },
              ret_bastion_channel = bastion_channel.read(&mut buf_bastion_channel).fuse() => match ret_bastion_channel {
                  Ok(n) if n == 0 => {
                      println!("bastion_channel read 0");
                      break
                  },
                  Ok(n) => {
                      println!("bastion_channel read {}", n);
                      forward_stream_r.write(&buf_bastion_channel[..n]).await.map(|_| ()).map_err(|err| {
                          eprintln!("forward_stream_r write failed, err {:?}", err);
                          err
                      })?
                  },
                  Err(err) => {
                      eprintln!("bastion_channel read failed, err {:?}", err);

                      return Err(err);
                  }
              },
          }
      }

      sender_with_forward.send("done_with_forward").await.unwrap();

      Ok(())
  });
    task_with_forward.detach();

    return Result::Ok(());
  }
}

#[async_trait]
impl TunnelDriver for SSH2TunnelDriver {
  async fn create(&self, configuration: &SSHTunnelConfiguration) -> Result<i32, DriverError> {
    let mut configs = _CONFIGS.lock().await;
    let id = configs.keys().len() as i32;
    configs.insert(id, configuration.clone());
    return Result::Ok(id);
  }

  async fn test_auth(&self, id: &i32) -> Result<(), DriverError> {
    self.open_client(id).await?;
    self.close_client(id).await?;
    return Result::Ok(());
  }

  async fn connect(&self, id: &i32, target: &SSHTunnelPortForward) -> Result<u16, DriverError> {
    self.open_client(id).await?;

    let instances = _INSTANCES.lock().await;
    let connection = &instances[id];
    drop(&instances);

    let session = connection.session.lock().await;

    let remote_host = &target.remote_host;
    let remote_port = target.remote_port;

    let listener = TcpListener::bind(format!(
      "localhost:{}",
      target.local_port.or(Some(0)).unwrap()
    ))?;
    let local_port = listener.local_addr()?.port();

    log(LogData::Info(format!(
      "Opening SSH Port Forward 127.0.0.1:{} > {}:{}",
      local_port, remote_host, remote_port,
    )));

    std::thread::spawn(move || for stream in listener.incoming() {});

    log(LogData::Info(format!(
      "Opened SSH Port Forward 127.0.0.1:{} > {}:{}",
      local_port, remote_host, remote_port,
    )));

    return Result::Ok(local_port);
  }

  async fn close(&self, id: &i32) -> Result<(), DriverError> {
    self.close_client(id).await?;
    return Result::Ok(());
  }

  async fn flush(&self) -> Result<(), DriverError> {
    let mut configs = _CONFIGS.lock().await;
    let mut instances = _INSTANCES.lock().await;

    let key_count = instances.keys().len() as i32;
    for index in 0..key_count {
      let id = index + 1;
      let _ = self.close(&id).await;
      instances.remove(&id);
      configs.remove(&id);
    }
    return Result::Ok(());
  }
}

impl std::convert::From<ssh2::Error> for DriverError {
  fn from(error: ssh2::Error) -> Self {
    return DriverError::Error(format!("{}", error));
  }
}
