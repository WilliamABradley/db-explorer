import './shim';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import * as util from 'util';

import { getTables } from './testPG';

console.log('hello!');
getTables().then(console.log);

AppRegistry.registerComponent(appName, () => App);
