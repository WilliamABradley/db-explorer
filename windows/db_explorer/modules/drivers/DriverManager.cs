using Microsoft.ReactNative.Managed;
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    [ReactModule(nameof(DriverManager))]
    public class DriverManager
    {
        private static ReactContext _reactContext;

        [ReactInitializer]
        public void Initialize(ReactContext reactContext)
        {
            _reactContext = reactContext;
            Debug.WriteLine("Registered DriverManager Handler");
        }

        [ReactMethod("postMessage")]
        public Task<string> PostMessage(string data)
        {
            return Task.Run(() => post_message(data));
        }

        // Post Message to library.
        [DllImport("shared.dll", EntryPoint = "receive_message")]
        private static extern string post_message(string data);
    }
}
