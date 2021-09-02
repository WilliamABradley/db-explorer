import DatabaseDriver from '../../drivers/DatabaseDriver';
import {IDBTypeInfo} from './IDBTypeInfo';

export default interface IDatabaseDialect<T extends IDBTypeInfo> {
  init(driver: DatabaseDriver): Promise<void>;
  parse(val: Buffer, type?: T): any;
}
