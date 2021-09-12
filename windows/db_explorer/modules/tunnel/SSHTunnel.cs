using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Renci.SshNet;
using System;

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
                    authenticationMethod = new PrivateKeyAuthenticationMethod(configuration.Username, new PrivateKeyFile(configuration.PrivateKey, configuration.Passphrase));
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

        public void Connect(SSHTunnelPortForward target)
        {
            Client.Connect();
            Client.AddForwardedPort(new ForwardedPortLocal(Convert.ToUInt32(target.LocalPort), target.RemoteHost, Convert.ToUInt32(target.RemotePort)));
        }

        public void Close()
        {
            Client.Disconnect();
            foreach(var port in Client.ForwardedPorts)
            {
                Client.RemoveForwardedPort(port);
            }
        }

        public void Dispose()
        {
            Client.Dispose();
        }
    }
}
