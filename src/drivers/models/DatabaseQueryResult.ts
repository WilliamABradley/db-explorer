import DatabaseColumnInfo from './DatabaseColumnInfo';

export default interface DatabaseQueryResult {
  columns: DatabaseColumnInfo[];
  rows: (Buffer | null)[][];
}
