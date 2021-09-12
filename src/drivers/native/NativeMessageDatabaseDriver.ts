import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import DatabaseDriver from '../DatabaseDriver';
import DatabaseQueryResult from '../models/DatabaseQueryResult';
import {sendManagerMessage} from '../../utils/driverManager';
import {
  DriverManagerDatabaseMessage,
  DriverManagerDatabaseMessageResult,
  DriverManagerDatabaseMessageType,
  DriverManagerMessageClass,
} from '../../utils/driverManager/types';

// Logic to ensure hot reload doesn't leave connections open.
const flushDictionary: string[] = [];
const FLUSH = false;

export default abstract class NativeMessageDatabaseDriver extends DatabaseDriver {
  constructor(driver: string, connectionInfo: DatabaseConnectionInfo) {
    super(connectionInfo);
    this.#driverName = driver;

    console.debug(`Aquiring Native ${this.#driverName} Instance`);

    const getInstance = async () => {
      console.debug(`Initialising ${this.#driverName}`);

      return this.sendDriverMessage(
        DriverManagerDatabaseMessageType.Create,
        connectionInfo,
      );
    };

    // Handle hot flush.
    if (FLUSH && __DEV__ && !flushDictionary.includes(this.#driverName)) {
      console.debug(`Flushing ${this.#driverName}`);
      const flush = this.sendDriverMessage(
        DriverManagerDatabaseMessageType.Flush,
      );
      this.#instance = flush.then(getInstance);
      flushDictionary.push(this.#driverName);
    } else {
      this.#instance = getInstance();
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.debug(`Native ${this.#driverName} Instance: `, id);
    });
  }

  #driverName: string;
  #instance: Promise<number>;
  #instanceId: number = -1;

  private sendDriverMessage<TType extends DriverManagerDatabaseMessageType>(
    type: TType,
    data?: ({type: TType} & DriverManagerDatabaseMessage)['data'],
  ): Promise<DriverManagerDatabaseMessageResult[TType]> {
    return sendManagerMessage({
      class: DriverManagerMessageClass.DatabaseDriver,
      payload: <DriverManagerDatabaseMessage>{
        driver: this.#driverName,
        id: this.#instanceId,
        type,
        data,
      },
    });
  }

  protected override async _connect(): Promise<void> {
    await this.#instance;
    console.debug(`Connecting ${this.#driverName}: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerDatabaseMessageType.Connect);
    console.debug(`Connected ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _close(): Promise<void> {
    console.debug(`Closing ${this.#driverName}: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerDatabaseMessageType.Close);
    console.debug(`Closed ${this.#driverName}: ${this.#instanceId}`);
  }

  protected override async _execute(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<number> {
    console.debug(`Executing on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage(
      DriverManagerDatabaseMessageType.Execute,
      {
        sql,
        variables,
      },
    );
    console.debug(`Executed on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }

  protected override async _query(
    sql: string,
    variables?: Record<string, any>,
  ): Promise<DatabaseQueryResult> {
    console.debug(`Querying on ${this.#driverName}: ${this.#instanceId}`);
    const result = await this.sendDriverMessage(
      DriverManagerDatabaseMessageType.Query,
      {
        sql,
        variables,
      },
    );
    console.debug(`Querying on ${this.#driverName}: ${this.#instanceId}`);
    return result;
  }
}
