package com.db_explorer.modules.drivers

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.github.jasync.sql.db.Connection
import com.github.jasync.sql.db.postgresql.PostgreSQLConnectionBuilder
import com.google.gson.GsonBuilder
import java.lang.NullPointerException
import java.util.*
import kotlin.collections.HashMap

class PostgresDriver(context: ReactApplicationContext): NativeDatabaseDriver(context) {
  override fun getName(): String {
    return "PostgresDriver";
  }

  private var instances: HashMap<Int, Connection> = HashMap();

  fun getConnection(id: Int): Connection {
    if(instances.containsKey(id)) {
      return instances[id] as Connection;
    }
    throw NullPointerException("Connection $id doesn't exist");
  }

  // Bindings.
  @ReactMethod
  override fun create(connectionInfo: ReadableMap, promise: Promise) {
    try {
      var getConfig = fun (key: String): String? {
        if (connectionInfo.hasKey(key)) {
          return connectionInfo.getString(key);
        }
        return null;
      };

      var connectionString = "jdbc:postgresql://${getConfig("host")}:${getConfig("port")}/${getConfig("database") ?: "postgres"}";
      var properties = Properties();
      properties.setProperty("ssl", getConfig("ssl"));
      if(connectionInfo.hasKey("username")) {
        properties.setProperty("user", getConfig("username"));
      }
      if(connectionInfo.hasKey("password")) {
        properties.setProperty("password", getConfig("password"));
      }

      var id = instances.count();
      instances[id] = PostgreSQLConnectionBuilder.createConnectionPool(connectionString);
      promise.resolve(id);
    } catch (e: Throwable) {
      promise.reject(e);
    }
  }

  @ReactMethod
  override fun connect(id: Int, promise: Promise) {
    getConnection(id)
      .connect()
      .thenAccept{
        promise.resolve(null);
      }
      .exceptionally {
        promise.reject(it);
        null
      }
  }

  @ReactMethod
  override fun close(id: Int, promise: Promise) {
    getConnection(id)
      .disconnect()
      .thenAccept{
        promise.resolve(null);
      }
      .exceptionally {
        promise.reject(it);
        null
      }
  }

  @ReactMethod
  override fun execute(id: Int, sql: String, variables: ReadableMap?, promise: Promise) {
    var connection = getConnection(id);
    var results = connection.sendPreparedStatement(sql);

    results
      .thenAccept {
        val json = GsonBuilder().create();
        promise.resolve(json.toJson(it.rows));
      }
      .exceptionally {
        promise.reject(it);
        null
      }
  }

  @ReactMethod
  override fun flush(promise: Promise?) {
    try {
      instances.forEach {
        it.value.disconnect()
      }
      instances.clear();

      promise?.resolve(null);
    } catch (e: Throwable) {
      promise?.reject(e);
    }
  }
}