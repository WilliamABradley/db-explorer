import {AddressType, getAddressType} from '../../utils';
import DatabaseConnectionInfo from '../models/DatabaseConnectionInfo';
import NativeMessageDatabaseDriver from '../native/NativeMessageDatabaseDriver';

export default class PostgresDriver extends NativeMessageDatabaseDriver {
  constructor(connectionInfo: DatabaseConnectionInfo) {
    super('Postgres', connectionInfo, {
      hostFormatter: address => {
        switch (getAddressType(address)) {
          case AddressType.Ipv6:
            return `[${address}]`;

          default:
            return address;
        }
      },
    });
  }
}
