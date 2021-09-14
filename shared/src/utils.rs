use crate::errors::DriverError;
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
    return OutboundMessage::Error(DriverError::SerializeError(format!(
      "{}",
      &serialize_result.unwrap_err()
    )));
  }

  return OutboundMessage::Result(serialize_result.unwrap());
}

pub fn to_cchar(source: String) -> *mut c_char {
  return CString::new(source).unwrap().into_raw();
}
