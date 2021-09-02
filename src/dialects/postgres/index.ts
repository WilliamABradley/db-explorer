import IDatabaseDialect from '../interfaces/IDatabaseDialect';
import DatabaseDriver from '../../drivers/DatabaseDriver';
import PgTypeInfo from './types/PgTypeInfo';
import Convert from './types/Convert';

export default class PostgresDialect implements IDatabaseDialect<PgTypeInfo> {
  driver!: DatabaseDriver;

  async init(driver: DatabaseDriver): Promise<void> {
    this.driver = driver;
  }

  parse(val: Buffer, type?: PgTypeInfo) {
    return Convert(val, type || new PgTypeInfo('0'));
  }
}
