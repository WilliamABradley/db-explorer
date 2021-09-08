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

export type DriverManagerDatabaseMessage =
  | {
      type: DriverManagerDatabaseMessageType.Create;
      data: Record<string, string>;
    }
  | {
      type: DriverManagerDatabaseMessageType.Connect;
    }
  | {
      type: DriverManagerDatabaseMessageType.Close;
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
    };

export enum DriverManagerTunnelMessageType {
  Create = 'Create',
  Connect = 'Connect',
  Close = 'Close',
  Flush = 'Flush',
}

export type DriverManagerTunnelMessage =
  | {
      type: DriverManagerTunnelMessageType.Create;
      data: Record<string, string>;
    }
  | {
      type: DriverManagerTunnelMessageType.Connect;
    }
  | {
      type: DriverManagerTunnelMessageType.Close;
    }
  | {
      type: DriverManagerTunnelMessageType.Flush;
    };

export type DriverManagerMessagePayload =
  | {
      class: DriverManagerMessageClass.DatabaseDriver;
      payload: {
        driver: string;
        id?: number | undefined;
      } & DriverManagerDatabaseMessage;
    }
  | {
      class: DriverManagerMessageClass.SSHTunnel;
      payload: {
        id?: number | undefined;
      } & DriverManagerTunnelMessage;
    };
