import {DatabaseConnectionInfo} from '../DatabaseDriver';

export default interface INativeDatabaseDriver {
  init(connectionInfo: DatabaseConnectionInfo): Promise<number>;
  connect(id: number): Promise<void>;
  close(id: number): Promise<void>;
  execute(
    id: number,
    sql: string,
    variables?: Record<string, any>,
  ): Promise<string>;
  flush(): Promise<void>;
}
