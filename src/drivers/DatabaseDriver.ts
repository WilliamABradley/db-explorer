import DatabaseConnectionInfo from './models/DatabaseConnectionInfo';
import DatabaseQueryResult from './models/DatabaseQueryResult';

export default abstract class DatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    this.connectionInfo = connectionInfo;
  }

  public connectionInfo: DatabaseConnectionInfo;
  public connected: boolean = false;

  // Database Internal functions
  protected abstract _connect(): Promise<void>;
  protected abstract _close(): Promise<void>;
  protected abstract _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<number>;
  protected abstract _query(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult>;

  public async connect(): Promise<void> {
    if (!this.connected) {
      this.connected = true;
      await this._connect();
    } else {
      throw new Error('Connection already open');
    }
  }

  public async close(): Promise<void> {
    if (this.connected) {
      await this._close();
    } else {
      throw new Error('Connection not open');
    }
  }

  public async execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<number> {
    if (!this.connected) {
      throw new Error('Connection not open');
    }
    return this._execute(sql, variables);
  }

  public async query(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult> {
    if (!this.connected) {
      throw new Error('Connection not open');
    }
    return this._query(sql, variables);
  }
}
