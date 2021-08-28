using Microsoft.ReactNative.Managed;
using System.Runtime.InteropServices;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    [ReactModule(nameof(DriverManager))]
    public class DriverManager
    {
        [ReactMethod("greet")]
        public Task<string> Greet(string person)
        {
           return Task.Run(() => SayHello(person));
        }

        [DllImport("shared.dll", EntryPoint = "say_hello")]
        private static extern string SayHello(string person);
    }
}
