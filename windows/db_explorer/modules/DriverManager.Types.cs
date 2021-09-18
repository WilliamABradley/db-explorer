using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace db_explorer.modules
{
    [JsonConverter(typeof(StringEnumConverter))]
    public enum DriverManagerOutboundMessageType
    {
        Result,
        Log,
        Error,
    }

    public struct DriverManagerOutboundMessage
    {
        [JsonProperty("type")]
        public DriverManagerOutboundMessageType Type { get; set; }

        [JsonProperty("data")]
        public object Data { get; set; }
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum DriverManagerErrorType
    {
        Error,
        FatalError,
        ParseError,
        SerializeError,
        NoConnectionError,
        UnknownMessage,
        UnknownDriver,
        UnknownError,
    }

    public struct DriverManagerDriverError
    {
        public DriverManagerDriverError(DriverManagerErrorType type, object data)
        {
            Type = type;
            Data = data;
        }

        [JsonProperty("error_type")]
        public DriverManagerErrorType Type { get; set; }

        [JsonProperty("error_data")]
        public object Data { get; set; }
    }

    public struct DriverManagerUnknownConnection
    {
        public DriverManagerUnknownConnection(string type, int id)
        {
            Type = type;
            Id = id;
        }

        [JsonProperty("connection_type")]
        public string Type { get; set; }

        [JsonProperty("connection_id")]
        public int Id { get; set; }
    }

    public struct DriverManagerUnknownType
    {
        public DriverManagerUnknownType(string from, string type)
        {
            From = from;
            Type = type;
        }

        [JsonProperty("unknown_from")]
        public string From { get; set; }

        [JsonProperty("unknown_type")]
        public string Type { get; set; }
    }
}
