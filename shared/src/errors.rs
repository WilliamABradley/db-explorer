use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "error_type", content = "error_data")]
pub enum DriverError {
  Error(String),
  FatalError(String),
  ParseError(String),
  SerializeError(String),
  NoConnectionError(DriverManagerUnknownConnection),
  UnknownMessage(DriverManagerUnknownType),
  UnknownDriver(DriverManagerUnknownType),
  UnknownError,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DriverManagerUnknownConnection {
  pub connection_type: String,
  pub connection_id: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DriverManagerUnknownType {
  pub unknown_from: String,
  pub unknown_type: String,
}
