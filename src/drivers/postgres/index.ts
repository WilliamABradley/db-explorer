import { NativeModules } from 'react-native';
import { DatabaseConnectionInfo } from '../DatabaseDriver';
import NativeDatabaseDriver from '../NativeDatabaseDriver';

export default class PostgresDriver extends NativeDatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    super(NativeModules.PostgresDriver, connectionInfo);
  }
}
