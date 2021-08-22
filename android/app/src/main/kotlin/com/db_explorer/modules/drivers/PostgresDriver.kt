package com.db_explorer.modules.drivers

import com.facebook.react.bridge.ReactApplicationContext
import java.util.*
import java.util.concurrent.CompletableFuture

class PostgresDriver(context: ReactApplicationContext) : NativeDatabaseDriver(context) {
  override fun getName(): String {
    return "PostgresDriver";
  }

  override fun driverInit(connectionInfo: Dictionary<String, String>): Int {
    TODO("Not yet implemented")
  }

  override fun driverConnect(id: Int): CompletableFuture<Unit> {
    TODO("Not yet implemented")
  }

  override fun driverClose(id: Int): CompletableFuture<Unit> {
    TODO("Not yet implemented")
  }

  override fun driverExecute(
    id: Int,
    sql: String,
    variables: Dictionary<String, String>?
  ): CompletableFuture<String> {
    TODO("Not yet implemented")
  }

  override fun driverFlush() {
    TODO("Not yet implemented")
  }
}