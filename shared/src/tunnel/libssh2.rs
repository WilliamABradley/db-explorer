use super::*;
use crate::logger::*;
use async_session::SshSession;
use async_trait::async_trait;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use libssh2_utils::{configure_session, run_port_forward};
use std::collections::HashMap;
use std::net::TcpListener;

lazy_static! {
  static ref _CONFIGS: Mutex<HashMap<i32, SSHTunnelConfiguration>> = Mutex::new(HashMap::new());
  static ref _INSTANCES: Mutex<HashMap<i32, SshSession>> = Mutex::new(HashMap::new());
}

#[derive(Debug)]
pub struct SSH2TunnelDriver;

impl SSH2TunnelDriver {
  async fn open_client(&self, id: &i32) -> Result<(), DriverError> {
    let configs = _CONFIGS.lock().await;
    if !configs.contains_key(id) {
      return Result::Err(DriverError::NoConnectionError(
        DriverManagerUnknownConnection {
          connection_type: "ssh2".into(),
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

    let instance = configure_session(configuration).await?;

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
    let session = &instances[id];
    drop(&instances);

    session.disconnect(None, "Closed", None).await?;
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
    let session = &instances[id];
    drop(&instances);

    let remote_host = &target.remote_host;
    let remote_port = target.remote_port;

    // Get Listen Address, this resolves the port if the port is 0 (Random).
    let listen_addr = TcpListener::bind(format!("localhost:{}", target.local_port.unwrap_or(0)))
      .unwrap()
      .local_addr()
      .unwrap();
    let local_port = listen_addr.port();

    log(LogData::Info(format!(
      "Opening LIBSSH2 Port Forward 127.0.0.1:{} > {}:{}",
      local_port, remote_host, remote_port,
    )));

    run_port_forward(session, remote_host, remote_port, listen_addr).await?;

    log(LogData::Info(format!(
      "Opened LIBSSH2 Port Forward 127.0.0.1:{} > {}:{}",
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
