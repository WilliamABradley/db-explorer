import DatabaseColumnInfo from './DatabaseColumnInfo';
import DatabaseValueInfo from './DatabaseValueInfo';

export default interface DatabaseQueryResult {
  columns: DatabaseColumnInfo[];
  rows: DatabaseValueInfo[][];
};