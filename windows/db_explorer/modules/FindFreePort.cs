using System.Linq;
using System.Net.NetworkInformation;
using System.Threading.Tasks;
using Microsoft.ReactNative.Managed;

namespace db_explorer.modules
{
    [ReactModule("FindFreePort")]
    public class FindFreePort
    {
        [ReactMethod("getFirstStartingFrom")]
        public Task<int> GetFirstStartingFrom(int port)
        {
            return Task.Run(() =>
            {
                var ipProperties = IPGlobalProperties.GetIPGlobalProperties();

                var usedPorts = ipProperties.GetActiveTcpConnections()
                        .Where(connection => connection.State != TcpState.Closed)
                        .Select(connection => connection.LocalEndPoint)
                        .Concat(ipProperties.GetActiveTcpListeners())
                        .Concat(ipProperties.GetActiveUdpListeners())
                        .Select(endpoint => endpoint.Port)
                        .ToArray();

                var isPortUsed = true;
                var _port = port;
                while (isPortUsed)
                {
                    isPortUsed = usedPorts.Contains(_port);
                    if (isPortUsed)
                    {
                        _port++;
                    }
                }
                return _port;
            });
        }
    }
}
