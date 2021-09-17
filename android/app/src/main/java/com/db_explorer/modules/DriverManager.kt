package com.db_explorer.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.sun.jna.Library
import com.sun.jna.Native
import com.sun.jna.Pointer

@Suppress("FunctionName")
class DriverManager(reactContext: ReactApplicationContext?) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "DriverManager";
    }

    @ReactMethod
    fun postMessage(data: String, promise: Promise) {
        var resultPtr = DriverInterface.INSTANCE.receive_message(data);
        var result = resultPtr.getString(0);
        DriverInterface.INSTANCE.free_message(resultPtr);
        promise.resolve(result);
    }

    interface DriverInterface : Library {
        fun receive_message(message: String): Pointer;
        fun free_message(messagePtr: Pointer);

        companion object {
            var INSTANCE =
                Native.load("db_explorer_shared", DriverInterface::class.java)!!
        }
    }
}