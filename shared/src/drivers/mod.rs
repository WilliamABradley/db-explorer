pub mod types;

use async_trait::async_trait;
use std::collections::HashMap;
use std::str::FromStr;
use types::*;

#[async_trait]
pub trait DatabaseDriver {
  async fn create(&self, connection_info: &HashMap<String, String>) -> Result<u32, DatabaseError>;
  async fn connect(&self, id: &u32) -> Result<(), DatabaseError>;
  async fn close(&self, id: &u32) -> Result<(), DatabaseError>;
  async fn execute(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<u64, DatabaseError>;
  async fn query(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<DatabaseQueryResult, DatabaseError>;
  async fn flush(&self) -> Result<(), DatabaseError>;
}

pub mod postgres;

pub fn get_driver(driver_type: &str) -> &impl DatabaseDriver {
  let type_enum = DriverType::from_str(driver_type).ok();

  match type_enum {
    Some(DriverType::Postgres) => &postgres::PostgresDriver {},
    _ => std::panic!("Unknown Driver Name: {}", driver_type),
  }
}
