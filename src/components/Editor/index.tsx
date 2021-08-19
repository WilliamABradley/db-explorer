import * as React from 'react';
import {Platform, StyleSheet, View, Text, Button} from 'react-native';
import WebView, {WebViewMessageEvent} from 'react-native-webview';

export default function Editor(): JSX.Element {
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
            level: keyof typeof console;
            log: string;
          } = dataPayload.message;
          console[consoleInfo.level](
            `[Editor:${consoleInfo.level}] ${consoleInfo.log}`,
          );
          break;
      }
    }
  };

  const sendMessage = (type: string, data: any) => {
    viewRef.current?.postMessage(JSON.stringify({type, data}));
  };

  return (
    <View style={styles.webview}>
      <Text>guh</Text>
      <Button
        title="Send Message"
        onPress={() => sendMessage('response', 'ok')}
      />
      <WebView
        ref={viewRef}
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
  webview: {
    width: 600,
    height: 300,
    overflow: 'hidden',
  },
});
