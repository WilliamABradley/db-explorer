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
        Log,
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
        public static DriverManager Current;
        public delegate void PostbackDelegate(IntPtr message);

        private static readonly string[] FORWARDED_CLASSES = new string[] { "DatabaseDriver" };
        private static readonly Dictionary<int, SSHTunnel> TUNNELS = new Dictionary<int, SSHTunnel>();

        private ReactContext _reactContext;
        private PostbackDelegate _postbackHandle;

        [ReactInitializer]
        public void Initialize(ReactContext reactContext)
        {
            Current = this;
            _reactContext = reactContext;
            Logger.Info("Registered DriverManager Handler");

            _postbackHandle = new PostbackDelegate(ReceiveMessage);
            var postbackHandlePtr = Marshal.GetFunctionPointerForDelegate(_postbackHandle);
            register_postback_handler(postbackHandlePtr);
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
                    try
                    {
                        var resultPtr = post_message(message);
                        var result = PtrToString(ref resultPtr);
                        return result;
                    }
                    catch(Exception e)
                    {
                        return JsonConvert.SerializeObject(new DriverManagerResult
                        {
                            Type = DriverManagerResultType.FatalError,
                            Data = e.Message
                        });
                    }
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

        public void ReceiveMessage(IntPtr messagePtr)
        {
            var message = PtrToString(ref messagePtr);
            Emit(message);
        }

        public void Emit(DriverManagerResult result)
        {
            Emit(JsonConvert.SerializeObject(result));
        }

        public void Emit(string message)
        {
            _reactContext.EmitJSEvent("RCTDeviceEventEmitter", "DriverManagerEvent", message);
        }

        private static string PtrToString(ref IntPtr strPtr)
        {
            string result = Marshal.PtrToStringAnsi(strPtr);
            free_message(strPtr);
            return result;
        }

        // Post Message to library with Message Results.
        [DllImport("db_explorer_shared.dll", EntryPoint = "receive_message")]
        private static extern IntPtr post_message(string message);

        // Free Message from library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "free_message")]
        private static extern void free_message(IntPtr messagePtr);

        // Receive Async Message from Library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "register_postback_handler")]
        private static extern void register_postback_handler(IntPtr postbackHandlePtr);

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

                            case "TestAuth":
                                var testAuthId = getId();
                                if (!TUNNELS.TryGetValue(testAuthId, out SSHTunnel testingAuthTunnel))
                                {
                                    return noConnection(testAuthId);
                                }
                                testingAuthTunnel.TestAuth();
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

                            case "TestPort":
                                var testId = getId();
                                if (!TUNNELS.TryGetValue(testId, out SSHTunnel testingTunnel))
                                {
                                    return noConnection(testId);
                                }
                                var isOpen = testingTunnel.TestPort();
                                return asResult(isOpen);

                            case "Close":
                                var closeId = getId();
                                if (!TUNNELS.TryGetValue(closeId, out SSHTunnel closingTunnel))
                                {
                                    return noConnection(closeId);
                                }
                                closingTunnel.Close();
                                return asResult(null);

                            case "Flush":
                                foreach (var tunnel in TUNNELS.ToList())
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
