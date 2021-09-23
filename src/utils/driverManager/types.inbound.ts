import {DriverManagerDatabaseMessage} from './types.database';
import {DriverManagerTunnelMessage} from './types.tunnel';

export enum DriverManagerMessageClass {
  DatabaseDriver = 'DatabaseDriver',
  SSHTunnel = 'SSHTunnel',
}

type DriverManagerInboundMessageTemplate<
  TClass extends DriverManagerMessageClass,
  TPayload,
> = {
  class: TClass;
  payload: TPayload;
};

export type DriverManagerInboundMessage =
  | DriverManagerInboundMessageTemplate<
      DriverManagerMessageClass.DatabaseDriver,
      DriverManagerDatabaseMessage
    >
  | DriverManagerInboundMessageTemplate<
      DriverManagerMessageClass.SSHTunnel,
      DriverManagerTunnelMessage
    >;
