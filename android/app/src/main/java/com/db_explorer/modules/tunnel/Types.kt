package com.db_explorer.modules.tunnel

enum class SSHTunnelAuthenticationMethod {
    Password,
    PublicKey,
    Agent
}

data class SSHTunnelConfiguration(
    val host: String,
    val port: Int,
    val username: String,
    val authenticationMethod: SSHTunnelAuthenticationMethod,
    val privateKey: String?,
    val passphrase: String?,
    val password: String?,
)

data class SSHTunnelPortForward(
    val remoteHost: String,
    val remotePort: Int,
    val localPort: Int,
)