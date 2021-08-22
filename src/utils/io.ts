import {Platform} from 'react-native';

let platformAssetsUri: string;
switch (Platform.OS) {
  case 'windows':
    platformAssetsUri = 'ms-appx-web:///';
    break;

  case 'android':
    platformAssetsUri = 'file:///android_asset/';
    break;

  case 'ios':
    platformAssetsUri = '';
    break;

  default:
    throw new Error('Not Implemented');
}

export {platformAssetsUri};
