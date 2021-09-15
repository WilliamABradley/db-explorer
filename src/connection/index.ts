import DatabaseDriver from '../drivers/DatabaseDriver';
import DatabaseConnectionInfo from '../drivers/models/DatabaseConnectionInfo';
import PostgresDriver from '../drivers/postgres';
import SSHTunnel, {SSHTunnelInfo} from '../tunnel';
import {
  deleteSecureData,
  getSecureData,
  setSecureData,
} from '../utils/secureStorage';

export default class DatabaseConnection {
  constructor(config?: DatabaseConnectionConfig, temporary: boolean = false) {
    this.config = config || {
      database: null,
      tunnel: null,
    };
    this.temporary = temporary;
  }

  public config: DatabaseConnectionConfig;
  public temporary: boolean;
  private _driver: DatabaseDriver | null = null;
  private _tunnel: SSHTunnel | null = null;

  private async reconfigure() {
    if (!this._driver) return;

    await this.close();

    if (!this.config.database) {
      return;
    }

    await this.getConnectedDriver();
  }

  private async update() {
    await this.reconfigure();
    if (!this.temporary) {
      await StoreConnection(this);
    }
  }

  public getTunnel(): SSHTunnel | null {
    if (this._tunnel) {
      return this._tunnel;
    }

    if (this.config.tunnel) {
      this._tunnel = new SSHTunnel(this.config.tunnel);
    }

    return this._tunnel;
  }

  public async getConnectedDriver(): Promise<DatabaseDriver | null> {
    // Return null if driver not configured.
    if (!this.config.database) {
      return null;
    }

    // Build river.
    if (!this._driver) {
      const tunnel = this.getTunnel();

      // Create new driver.
      if (tunnel) {
        await tunnel.connect({
          remoteHost: this.config.database.host,
          remotePort: this.config.database.port,
          localPort: 0,
        });

        this._driver = new PostgresDriver({
          ...this.config.database,
          host: 'localhost',
          port: tunnel.localPort,
        });
      } else {
        this._driver = new PostgresDriver(this.config.database);
      }
    }

    // Connect if not connected.
    if (!this._driver.connected) {
      await this._driver.connect();
    }
    return this._driver;
  }

  public async setDatabase(database: DatabaseConnectionInfo | null) {
    this.config.database = database;
    await this.update();
  }

  public async setTunnel(tunnel: SSHTunnelInfo | null) {
    this.config.tunnel = tunnel;
    await this.update();
  }

  public async close() {
    if (this._driver) {
      await this._driver.close();
      this._driver = null;
    }

    if (this._tunnel) {
      await this._tunnel.close();
      this._tunnel = null;
    }
  }
}

export type DatabaseConnectionConfig = {
  database: DatabaseConnectionInfo | null;
  tunnel: SSHTunnelInfo | null;
};

const STORE_KEY = 'connection';
let _connection: Promise<DatabaseConnection> | null = null;

export async function LoadConnection(): Promise<DatabaseConnection> {
  if (_connection) {
    return _connection;
  }

  _connection = getSecureData<DatabaseConnectionConfig>(STORE_KEY).then(
    info => {
      if (info) {
        return new DatabaseConnection(info);
      }
      return new DatabaseConnection();
    },
  );

  return _connection;
}

export async function StoreConnection(connection: DatabaseConnection) {
  await setSecureData(STORE_KEY, connection.config);
}

export async function DeleteConnection() {
  _connection = null;
  await deleteSecureData(STORE_KEY);
}
