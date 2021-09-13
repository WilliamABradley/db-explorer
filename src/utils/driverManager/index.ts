import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {
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
            message += ` (Fatal)`;
          }
          (<any>console)[level](message);
          break;

        case DriverManagerOutboundMessageType.Error:
          throw new Error(
            `${result.data.error_type}: ${result.data.error_message}`,
          );

        case DriverManagerOutboundMessageType.FatalError:
          throw new Error(result.data);

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
  if (message.payload.id === -1) {
    delete message.payload.id;
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
      throw new Error(
        `${result.data.error_type}: ${result.data.error_message}`,
      );

    case DriverManagerOutboundMessageType.FatalError:
      throw new Error(result.data);

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
