using System;
using System.Net;
using System.Net.Sockets;
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
                var isPortUsed = true;
                var _port = port;
                while (isPortUsed)
                {
                    if(_port > 65535)
                    {
                        throw new Exception("No ports are available");
                    }

                    isPortUsed = IsPortOpen(_port);
                    if (isPortUsed)
                    {
                        _port++;
                    }
                }
                return _port;
            });
        }

        public static bool IsPortOpen(int port)
        {
            try
            {
                var tcpListener = new TcpListener(IPAddress.Parse("127.0.0.1"), port);
                tcpListener.Start();
                tcpListener.Stop();
                return true;
            }
            catch (Exception e)
            {
                Logger.Error(e.Message);
                return false;
            }
        }
    }
}
