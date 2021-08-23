package com.db_explorer.modules.drivers

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import org.jooq.impl.DSL
import java.lang.NullPointerException
import java.sql.Connection
import java.sql.DriverManager
import java.util.*
import java.util.concurrent.CompletableFuture
import kotlin.collections.HashMap

class JDBCData(connectionString: String, properties: Properties) {
  var connectionString: String = connectionString;
  var properties: Properties = properties;
}

var ConnectionInfo: HashMap<Int, JDBCData> = HashMap();
var Instances: HashMap<Int, Connection> = HashMap();

fun getConnection(id: Int): Connection {
  if(Instances.containsKey(id)) {
    return Instances[id] as Connection;
  }
  throw NullPointerException("Connection $id doesn't exist");
}

class PostgresDriver(context: ReactApplicationContext): NativeDatabaseDriver(context) {
  override fun getName(): String {
    return "PostgresDriver";
  }

  // Bindings.
  @ReactMethod
  override fun init(connectionInfo: ReadableMap, promise: Promise) {
    super.init(connectionInfo, promise)
  }
  @ReactMethod
  override fun connect(id: Int, promise: Promise) {
    super.connect(id, promise)
  }
  @ReactMethod
  override fun close(id: Int, promise: Promise) {
    super.close(id, promise)
  }
  @ReactMethod
  override fun execute(id: Int, sql: String, variables: ReadableMap?, promise: Promise) {
    super.execute(id, sql, variables, promise)
  }

  @ReactMethod
  override fun flush(promise: Promise) {
    super.flush(promise)
  }

  override fun driverInit(connectionInfo: HashMap<String, String>): CompletableFuture<Int> {
    Class.forName("org.postgresql.Driver").newInstance();
    var connectionString = "jdbc:postgresql://${connectionInfo["host"]}:${connectionInfo["port"]}/${connectionInfo.getOrDefault("database", "postgres")}";
    var properties = Properties();
    properties.setProperty("ssl", connectionInfo["ssl"]);
    if(connectionInfo.containsKey("username")) {
      properties.setProperty("user", connectionInfo["username"]);
    }
    if(connectionInfo.containsKey("password")) {
      properties.setProperty("password", connectionInfo["password"]);
    }

    var id = ConnectionInfo.count();
    ConnectionInfo[id] = JDBCData(connectionString, properties);
    return CompletableFuture.completedFuture(id);
  }

  override fun driverConnect(id: Int): CompletableFuture<Unit> {
    var connectionInfo = ConnectionInfo[id];
    if(connectionInfo == null) {
      throw NullPointerException("Connection $id doesn't exist");
    }
    var connection = DriverManager.getConnection(connectionInfo.connectionString, connectionInfo.properties);
    Instances[id] = connection;
    return CompletableFuture();
  }

  override fun driverClose(id: Int): CompletableFuture<Unit> {
    getConnection(id)
      .close();
    return CompletableFuture();
  }

  override fun driverExecute(
    id: Int,
    sql: String,
    variables: HashMap<String, String>
  ): CompletableFuture<String> {
    var connection = getConnection(id);
    var statement = connection.createStatement();
    var results = statement.executeQuery(sql);

    var response = DSL.using(connection)
      .fetch(results)
      .formatJSON();

    return CompletableFuture
      .completedFuture(response);
  }

  override fun driverFlush() {
    Instances.forEach {
      it.value.close();
    }
    Instances.clear();
    ConnectionInfo.clear();
  }
}