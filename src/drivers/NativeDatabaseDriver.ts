import DatabaseDriver, { DatabaseConnectionInfo } from './DatabaseDriver';
import INativeDatabaseDriver from './interfaces/INativeDatabaseDriver';

// Logic to ensure hot reload doesn't leave connections open.
const flushDictionary: string[] = [];

export default abstract class NativeDriver extends DatabaseDriver {
  constructor(
    driver: INativeDatabaseDriver,
    connectionInfo: DatabaseConnectionInfo,
  ) {
    super(connectionInfo);
    this.#driverName = this.constructor.name;
    this.#driver = driver;

    if (driver === undefined || driver === null) {
      throw new Error(
        `Native Module for ${this.#driverName} is not registered`,
      );
    }

    const _connectionInfo: Partial<
      Record<keyof DatabaseConnectionInfo, string>
    > = {
      ...connectionInfo,
      ssl: connectionInfo.ssl.toString(),
    };

    console.debug(`Aquiring Native ${this.#driverName} Instance`);

    // Handle hot flush.
    if (__DEV__ && !flushDictionary.includes(this.#driverName)) {
      console.debug(`Flushing ${this.#driverName}`);
      const flush = this.#driver.flush();
      this.#instance = flush.then(() => {
        console.debug(`Initialising ${this.#driverName}`);
        return this.#driver.create(_connectionInfo);
      });
      flushDictionary.push(this.#driverName);
    } else {
      this.#instance = this.#driver.create(_connectionInfo);
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.debug(`Native ${this.#driverName} Instance: `, id);
    });
  }

  #driverName: string;
  #driver: INativeDatabaseDriver;
  #instance: Promise<number>;
  #instanceId: number = -1;

  protected override async _connect(): Promise<void> {
    await this.#instance;
    console.debug(`Connecting ${this.#driverName}: ${this.#instanceId}`);
    await this.#driver.connect(this.#instanceId);
    console.debug(`Connected ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _close(): Promise<void> {
    console.debug(`Closing ${this.#driverName}: ${this.#instanceId}`);
    await this.#driver.close(this.#instanceId);
    console.debug(`Closed ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<string> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.#driver.execute(this.#instanceId, sql, variables);
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }
}
