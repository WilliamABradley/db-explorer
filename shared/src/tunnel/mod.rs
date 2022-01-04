pub mod libssh2;
pub mod types;

use crate::errors::*;
use async_trait::async_trait;
use std::str::FromStr;
use types::*;

#[async_trait]
pub trait TunnelDriver {
  async fn create(&self, configuration: &SSHTunnelConfiguration) -> Result<i32, DriverError>;
  async fn test_auth(&self, id: &i32) -> Result<(), DriverError>;
  async fn connect(&self, id: &i32, target: &SSHTunnelPortForward) -> Result<u16, DriverError>;
  async fn close(&self, id: &i32) -> Result<(), DriverError>;
  async fn flush(&self) -> Result<(), DriverError>;
}

pub fn get_driver(driver_type: &str) -> Option<&impl TunnelDriver> {
  let type_enum = TunnelDriverType::from_str(driver_type).ok();

  return match type_enum {
    Some(TunnelDriverType::LIBSSH2) => Some(&libssh2::SSH2TunnelDriver {}),
    _ => None,
  };
}
