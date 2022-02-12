namespace db_explorer.modules
{
    public class Logger : ILogger
    {
        public void Log(string level, string message)
        {
            System.Diagnostics.Debug.WriteLine($"[{level}] {message}");
            PlatformDriverManager.Current?.Emit(new DriverManagerOutboundMessage
            {
                Type = DriverManagerOutboundMessageType.Log,
                Data = new
                {
                    level,
                    message
                },
            });;
        }

        public void Debug(string message)
        {
            Log("Debug", message);
        }

        public void Info(string message)
        {
            Log("Info", message);
        }

        public void Warn(string message)
        {
            Log("Warn", message);
        }

        public void Error(string message)
        {
            Log("Error", message);
        }

        public void Fatal(string message)
        {
            Log("Fatal", message);
        }
    }
}
