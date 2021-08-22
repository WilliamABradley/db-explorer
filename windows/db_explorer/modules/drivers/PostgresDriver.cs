using Microsoft.ReactNative.Managed;
using Newtonsoft.Json;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace db_explorer.modules.drivers
{
    [ReactModule("PostgresDriver")]
    public class PostgresDriver : INativeDatabaseDriver
    {
        public Dictionary<int, NpgsqlConnection> Instances = new Dictionary<int, NpgsqlConnection>();

        private NpgsqlConnection GetConnection(int id)
        {
            if (Instances.TryGetValue(id, out NpgsqlConnection connection))
            {
                return connection;
            }

            throw new NullReferenceException($"Connection {id} doesn't exist");
        }

        [ReactMethod("init")]
        public Task<int> Init(Dictionary<string, string> options)
        {
            var connectionStringBuilder = new NpgsqlConnectionStringBuilder
            {
                Host = options["host"],
                Port = Convert.ToInt32(options["port"]),
                SslMode = options["ssl"] == "true" ? SslMode.Require : SslMode.Disable,
            };

            if(options.TryGetValue("username", out string username))
            {
                connectionStringBuilder.Username = username;
            }

            if (options.TryGetValue("password", out string password))
            {
                connectionStringBuilder.Password = password;
            }

            if (options.TryGetValue("database", out string database))
            {
                connectionStringBuilder.Database = database;
            }

            var connection = new NpgsqlConnection(connectionStringBuilder.ToString());

            var id = Instances.Count;
            Instances.Add(id, connection);
            return Task.FromResult(id);
        }

        [ReactMethod("connect")]
        public Task Connect(int id)
        {
            return Task.Run(async () =>
            {
                var connection = GetConnection(id);
                await connection.OpenAsync();
            });
        }

        [ReactMethod("close")]
        public Task Close(int id)
        {
            return Task.Run(async () =>
            {
                var connection = GetConnection(id);
                await connection.CloseAsync();
            });
        }

        [ReactMethod("execute")]
        public Task<string> Execute(int id, string sql, Dictionary<string, object> variables = null)
        {
            return Task.Run(() =>
            {
                var connection = GetConnection(id);

                using (var command = new NpgsqlCommand(sql, connection))
                {
                    if (variables != null)
                    {
                        foreach (var variable in variables)
                        {
                            command.Parameters.AddWithValue(variable.Key, variable.Value);
                        }
                    }

                    var dataSet = new DataSet();
                    var dataAdapter = new NpgsqlDataAdapter(command);
                    dataSet.Reset();
                    dataAdapter.Fill(dataSet);

                    DataTable dataTable = dataSet.Tables[0];
                    return JsonConvert.SerializeObject(dataTable);
                }
            });
        }

        [ReactMethod("flush")]
        public Task Flush()
        {
            foreach (var instance in Instances)
            {
                instance.Value.Dispose();
                Instances.Remove(instance.Key);
            }
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            Flush();
        }
    }
}
