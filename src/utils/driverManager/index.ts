import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  DriverErrors,
  DriverManagerInboundMessage,
  DriverManagerOutboundMessage,
  DriverManagerOutboundMessageType,
  INativeMessageDriver,
} from './types';

export * from './types';

const driverManager: INativeMessageDriver = NativeModules.DriverManager;
const platformDriverManager: INativeMessageDriver =
  NativeModules.PlatformDriverManager;

if (driverManager === undefined || driverManager === null) {
  throw new Error('Native Module for DriverManager is not registered');
}

if (platformDriverManager === undefined || platformDriverManager === null) {
  throw new Error('Native Module for PlatformDriverManager is not registered');
}

let driverEmitter: NativeEventEmitter | null = null;
let driverEventEmitterSubscription: EmitterSubscription | null = null;

function onReceive(event: string) {
  const result: DriverManagerOutboundMessage = JSON.parse(event);

  switch (result.type) {
    case DriverManagerOutboundMessageType.Log:
      let level = result.data.level.toLowerCase();
      let message = result.data.message;

      // Fatal doesn't exist in console.
      if (level === 'fatal') {
        level = 'error';
        message = `Fatal: ${message}`;
      }
      (<any>console)[level](message);
      break;

    case DriverManagerOutboundMessageType.Error:
      throw new Error(getErrorMessage(result.data));

    default:
      throw new Error(
        `Received ${result.type} from Driver Manager: ${JSON.stringify(
          result.data,
          null,
          2,
        )}`,
      );
  }
}

export function registerEventEmitters() {
  driverEmitter = new NativeEventEmitter(NativeModules.RNEventEmitter);
  driverEventEmitterSubscription = driverEmitter.addListener(
    'DriverManagerEvent',
    onReceive,
  );
}

export function unregisterEventEmitters() {
  if (driverEmitter && driverEventEmitterSubscription) {
    driverEmitter.removeSubscription(driverEventEmitterSubscription);
  }
}

export async function sendManagerMessage<T = undefined>(
  to: 'driver' | 'platform',
  message: DriverManagerInboundMessage,
): Promise<T> {
  const payload = <any>message.payload;
  if (payload.id === -1) {
    delete payload.id;
  }

  let manager: INativeMessageDriver;
  switch (to) {
    case 'driver':
      manager = driverManager;
      break;

    case 'platform':
      manager = platformDriverManager;
      break;
  }

  console.debug('Sending:', message);
  const response = await manager.postMessage(JSON.stringify(message));
  let result: DriverManagerOutboundMessage;
  try {
    result = JSON.parse(response);
  } catch (e: any) {
    throw new Error(
      `Failed to Parse DriverManager Message: ${response} (${e.message})`,
    );
  }
  console.debug('Received: ', result);

  switch (result.type) {
    case DriverManagerOutboundMessageType.Result:
      return result.data;

    case DriverManagerOutboundMessageType.Error:
      throw new Error(getErrorMessage(result.data));

    default:
      throw new Error(
        `Received ${result.type} from Driver Manager: ${JSON.stringify(
          result.data,
          null,
          2,
        )}`,
      );
  }
}

function getErrorMessage(error: DriverErrors): string {
  switch (error.error_type) {
    case 'Error':
      return error.error_data;

    case 'FatalError':
      return `Fatal: ${error.error_data}`;

    case 'ParseError':
      return `Failed to parse message: ${error.error_data}`;

    case 'SerializeError':
      return `Failed to serialize message: ${error.error_data}`;

    case 'NoConnectionError':
      return `${error.error_data.connection_type} Connection ${error.error_data.connection_id} not found`;

    case 'UnknownMessage':
      return `Received unhandled message type for ${error.error_data.unknown_from}: ${error.error_data.unknown_type}`;

    case 'UnknownDriver':
      return `Unknown ${error.error_data.unknown_from}: ${error.error_data.unknown_type}`;

    case 'UnknownError':
      return 'An unexpected error occurred';

    default:
      return JSON.stringify(error);
  }
}
