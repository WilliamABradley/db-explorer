using Microsoft.ReactNative.Managed;
using System;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using SSH.Core;

namespace db_explorer.modules
{
    [ReactModule(nameof(PlatformDriverManager))]
    public partial class PlatformDriverManager
    {
        public static PlatformDriverManager Current;
        private static readonly Dictionary<int, SSHTunnel> TUNNELS = new Dictionary<int, SSHTunnel>();

        private static readonly Logger Logger = new Logger();
        private ReactContext _reactContext;

        [ReactInitializer]
        public void Initialize(ReactContext reactContext)
        {
            Current = this;
            _reactContext = reactContext;
        }

        [ReactMethod("postMessage")]
        public Task<string> PostMessage(string message)
        {
            return Task.Run(() =>
            {
                    var messageData = JsonConvert.DeserializeObject<JObject>(message);
                    var messageClass = messageData.Value<string>("class");
                    var payload = messageData.Value<JObject>("payload");

                    // Process the message.
                    var response = HandleMessage(messageClass, payload);

                    // Return response.
                    return JsonConvert.SerializeObject(response);
            });
        }

        public void Emit(DriverManagerOutboundMessage result)
        {
            _reactContext.EmitJSEvent("RCTDeviceEventEmitter", "DriverManagerEvent", JsonConvert.SerializeObject(result));
        }

        private static DriverManagerOutboundMessage HandleMessage(string messageClass, JObject payload)
        {
            try
            {
                var payloadType = payload.Value<string>("type");
                var data = payload["data"];

                int getId() => payload.Value<int>("id");
                DriverManagerOutboundMessage asResult(object result) => new DriverManagerOutboundMessage
                {
                    Type = DriverManagerOutboundMessageType.Result,
                    Data = result
                };

                switch (messageClass)
                {
                    case "SSHTunnel":
                        DriverManagerOutboundMessage noConnection(int id) => new DriverManagerOutboundMessage
                        {
                            Type = DriverManagerOutboundMessageType.Error,
                            Data = new DriverManagerDriverError(DriverManagerErrorType.NoConnectionError, new DriverManagerUnknownConnection("Tunnel", id)),
                        };

                        switch (payloadType)
                        {
                            case "Create":
                                var configuration = data.ToObject<SSHTunnelConfiguration>();
                                var creationId = TUNNELS.Count;
                                var createdTunnel = new SSHTunnel(configuration, Logger);
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
                                var port = connectingTunnel.Connect(forward);
                                return asResult(port);

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
                                return new DriverManagerOutboundMessage
                                {
                                    Type = DriverManagerOutboundMessageType.Error,
                                    Data = new DriverManagerDriverError(DriverManagerErrorType.UnknownMessage, new DriverManagerUnknownType("SSH Tunnel", payloadType)),
                                };
                        }

                    default:
                        return new DriverManagerOutboundMessage
                        {
                            Type = DriverManagerOutboundMessageType.Error,
                            Data = new DriverManagerDriverError(DriverManagerErrorType.UnknownMessage, new DriverManagerUnknownType("Message Class", messageClass)),
                        };
                }
            }
            catch (Exception e)
            {
                return new DriverManagerOutboundMessage
                {
                    Type = DriverManagerOutboundMessageType.Error,
                    Data = new DriverManagerDriverError(DriverManagerErrorType.FatalError, $"{e.Message}\n{e.StackTrace}")
                };
            }
        }
    }
}
