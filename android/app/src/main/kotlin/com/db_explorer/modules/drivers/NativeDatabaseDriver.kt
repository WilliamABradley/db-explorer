package com.db_explorer.modules.drivers

import com.facebook.react.bridge.*
import java.util.concurrent.CompletableFuture
import java.util.HashMap

abstract class NativeDatabaseDriver(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    abstract fun create(connectionInfo: ReadableMap, promise: Promise): Unit;
    abstract fun connect(id: Int, promise: Promise): Unit;
    abstract fun close(id: Int, promise: Promise): Unit;
    abstract fun execute(id: Int, sql: String, variables: ReadableMap?, promise: Promise): Unit;
    abstract fun flush(promise: Promise? = null): Unit;

    override fun invalidate() {
        super.invalidate();
        flush();
    }
}