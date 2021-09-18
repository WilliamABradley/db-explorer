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
import java.net.ConnectException
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket

class SSHTunnel(val configuration: SSHTunnelConfiguration) {
    val clientConfig: Config = DefaultConfig()
    val client: SSHClient = SSHClient(clientConfig)

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
        connectClient()
        tunnel = TunnelHandler(this, target)
        tunnel?.start()
        return 0
    }

    fun testPort(): Boolean {
        if (tunnel == null) {
            return false
        }

        return try {
            val socket = Socket()
            socket.connect(InetSocketAddress(tunnel!!.localPort), 500)
            socket.close()
            true
        } catch (ce: ConnectException) {
            false
        } catch (ex: java.lang.Exception) {
            false
        }
    }

    fun close() {
        if (tunnel != null) {
            tunnel?.close()
            tunnel = null
        }

        closeClient()
    }

    private class TunnelHandler(val tunnel: SSHTunnel, val target: SSHTunnelPortForward) : Thread() {
        val logger = tunnel.logger
        var localHost = ""
        var localPort = -1
        var portForwarder: LocalPortForwarder? = null

        override fun run() {
            name = "SSH Tunnel"
            try {
                logger.info("Opening SSH Port Forward ${localHost}:${localPort} > ${target.remoteHost}:${target.remotePort}")
                val socket = ServerSocket()
                socket.reuseAddress = true
                socket.bind(InetSocketAddress(target.localPort))
                localHost = socket.localSocketAddress.toString()
                localPort = socket.localPort

                portForwarder = tunnel.client.newLocalPortForwarder(Parameters(
                    localHost,
                    localPort,
                    target.remoteHost,
                    target.remotePort,
                ), socket)

                portForwarder?.listen()
                logger.info("Opened SSH Port Forward ${localHost}:${localPort} > ${target.remoteHost}:${target.remotePort}")
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