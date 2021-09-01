use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt;
use std::fmt::Debug;
use strum_macros::EnumString;

#[derive(strum_macros::Display, EnumString)]
pub enum DriverType {
  Postgres,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseColumnInfo {
  pub name: String,
  pub dataType: String,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseQueryResult {
  pub columns: Vec<DatabaseColumnInfo>,
  pub rows: Vec<Vec<Option<String>>>,
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

#[derive(Debug)]
pub struct InvalidError {
  pub message: String,
}
impl fmt::Display for InvalidError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.message)
  }
}
impl Error for InvalidError {}

pub type DatabaseError = Box<dyn Error>;
