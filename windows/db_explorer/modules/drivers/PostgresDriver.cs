using db_explorer.modules.drivers.models;
using Microsoft.ReactNative.Managed;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace db_explorer.modules.drivers
{
    [ReactModule(nameof(PostgresDriver))]
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

        [ReactMethod("create")]
        public Task<int> Create(Dictionary<string, string> options)
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
        public Task<DatabaseQueryResult> Execute(int id, string sql, Dictionary<string, object> variables = null)
        {
            return Task.Run(async () =>
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

                    command.AllResultTypesAreUnknown = true;
                    var reader = await command.ExecuteReaderAsync();
                    using(reader)
                    {
                        var columnInfo = await reader.GetColumnSchemaAsync();
                        var columns = columnInfo.Select(column =>
                        {
                            return new DatabaseColumnInfo
                            {
                                name = column.ColumnName,
                                dataType = column.PostgresType.InternalName,
                            };
                        });

                        var rows = new List<string[]>();
                        while (await reader.ReadAsync())
                        {
                            var row = new string[reader.FieldCount];
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                // Should be string as AllResultTypesAreUnknown=true
                                //var value = reader.GetValue(i);
                                string resultValue = null;
                                //if (value is string valueString)
                                //{
                                //    resultValue = valueString;
                                //}
                                //else if (value is DBNull)
                                //{
                                //    resultValue = null;
                                //}
                                //else
                                //{
                                //    throw new Exception($"Unknown Value Type: {value.GetType().Name}");
                                //}
                                row[i] = resultValue;
                            }
                            rows.Add(row);
                        }

                        return new DatabaseQueryResult
                        {
                            columns = columns.ToArray(),
                            affectedRows = reader.RecordsAffected,
                            rows = new string[][] { new string[] { "wow" } },
                        };
                    }
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
