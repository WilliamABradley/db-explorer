pub mod database;
pub mod tunnel;

use crate::errors::DriverError;
use crate::logger::LogData;
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
  Log(LogData),
  Error(DriverError),
}
