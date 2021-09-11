use super::*;
use async_trait::async_trait;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use sqlx::postgres::PgPoolOptions;
use sqlx::postgres::Postgres;
use sqlx::Column;
use sqlx::Row;
use std::collections::HashMap;
use std::str;

lazy_static! {
  static ref _CONFIGS: Mutex<HashMap<u32, DatabaseConnectionInfo>> = Mutex::new(HashMap::new());
  static ref _INSTANCES: Mutex<HashMap<u32, sqlx::Pool<Postgres>>> = Mutex::new(HashMap::new());
}

#[derive(Debug)]
pub struct PostgresDriver;

#[async_trait]
impl DatabaseDriver for PostgresDriver {
  async fn create(&self, connection_info: &DatabaseConnectionInfo) -> Result<u32, DriverError> {
    let mut configs = _CONFIGS.lock().await;
    let id = configs.keys().len() as u32;
    configs.insert(id, connection_info.clone());
    return Result::Ok(id);
  }

  async fn connect(&self, id: &u32) -> Result<(), DriverError> {
    let configs = _CONFIGS.lock().await;
    if !configs.contains_key(id) {
      return Result::Err(DriverError::NoConnectionError(*id));
    }
    let connection_info = &configs[id];
    drop(&configs);

    let pool = PgPoolOptions::new().max_connections(5);

    let mut connection_string: String = "postgres://".to_owned();
    if connection_info.username.is_some() {
      connection_string.push_str(&connection_info.username.as_ref().unwrap());

      if connection_info.password.is_some() {
        connection_string.push_str(":");
        connection_string.push_str(&connection_info.password.as_ref().unwrap());
      }
      connection_string.push_str("@");
    }
    connection_string.push_str(&connection_info.host);
    connection_string.push_str(":");
    connection_string.push_str(&connection_info.port);
    if connection_info.database.is_some() {
      connection_string.push_str("/");
      connection_string.push_str(&connection_info.database.as_ref().unwrap());
    }

    let result = pool.connect(&connection_string).await;
    if result.is_err() {
      return Result::Err(DriverError::Error(format!("{}", result.err().unwrap())));
    }

    let mut instances = _INSTANCES.lock().await;
    instances.insert(*id, result.unwrap());
    return Result::Ok(());
  }

  async fn close(&self, id: &u32) -> Result<(), DriverError> {
    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(id) {
      return Result::Err(DriverError::NoConnectionError(*id));
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
  ) -> Result<u64, DriverError> {
    if variables.is_some() {
      panic!("Variable support not implemented!");
    }

    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(&id) {
      return Result::Err(DriverError::NoConnectionError(*id));
    }
    let connection = &instances[id];
    drop(&instances);

    let query = sqlx::query(sql);
    let result = query.execute(connection).await;
    if result.is_err() {
      return Result::Err(DriverError::Error(format!("{}", result.err().unwrap())));
    }

    let data = result.unwrap();
    return Result::Ok(data.rows_affected());
  }

  async fn query(
    &self,
    id: &u32,
    sql: &str,
    variables: &Option<HashMap<String, String>>,
  ) -> Result<DatabaseQueryResult, DriverError> {
    if variables.is_some() {
      panic!("Variable support not implemented!");
    }

    let instances = _INSTANCES.lock().await;
    if !instances.contains_key(&id) {
      return Result::Err(DriverError::NoConnectionError(*id));
    }
    let connection = &instances[id];
    drop(&instances);

    let query = sqlx::query(sql);
    let result = query.fetch_all(connection).await;
    if result.is_err() {
      return Result::Err(DriverError::Error(format!("{}", result.err().unwrap())));
    }

    let mut columns: Vec<DatabaseColumnInfo> = Vec::new();
    let mut rows: Vec<Vec<Option<Vec<u8>>>> = Vec::new();

    let result_data = result.unwrap();
    if result_data.len() > 0 {
      let column_info = result_data[0].columns();

      for column in column_info {
        let type_info = column.type_info();

        columns.push(DatabaseColumnInfo {
          name: column.name().to_string(),
          data_type: type_info.oid().to_string(),
        });
      }

      for row in &result_data {
        let mut data: Vec<Option<Vec<u8>>> = Vec::new();
        for ordinal in 0..column_info.len() {
          let value_ref = row.try_get_raw(ordinal).unwrap();

          let mut value: Option<Vec<u8>> = None;
          if value_ref.value.is_some() {
            let value_bytes = value_ref.value.unwrap();
            value = Some(value_bytes.to_vec());
          }
          data.push(value);
        }
        rows.push(data);
      }
    }

    let payload = DatabaseQueryResult { columns, rows };
    return Result::Ok(payload);
  }

  async fn flush(&self) -> Result<(), DriverError> {
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
