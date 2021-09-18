@file:Suppress("unused")

package com.db_explorer.modules

enum class DriverManagerOutboundMessageType {
    Result,
    Log,
    Error
}

data class DriverManagerOutboundMessage(val type: DriverManagerOutboundMessageType, val data: Any?)

enum class DriverManagerErrorType {
    Error,
    FatalError,
    ParseError,
    NoConnectionError,
    UnknownMessage,
    UnknownDriver,
    UnknownError,
}

data class DriverManagerDriverError(val error_type: DriverManagerErrorType, val error_data: Any?)

data class DriverManagerUnknownConnection(val connection_type: String, val connection_id: Int)

data class DriverManagerUnknownType(val unknown_from: String, val unknown_type: String)