using Microsoft.ReactNative.Managed;
using System;
using System.Linq;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using db_explorer.modules.tunnel;
using System.Collections.Generic;
using Newtonsoft.Json.Converters;

namespace db_explorer.modules
{
    public enum DriverManagerResultType
    {
        Result,
        Error,
        FatalError,
        NoConnectionError,
        UnknownMessage
    }

    public struct DriverManagerResult
    {
        [JsonProperty("type")]
        [JsonConverter(typeof(StringEnumConverter))]
        public DriverManagerResultType Type { get; set; }

        [JsonProperty("data")]
        public object Data { get; set; }
    }

    [ReactModule(nameof(DriverManager))]
    public class DriverManager
    {
        private static ReactContext _reactContext;
        private static readonly string[] FORWARDED_CLASSES = new string[] { "DatabaseDriver" };
        private static readonly Dictionary<int, SSHTunnel> TUNNELS = new Dictionary<int, SSHTunnel>();

        [ReactInitializer]
        public void Initialize(ReactContext reactContext)
        {
            _reactContext = reactContext;
            Debug.WriteLine("Registered DriverManager Handler");
        }

        [ReactMethod("postMessage")]
        public Task<string> PostMessage(string message)
        {
            return Task.Run(() => {
                // Check for forwarded classes.
                var isForwarding = FORWARDED_CLASSES.Any(c => message.Contains($"\"class\":\"{c}\""));

                // Forward message to lower level.
                if(isForwarding)
                {
                    var resultPtr = post_message(message);
                    string result = Marshal.PtrToStringAnsi(resultPtr);
                    free_message(resultPtr);
                    return result;
                } 
                // Process message on this level.
                else
                {
                    var messageData = JsonConvert.DeserializeObject<JObject>(message);
                    var messageClass = messageData.Value<string>("class");
                    var payload = messageData.Value<JObject>("payload");

                    // Process the message.
                    var response = HandleMessage(messageClass, payload);

                    // Return response.
                    return JsonConvert.SerializeObject(response);
                }
            });
        }

        // Post Message to library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "receive_message")]
        private static extern IntPtr post_message(string message);

        // Free Message from library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "free_message")]
        private static extern void free_message(IntPtr messagePtr);

        private static DriverManagerResult HandleMessage(string messageClass, JObject payload)
        {
            try
            {
                var payloadType = payload.Value<string>("type");
                var data = payload["data"];

                int getId() => payload.Value<int>("id");
                DriverManagerResult asResult(object result) => new DriverManagerResult
                {
                    Type = DriverManagerResultType.Result,
                    Data = result
                };

                switch (messageClass)
                {
                    case "SSHTunnel":
                        DriverManagerResult noConnection(int id) => new DriverManagerResult
                        {
                            Type = DriverManagerResultType.NoConnectionError,
                            Data = $"No Tunnel exists with instance id {id}",
                        };

                        switch (payloadType)
                        {
                            case "Create":
                                var configuration = data.ToObject<SSHTunnelConfiguration>();
                                var creationId = TUNNELS.Count;
                                var createdTunnel = new SSHTunnel(configuration);
                                TUNNELS.Add(creationId, createdTunnel);
                                return asResult(creationId);

                            case "Test":
                                var testId = getId();
                                if (!TUNNELS.TryGetValue(testId, out SSHTunnel testingTunnel))
                                {
                                    return noConnection(testId);
                                }
                                testingTunnel.Test();
                                return asResult(null);

                            case "Connect":
                                var connectId = getId();
                                if (!TUNNELS.TryGetValue(connectId, out SSHTunnel connectingTunnel))
                                {
                                    return noConnection(connectId);
                                }
                                var forward = data.ToObject<SSHTunnelPortForward>();
                                connectingTunnel.Connect(forward);
                                return asResult(null);

                            case "Close":
                                var closeId = getId();
                                if (!TUNNELS.TryGetValue(closeId, out SSHTunnel closingTunnel))
                                {
                                    return noConnection(closeId);
                                }
                                closingTunnel.Close();
                                return asResult(null);

                            case "Flush":
                                foreach (var tunnel in TUNNELS.Reverse())
                                {
                                    tunnel.Value.Close();
                                    TUNNELS.Remove(tunnel.Key);
                                }
                                return asResult(null);

                            default:
                                return new DriverManagerResult
                                {
                                    Type = DriverManagerResultType.UnknownMessage,
                                    Data = $"Unknown Message for SSHTunnel: {payloadType}"
                                };
                        }

                    default:
                        return new DriverManagerResult
                        {
                            Type = DriverManagerResultType.UnknownMessage,
                            Data = $"Unknown Message Class: {messageClass}"
                        };
                }
            } 
            catch(Exception e)
            {
                return new DriverManagerResult
                {
                    Type = DriverManagerResultType.FatalError,
                    Data = $"{e.Message}\n{e.StackTrace}"
                };
            }
        }
    }
}
