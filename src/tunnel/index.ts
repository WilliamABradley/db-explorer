import {
  DriverManagerMessageClass,
  DriverManagerTunnelMessageType,
  sendManagerMessage,
} from '../utils/driverManager';
import {
  SSHTunnelConfiguration,
  SSHTunnelConnection,
  SSHTunnelInfo,
} from './types';
export * from './types';

const FLUSH = false;

export default class SSHTunnel {
  constructor(connectionInfo: SSHTunnelInfo) {
    console.debug('Aquiring Native SSH Tunnel Instance');

    // We need to load the private key data from path.
    const getInstance = async () => {
      console.debug('Initialising Tunnel');
      const configuration: SSHTunnelConfiguration = {
        ...connectionInfo,
        privateKey: connectionInfo.privateKey
          ? connectionInfo.privateKey.data
          : undefined,
      };

      return this.sendDriverMessage<number>(
        DriverManagerTunnelMessageType.Create,
        configuration,
      );
    };

    // Handle hot flush.
    if (FLUSH && __DEV__) {
      console.debug('Flushing Tunnel');
      const flush = this.sendDriverMessage(
        DriverManagerTunnelMessageType.Flush,
      );
      this.#instance = flush.then(getInstance);
    } else {
      this.#instance = getInstance();
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.debug('Native Tunnel Instance: ', id);
    });
  }

  #instance: Promise<number>;
  #instanceId: number = -1;
  public connected: boolean = false;
  public connection: SSHTunnelConnection | null = null;

  private sendDriverMessage<T>(
    type: DriverManagerTunnelMessageType,
    data?: any,
  ): Promise<T> {
    return sendManagerMessage({
      class: DriverManagerMessageClass.SSHTunnel,
      payload: {
        id: this.#instanceId,
        type,
        data,
      },
    });
  }

  public async connect(): Promise<SSHTunnelConnection> {
    await this.#instance;
    console.debug(`Connecting Tunnel: ${this.#instanceId}`);
    this.connection = await this.sendDriverMessage<SSHTunnelConnection>(
      DriverManagerTunnelMessageType.Connect,
    );
    this.connected = true;
    console.debug(`Connected Tunnel: ${this.#instanceId}`);
    return this.connection;
  }

  public async close(): Promise<void> {
    console.debug(`Closing Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Close);
    this.connected = false;
    console.debug(`Closed Tunnel: ${this.#instanceId}`);
  }
}
