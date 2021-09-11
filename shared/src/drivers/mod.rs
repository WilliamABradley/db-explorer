pub mod types;

use crate::errors::*;
use async_trait::async_trait;
use std::collections::HashMap;
use std::str::FromStr;
use types::*;

#[async_trait]
pub trait DatabaseDriver {
  async fn create(&self, connection_info: &DatabaseConnectionInfo) -> Result<u32, DriverError>;
  async fn connect(&self, id: &u32) -> Result<(), DriverError>;
  async fn close(&self, id: &u32) -> Result<(), DriverError>;
  async fn execute(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<u64, DriverError>;
  async fn query(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<DatabaseQueryResult, DriverError>;
  async fn flush(&self) -> Result<(), DriverError>;
}

pub mod postgres;

pub fn get_driver(driver_type: &str) -> Option<&impl DatabaseDriver> {
  let type_enum = DriverType::from_str(driver_type).ok();

  return match type_enum {
    Some(DriverType::Postgres) => Some(&postgres::PostgresDriver {}),
    _ => None,
  };
}
