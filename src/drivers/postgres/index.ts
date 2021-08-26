import { NativeModules } from 'react-native';
import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import NativeDatabaseDriver from '../NativeDatabaseDriver';

export default class PostgresDriver extends NativeDatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    super(NativeModules.NVPostgresDriver, connectionInfo);
  }
}
