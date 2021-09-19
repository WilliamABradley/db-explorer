using Microsoft.ReactNative.Managed;
using System;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace db_explorer.modules
{
    [ReactModule(nameof(DriverManager))]
    public partial class DriverManager
    {
        public DriverManager()
        {
            Logger.Info("Initialising DriverManager");
            init_lib();

            _postbackHandle = new PostbackDelegate(ReceiveMessage);
            var postbackHandlePtr = Marshal.GetFunctionPointerForDelegate(_postbackHandle);
            register_postback_handler(postbackHandlePtr);
        }

        ~DriverManager()
        {
            Logger.Info("Closing DriverManager");
            deinit_lib();
        }

        public static DriverManager Current;
        public delegate void PostbackDelegate(IntPtr message);

        private static readonly Logger Logger = new Logger();
        private ReactContext _reactContext;
        private PostbackDelegate _postbackHandle;

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
                try
                {
                    var resultPtr = post_message(message);
                    var result = PtrToString(ref resultPtr);
                    return result;
                }
                catch (Exception e)
                {
                    return JsonConvert.SerializeObject(new DriverManagerOutboundMessage
                    {
                        Type = DriverManagerOutboundMessageType.Error,
                        Data = new DriverManagerDriverError(DriverManagerErrorType.FatalError, e.Message)
                    });
                }
            });
        }

        public void ReceiveMessage(IntPtr messagePtr)
        {
            var message = PtrToString(ref messagePtr);
            Emit(message);
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

        // Initialise Library Helpers.
        [DllImport("db_explorer_shared.dll", EntryPoint = "db_shared_init")]
        private static extern void init_lib();

        // De-Initialise Library Helpers, preparing for shutdown.
        [DllImport("db_explorer_shared.dll", EntryPoint = "db_shared_deinit")]
        private static extern void deinit_lib();

        // Receive Async Message from Library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "db_shared_register_postback_handler")]
        private static extern void register_postback_handler(IntPtr postbackHandlePtr);

        // Post Message to library with Message Results.
        [DllImport("db_explorer_shared.dll", EntryPoint = "db_shared_receive_message")]
        private static extern IntPtr post_message(string message);

        // Free Message from library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "db_shared_free_message")]
        private static extern void free_message(IntPtr messagePtr);
    }
}
