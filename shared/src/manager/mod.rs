use crate::*;
use std::collections::HashMap;

pub fn to_message(msg_type: String, data: HashMap<String, String>) -> String {
  return json::stringify(object! {
      "type": msg_type,
      data: data,
  });
}

pub fn handle_message(message_data: &str) -> String {
  let mut result_info: HashMap<String, String> = HashMap::new();

  // Expect
  let message_result = json::parse(message_data);
  if message_result.is_err() {
    let mut error_info = HashMap::new();
    let error = message_result.unwrap_err();
    error_info.insert(String::from("message"), format!("{}", error));
    return to_message(String::from("ParseError"), error_info);
  }
  let message = message_result.unwrap();

  result_info.insert(String::from("received_type"), message["type"].to_string());
  return to_message(String::from("result"), result_info);
}
