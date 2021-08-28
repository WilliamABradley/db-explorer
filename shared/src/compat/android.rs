#[allow(non_snake_case)]
pub mod android {
  extern crate jni;

  use self::jni::objects::{JClass, JString};
  use self::jni::sys::jstring;
  use self::jni::JNIEnv;
  use crate::*;
  use std::ffi::CString;

  #[no_mangle]
  pub unsafe extern "C" fn Java_com_db_1explorer_DriverManager_send_message(
    env: JNIEnv,
    _: JClass,
    data: JString,
  ) -> jstring {
    let result = send_message(env.get_string(data).expect("Invalid message data").as_ptr());
    // Retake pointer so that we can use it below and allow memory to be freed when it goes out of scope.
    let result_ptr = CString::from_raw(result);
    let output = env
      .new_string(result_ptr.to_str().unwrap())
      .expect("Couldn't create java string!");

    output.into_inner()
  }
}
