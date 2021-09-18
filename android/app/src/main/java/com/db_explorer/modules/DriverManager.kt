package com.db_explorer.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.sun.jna.Callback
import com.sun.jna.Library
import com.sun.jna.Native
import com.sun.jna.Pointer
import java.io.Console

class DriverManager(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
    private val logger = Logger()
    private val postbackHandle = object : DriverInterface.PostbackCallback {
        override fun invoke(messagePtr: Pointer) {
            val message = ptrToString(messagePtr)
            this@DriverManager.emit(message)
        }
    }

    init {
        logger.info("Initialising DriverManager")
        Native.setProtected(true)
        DriverInterface.Current.init()

        // Register the postback handler.
        DriverInterface.Current.register_postback_handler(postbackHandle)
    }

    protected fun finalize() {
        logger.info("Closing DriverManager")
        DriverInterface.Current.deinit()
    }

    override fun getName(): String {
        return "DriverManager"
    }

    @ReactMethod
    fun postMessage(data: String, promise: Promise) {
        val resultPtr = DriverInterface.Current.receive_message(data)
        val result = ptrToString(resultPtr)
        promise.resolve(result)
    }

    fun emit(message: String) {
        this.reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("DriverManagerEvent", message)
    }

    private fun ptrToString(strPtr: Pointer): String {
        val result = strPtr.getString(0)
        DriverInterface.Current.free_message(strPtr)
        return result
    }

    @Suppress("FunctionName", "unused")
    private interface DriverInterface : Library {
        interface PostbackCallback : Callback {
            fun invoke(messagePtr: Pointer)
        }

        fun init()
        fun deinit()
        fun register_postback_handler(postbackHandle: PostbackCallback)
        fun receive_message(message: String): Pointer
        fun free_message(messagePtr: Pointer)

        companion object {
            var Current =
                Native.load("db_explorer_shared", DriverInterface::class.java)!!
        }
    }
}