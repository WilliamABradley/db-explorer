using Microsoft.ReactNative.Managed;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    [ReactModule(nameof(DriverManager))]
    public class DriverManager
    {
        [ReactMethod("sendMessage")]
        public Task<string> SendMessage(string data)
        {
           return Task.Run(() => send_message(data));
        }

        [DllImport("shared.dll", EntryPoint = "send_message")]
        private static extern string send_message(string data);
    }
}
