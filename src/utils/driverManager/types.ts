import DatabaseConnectionInfo from '../../drivers/models/DatabaseConnectionInfo';
import DatabaseQueryResult from '../../drivers/models/DatabaseQueryResult';
import {SSHTunnelConfiguration, SSHTunnelPortForward} from '../../tunnel/types';

export interface INativeMessageDatabaseDriver {
  postMessage(message: string): Promise<string>;
}

export enum DriverManagerMessageClass {
  DatabaseDriver = 'DatabaseDriver',
  SSHTunnel = 'SSHTunnel',
}

export enum DriverManagerDatabaseMessageType {
  Create = 'Create',
  Connect = 'Connect',
  Close = 'Close',
  Execute = 'Execute',
  Query = 'Query',
  Flush = 'Flush',
}

export type DatabaseQueryData = {
  sql: string;
  variables?: Record<string, string> | undefined;
};

export type DriverManagerDatabaseMessage = {
  driver: string;
  id?: number | undefined;
} & (
  | {
      type: DriverManagerDatabaseMessageType.Create;
      data: DatabaseConnectionInfo;
    }
  | {
      type: DriverManagerDatabaseMessageType.Connect;
      data: never;
    }
  | {
      type: DriverManagerDatabaseMessageType.Close;
      data: never;
    }
  | {
      type: DriverManagerDatabaseMessageType.Execute;
      data: DatabaseQueryData;
    }
  | {
      type: DriverManagerDatabaseMessageType.Query;
      data: DatabaseQueryData;
    }
  | {
      type: DriverManagerDatabaseMessageType.Flush;
      data: never;
    }
);

export type DriverManagerDatabaseMessageResult = {
  [DriverManagerDatabaseMessageType.Create]: number;
  [DriverManagerDatabaseMessageType.Connect]: void;
  [DriverManagerDatabaseMessageType.Close]: void;
  [DriverManagerDatabaseMessageType.Execute]: number;
  [DriverManagerDatabaseMessageType.Query]: DatabaseQueryResult;
  [DriverManagerDatabaseMessageType.Flush]: void;
};

export enum DriverManagerTunnelMessageType {
  Create = 'Create',
  Test = 'Test',
  Connect = 'Connect',
  Close = 'Close',
  Flush = 'Flush',
}

export type DriverManagerTunnelMessage = {
  id?: number | undefined;
} & (
  | {
      type: DriverManagerTunnelMessageType.Create;
      data: SSHTunnelConfiguration;
    }
  | {
      type: DriverManagerTunnelMessageType.Connect;
      data: SSHTunnelPortForward;
    }
  | {
      type: DriverManagerTunnelMessageType.Test;
      data: never;
    }
  | {
      type: DriverManagerTunnelMessageType.Close;
      data: never;
    }
  | {
      type: DriverManagerTunnelMessageType.Flush;
      data: never;
    }
);

export type DriverManagerTunnelMessageResult = {
  [DriverManagerTunnelMessageType.Create]: number;
  [DriverManagerTunnelMessageType.Test]: void;
  [DriverManagerTunnelMessageType.Connect]: void;
  [DriverManagerTunnelMessageType.Close]: void;
  [DriverManagerTunnelMessageType.Flush]: void;
};

export type DriverManagerMessagePayload =
  | {
      class: DriverManagerMessageClass.DatabaseDriver;
      payload: DriverManagerDatabaseMessage;
    }
  | {
      class: DriverManagerMessageClass.SSHTunnel;
      payload: DriverManagerTunnelMessage;
    };
