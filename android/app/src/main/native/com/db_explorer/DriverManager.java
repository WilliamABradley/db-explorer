package com.db_explorer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class DriverManager extends ReactContextBaseJavaModule {
  DriverManager(ReactApplicationContext context) {
    super(context);
  }

  static {
    System.loadLibrary("shared");
  }

  @NonNull
  @Override
  public String getName() {
    return "DriverManager";
  }

  @ReactMethod
  public void sendMessage(final String data) {
    promise.resolve(DriverManager.send_message(data));
  }

  private static native String send_message(final String data);
}
