package com.db_explorer;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.sun.jna.Library;
import com.sun.jna.Native;

public class DriverManager extends ReactContextBaseJavaModule {
  DriverManager(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return "DriverManager";
  }

  @ReactMethod
  public void postMessage(final String data, Promise promise) {
    promise.resolve(DriverInterface.INSTANCE.receive_message(data));
  }

  public interface DriverInterface extends Library {
    DriverInterface INSTANCE = (DriverInterface) Native.load("db_explorer_shared", DriverInterface.class);

    String receive_message(String message);
  }
}
