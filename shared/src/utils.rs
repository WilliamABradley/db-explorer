use crate::io::*;
use serde::Serialize;
use std::ffi::CString;
use std::os::raw::c_char;

pub fn as_result<T>(result: T) -> OutboundMessage
where
  T: Serialize,
{
  let serialize_result = serde_json::to_value(result);
  if serialize_result.is_err() {
    return OutboundMessage::Error {
      error_type: DriverErrorType::SerializeError,
      error_message: format!("{}", &serialize_result.unwrap_err()),
    };
  }

  return OutboundMessage::Result(serialize_result.unwrap());
}

pub fn as_error<T>(error: T) -> OutboundMessage
where
  T: std::fmt::Display,
{
  return OutboundMessage::Error {
    error_type: DriverErrorType::DriverError,
    error_message: format!("{}", error),
  };
}

pub fn to_cchar(source: String) -> *mut c_char {
  return CString::new(source).unwrap().into_raw();
}
