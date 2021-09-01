pub mod drivers;
pub mod manager;
pub mod messages;
pub mod utils;

use backtrace::Backtrace;
use futures::executor::block_on;
use messages::*;
use std::ffi::CStr;
use std::os::raw::c_char;
use std::panic;
use utils::*;

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
        let future = manager::handle_message(message_clone);
        return to_cchar(block_on(future));
    });

    // Validate that we didn't panic
    if result.is_err() {
        let err = result.unwrap_err();

        // Try and capture the error message.
        let err_message: String = match err.downcast_ref::<&'static str>() {
            Some(e) => format!("{}\n{:?}", e, trace),
            _ => format!("Unknown Error: {:?}\n{:?}", err, trace),
        };

        return to_cchar(to_driver_error(DriverErrorType::FatalError, &err_message));
    }

    return result.unwrap();
}
