use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use strum_macros::EnumString;

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug)]
pub struct InboundMessage {
  pub r#type: String,
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
  NoConnectionError,
  UnknownMessage,
  UnknownDriver,
  UnknownError,
}

pub struct DriverError {
  pub r#type: DriverErrorType,
  pub message: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseDriverMessage {
  pub driver: String,
  pub r#type: String,
  pub data: serde_json::Value,
}
