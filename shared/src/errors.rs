use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use thiserror::Error;

#[derive(Serialize, Deserialize, Error, Debug)]
#[serde(tag = "error_type")]
pub enum DriverError {
  #[error("{0}")]
  Error(String),
  #[error("{0}")]
  FatalError(String),
  #[error("Failed to parse message: {0}")]
  ParseError(String),
  #[error("Failed to serialize message: {0}")]
  SerializeError(String),
  #[error("Connection {0} not found")]
  NoConnectionError(u32),
  #[error("Received unhandled message type: {0}")]
  UnknownMessage(String),
  #[error("Unknown Driver: {0}")]
  UnknownDriver(String),
  #[error("Unknown Error")]
  UnknownError,
}
