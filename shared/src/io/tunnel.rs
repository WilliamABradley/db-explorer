use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
pub struct SSHTunnelMessagePayload {
  pub id: Option<u32>,
  #[serde(flatten)]
  pub data: SSHTunnelMessage,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum SSHTunnelMessage {
  Test,
}
