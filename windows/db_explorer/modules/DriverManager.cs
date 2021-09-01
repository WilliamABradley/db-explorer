using Microsoft.ReactNative.Managed;
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace db_explorer.modules
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
        public Task<string> PostMessage(string message)
        {
            return Task.Run(() => {
                var resultPtr = post_message(message);
                string result = Marshal.PtrToStringAnsi(resultPtr);
                free_message(resultPtr);
                return result;
            });
        }

        // Post Message to library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "receive_message")]
        private static extern IntPtr post_message(string message);

        // Free Message from library.
        [DllImport("db_explorer_shared.dll", EntryPoint = "free_message")]
        private static extern void free_message(IntPtr messagePtr);
    }
}
