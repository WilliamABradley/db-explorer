import {IDBTypeInfo} from '../../interfaces/IDBTypeInfo';

export default class PgTypeInfo implements IDBTypeInfo {
  constructor(type: string) {
    this.type = type;
  }

  type: string;

  get oid() {
    return parseInt(this.type, 10);
  }
}
