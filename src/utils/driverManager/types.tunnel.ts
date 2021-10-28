import {SSHTunnelConfiguration, SSHTunnelPortForward} from '../../tunnel/types';

export enum DriverManagerTunnelMessageType {
  Create = 'Create',
  TestAuth = 'TestAuth',
  Connect = 'Connect',
  Close = 'Close',
  Flush = 'Flush',
}

type DriverManagerTunnelMessageTemplate<
  TType extends DriverManagerTunnelMessageType,
  TData = never,
> = {
  driver: string;
  type: TType;
  data: TData;
};

type DriverManagerTunnelMessageInstanceTemplate<
  TType extends DriverManagerTunnelMessageType,
  TData = never,
> = DriverManagerTunnelMessageTemplate<TType, TData> & {
  id: number;
};

export type DriverManagerTunnelMessage =
  | DriverManagerTunnelMessageTemplate<
      DriverManagerTunnelMessageType.Create,
      SSHTunnelConfiguration
    >
  | DriverManagerTunnelMessageTemplate<DriverManagerTunnelMessageType.Flush>
  | DriverManagerTunnelMessageTemplate<DriverManagerTunnelMessageType.TestAuth>
  | DriverManagerTunnelMessageInstanceTemplate<
      DriverManagerTunnelMessageType.Connect,
      SSHTunnelPortForward
    >
  | DriverManagerTunnelMessageInstanceTemplate<DriverManagerTunnelMessageType.Close>;

export type DriverManagerTunnelMessageResult = {
  [DriverManagerTunnelMessageType.Create]: number;
  [DriverManagerTunnelMessageType.TestAuth]: void;
  [DriverManagerTunnelMessageType.Connect]: number;
  [DriverManagerTunnelMessageType.Close]: void;
  [DriverManagerTunnelMessageType.Flush]: void;
};
