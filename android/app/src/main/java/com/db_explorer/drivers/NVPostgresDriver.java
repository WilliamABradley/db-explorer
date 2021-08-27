package com.db_explorer.drivers;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = NVPostgresDriver.NAME)
public class NVPostgresDriver extends ReactContextBaseJavaModule {
  public static final String NAME = "NVPostgresDriver";

  public NVPostgresDriver(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  static {
    try {
      // Used to load the 'native-lib' library on application startup.
      System.loadLibrary("driver_manager");
    } catch (Exception ignored) {
    }
  }

  // Example method
  // See https://reactnative.dev/docs/native-modules-android
  @ReactMethod
  public void create(ReadableMap connectionInfo, Promise promise) {
    String[][] info = new String[2][1];
    info[0][0] = "port";
    info[0][1] = "5050";
    promise.resolve(_create(info));
  }

  private native int _create(String[][] connectionInfo);
}
