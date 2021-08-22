import DatabaseDriver, {DatabaseConnectionInfo} from './DatabaseDriver';
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

    if (!driver) {
      throw new Error(
        `Native Module for ${this.#driverName} is not registered`,
      );
    }

    // Handle hot flush.
    if (__DEV__ && !flushDictionary.includes(this.#driverName)) {
      console.log(`Flushing ${this.#driverName}`);
      const flush = this.#driver.flush();
      this.#instance = flush.then(() => this.#driver.init(connectionInfo));
      flushDictionary.push(this.#driverName);
    } else {
      this.#instance = this.#driver.init(connectionInfo);
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.log(`Native ${this.#driverName} Instance: `, id);
    });
  }

  #driverName: string;
  #driver: INativeDatabaseDriver;
  #instance: Promise<number>;
  #instanceId: number;

  protected override async _connect(): Promise<void> {
    await this.#instance;
    return this.#driver.connect(this.#instanceId);
  }

  protected override async _close(): Promise<void> {
    return this.#driver.close(this.#instanceId);
  }

  protected override async _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<string> {
    return this.#driver.execute(this.#instanceId, sql, variables);
  }
}
