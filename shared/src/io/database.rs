use crate::drivers::types::DatabaseConnectionInfo;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseDriverMessagePayload {
  pub driver: String,
  pub id: Option<u32>,
  #[serde(flatten)]
  pub data: DatabaseDriverMessage,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum DatabaseDriverMessage {
  Create(DatabaseConnectionInfo),
  Connect,
  Close,
  Execute(DatabaseQueryData),
  Query(DatabaseQueryData),
  Flush,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseQueryData {
  pub sql: String,
  pub variables: Option<HashMap<String, String>>,
}
