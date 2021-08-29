use async_trait::async_trait;
use std::collections::HashMap;
use std::error::Error;
use std::fmt;

#[allow(non_snake_case)]
pub struct DatabaseColumnInfo {
  pub name: String,
  pub dataType: String,
}

#[allow(non_snake_case)]
pub struct DatabaseValueInfo {
  pub value: Option<String>,
  pub isNull: bool,
}

#[allow(non_snake_case)]
pub struct DatabaseQueryResult {
  pub columns: Vec<DatabaseColumnInfo>,
  pub rows: Vec<Vec<DatabaseValueInfo>>,
}

#[derive(Debug)]
pub struct NoConnectionError {
  pub id: u32,
}
impl fmt::Display for NoConnectionError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Connection {} not found", self.id)
  }
}
impl Error for NoConnectionError {}

pub type DatabaseError = Box<dyn Error>;

#[async_trait]
pub trait DatabaseDriver {
  fn create(&self, connection_info: &HashMap<String, String>) -> Result<u32, DatabaseError>;
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

pub fn get_driver(driver_name: &str) -> Box<dyn DatabaseDriver> {
  match driver_name {
    "postgres" => Box::new(postgres::PostgresDriver {}),
    _ => std::panic!("Unknown Driver Name: {}", driver_name),
  }
}
