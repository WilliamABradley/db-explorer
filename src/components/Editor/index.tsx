import * as React from 'react';
import {Platform, StyleSheet, View, Text, Button} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

export default function Editor(): JSX.Element {
  const [message, setMessage] = React.useState('guh');
  const [isVisible, setIsVisible] = React.useState(false);
  const viewRef = React.useRef<WebView>(null);

  let editorBaseUri: string;
  switch (Platform.OS) {
    case 'windows':
      editorBaseUri = 'ms-appx-web:///editor';
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
            log: string;
          } = dataPayload.message;
          (console as any)[consoleInfo.level](
            `[Editor:${consoleInfo.level}] ${consoleInfo.log}`,
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

  const sendMessage = (type: string, data?: any) => {
    viewRef.current?.postMessage(JSON.stringify({type, data}));
  };

  const viewStyle = {
    opacity: isVisible ? 1 : 0,
  };

  return (
    <View style={styles.container}>
      <Text>{message}</Text>
      <Button title="Send Message" onPress={() => sendMessage('reload')} />
      <WebView
        ref={viewRef}
        style={viewStyle}
        source={{
          uri: `${editorBaseUri}/editorFrame.html`,
        }}
        onMessage={onMessage}
        onLoad={() => {
          console.log('loaded!');
        }}
        onError={() => console.error('error!')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 600,
    height: 300,
    overflow: 'hidden',
  },
});
