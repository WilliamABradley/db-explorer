#pragma warning disable IDE1006 // JS Naming Conventions

namespace db_explorer.modules.drivers.models
{
    public struct DatabaseQueryResult
    {
        public DatabaseColumnInfo[] columns { get;  set; }
        public string[][] rows { get; set; }
        public long affectedRows { get; set; }
    }
}
