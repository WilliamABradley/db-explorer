package com.db_explorer.modules

import  android.util.Log

class Logger {
    fun log(level: String, message: String) {
         val priority = when(level) {
            "Debug" -> Log.DEBUG
            "Info" -> Log.INFO
            "Warn" -> Log.WARN
            "Error" -> Log.ERROR
            "Fatal" -> Log.ERROR
            else -> Log.INFO
        }

        // Log Native
        Log.println(priority, "Logger", message)

        // Send to React Native
        PlatformDriverManager.Current?.emit(
          DriverManagerOutboundMessage(
              DriverManagerOutboundMessageType.Log,
              mapOf(level to level, message to message),
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