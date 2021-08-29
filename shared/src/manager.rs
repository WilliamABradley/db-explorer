use crate::drivers;
use crate::messages::*;
use crate::utils::*;
use std::str::FromStr;

pub async fn handle_message(message_data: &str) -> String {
  let message_result: Result<InboundMessage, serde_json::Error> =
    serde_json::from_str(message_data);
  if message_result.is_err() {
    let error = message_result.unwrap_err();
    return as_driver_error(DriverErrorType::ParseError, &format!("{}", error));
  }
  let message = message_result.unwrap();
  let message_type = InboundMessageType::from_str(message.r#type.as_str()).ok();

  let result: String = match message_type {
    Some(InboundMessageType::DatabaseDriver) => {
      if message.data.is_none() {
        return as_driver_error(
          DriverErrorType::ParseError,
          &"DatabaseDriver messages must contain the encapsulated \"data\" field".into(),
        );
      }
      let database_message = message.data.unwrap();
      return handle_database_message(&database_message);
    }
    _ => as_driver_error(
      DriverErrorType::UnknownMessage,
      &format!("Unknown Message Type: {}", message.r#type.as_str()),
    ),
  };
  return result;
}

fn handle_database_message(message: &DatabaseDriverMessage) -> String {
  let driver_result = drivers::get_driver(&message.driver);
  if driver_result.is_none() {
    return as_driver_error(
      DriverErrorType::UnknownDriver,
      &format!("Unknown Driver Name: {}", message.driver),
    );
  }

  // We known the driver you speak of.
  let driver = driver_result.unwrap();
  let message_type = DatabaseDriverMessageType::from_str(message.r#type.as_str()).ok();

  return match message_type {
    Some(DatabaseDriverMessageType::Create) => marshal_create(driver, &message.data),
    _ => as_driver_error(
      DriverErrorType::UnknownMessage,
      &format!("Unknown Database Message Type: {}", message.r#type.as_str()),
    ),
  };
}

fn marshal_create(driver: &impl drivers::DatabaseDriver, message: &serde_json::Value) -> String {
  //let id = driver.create(connection_info);
  return to_message(
    OutboundMessageType::Result,
    serde_json::to_value(-1).unwrap(),
  );
}
