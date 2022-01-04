use crate::tunnel::types::{SSHTunnelConfiguration, SSHTunnelPortForward};
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
pub struct SSHTunnelMessagePayload {
  pub driver: String,
  pub id: Option<i32>,
  #[serde(flatten)]
  pub data: SSHTunnelMessage,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum SSHTunnelMessage {
  Create(SSHTunnelConfiguration),
  TestAuth,
  Connect(SSHTunnelPortForward),
  Close,
  Flush,
}
