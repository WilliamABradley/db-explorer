pub mod compat;
pub mod drivers;
pub mod manager;

use json::object;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn send_message(message_raw: *const c_char) -> *mut c_char {
    let c_str = unsafe { CStr::from_ptr(message_raw) };
    let message_str = c_str.to_str();

    // Return null if no message was passed.
    if message_str.is_err() {
        return std::ptr::null_mut();
    }

    let result = manager::handle_message(message_str.unwrap());
    return to_cchar(result);
}

fn to_cchar(source: String) -> *mut c_char {
    return CString::new(source).unwrap().into_raw();
}
