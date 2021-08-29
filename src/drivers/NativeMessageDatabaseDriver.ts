import { NativeModules } from 'react-native';
import DatabaseConnectionInfo from './models/DatabaseConnectionInfo';
import DatabaseDriver from './DatabaseDriver';
import DatabaseQueryResult from './models/DatabaseQueryResult';

// Logic to ensure hot reload doesn't leave connections open.
const flushDictionary: string[] = [];
const FLUSH = false;

interface INativeMessageDatabaseDriver {
  sendMessage(message: string): Promise<string>;
}

const manager: INativeMessageDatabaseDriver = NativeModules.DriverManager;

async function sendManagerMessage<T>(driver: string, type: string, data?: any): Promise<T> {
  const message = {
    type,
    data: {
      driver,
      ...data,
    },
  };
  const response = await manager.sendMessage(JSON.stringify(message));
  console.log(response);
  const result = JSON.parse(response);
  switch (result.type) {
    case 'result':
      return result;

    default:
      throw new Error(`Received ${result.type} from Driver Manager: ${JSON.stringify(result.data, null, 2)}`);
  }
}

export default abstract class NativeMessageDatabaseDriver extends DatabaseDriver {
  constructor(
    driver: string,
    connectionInfo: DatabaseConnectionInfo,
  ) {
    super(connectionInfo);
    this.#driverName = driver;

    if (manager === undefined || manager === null) {
      throw new Error(
        'Native Module for DriverManager is not registered',
      );
    }

    console.debug(`Aquiring Native ${this.#driverName} Instance`);
    const createInfo = {
      driver,
      connectionInfo,
    };

    // Handle hot flush.
    if (FLUSH && __DEV__ && !flushDictionary.includes(this.#driverName)) {
      console.debug(`Flushing ${this.#driverName}`);
      const flush = sendManagerMessage(this.#driverName, 'flush');
      this.#instance = flush.then(() => {
        console.debug(`Initialising ${this.#driverName}`);
        return sendManagerMessage(this.#driverName, 'create', createInfo);
      });
      flushDictionary.push(this.#driverName);
    } else {
      this.#instance = sendManagerMessage(this.#driverName, 'create', createInfo);
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.debug(`Native ${this.#driverName} Instance: `, id);
    });
  }

  #driverName: string;
  #instance: Promise<number>;
  #instanceId: number = -1;

  private sendDriverMessage<T>(type: string, data?: any): Promise<T> {
    return sendManagerMessage(this.#driverName, type, {
      id: this.#instanceId,
      data,
    });
  }

  protected override async _connect(): Promise<void> {
    await this.#instance;
    console.debug(`Connecting ${this.#driverName}: ${this.#instanceId}`);
    await this.sendDriverMessage('connect');
    console.debug(`Connected ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _close(): Promise<void> {
    console.debug(`Closing ${this.#driverName}: ${this.#instanceId}`);
    await this.sendDriverMessage('close');
    console.debug(`Closed ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<number> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage<number>('execute', { sql, variables });
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }

  protected override async _query(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage<DatabaseQueryResult>('query', { sql, variables });
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }
}
