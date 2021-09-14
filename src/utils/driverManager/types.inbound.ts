import {DriverManagerDatabaseMessage} from './types.database';
import {DriverManagerTunnelMessage} from './types.tunnel';

export enum DriverManagerMessageClass {
  DatabaseDriver = 'DatabaseDriver',
  SSHTunnel = 'SSHTunnel',
}

type DriverManagerMessagePayloadTemplate<
  TClass extends DriverManagerMessageClass,
  TPayload,
> = {
  class: TClass;
  payload: TPayload;
};

export type DriverManagerMessagePayload =
  | DriverManagerMessagePayloadTemplate<
      DriverManagerMessageClass.DatabaseDriver,
      DriverManagerDatabaseMessage
    >
  | DriverManagerMessagePayloadTemplate<
      DriverManagerMessageClass.SSHTunnel,
      DriverManagerTunnelMessage
    >;
