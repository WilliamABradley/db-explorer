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
  public void postMessage(final String data, Promise promise) {
    promise.resolve(DriverManager.receiveMessage(data));
  }

  private static native String receiveMessage(final String data);
}
