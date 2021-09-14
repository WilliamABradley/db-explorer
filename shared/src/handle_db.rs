use crate::drivers;
use crate::drivers::DatabaseDriver;
use crate::errors::*;
use crate::io::database::*;
use crate::io::*;
use crate::logger::*;
use crate::utils::*;

pub async fn handle_database_message(message: &DatabaseDriverMessagePayload) -> OutboundMessage {
  // Can we find the driver?
  let driver_result = drivers::get_driver(&message.driver);
  if driver_result.is_none() {
    return OutboundMessage::Error(DriverError::UnknownDriver(DriverManagerUnknownType {
      unknown_from: "Database Driver".into(),
      unknown_type: message.driver.clone(),
    }));
  }
  let driver = driver_result.unwrap();

  let get_instance_id = || {
    if message.id.is_none() {
      log(LogData::Error("Instance id not provided!".into()));
    }

    return message.id.unwrap_or(u32::MAX);
  };

  let message_data = &message.data;

  match message_data {
    DatabaseDriverMessage::Create(connection_info) => {
      let result = driver.create(&connection_info).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Connect => {
      let result = driver.connect(&get_instance_id()).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
    DatabaseDriverMessage::Close => {
      let result = driver.close(&get_instance_id()).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
    DatabaseDriverMessage::Execute(query_data) => {
      let sql = query_data.sql.as_str();
      let variables = &query_data.variables;
      let result = driver.execute(&get_instance_id(), sql, variables).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Query(query_data) => {
      let sql = query_data.sql.as_str();
      let variables = &query_data.variables;
      let result = driver.query(&get_instance_id(), sql, variables).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    DatabaseDriverMessage::Flush => {
      let result = driver.flush().await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
  }
}
