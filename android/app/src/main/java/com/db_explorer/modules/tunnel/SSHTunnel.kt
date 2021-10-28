package com.db_explorer.modules.tunnel

import com.db_explorer.modules.Logger
import net.schmizz.sshj.Config
import net.schmizz.sshj.DefaultConfig
import net.schmizz.sshj.SSHClient
import net.schmizz.sshj.connection.channel.direct.LocalPortForwarder
import net.schmizz.sshj.connection.channel.direct.Parameters
import net.schmizz.sshj.transport.verification.PromiscuousVerifier
import net.schmizz.sshj.userauth.password.PasswordFinder
import net.schmizz.sshj.userauth.password.Resource
import java.io.IOException
import java.net.*

class SSHTunnel(val configuration: SSHTunnelConfiguration) {
    val clientConfig: Config = DefaultConfig()
    val client: SSHClient = SSHClient(clientConfig)

    val localHost = "127.0.0.1"
    var localPort: Int = 0

    init {
        client.addHostKeyVerifier(PromiscuousVerifier())
    }

    private val logger = Logger()
    private var tunnel: TunnelHandler? = null

    private fun connectClient() {
        client.connect(configuration.host, configuration.port)

        when(configuration.authenticationMethod) {
            SSHTunnelAuthenticationMethod.PublicKey -> {
                val keyProvider = client.loadKeys(
                    configuration.privateKey,
                    null,
                    object : PasswordFinder {
                        override fun reqPassword(resource: Resource<*>?): CharArray? {
                            if (configuration.passphrase != null) {
                                return configuration.passphrase.toCharArray()
                            }
                            return null
                        }

                        override fun shouldRetry(resource: Resource<*>?): Boolean {
                            return false
                        }
                    }
                )
                client.authPublickey(configuration.username, keyProvider)
            }
            SSHTunnelAuthenticationMethod.Password -> {
                client.authPassword(configuration.username, configuration.password)
            }
            else -> throw Error("${configuration.authenticationMethod} authentication is not implemented")
        }
    }

    private fun closeClient() {
        client.close()
    }

    fun testAuth() {
        connectClient()
        closeClient()
    }

    fun connect(target: SSHTunnelPortForward): Int {
        logger.debug("Connecting SSH Tunnel")
        connectClient()

        val socket = ServerSocket()
        socket.reuseAddress = true
        socket.bind(InetSocketAddress(localHost, target.localPort))
        localPort = socket.localPort

        tunnel = TunnelHandler(this, socket, target)
        tunnel!!.start()
        return localPort
    }

    fun close() {
        if (tunnel != null) {
            tunnel?.close()
            tunnel = null
        }

        closeClient()
    }

    private class TunnelHandler(val tunnel: SSHTunnel, val socket: ServerSocket, val target: SSHTunnelPortForward) : Thread() {
        val logger = tunnel.logger
        var portForwarder: LocalPortForwarder? = null

        override fun run() {
            name = "SSH Tunnel"
            try {
                 logger.info("Opening SSH Port Forward ${tunnel.localHost}:${tunnel.localPort} > ${target.remoteHost}:${target.remotePort}")

                portForwarder = tunnel.client.newLocalPortForwarder(Parameters(
                    tunnel.localHost,
                    tunnel.localPort,
                    target.remoteHost,
                    target.remotePort,
                ), socket)

                portForwarder?.listen()
            } catch (e: IOException) {
                logger.error("SSH Tunnel Error: ${e.message.toString()}")
                throw e
            }
            logger.debug("SSH Tunnel Closed")
        }

        fun close() {
            try {
                portForwarder?.close()
            } catch (e: IOException) {
                logger.error("Error closing port forwarder: ${e.message}")
            }
            portForwarder = null
        }
    }
}