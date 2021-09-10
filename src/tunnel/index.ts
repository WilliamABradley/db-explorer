import {
  DriverManagerMessageClass,
  DriverManagerTunnelMessageType,
  sendManagerMessage,
} from '../utils/driverManager';
import {SSHTunnelInfo} from './types';
export * from './types';

const FLUSH = false;

export default class SSHTunnel {
  constructor(connectionInfo: SSHTunnelInfo) {
    console.debug('Aquiring Native SSH Tunnel Instance');

    // Handle hot flush.
    if (FLUSH && __DEV__) {
      console.debug('Flushing Tunnel');
      const flush = this.sendDriverMessage(
        DriverManagerTunnelMessageType.Flush,
      );
      this.#instance = flush.then(() => {
        console.debug('Initialising Tunnel');
        return this.sendDriverMessage(
          DriverManagerTunnelMessageType.Create,
          connectionInfo,
        );
      });
    } else {
      this.#instance = this.sendDriverMessage(
        DriverManagerTunnelMessageType.Create,
        connectionInfo,
      );
    }

    this.#instance.then(id => {
      this.#instanceId = id;
      console.debug('Native Tunnel Instance: ', id);
    });
  }

  #instance: Promise<number>;
  #instanceId: number = -1;
  public connected: boolean = false;

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

  public async connect(): Promise<void> {
    await this.#instance;
    console.debug(`Connecting Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Connect);
    this.connected = true;
    console.debug(`Connected Tunnel: ${this.#instanceId}`);
  }

  public async close(): Promise<void> {
    console.debug(`Closing Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Close);
    this.connected = false;
    console.debug(`Closed Tunnel: ${this.#instanceId}`);
  }
}
