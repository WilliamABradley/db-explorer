pub mod database;

use crate::errors::DriverError;
use database::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "class", content = "payload")]
pub enum InboundMessage {
  DatabaseDriver(DatabaseDriverMessagePayload),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum OutboundMessage {
  Result(Value),
  Error(DriverError),
}
