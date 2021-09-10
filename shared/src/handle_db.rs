use crate::drivers;
use crate::drivers::DatabaseDriver;
use crate::io::database::*;
use crate::io::*;
use crate::utils::*;

pub async fn handle_database_message(message: &DatabaseDriverMessagePayload) -> OutboundMessage {
  // Can we find the driver?
  let driver_result = drivers::get_driver(&message.driver);
  if driver_result.is_none() {
    return OutboundMessage::Error {
      error_type: DriverErrorType::UnknownDriver,
      error_message: format!("Unknown Driver Name: {}", message.driver),
    };
  }
  let driver = driver_result.unwrap();

  let get_driver_id = || {
    if message.id.is_none() {
      panic!("Driver id not provided!");
    }

    return message.id.unwrap();
  };

  let message_data = &message.data;

  match message_data {
    DatabaseDriverMessage::Create(connection_info) => {
      let result = driver.create(&connection_info).await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Connect => {
      let result = driver.connect(&get_driver_id()).await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(());
    }
    DatabaseDriverMessage::Close => {
      let result = driver.close(&get_driver_id()).await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(());
    }
    DatabaseDriverMessage::Execute(query_data) => {
      let sql = query_data.sql.as_str();
      let variables = &query_data.variables;
      let result = driver.execute(&get_driver_id(), sql, variables).await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Query(query_data) => {
      let sql = query_data.sql.as_str();
      let variables = &query_data.variables;
      let result = driver.query(&get_driver_id(), sql, variables).await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Flush => {
      let result = driver.flush().await;
      if result.is_err() {
        return as_error(result.unwrap_err());
      }
      return as_result(());
    }
  }
}