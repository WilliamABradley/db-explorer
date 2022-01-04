use serde::{Deserialize, Serialize, Serializer};
use std::collections::HashMap;
use std::fmt::Debug;
use std::str;
use strum_macros::EnumString;

#[derive(strum_macros::Display, EnumString)]
pub enum DatabaseDriverType {
  Postgres,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DatabaseConnectionInfo {
  pub host: String,
  pub port: i32,
  pub ssl: bool,
  pub username: Option<String>,
  pub password: Option<String>,
  pub database: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseColumnInfo {
  pub name: String,
  #[serde(rename = "dataType")]
  pub data_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseQueryData {
  pub sql: String,
  pub variables: Option<HashMap<String, String>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseQueryResult {
  pub columns: Vec<DatabaseColumnInfo>,
  // A vector of rows, containg a vector or columns, containing a vector of bytes.
  #[serde(serialize_with = "row_serialize")]
  pub rows: Vec<Vec<Option<Vec<u8>>>>,
}

fn row_serialize<S>(x: &Vec<Vec<Option<Vec<u8>>>>, s: S) -> Result<S::Ok, S::Error>
where
  S: Serializer,
{
  let mut rows: Vec<Vec<Option<String>>> = Vec::new();
  let source_rows = x;

  for row_index in 0..source_rows.len() {
    let cols = &source_rows[row_index];
    let mut data: Vec<Option<String>> = Vec::new();

    for col_index in 0..cols.len() {
      let bytes = &cols[col_index];
      data.push(match bytes {
        Some(bytes) => Some(base64::encode(bytes)),
        None => None,
      });
    }
    rows.push(data);
  }
  return s.collect_seq(rows);
}
