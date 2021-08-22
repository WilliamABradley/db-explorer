import {NativeModules} from 'react-native';
import IDriver from '../IDriver';
import INativeDriver from '../INativeDriver';

var _pgInst = 0;
const _driver = NativeModules.PostgresDriver as INativeDriver;

export default class PostgresDriver implements IDriver {
  constructor() {
    console.log('PG INST: ', _pgInst);
    this._id = ++_pgInst;
  }
  private _id: number;
  private _connected: boolean = false;

  connect(connectionString: string): Promise<void> {
    if (!this._connected) {
      this._connected = true;
      return _driver.connect(this._id, connectionString);
    }
    return Promise.resolve();
  }

  close(): Promise<void> {
    return _driver.close(this._id);
  }

  async execute(sql: string, variables?: Record<string, any>): Promise<string> {
    return _driver.execute(this._id, sql, variables);
  }
}
