using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    public interface INativeDatabaseDriver : IDisposable
    {
        Task Connect(int id, string connectionString);
        Task Close(int id);
        Task<string> Execute(int id, string sql, Dictionary<string, object> variables = null);
    }
}
