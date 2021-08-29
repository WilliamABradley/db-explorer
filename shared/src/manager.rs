use crate::drivers;
use crate::messages::*;
use crate::utils::*;
use std::collections::HashMap;
use std::str::FromStr;

pub async fn handle_message(message_data: &str) -> String {
  let message_result: Result<InboundMessage, serde_json::Error> =
    serde_json::from_str(message_data);
  if message_result.is_err() {
    let error = message_result.unwrap_err();
    return to_driver_error(DriverErrorType::ParseError, &format!("{}", error));
  }
  let message = message_result.unwrap();
  let message_type = InboundMessageType::from_str(message.r#type.as_str()).ok();

  let result: String = match message_type {
    Some(InboundMessageType::DatabaseDriver) => {
      if message.data.is_none() {
        return to_driver_error(
          DriverErrorType::ParseError,
          &"DatabaseDriver messages must contain the encapsulated \"data\" field".into(),
        );
      }
      let database_message = message.data.unwrap();
      return handle_database_message(&database_message).await;
    }
    _ => to_driver_error(
      DriverErrorType::UnknownMessage,
      &format!("Unknown Message Type: {}", message.r#type.as_str()),
    ),
  };
  return result;
}

async fn handle_database_message(message: &DatabaseDriverMessage) -> String {
  // Can we find the driver?
  let driver_result = drivers::get_driver(&message.driver);
  if driver_result.is_none() {
    return to_driver_error(
      DriverErrorType::UnknownDriver,
      &format!("Unknown Driver Name: {}", message.driver),
    );
  }
  let driver = driver_result.unwrap();

  // Do
  let message_type = DatabaseDriverMessageType::from_str(message.r#type.as_str()).ok();
  if message_type.is_none() {
    return to_driver_error(
      DriverErrorType::UnknownMessage,
      &format!("Unknown Database Message Type: {}", message.r#type.as_str()),
    );
  }

  let response = match message_type {
    Some(DatabaseDriverMessageType::Create) => marshal_create(driver, &message.data).await,
    Some(DatabaseDriverMessageType::Connect) => marshal_connect(driver, &message.id.unwrap()).await,
    Some(DatabaseDriverMessageType::Close) => marshal_close(driver, &message.id.unwrap()).await,
    Some(DatabaseDriverMessageType::Execute) => {
      return marshal_execute(driver, &message.id.unwrap(), &message.data).await;
    }
    Some(DatabaseDriverMessageType::Query) => {
      return marshal_query(driver, &message.id.unwrap(), &message.data).await;
    }
    Some(DatabaseDriverMessageType::Flush) => marshal_flush(driver).await,
    _ => panic!("Fell through DriverMessageType!"),
  };
  return response;
}

async fn marshal_create(
  driver: &impl drivers::DatabaseDriver,
  message: &serde_json::Value,
) -> String {
  let mut connection_info: HashMap<String, String> = HashMap::new();

  // Decode message.
  let data = message.as_object().unwrap();
  for key in data.keys() {
    let value: String;

    // We expect strings or booleans, convert the bools to string.
    // Otherwise panic.
    let _strdata = data[key].as_str();
    if _strdata.is_some() {
      value = _strdata.unwrap().to_string();
    } else {
      value = data[key].as_bool().unwrap().to_string();
    }

    connection_info.insert(key.clone(), value);
  }

  // Create the Driver.
  let result = driver.create(&connection_info).await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }

  return as_result(result.unwrap());
}

async fn marshal_connect(driver: &impl drivers::DatabaseDriver, id: &u32) -> String {
  let result = driver.connect(id).await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }
  return as_result(());
}

async fn marshal_close(driver: &impl drivers::DatabaseDriver, id: &u32) -> String {
  let result = driver.close(id).await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }
  return as_result(());
}

async fn marshal_execute(
  driver: &impl drivers::DatabaseDriver,
  id: &u32,
  message: &serde_json::Value,
) -> String {
  let sql = message["sql"].as_str();
  if sql.is_none() {
    return as_error("SQL must be provided");
  }

  let _variables = message["variables"].as_object();
  let mut variables: Option<HashMap<String, String>> = None;
  if _variables.is_some() {
    panic!("Variable support not implemented!");
  }

  let result = driver.execute(id, sql.unwrap(), &variables).await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }
  return as_result(result.unwrap());
}

async fn marshal_query(
  driver: &impl drivers::DatabaseDriver,
  id: &u32,
  message: &serde_json::Value,
) -> String {
  let sql = message["sql"].as_str();
  if sql.is_none() {
    return as_error("SQL must be provided");
  }

  let _variables = message["variables"].as_object();
  let variables: Option<HashMap<String, String>> = None;
  if _variables.is_some() {
    panic!("Variable support not implemented!");
  }

  let result = driver.query(id, sql.unwrap(), &variables).await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }
  return as_result(result.unwrap());
}

async fn marshal_flush(driver: &impl drivers::DatabaseDriver) -> String {
  let result = driver.flush().await;
  if result.is_err() {
    return as_error(result.unwrap_err());
  }
  return as_result(());
}
