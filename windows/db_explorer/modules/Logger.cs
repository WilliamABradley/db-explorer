﻿namespace db_explorer.modules
{
    public class Logger : ILogger, SSH.Core.ILogger
    {
        public void Log(string level, string message)
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
