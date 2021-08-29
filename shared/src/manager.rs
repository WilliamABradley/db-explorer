use crate::drivers;
use crate::*;
use json::JsonValue;
use std::collections::HashMap;

pub fn to_message(msg_type: String, data: HashMap<String, String>) -> String {
  return json::stringify(object! {
      "type": msg_type,
      data: data,
  });
}

pub fn handle_message(message_data: &str) -> String {
  // Expect
  let message_result = json::parse(message_data);
  if message_result.is_err() {
    let mut error_info = HashMap::new();
    let error = message_result.unwrap_err();
    error_info.insert(String::from("message"), format!("{}", error));
    return to_message(String::from("ParseError"), error_info);
  }
  let message = message_result.unwrap();

  let driver_name = message["driver"].to_string();
  let driver = drivers::get_driver(&driver_name);

  // Determine which message we received.
  let message_type = message["type"];
  let response = match message_type.as_str() {
    Some("create") => {}
    _ => std::panic!("Unknown Message Type: {}", message_type.to_string()),
  };

  return String::from("WIP"); //to_message(String::from("result"), result_info);
}

fn marshal_create(driver: &impl drivers::DatabaseDriver, message: &JsonValue) -> JsonValue {
  let connection_info = HashMap::new();
  let id = driver.create(connection_info);
  return json::from(id);
}
