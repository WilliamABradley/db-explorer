export type DatabaseConnectionInfo = {
  host: string;
  port: string;
  username?: string;
  password?: string;
  database?: string;
};

export default abstract class DatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    this.connectionInfo = connectionInfo;
  }

  public connectionInfo: DatabaseConnectionInfo;
  public connected: boolean;

  // Database Internal functions
  protected abstract _connect(): Promise<void>;
  protected abstract _close(): Promise<void>;
  protected abstract _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<string>;

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
  ): Promise<string> {
    if (!this.connected) {
      throw new Error('Connection not open');
    }
    return this._execute(sql, variables);
  }
}
