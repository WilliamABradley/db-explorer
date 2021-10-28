use crate::database::types::{DatabaseConnectionInfo, DatabaseQueryData};
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseDriverMessagePayload {
  pub driver: String,
  pub id: Option<i32>,
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
