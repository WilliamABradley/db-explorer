import { NativeEventEmitter, NativeModules } from 'react-native';
import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import DatabaseDriver from '../DatabaseDriver';
import DatabaseQueryResult from '../models/DatabaseQueryResult';

// Logic to ensure hot reload doesn't leave connections open.
const flushDictionary: string[] = [];
const FLUSH = false;

interface INativeMessageDatabaseDriver {
  postMessage(message: string): Promise<string>;
}

const manager: INativeMessageDatabaseDriver = NativeModules.DriverManager;
const emitter = new NativeEventEmitter(NativeModules.DriverManager);

emitter.addListener('receiveMessage', ev => {
  console.log('[DriverManager]');
  console.log(ev);
});

async function sendManagerMessage<T>(driver: string, type: string, data?: any): Promise<T> {
  const message = {
    type: 'DatabaseDriver',
    data: {
      type,
      driver,
      data,
    },
  };
  const response = await manager.postMessage(JSON.stringify(message));
  const result = JSON.parse(response);
  switch (result.type) {
    case 'Result':
      return result.data;

    case 'Error':
      throw new Error(`DriverManager (${result.data.error_type}): ${result.data.error_message}`);

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
      const flush = sendManagerMessage(this.#driverName, 'Flush');
      this.#instance = flush.then(() => {
        console.debug(`Initialising ${this.#driverName}`);
        return sendManagerMessage(this.#driverName, 'Create', createInfo);
      });
      flushDictionary.push(this.#driverName);
    } else {
      this.#instance = sendManagerMessage(this.#driverName, 'Create', createInfo);
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
    await this.sendDriverMessage('Connect');
    console.debug(`Connected ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _close(): Promise<void> {
    console.debug(`Closing ${this.#driverName}: ${this.#instanceId}`);
    await this.sendDriverMessage('Close');
    console.debug(`Closed ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<number> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage<number>('Execute', { sql, variables });
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }

  protected override async _query(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage<DatabaseQueryResult>('Query', { sql, variables });
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }
}