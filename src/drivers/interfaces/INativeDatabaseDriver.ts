import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import DatabaseQueryResult from '../models/DatabaseQueryResult';

export type NativeDatabaseConnectionInfo = Partial<
  Record<keyof DatabaseConnectionInfo, string>
>;

export default interface INativeDatabaseDriver {
  create(connectionInfo: NativeDatabaseConnectionInfo): Promise<number>;
  connect(id: number): Promise<void>;
  close(id: number): Promise<void>;
  execute(
    id: number,
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult>;
  flush(): Promise<void>;
}
