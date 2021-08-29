pub mod compat;
pub mod drivers;
pub mod manager;
pub mod messages;
pub mod utils;

use futures::executor::block_on;
use futures_util::lock::Mutex;
use lazy_static::lazy_static;
use messages::*;
use std::ffi::CStr;
use std::os::raw::c_char;
use std::panic;
use utils::*;

type MessageCallback = extern "system" fn(*mut c_char);

// A Stubbed handle, to be replaced during registration.
extern "system" fn _stub_post_handle(_: *mut c_char) -> () {
    panic!("No message delegate registered from register_post_message!");
}

lazy_static! {
    static ref POST_MESSAGE_HANDLE: Mutex<MessageCallback> = Mutex::new(_stub_post_handle);
}

#[no_mangle]
pub extern "system" fn register_post_message(handle: extern "system" fn(*mut c_char)) -> () {
    let future = async {
        let mut _handle = POST_MESSAGE_HANDLE.lock().await;
        *_handle = handle;
    };
    block_on(future);
}

#[no_mangle]
pub extern "system" fn receive_message(message_raw: *const c_char) -> *mut c_char {
    let c_str = unsafe { CStr::from_ptr(message_raw) };
    let message_str = c_str.to_str();
    // Return null if no message was passed.
    if message_str.is_err() {
        return std::ptr::null_mut();
    }

    let result = panic::catch_unwind(|| {
        let future = manager::handle_message(message_str.unwrap());
        return to_cchar(block_on(future));
    });

    // Validate that we didn't panic
    if result.is_ok() {
        return result.unwrap();
    } else {
        let err = result.unwrap_err();

        // Try and capture the error message.
        let err_message: String = match err.downcast_ref::<&'static str>() {
            Some(e) => e.to_string(),
            _ => format!("Unknown Error: {:?}", err),
        };

        return to_cchar(as_driver_error(DriverErrorType::FatalError, &err_message));
    }
}

pub async fn post_message(message: String) -> () {
    let invoke = POST_MESSAGE_HANDLE.lock().await;
    invoke(to_cchar(message));
}
