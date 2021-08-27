#[cfg(target_os = "android")]
#[allow(non_snake_case)]
pub mod android {
  extern crate jni;

  use self::jni::objects::{JClass, JString};
  use self::jni::sys::jstring;
  use self::jni::JNIEnv;
  use super::*;

  #[no_mangle]
  pub unsafe extern "C" fn Java_com_db_1explorer_DriverManager_sayHello(
    env: JNIEnv,
    _: JClass,
    person: JString,
  ) -> jstring {
    // Our Java companion code might pass-in "world" as a string, hence the name.
    let world = say_hello(
      env
        .get_string(person)
        .expect("invalid pattern string")
        .as_ptr(),
    );
    // Retake pointer so that we can use it below and allow memory to be freed when it goes out of scope.
    let world_ptr = CString::from_raw(world);
    let output = env
      .new_string(world_ptr.to_str().unwrap())
      .expect("Couldn't create java string!");

    output.into_inner()
  }
}
