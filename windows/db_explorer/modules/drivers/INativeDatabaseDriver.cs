using db_explorer.modules.drivers.models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    public interface INativeDatabaseDriver : IDisposable
    {
        Task<int> Create(Dictionary<string, string> connectionInfo);
        Task Connect(int id);
        Task Close(int id);
        Task<DatabaseQueryResult> Execute(int id, string sql, Dictionary<string, object> variables = null);
        Task Flush();
    }
}
