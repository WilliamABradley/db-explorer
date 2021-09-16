namespace SSH.Core
{
    public interface ILogger
    {
        void Log(string level, string message);
        void Debug(string message);
        void Info(string message);
        void Warn(string message);
        void Error(string message);
        void Fatal(string message);
    }
}
