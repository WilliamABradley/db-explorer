use super::*;
use crate::logger::*;
use libssh2_utils::{configure_session, AsyncLibSSHSession};

use async_executor::{Executor, LocalExecutor, Task};
use async_io::Async;
use async_trait::async_trait;
use easy_parallel::Parallel;
use futures::executor::block_on;
use futures::future::FutureExt;
use futures::select;
use futures::{AsyncReadExt, AsyncWriteExt};
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use ssh2::{Channel, Session};
use std::collections::HashMap;
use std::env;
use std::io::{Error, ErrorKind};
use std::net::{TcpListener, TcpStream, ToSocketAddrs};
use std::sync::Arc;

lazy_static! {
  static ref _CONFIGS: Mutex<HashMap<i32, SSHTunnelConfiguration>> = Mutex::new(HashMap::new());
  static ref _INSTANCES: Mutex<HashMap<i32, AsyncLibSSHSession>> = Mutex::new(HashMap::new());
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
