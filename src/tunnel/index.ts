import {
  DriverManagerMessageClass,
  DriverManagerTunnelMessage,
  DriverManagerTunnelMessageResult,
  DriverManagerTunnelMessageType,
  sendManagerMessage,
} from '../utils/driverManager';
import {
  SSHTunnelConfiguration,
  SSHTunnelInfo,
  SSHTunnelPortForward,
} from './types';
export * from './types';

const FLUSH = true;

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

      return this.sendDriverMessage(
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
  public localPort: number = 0;

  private sendDriverMessage<TType extends DriverManagerTunnelMessageType>(
    type: TType,
    data?: ({type: TType} & DriverManagerTunnelMessage)['data'],
  ): Promise<DriverManagerTunnelMessageResult[TType]> {
    return sendManagerMessage('driver', {
      class: DriverManagerMessageClass.SSHTunnel,
      payload: <DriverManagerTunnelMessage>{
        driver: 'LIBSSH2',
        id: this.#instanceId,
        type,
        data,
      },
    });
  }

  public async testAuth(): Promise<void> {
    await this.#instance;

    console.debug(`Testing Tunnel Auth: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.TestAuth);
    console.debug(`Tested Tunnel Auth: ${this.#instanceId}`);
  }

  public async connect(forward: SSHTunnelPortForward): Promise<number> {
    await this.#instance;

    console.debug(
      `Connecting Tunnel: ${this.#instanceId} to Port ${
        forward.localPort || 0
      }`,
    );
    this.localPort = await this.sendDriverMessage(
      DriverManagerTunnelMessageType.Connect,
      forward,
    );
    this.connected = true;
    console.debug(`Connected Tunnel: ${this.#instanceId} on ${this.localPort}`);

    return this.localPort;
  }

  public async testPort(): Promise<boolean> {
    console.debug(`Testing Tunnel: ${this.#instanceId}`);
    throw new Error('Not implemented');
    //console.debug(`Tested Tunnel: ${this.#instanceId}`);
    //return result;
  }

  public async close(): Promise<void> {
    console.debug(`Closing Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Close);
    this.connected = false;
    console.debug(`Closed Tunnel: ${this.#instanceId}`);
  }
}
