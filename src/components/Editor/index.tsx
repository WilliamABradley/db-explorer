/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import * as React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import WebView from 'react-native-webview';
import {platformAssetsUri} from '../../utils';
import {openContextMenu} from '../../utils/contextMenu';

export type EditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function Editor({value, onChange}: EditorProps): JSX.Element {
  // Show frame at startup in dev.
  const [isLoaded, setIsLoaded] = React.useState(__DEV__);
  const containerRef = React.useRef<View>(null);
  const viewRef = React.useRef<WebView>(null);

  let _lastSetValue: string | undefined;

  const sendMessage = (type: string, message?: any) => {
    viewRef.current?.postMessage(JSON.stringify({type, message}));
  };

  const init = (
    options: monaco.editor.IStandaloneEditorConstructionOptions,
  ) => {
    sendMessage('init', options);
  };

  const updateOptions: monaco.editor.IStandaloneCodeEditor['updateOptions'] =
    options => {
      sendMessage('updateOptions', options);
    };

  const setValue = (value: string) => {
    _lastSetValue = value;
    if (_lastSetValue !== value) {
      sendMessage('setValue', value);
    }
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

      // Scripts Loaded, initialise the editor.
      case 'loaded':
        init({
          contextmenu: false,
          minimap: {
            enabled: false,
          },
          language: 'pgsql',
          value,
        });
        break;

      // Editor initialised
      case 'initialised':
        setIsLoaded(true);

        // Just in case we had more than one update since we initialised.
        if (_lastSetValue !== value) {
          setValue(value);
        }

        if (Platform.OS === 'android') {
          viewRef.current?.requestFocus();
        }
        break;

      case 'loadFailed':
        throw new Error(`Editor Failed to Load View`);

      case 'setValue':
        onChange?.(message);
        break;

      case 'selectedText':
      case 'selectedRange':
        break;

      case 'contextMenu':
        containerRef.current?.measure(
          (_x, _y, _width, _height, pageX, pageY) => {
            openContextMenu(
              pageX + message.event.pos.x,
              pageY + message.event.pos.y,
            );
          },
        );
        break;

      default:
        console.warn(`Unknown Editor Message Type: ${type}`, message);
        break;
    }
  };

  // Handle update events once we are loaded.
  React.useEffect(() => {
    if (isLoaded) {
      setValue(value);
    }
  }, [value, isLoaded]);

  const viewStyle = {
    opacity: isLoaded ? 1 : 0,
  };

  return (
    <View ref={containerRef} style={styles.container}>
      <WebView
        ref={viewRef}
        style={viewStyle}
        source={{
          uri: `${platformAssetsUri}editor.bundle/index.html`,
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
