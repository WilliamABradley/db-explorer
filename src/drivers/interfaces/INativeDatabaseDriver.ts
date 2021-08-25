import { DatabaseConnectionInfo } from '../DatabaseDriver';

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
  ): Promise<string>;
  flush(): Promise<void>;
}
