import {SSHTunnelConfiguration, SSHTunnelPortForward} from '../../tunnel/types';

export enum DriverManagerTunnelMessageType {
  Create = 'Create',
  TestAuth = 'TestAuth',
  Connect = 'Connect',
  TestPort = 'TestPort',
  Close = 'Close',
  Flush = 'Flush',
}

type DriverManagerTunnelMessageTemplate<
  TType extends DriverManagerTunnelMessageType,
  TData = never,
> = {
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
  | DriverManagerTunnelMessageInstanceTemplate<
      DriverManagerTunnelMessageType.Connect,
      SSHTunnelPortForward
    >
  | DriverManagerTunnelMessageInstanceTemplate<DriverManagerTunnelMessageType.TestPort>
  | DriverManagerTunnelMessageInstanceTemplate<DriverManagerTunnelMessageType.Close>;

export type DriverManagerTunnelMessageResult = {
  [DriverManagerTunnelMessageType.Create]: number;
  [DriverManagerTunnelMessageType.TestAuth]: void;
  [DriverManagerTunnelMessageType.Connect]: void;
  [DriverManagerTunnelMessageType.TestPort]: boolean;
  [DriverManagerTunnelMessageType.Close]: void;
  [DriverManagerTunnelMessageType.Flush]: void;
};
