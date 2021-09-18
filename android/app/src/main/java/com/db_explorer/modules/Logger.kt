package com.db_explorer.modules

class Logger {
    fun log(level: String, message: String) {
        // Send to React Native
        PlatformDriverManager.Current?.emit(
          DriverManagerOutboundMessage(
              DriverManagerOutboundMessageType.Log,
              mapOf("level" to level, "message" to message),
          ),
        )
    }

    fun debug(message: String) {
        log("Debug", message)
    }

    fun info(message: String) {
        log("Info", message)
    }

    fun warn(message: String) {
        log("Warn", message)
    }

    fun error(message: String) {
        log("Error", message)
    }

    fun fatal(message: String) {
        log("Fatal", message)
    }
}