package com.db_explorer.modules.drivers

import java.util.concurrent.CompletableFuture
import java.util.HashMap

interface INativeDatabaseDriver {
    fun driverInit(connectionInfo: HashMap<String, String>): CompletableFuture<Int>;
    fun driverConnect(id: Int): CompletableFuture<Unit>;
    fun driverClose(id: Int): CompletableFuture<Unit>;
    fun driverExecute(id: Int, sql: String, variables: HashMap<String, String>): CompletableFuture<String>;
    fun driverFlush(): Unit;
}