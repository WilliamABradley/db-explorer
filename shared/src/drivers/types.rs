use std::error::Error;
use std::fmt;
use std::fmt::Debug;
use strum_macros::EnumString;

#[derive(strum_macros::Display, EnumString)]
pub enum DriverType {
  Postgres,
}

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
