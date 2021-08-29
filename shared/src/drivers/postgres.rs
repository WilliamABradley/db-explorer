use super::*;
use async_trait::async_trait;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use sqlx::postgres::PgPoolOptions;
use sqlx::postgres::Postgres;
use sqlx::Row;
use std::collections::HashMap;

lazy_static! {
  static ref _CONFIGS: Mutex<HashMap<u32, HashMap<String, String>>> = Mutex::new(HashMap::new());
  static ref _INSTANCES: Mutex<HashMap<u32, sqlx::Pool<Postgres>>> = Mutex::new(HashMap::new());
}

#[derive(Debug)]
pub struct PostgresDriver;

#[async_trait]
impl DatabaseDriver for PostgresDriver {
  async fn create(&self, connection_info: &HashMap<String, String>) -> Result<u32, DatabaseError> {
    let mut configs = _CONFIGS.lock().await;
    let id = configs.keys().len() as u32;
    configs.insert(id, connection_info.clone());
    return Result::Ok(id);
  }

  async fn connect(&self, id: &u32) -> Result<(), DatabaseError> {
    let configs = _CONFIGS.lock().await;
    if !configs.contains_key(id) {
      return Result::Err(Box::new(NoConnectionError { id: id.clone() }));
    }
    let connection_info = &configs[id];
    drop(&configs);

    let pool = PgPoolOptions::new().max_connections(5);

    let mut connection_string: String = "postgres://".to_owned();
    if connection_info.contains_key("username") {
      connection_string.push_str(&connection_info["username"]);

      if connection_info.contains_key("password") {
        connection_string.push_str(":");
        connection_string.push_str(&connection_info["password"])
      }
      connection_string.push_str("@");
    }
    if !connection_info.contains_key("host") {
      return Result::Err(Box::new(InvalidError {
        message: "Host must be provided".to_string(),
      }));
    }
    connection_string.push_str(&connection_info["host"]);
    if connection_info.contains_key("port") {
      connection_string.push_str(":");
      connection_string.push_str(&connection_info["port"]);
    }
    if connection_info.contains_key("database") {
      connection_string.push_str("/");
      connection_string.push_str(&connection_info["database"]);
    }

    let result = pool.connect(&connection_string).await;
    if result.is_err() {
      return Result::Err(Box::new(result.err().unwrap()));
    }

    let mut instances = _INSTANCES.lock().await;
    instances.insert(*id, result.unwrap());
    return Result::Ok(());
  }

  async fn close(&self, id: &u32) -> Result<(), DatabaseError> {
    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(id) {
      return Result::Err(Box::new(NoConnectionError { id: id.clone() }));
    }
    let connection = &instances[id];
    drop(&instances);

    connection.close().await;
    return Result::Ok(());
  }

  async fn execute(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<u64, DatabaseError> {
    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(&id) {
      return Result::Err(Box::new(NoConnectionError { id: id.clone() }));
    }
    let connection = &instances[id];
    drop(&instances);

    let query = sqlx::query(sql);
    let result = query.execute(connection).await;
    if result.is_err() {
      return Result::Err(Box::new(result.err().unwrap()));
    }

    let data = result.unwrap();
    return Result::Ok(data.rows_affected());
  }

  async fn query(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<DatabaseQueryResult, DatabaseError> {
    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(&id) {
      return Result::Err(Box::new(NoConnectionError { id: id.clone() }));
    }
    let connection = &instances[id];
    drop(&instances);

    let query = sqlx::query(sql);
    let result = query.fetch_all(connection).await;
    if result.is_err() {
      return Result::Err(Box::new(result.err().unwrap()));
    }

    let columns: Vec<DatabaseColumnInfo> = Vec::new();
    let rows: Vec<Vec<DatabaseValueInfo>> = Vec::new();

    let result_data = result.unwrap();
    if result_data.len() > 0 {
      let column_info = result_data[0].columns();

      for row in &result_data {
        let mut data: Vec<DatabaseValueInfo> = Vec::new();
        for ordinal in 0..column_info.len() {
          let _column = &column_info[ordinal];
          let _value: Result<&str, sqlx::Error> = row.try_get(ordinal);
          let value = match _value {
            Ok(string_val) => DatabaseValueInfo {
              value: Some(string_val.to_string()),
              isNull: false,
            },
            _ => DatabaseValueInfo {
              value: None,
              isNull: true,
            },
          };
          data.push(value);
        }
      }
    }

    let payload = DatabaseQueryResult { columns, rows };
    return Result::Ok(payload);
  }

  async fn flush(&self) -> Result<(), DatabaseError> {
    let mut configs = _CONFIGS.lock().await;
    let mut instances = _INSTANCES.lock().await;

    let key_count = instances.keys().len() as u32;
    for index in 0..key_count {
      let id = index + 1;
      let _ = self.close(&id).await;
      instances.remove(&id);
      configs.remove(&id);
    }
    return Result::Ok(());
  }
}
