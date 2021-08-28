import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import NativeMessageDatabaseDriver from '../NativeMessageDatabaseDriver';

export default class PostgresDriver extends NativeMessageDatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    super('postgres', connectionInfo);
  }
}
