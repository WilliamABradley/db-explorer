using Renci.SshNet;
using System;
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Text;

namespace SSH.Core
{
    public class SSHTunnel : IDisposable
    {
        public SSHTunnel(SSHTunnelConfiguration configuration, ILogger logger)
        {
            Logger = logger;
            Configuration = configuration;

            AuthenticationMethod authenticationMethod;
            switch (configuration.AuthenticationMethod)
            {
                case SSHTunnelAuthenticationMethod.PublicKey:
                    byte[] privateKeyBytes = Encoding.UTF8.GetBytes(configuration.PrivateKey);
                    using (var privateKeyStream = new MemoryStream(privateKeyBytes))
                    {
                        authenticationMethod = new PrivateKeyAuthenticationMethod(configuration.Username, new PrivateKeyFile(privateKeyStream, configuration.Passphrase));
                    }
                    break;

                case SSHTunnelAuthenticationMethod.Password:
                    authenticationMethod = new PasswordAuthenticationMethod(configuration.Username, configuration.Password);
                    break;

                case SSHTunnelAuthenticationMethod.Agent:
                default:
                    throw new NotImplementedException();
            }

            var connectionInfo = new ConnectionInfo(configuration.Host, Convert.ToInt32(configuration.Port), configuration.Username, authenticationMethod);
            Client = new SshClient(connectionInfo);
        }

        public SSHTunnelConfiguration Configuration { get; }
        private SshClient Client { get; }
        private ForwardedPortLocal Port { get; set; }
        private int localPort;
        private ILogger Logger;

        public void TestAuth()
        {
            Client.Connect();
            Client.Disconnect();
        }

        public int Connect(SSHTunnelPortForward target)
        {
            Client.KeepAliveInterval = new TimeSpan(0, 0, 30);
            Client.ConnectionInfo.Timeout = new TimeSpan(0, 0, 60);
            Client.Connect();

            localPort = target.LocalPort;
            Port = new ForwardedPortLocal("127.0.0.1", (uint)target.LocalPort, target.RemoteHost, (uint)target.RemotePort);
            Client.AddForwardedPort(Port);

            Client.ErrorOccurred += Client_ErrorOccurred;
            Port.Exception += Port_Exception;
            Port.RequestReceived += Port_RequestReceived;

            try
            {
                Port.Start();
                localPort = (int)Port.BoundPort;
                Logger.Info($"Opened SSH Port Forward 127.0.0.1:{localPort} > {target.RemoteHost}:{target.RemotePort}");
                return localPort;
            }
            catch (Exception e)
            {
                Client.RemoveForwardedPort(Port);
                Client.Disconnect();
                throw e;
            }
        }

        public bool TestPort()
        {
            try
            {
                var tcpClient = new TcpClient();
                tcpClient.Connect("127.0.0.1", localPort);
                tcpClient.Close();
                return true;
            }
            catch (Exception e)
            {
                Logger.Error(e.Message);
                return false;
            }
        }

        public void Close()
        {
            foreach (var port in Client.ForwardedPorts.ToList())
            {
                port.Stop();
                Client.RemoveForwardedPort(port);
            }

            Client.Disconnect();
        }

        public void Dispose()
        {
            Close();
            Client.Dispose();
        }

        private void Port_RequestReceived(object sender, Renci.SshNet.Common.PortForwardEventArgs e)
        {
            Logger.Debug($"SSH Port Request: {e.OriginatorHost}:{e.OriginatorPort}");
        }

        private void Port_Exception(object sender, Renci.SshNet.Common.ExceptionEventArgs e)
        {
            Logger.Debug($"SSH Port Error: {e.Exception.Message}");
        }

        private void Client_ErrorOccurred(object sender, Renci.SshNet.Common.ExceptionEventArgs e)
        {
            Logger.Debug($"SSH Error: {e.Exception.Message}");
        }
    }
}
