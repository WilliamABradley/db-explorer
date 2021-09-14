import DatabaseConnectionInfo from '../../drivers/models/DatabaseConnectionInfo';
import DatabaseQueryResult from '../../drivers/models/DatabaseQueryResult';
import DatabaseQueryData from '../../drivers/models/DatabaseQueryData';

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
  type: TType;
  data: TData;
};

type DriverManagerDatabaseMessageInstanceTemplate<
  TType extends DriverManagerDatabaseMessageType,
  TData = never,
> = DriverManagerDatabaseMessageTemplate<TType, TData> & {
  driver: string;
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
