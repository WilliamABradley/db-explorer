import * as React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import WebView from 'react-native-webview';

export default function Editor(): JSX.Element {
  let editorBaseUri: string;
  switch (Platform.OS) {
    case 'windows':
      editorBaseUri = 'ms-appx-web:///editor';
      break;

    default:
      throw new Error('Not Implemented');
  }

  return (
    <View style={styles.webview}>
      <WebView
        source={{
          uri: `${editorBaseUri}/editorFrame.html`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    width: 400,
    height: 100,
    overflow: 'hidden',
  },
});
