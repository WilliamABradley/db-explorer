using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Renci.SshNet;
using System;
using System.IO;
using System.Text;

namespace db_explorer.modules.tunnel
{
    [JsonConverter(typeof(StringEnumConverter))]
    public enum SSHTunnelAuthenticationMethod
    {
        Password,
        PublicKey,
        Agent
    }

    public struct SSHTunnelConfiguration
    {
        [JsonProperty("host")]
        public string Host { get; set; }

        [JsonProperty("port")]
        public string Port { get; set; }

        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("authenticationMethod")]
        public SSHTunnelAuthenticationMethod AuthenticationMethod { get; set; }

        [JsonProperty("privateKey")]
        public string PrivateKey { get; set; }

        [JsonProperty("passphrase")]
        public string Passphrase { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }
    }

    public struct SSHTunnelPortForward
    {
        [JsonProperty("remoteHost")]
        public string RemoteHost { get; set; }

        [JsonProperty("remotePort")]
        public string RemotePort { get; set; }

        [JsonProperty("localPort")]
        public string LocalPort { get; set; }
    }

    public class SSHTunnel : IDisposable
    {
        public SSHTunnel(SSHTunnelConfiguration configuration)
        {
            Configuration = configuration;

            AuthenticationMethod authenticationMethod;
            switch(configuration.AuthenticationMethod)
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

        public void Test()
        {
            Client.Connect();
            Client.Disconnect();
        }

        public void Connect(SSHTunnelPortForward target)
        {
            Client.KeepAliveInterval = new TimeSpan(0, 0, 30);
            Client.ConnectionInfo.Timeout = new TimeSpan(0, 0, 20);
            Client.Connect();

            Port = new ForwardedPortLocal(Convert.ToUInt32(target.LocalPort), target.RemoteHost, Convert.ToUInt32(target.RemotePort));
            Client.AddForwardedPort(Port);

            Port.Start();
        }

        public void Close()
        {
            foreach (var port in Client.ForwardedPorts)
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
    }
}
