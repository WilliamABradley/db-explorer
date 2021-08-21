import * as React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

export default function Editor(): JSX.Element {
  const [isVisible, setIsVisible] = React.useState(false);
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

  const onMessage = (payload: WebViewMessageEvent) => {
    let dataPayload;
    try {
      dataPayload = JSON.parse(payload.nativeEvent.data);
    } catch (e) {
      throw new Error('Invalid Editor Message');
    }

    if (dataPayload) {
      switch (dataPayload.type) {
        case 'console':
          const consoleInfo: {
            level: string;
            message: string;
          } = dataPayload.message;
          (console as any)[consoleInfo.level](
            `[Editor:${consoleInfo.level}] ${consoleInfo.message}`,
          );
          break;

        case 'event':
          switch (dataPayload.message) {
            case 'Loaded':
              setIsVisible(true);
              break;

            case 'LoadFailed':
              setMessage('uh oh!');
              break;

            default:
              break;
          }
          break;

        default:
          console.log(dataPayload);
          break;
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendMessage = (type: string, data?: any) => {
    viewRef.current?.postMessage(JSON.stringify({type, data}));
  };

  const viewStyle = {
    opacity: isVisible ? 1 : 0,
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={viewRef}
        style={viewStyle}
        source={{
          uri: `${editorBaseUri}editor.bundle/index.html`,
          baseUrl: editorBaseUri,
        }}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        onMessage={onMessage}
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
