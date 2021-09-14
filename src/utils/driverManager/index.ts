import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
  DriverErrors,
  DriverManagerMessagePayload,
  DriverManagerOutboundMessage,
  DriverManagerOutboundMessageType,
  INativeMessageDatabaseDriver,
} from './types';

export * from './types';

const manager: INativeMessageDatabaseDriver = NativeModules.DriverManager;

if (manager === undefined || manager === null) {
  throw new Error('Native Module for DriverManager is not registered');
}

let emitter: NativeEventEmitter | null = null;
let eventEmitterSubscription: EmitterSubscription | null = null;

export function registerEventEmitter() {
  emitter = new NativeEventEmitter(NativeModules.DriverManager);
  eventEmitterSubscription = emitter.addListener(
    'DriverManagerEvent',
    event => {
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
    },
  );
}

export function unregisterEventEmitter() {
  if (emitter && eventEmitterSubscription) {
    emitter.removeSubscription(eventEmitterSubscription);
  }
}

export async function sendManagerMessage<T = undefined>(
  message: DriverManagerMessagePayload,
): Promise<T> {
  const payload = <any>message.payload;
  if (payload.id === -1) {
    delete payload.id;
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
