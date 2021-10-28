import DatabaseConnectionInfo from '../../database/models/DatabaseConnectionInfo';
import DatabaseQueryResult from '../../database/models/DatabaseQueryResult';
import DatabaseQueryData from '../../database/models/DatabaseQueryData';

export enum DriverManagerDatabaseMessageType {
  Create = 'Create',
  Connect = 'Connect',
  Close = 'Close',
  Execute = 'Execute',
  Query = 'Query',
  Flush = 'Flush',
}

type DriverManagerDatabaseMessageTemplate<
  TType extends DriverManagerDatabaseMessageType,
  TData = never,
> = {
  driver: string;
  type: TType;
  data: TData;
};

type DriverManagerDatabaseMessageInstanceTemplate<
  TType extends DriverManagerDatabaseMessageType,
  TData = never,
> = DriverManagerDatabaseMessageTemplate<TType, TData> & {
  id: number;
};

export type DriverManagerDatabaseMessage =
  | DriverManagerDatabaseMessageTemplate<
      DriverManagerDatabaseMessageType.Create,
      DatabaseConnectionInfo
    >
  | DriverManagerDatabaseMessageTemplate<DriverManagerDatabaseMessageType.Flush>
  | DriverManagerDatabaseMessageInstanceTemplate<DriverManagerDatabaseMessageType.Connect>
  | DriverManagerDatabaseMessageInstanceTemplate<DriverManagerDatabaseMessageType.Close>
  | DriverManagerDatabaseMessageInstanceTemplate<
      DriverManagerDatabaseMessageType.Execute,
      DatabaseQueryData
    >
  | DriverManagerDatabaseMessageInstanceTemplate<
      DriverManagerDatabaseMessageType.Query,
      DatabaseQueryData
    >;

export type DriverManagerDatabaseMessageResult = {
  [DriverManagerDatabaseMessageType.Create]: number;
  [DriverManagerDatabaseMessageType.Connect]: void;
  [DriverManagerDatabaseMessageType.Close]: void;
  [DriverManagerDatabaseMessageType.Execute]: number;
  [DriverManagerDatabaseMessageType.Query]: DatabaseQueryResult;
  [DriverManagerDatabaseMessageType.Flush]: void;
};
