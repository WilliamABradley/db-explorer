use crate::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "level", content = "message")]
pub enum LogData {
  Debug(String),
  Info(String),
  Warn(String),
  Error(String),
  Fatal(String),
}

pub fn log(_log: LogData) -> () {
  postback_message(OutboundMessage::Log(_log));
}
