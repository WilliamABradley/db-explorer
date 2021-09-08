pub mod database;
pub mod tunnel;

use database::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt::Debug;
use tunnel::*;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "class", content = "payload")]
pub enum InboundMessage {
  DatabaseDriver(DatabaseDriverMessagePayload),
  SSHTunnel(SSHTunnelMessagePayload),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum OutboundMessage {
  Result(Value),
  Error {
    error_type: DriverErrorType,
    error_message: String,
  },
}

#[derive(Serialize, Deserialize, Debug)]
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
