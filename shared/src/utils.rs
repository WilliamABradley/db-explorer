use crate::messages::*;
use serde::Serialize;
use std::collections::HashMap;
use std::ffi::CString;
use std::os::raw::c_char;

pub fn to_message(message_type: OutboundMessageType, data: serde_json::Value) -> String {
  let mut result = serde_json::Map::new();
  result.insert(
    "type".into(),
    serde_json::to_value(message_type.to_string()).unwrap(),
  );
  result.insert("data".into(), data);
  return serde_json::to_string(&result).unwrap();
}

pub fn to_driver_error(error_type: DriverErrorType, error_message: &String) -> String {
  let mut error_data: HashMap<&str, &str> = HashMap::new();
  let _error_type = error_type.to_string();
  error_data.insert("error_type", &_error_type.as_str());
  error_data.insert("error_message", error_message);
  return to_message(
    OutboundMessageType::Error,
    serde_json::to_value(&error_data).unwrap(),
  );
}

pub fn as_result<T>(result: T) -> String
where
  T: Serialize,
{
  let serialize_result = serde_json::to_value(result);
  if serialize_result.is_err() {
    return to_driver_error(
      DriverErrorType::SerializeError,
      &format!("{}", &serialize_result.unwrap_err()),
    );
  }

  return to_message(OutboundMessageType::Result, serialize_result.unwrap());
}

pub fn as_error<T>(error: T) -> String
where
  T: std::fmt::Display,
{
  return to_driver_error(DriverErrorType::DriverError, &format!("{}", error));
}

pub fn to_cchar(source: String) -> *mut c_char {
  return CString::new(source).unwrap().into_raw();
}
