import * as React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import WebView from 'react-native-webview';

export default function Editor(): JSX.Element {
  const [isVisible, setIsVisible] = React.useState(true);
  const viewRef = React.useRef<WebView>(null);

  let editorBaseUri: string;
  switch (Platform.OS) {
    case 'windows':
      editorBaseUri = 'ms-appx-web:///';
      break;

    case 'android':
      editorBaseUri = 'file:///android_asset/';
      break;

    case 'ios':
      editorBaseUri = '';
      break;

    default:
      throw new Error('Not Implemented');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendMessage = (type: string, data?: any) => {
    viewRef.current?.postMessage(JSON.stringify({type, data}));
  };

  const receiveMessage = (type: string, message: any) => {
    switch (type) {
      case 'console':
        const consoleInfo: {
          level: string;
          message: string;
        } = message;
        (console as any)[consoleInfo.level](
          `[Editor:${consoleInfo.level}] ${consoleInfo.message}`,
        );
        break;

      case 'fatal':
        console.error(message);
        break;

      case 'event':
        switch (message) {
          case 'Loaded':
            setIsVisible(true);
            sendMessage('');
            if (typeof viewRef.current?.requestFocus === 'function') {
              viewRef.current.requestFocus();
            }
            break;

          case 'LoadFailed':
            throw new Error(`Editor Failed to Load View`);

          default:
            console.warn(`Unknown Editor Event Type: ${message}`);
            break;
        }
        break;

      default:
        console.warn(`Unknown Editor Message Type: ${type}`, message);
        break;
    }
  };

  const viewStyle = {
    opacity: isVisible ? 1 : 0,
  };

  return (
    <View style={styles.container}>
      {/*       <TouchableWithoutFeedback onLongPress={e => console.log('Long Press', e)}>
        <Text>Test Touch</Text>
      </TouchableWithoutFeedback> */}
      <WebView
        ref={viewRef}
        style={viewStyle}
        source={{
          uri: `${editorBaseUri}editor.bundle/index.html`,
          baseUrl: editorBaseUri,
        }}
        originWhitelist={['*']}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        focusable={true}
        onMessage={e => {
          let dataPayload;
          try {
            dataPayload = JSON.parse(e.nativeEvent.data);
          } catch (e) {
            throw new Error('Invalid Editor Message');
          }

          if (dataPayload) {
            receiveMessage(dataPayload.type, dataPayload.message);
          }
        }}
        onError={e => {
          throw new Error(
            `Editor Failed to Load with Code: ${e.nativeEvent.code}`,
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
  },
});
