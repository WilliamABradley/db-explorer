use serde::{Deserialize, Serialize, Serializer};
use std::error::Error;
use std::fmt;
use std::fmt::Debug;
use std::str;
use strum_macros::EnumString;

#[derive(strum_macros::Display, EnumString)]
pub enum DriverType {
  Postgres,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DatabaseColumnInfo {
  pub name: String,
  #[serde(rename = "dataType")]
  pub data_type: String,
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
  let mut rows: Vec<Vec<Option<&str>>> = Vec::new();
  let source_rows = x;

  for row_index in 0..source_rows.len() {
    let cols = &source_rows[row_index];
    let mut data: Vec<Option<&str>> = Vec::new();

    for col_index in 0..cols.len() {
      let bytes = &cols[col_index];
      data.push(match bytes {
        Some(bytes) => Some(unsafe { str::from_utf8_unchecked(&bytes) }),
        None => None,
      });
    }
    rows.push(data);
  }
  return s.collect_seq(rows);
}

#[derive(Debug)]
pub struct NoConnectionError {
  pub id: u32,
}
impl fmt::Display for NoConnectionError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Connection {} not found", self.id)
  }
}
impl Error for NoConnectionError {}

#[derive(Debug)]
pub struct InvalidError {
  pub message: String,
}
impl fmt::Display for InvalidError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.message)
  }
}
impl Error for InvalidError {}

pub type DatabaseError = Box<dyn Error>;
