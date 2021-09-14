namespace db_explorer.modules
{
    public static class Logger
    {
        public static void Log(string level, string message)
        {
            System.Diagnostics.Debug.WriteLine($"[{level}] {message}");
            DriverManager.Current?.Emit(new DriverManager.DriverManagerResult
            {
                Type = DriverManager.DriverManagerResultType.Log,
                Data = new
                {
                    level,
                    message
                },
            });;
        }

        public static void Debug(string message)
        {
            Log("Debug", message);
        }

        public static void Info(string message)
        {
            Log("Info", message);
        }

        public static void Warn(string message)
        {
            Log("Warn", message);
        }

        public static void Error(string message)
        {
            Log("Error", message);
        }

        public static void Fatal(string message)
        {
            Log("Fatal", message);
        }
    }
}
