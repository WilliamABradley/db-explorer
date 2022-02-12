using Microsoft.ReactNative.Managed;
using System;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;

namespace db_explorer.modules
{
    [ReactModule(nameof(PlatformDriverManager))]
    public partial class PlatformDriverManager
    {
        public static PlatformDriverManager Current;

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

        public void Emit(DriverManagerOutboundMessage message)
        {
            _reactContext.EmitJSEvent("RCTDeviceEventEmitter", "DriverManagerEvent", JsonConvert.SerializeObject(message));
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
