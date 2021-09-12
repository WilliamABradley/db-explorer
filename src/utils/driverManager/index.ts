import {NativeModules} from 'react-native';
import {
  DriverManagerMessagePayload,
  INativeMessageDatabaseDriver,
} from './types';
export * from './types';

const manager: INativeMessageDatabaseDriver = NativeModules.DriverManager;

if (manager === undefined || manager === null) {
  throw new Error('Native Module for DriverManager is not registered');
}

export async function sendManagerMessage<T = undefined>(
  message: DriverManagerMessagePayload,
): Promise<T> {
  if (message.payload.id === -1) {
    delete message.payload.id;
  }

  console.debug('Sending:', message);
  const response = await manager.postMessage(JSON.stringify(message));
  let result: any;
  try {
    result = JSON.parse(response);
  } catch (e: any) {
    throw new Error(
      `Failed to Parse DriverManager Message: ${response} (${e.message})`,
    );
  }
  console.debug('Received: ', result);

  switch (result.type) {
    case 'Result':
      return result.data;

    case 'Error':
      throw new Error(
        `${result.data.error_type}: ${result.data.error_message}`,
      );

    case 'FatalError':
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
