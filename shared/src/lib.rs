pub mod drivers;
pub mod errors;
pub mod handle_db;
pub mod io;
pub mod logger;
pub mod utils;

use backtrace::Backtrace;
use errors::{DriverError, DriverManagerUnknownType};
use futures::executor::block_on;
use io::*;
use lazy_static::*;
use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;
use std::panic;
use std::sync::{Arc, Mutex};
use utils::*;

type PostbackHandler = unsafe extern "C" fn(*mut c_char);

lazy_static! {
    static ref POSTBACK_HANDLER: Arc<Mutex<Option<PostbackHandler>>> = Arc::new(Mutex::new(None));
}

#[no_mangle]
pub extern "C" fn register_postback_handler(callback: PostbackHandler) -> () {
    let mut postback_handler = POSTBACK_HANDLER.lock().unwrap();
    *postback_handler = Some(callback);
}

#[no_mangle]
pub extern "C" fn receive_message(message: *const c_char) -> *mut c_char {
    let c_str = unsafe { CStr::from_ptr(message) };
    let message_str = c_str.to_str();
    // Return null if no message was passed.
    if message_str.is_err() {
        return std::ptr::null_mut();
    }
    // Copy the message incase the pointer is taken away.
    let message_clone = message_str.unwrap().clone();

    let trace = Backtrace::new();

    let result = panic::catch_unwind(|| {
        let future = handle_message(message_clone);
        let outbound_message = block_on(future);

        let serialize_result = serde_json::to_string(&outbound_message);
        if serialize_result.is_err() {
            return to_cchar(
                serde_json::to_string(&OutboundMessage::Error(DriverError::SerializeError(
                    format!("{}", serialize_result.err().unwrap()),
                )))
                .unwrap(),
            );
        }
        return to_cchar(serialize_result.unwrap());
    });

    // Validate that we didn't panic
    if result.is_ok() {
        return result.unwrap();
    } else {
        let err = result.unwrap_err();

        // Try and capture the error message.
        let err_message: String = match err.downcast_ref::<&'static str>() {
            Some(e) => format!("{}\n{:?}", e, trace),
            _ => format!("Unknown Error: {:?}\n{:?}", err, trace),
        };

        let error = OutboundMessage::Error(DriverError::FatalError(err_message));
        return to_cchar(serde_json::to_string(&error).unwrap());
    }
}

#[no_mangle]
pub extern "C" fn free_message(s: *mut c_char) -> () {
    unsafe {
        if s.is_null() {
            return;
        }
        // Retake ownership of the c string for de-allocation.
        CString::from_raw(s)
    };
}

async fn handle_message(message_data: &str) -> OutboundMessage {
    let message_result: Result<InboundMessage, serde_json::Error> =
        serde_json::from_str(message_data);
    if message_result.is_err() {
        let error = message_result.unwrap_err();
        return OutboundMessage::Error(DriverError::ParseError(format!("{}", error)));
    }
    let message = message_result.unwrap();

    #[allow(unreachable_patterns)]
    match message {
        InboundMessage::DatabaseDriver(database_message) => {
            return handle_db::handle_database_message(&database_message).await;
        }
        _ => {
            return OutboundMessage::Error(DriverError::UnknownMessage(DriverManagerUnknownType {
                unknown_from: "Message Class".into(),
                unknown_type: message_data.into(),
            }));
        }
    };
}

pub fn postback_message(outbound_message: OutboundMessage) -> () {
    let serialize_result = serde_json::to_string(&outbound_message);
    let response = serialize_result.unwrap_or_else(|err| {
        serde_json::to_string(&OutboundMessage::Error(DriverError::SerializeError(
            format!("{}", err),
        )))
        .unwrap()
    });

    let postback_handler = POSTBACK_HANDLER.lock().unwrap();
    match *postback_handler {
        Some(postback) => unsafe {
            postback(to_cchar(response));
        },
        None => (),
    }
}
