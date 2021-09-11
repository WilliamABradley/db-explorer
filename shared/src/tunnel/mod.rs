pub mod types;

use crate::errors::DriverError;
use async_trait::async_trait;
use futures_util::lock::Mutex;
use std::cell::Cell;
use std::collections::HashMap;
use std::error::Error;
use std::io::Read;
use std::str;
use std::sync::Arc;
use std::sync::RwLock;
use thrussh::server::{Auth, Session};
use thrussh::*;
use thrussh_keys::*;
use types::*;

#[async_trait]
pub trait SSHTunnelInterface {
  async fn connect(&self, target: &SSHConnectionTarget)
    -> Result<SSHTunnelConnection, DriverError>;
  async fn close(&self) -> Result<(), DriverError>;
}

pub struct SSHTunnel {
  pub configuration: SSHTunnelConfiguration,
  pub session: Mutex<Option<thrussh::client::Handle<SSHTunnelClient>>>,
}

pub struct SSHTunnelClient {}

#[async_trait]
impl SSHTunnelInterface for SSHTunnel {
  async fn connect(
    &self,
    target: &SSHConnectionTarget,
  ) -> Result<SSHTunnelConnection, DriverError> {
    let config = thrussh::client::Config::default();
    let config = Arc::new(config);

    let mut address: String = "".to_owned();
    address.push_str(&self.configuration.host);
    address.push_str(":");
    address.push_str(&self.configuration.port);

    let client = SSHTunnelClient {};
    let session_result = thrussh::client::connect(config, address, client).await;
    if session_result.is_err() {
      return Result::Err(DriverError::Error(format!(
        "{}",
        session_result.err().unwrap()
      )));
    }
    let mut session = self.session.lock().await;
    *session = Some(session_result.unwrap());
    return Result::Ok(SSHTunnelConnection { local_port: 0 });
  }
  async fn close(&self) -> Result<(), DriverError> {
    let mut session = self.session.lock().await;

    // or use in match, notice &mut borrowing
    match &mut *session {
      Some(session) => {
        let result = session
          .disconnect(Disconnect::ByApplication, "", "English")
          .await;

        if result.is_err() {
          return Result::Err(DriverError::Error(format!("{}", result.err().unwrap())));
        }
        return Result::Ok(());
      }
      None => {
        return Result::Err(DriverError::Error("Tunnel not open".into()));
      }
    }
  }
}

type SSHError = anyhow::Error;

impl client::Handler for SSHTunnelClient {
  type Error = SSHError;
  type FutureUnit = futures::future::Ready<Result<(Self, client::Session), SSHError>>;
  type FutureBool = futures::future::Ready<Result<(Self, bool), SSHError>>;

  fn finished_bool(self, b: bool) -> Self::FutureBool {
    futures::future::ready(Ok((self, b)))
  }
  fn finished(self, session: client::Session) -> Self::FutureUnit {
    futures::future::ready(Ok((self, session)))
  }
  fn check_server_key(self, server_public_key: &key::PublicKey) -> Self::FutureBool {
    println!("check_server_key: {:?}", server_public_key);
    self.finished_bool(true)
  }
  fn channel_open_confirmation(
    self,
    channel: ChannelId,
    max_packet_size: u32,
    window_size: u32,
    session: client::Session,
  ) -> Self::FutureUnit {
    println!("channel_open_confirmation: {:?}", channel);
    self.finished(session)
  }
  fn data(self, channel: ChannelId, data: &[u8], session: client::Session) -> Self::FutureUnit {
    println!(
      "data on channel {:?}: {:?}",
      channel,
      std::str::from_utf8(data)
    );
    self.finished(session)
  }
}
