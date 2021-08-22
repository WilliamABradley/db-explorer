package com.db_explorer.modules.drivers

import com.facebook.react.bridge.*
import java.util.concurrent.CompletableFuture
import java.util.HashMap

fun <T> futureToPromise(future: CompletableFuture<T>, promise: Promise) {
    future
        .thenAccept {
            promise.resolve(null);
        }
        .exceptionally { ex ->
            promise.reject(ex);
            null
        }
}

abstract class NativeDatabaseDriver(context: ReactApplicationContext) : ReactContextBaseJavaModule(context), INativeDatabaseDriver {
    @ReactMethod
    fun init(connectionInfo: ReadableMap, promise: Promise): Unit {
        futureToPromise(driverInit(connectionInfo.toHashMap() as HashMap<String, String>), promise);
    }

    @ReactMethod
    fun connect(id: Int, promise: Promise): Unit {
        futureToPromise(driverConnect(id), promise);
    }

    @ReactMethod
    fun close(id: Int, promise: Promise): Unit {
        futureToPromise(driverClose(id), promise);
    }

    @ReactMethod
    fun execute(id: Int, sql: String, variables: ReadableMap?, promise: Promise): Unit {
        futureToPromise(driverExecute(id, sql, variables?.toHashMap() as HashMap<String, String>), promise);
    }

    @ReactMethod
    fun flush(): Unit {
        driverFlush();
    }

    override fun invalidate() {
        super.invalidate();
        driverFlush();
    }
}