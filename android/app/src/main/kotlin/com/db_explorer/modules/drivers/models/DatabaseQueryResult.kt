package com.db_explorer.modules.drivers.models

class DatabaseQueryResult(
    _rowsAffected: Long,
    _columns: Array<DatabaseColumnInfo>,
    _rows: Array<Array<String>>,
) {
    var rowsAffected: Long = _rowsAffected
    var columns: Array<DatabaseColumnInfo> = _columns
    var rows: Array<Array<String>> = _rows
}
