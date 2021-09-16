using SSH.Core;
using System;

namespace SSH.Test
{
    public class Logger : ILogger
    {
        public void Log(string level, string message)
        {
            var output = $"[{level}] {message}";
            System.Diagnostics.Debug.WriteLine(output);
            Console.WriteLine(output);
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
