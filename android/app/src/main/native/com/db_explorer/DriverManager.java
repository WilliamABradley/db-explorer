package com.db_explorer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DriverManager extends ReactContextBaseJavaModule {
  DriverManager(ReactApplicationContext context) {
    super(context);
  }

  static {
    System.loadLibrary("native");
  }

  @NonNull
  @Override
  public String getName() {
    return "com.db_explorer.DriverManager";
  }

  @ReactMethod
  public String greet(final String person) {
    return DriverManager.sayHello(person);
  }

  private static native String sayHello(final String person);
}
