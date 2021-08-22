package com.db_explorer.modules.drivers

import java.util.*
import java.util.concurrent.CompletableFuture

interface INativeDatabaseDriver {
    fun driverInit(connectionInfo: Dictionary<String, String>): Int
    fun driverConnect(id: Int): CompletableFuture<Unit>;
    fun driverClose(id: Int): CompletableFuture<Unit>;
    fun driverExecute(id: Int, sql: String, variables: Dictionary<String, String>?): CompletableFuture<String>;
    fun driverFlush(): Unit;
}