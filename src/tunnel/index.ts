import FindFreePort from 'react-native-find-free-port';
import {
  DriverManagerMessageClass,
  DriverManagerTunnelMessage,
  DriverManagerTunnelMessageResult,
  DriverManagerTunnelMessageType,
  sendManagerMessage,
} from '../utils/driverManager';
import {
  SSHTunnelConfiguration,
  SSHTunnelConnection,
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
  public connection: SSHTunnelConnection | null = null;

  private sendDriverMessage<TType extends DriverManagerTunnelMessageType>(
    type: TType,
    data?: ({type: TType} & DriverManagerTunnelMessage)['data'],
  ): Promise<DriverManagerTunnelMessageResult[TType]> {
    return sendManagerMessage({
      class: DriverManagerMessageClass.SSHTunnel,
      payload: <DriverManagerTunnelMessage>{
        id: this.#instanceId,
        type,
        data,
      },
    });
  }

  public async test(): Promise<void> {
    console.debug(`Testing Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Test);
    console.debug(`Tested Tunnel: ${this.#instanceId}`);
  }

  public async connect(
    forward: SSHTunnelPortForward,
  ): Promise<SSHTunnelConnection> {
    await this.#instance;
    const localPort =
      forward.localPort ||
      (await FindFreePort.getFirstStartingFrom(1024)).toString();

    console.debug(
      `Connecting Tunnel: ${this.#instanceId} to Port ${localPort}`,
    );
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Connect, {
      ...forward,
      localPort,
    });
    this.connected = true;
    console.debug(`Connected Tunnel: ${this.#instanceId}`);

    return {localPort};
  }

  public async close(): Promise<void> {
    console.debug(`Closing Tunnel: ${this.#instanceId}`);
    await this.sendDriverMessage(DriverManagerTunnelMessageType.Close);
    this.connected = false;
    console.debug(`Closed Tunnel: ${this.#instanceId}`);
  }
}
