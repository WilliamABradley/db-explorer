using SSH.Core;
using System;
using System.Net.Sockets;

namespace SSH.Test
{
    class Program
    {
        private static readonly Logger Logger = new();

        static void Main()
        {
            string GetVar(string hint, bool retry = true)
            {
                string result;
                do
                {
                    Console.Write($"{hint}: ");
                    result = Console.ReadLine();
                }
                while ((result == "" || result == null) && retry);
                return result;
            }

            string GetKey(string hint)
            {
                Console.Write($"{hint}: ");
                string result = "";
                string current;
                do
                {
                    current = Console.ReadLine();
                    result += current + "\n";
                } while (current != "");
                return result;
            }

            string GetPassword(string hint)
            {
                string pass = "";
                Console.Write($"{hint}: ");
                ConsoleKeyInfo key;

                do
                {
                    key = Console.ReadKey(true);

                    // Backspace Should Not Work
                    if (!char.IsControl(key.KeyChar))
                    {
                        pass += key.KeyChar;
                        Console.Write("*");
                    }
                    else
                    {
                        if (key.Key == ConsoleKey.Backspace && pass.Length > 0)
                        {
                            pass = pass.Substring(0, pass.Length -1);
                            Console.Write("\b \b");
                        }
                    }
                }
                // Stops Receving Keys Once Enter is Pressed
                while (key.Key != ConsoleKey.Enter);
                return pass;
            }

            var host = GetVar("host");
            var port = Convert.ToInt32(GetVar("port"));
            var username = GetVar("username");

            var authenticationMethod = SSHTunnelAuthenticationMethod.PublicKey;
            string privateKey = null;
            string passphrase = null;
            string password = null;

            while (true)
            {
                switch (GetVar("authentication method"))
                {
                    case "key":
                        authenticationMethod = SSHTunnelAuthenticationMethod.PublicKey;
                        privateKey = GetKey("private key");
                        passphrase = GetPassword("passphrase");
                        if(passphrase == "")
                        {
                            passphrase = null;
                        }
                        break;

                    case "pass":
                        password = GetPassword("password");
                        break;

                    default:
                        continue;
                }
                break;
            }

            SSHTunnel tunnel;
            try
            {
                tunnel = new SSHTunnel(new SSHTunnelConfiguration
                {
                    Host = host,
                    Port = port,
                    Username = username,
                    AuthenticationMethod = authenticationMethod,
                    PrivateKey = privateKey,
                    Passphrase = passphrase,
                    Password = password,
                }, Logger);
            }
            catch (Exception e)
            {
                Logger.Error(e.Message);
                Environment.Exit(-1);
                return;
            }

            while (true)
            {
                switch (GetVar("action"))
                {
                    case "test-auth":
                        try
                        {
                            tunnel.TestAuth();
                            Logger.Info("Success");
                        }
                        catch (Exception e)
                        {
                            Logger.Error(e.Message);
                        }
                        break;

                    case "test-port":
                        try
                        {
                            var testPort = tunnel.Connect(new SSHTunnelPortForward
                            {
                                RemoteHost = GetVar("remote host"),
                                RemotePort = Convert.ToInt32(GetVar("remote port")),
                                LocalPort = 0,
                            });
                            Logger.Info($"Started on Port {testPort}");
                            var portAccess = false;
                            try
                            {
                                var tcpClient = new TcpClient();
                                tcpClient.Connect("127.0.0.1", testPort);
                                tcpClient.Close();
                                portAccess = true;
                            }
                            catch (Exception e)
                            {
                                Logger.Error(e.Message);
                            }
                            var accessResult = portAccess ? "accessible" : "inaccessible";
                            Logger.Info($"Tunnel is {accessResult}");
                            tunnel.Close();
                        }
                        catch (Exception e)
                        {
                            Logger.Error(e.Message);
                        }
                        break;

                    case "connect":
                        try
                        {
                            var connectPort = tunnel.Connect(new SSHTunnelPortForward
                            {
                                RemoteHost = GetVar("remote host"),
                                RemotePort = Convert.ToInt32(GetVar("remote port")),
                                LocalPort = 0,
                            });
                            Logger.Info($"Started on Port {connectPort}");
                        }
                        catch (Exception e)
                        {
                            Logger.Error(e.Message);
                        }
                        break;

                    default:
                        continue;
                }
                break;
            }
            Console.WriteLine("Press any key to exit");
            Console.ReadKey();
        }
    }
}
