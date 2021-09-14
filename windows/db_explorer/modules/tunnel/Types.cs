using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

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
}
