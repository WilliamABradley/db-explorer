use crate::tunnel::types::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SSHTunnelMessagePayload {
  pub id: Option<u32>,
  #[serde(flatten)]
  pub data: SSHTunnelMessage,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum SSHTunnelMessage {
  Create(SSHTunnelConfiguration),
  Connect(SSHConnectionTarget),
  Close,
  Flush,
}
