package com.db_explorer.modules.drivers

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.*

abstract class NativeDatabaseDriver(context: ReactApplicationContext) : ReactContextBaseJavaModule(context), INativeDatabaseDriver {
    @ReactMethod
    fun init(connectionInfo: Dictionary<String, String>, promise: Promise): Unit {
        promise.resolve(driverInit(connectionInfo));
    }

    @ReactMethod
    fun connect(id: Int, promise: Promise): Unit {
        driverConnect(id)
            .thenAccept {
                promise.resolve(null);
            }
            .exceptionally { ex ->
                promise.reject(ex);
                null
            }
    }

    @ReactMethod
    fun close(id: Int, promise: Promise): Unit {
        driverClose(id)
            .thenAccept {
                promise.resolve(null);
            }
            .exceptionally { ex ->
                promise.reject(ex);
                null
            }
    }

    @ReactMethod
    fun execute(id: Int, sql: String, variables: Dictionary<String, String>?, promise: Promise): Unit {
        driverExecute(id, sql, variables)
            .thenAccept {
                promise.resolve(it);
            }
            .exceptionally { ex ->
                promise.reject(ex);
                null
            }
    }

    @ReactMethod
    fun flush(): Unit {
        driverFlush();
    }
}