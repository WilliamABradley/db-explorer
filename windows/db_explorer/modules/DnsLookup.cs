using System.Threading.Tasks;
using Microsoft.ReactNative.Managed;
using System.Net;
using System.Linq;

namespace db_explorer.modules
{
    [ReactModule("RNDnsLookup")]
    public class DnsLookup
    {
        [ReactMethod("getIpAddresses")]
        public Task<string[]> GetIpAddresses(string hostname)
        {
            return Task.Run(() =>
            {
                return Dns.GetHostAddresses(hostname)
                    .Select(ip => ip.ToString())
                    .ToArray();
            });
        }
    }
}
