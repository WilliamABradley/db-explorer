package com.db_explorer.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule

class PlatformDriverManager(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
    private var logger = Logger()
    private var json = ObjectMapper().registerKotlinModule()

    init {
        Current = this
    }

    override fun getName(): String {
        return "PlatformDriverManager"
    }

    companion object {
        var Current: PlatformDriverManager? = null
    }

    @ReactMethod
    fun postMessage(data: String, promise: Promise) {
        val message = json.readValue(data, JsonNode::class.java)
        val messageClass = message.get("class").textValue()
        val payload = message.get("payload")

        // Process the message.
        val response = handleMessage(messageClass, payload)
        val responseJson = json.writeValueAsString(response)

        promise.resolve(responseJson)
    }

    fun emit(message: DriverManagerOutboundMessage) {
        val messageJson = json.writeValueAsString(message)

        this.reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("DriverManagerEvent", messageJson)
    }

    fun handleMessage(messageClass: String, payload: JsonNode): DriverManagerOutboundMessage {
        try {
            val payloadType = payload.get("type").textValue()
            val data = payload.get("data")

            fun getId(): Int {
                return payload.get("id").intValue()
            }

            fun asResult(result: Any?): DriverManagerOutboundMessage {
                return DriverManagerOutboundMessage(
                    DriverManagerOutboundMessageType.Result,
                    result
                )
            }

            when (messageClass) {
                else -> {
                    return DriverManagerOutboundMessage(
                        DriverManagerOutboundMessageType.Error,
                        DriverManagerDriverError(
                            DriverManagerErrorType.UnknownMessage,
                            DriverManagerUnknownType("Message Class", messageClass)
                        )
                    )
                }
            }
        } catch (e: Throwable) {
            return DriverManagerOutboundMessage(
                DriverManagerOutboundMessageType.Error,
                DriverManagerDriverError(
                    DriverManagerErrorType.FatalError,
                    "${e.message}\n${e.stackTraceToString()}"
                )
            )
        }
    }
}