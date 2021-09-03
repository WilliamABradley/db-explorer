use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use strum_macros::EnumString;

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct InboundMessage {
  #[serde(rename = "type")]
  pub message_type: String,
  pub data: Option<DatabaseDriverMessage>,
}

#[derive(strum_macros::Display, EnumString)]
pub enum InboundMessageType {
  DatabaseDriver,
}

#[derive(strum_macros::Display, EnumString)]
pub enum OutboundMessageType {
  Result,
  Error,
}

#[derive(strum_macros::Display, EnumString)]
pub enum DatabaseDriverMessageType {
  Create,
  Connect,
  Close,
  Execute,
  Query,
  Flush,
}

#[derive(strum_macros::Display, EnumString)]
pub enum DriverErrorType {
  FatalError,
  ParseError,
  SerializeError,
  NoConnectionError,
  DriverError,
  UnknownMessage,
  UnknownDriver,
  UnknownError,
}

pub struct DriverError {
  pub error_type: DriverErrorType,
  pub message: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseDriverMessage {
  pub driver: String,
  pub id: Option<u32>,
  #[serde(rename = "type")]
  pub message_type: String,
  pub data: Option<serde_json::Value>,
}
