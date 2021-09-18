import path from 'path';
import * as React from 'react';
import {
  View,
  Button,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import Modal from 'react-native-root-modal';
import {SSHTunnelAuthenticationMethod, SSHTunnelInfo} from '../../../tunnel';
import {FileData, PickFileData} from '../../../utils/fileManager';

export type SSHTunnelModalProps = {
  visible: boolean;
  changeVisibleTo: (visible: boolean) => void;
  getExistingSSHTunnelInfo?: () => Promise<SSHTunnelInfo | null>;
  onSetTunnel: (
    info: SSHTunnelInfo | null,
    test: boolean,
  ) => Promise<Error | undefined>;
};

export default function SSHTunnelModal(
  props: SSHTunnelModalProps,
): JSX.Element {
  const [host, setHost] = React.useState<string | undefined>(undefined);
  const [port, setPort] = React.useState<string | undefined>('22');
  const [username, setUsername] = React.useState<string | undefined>(undefined);
  const [privateKey, setPrivateKey] = React.useState<FileData | undefined>(
    undefined,
  );
  const [passphrase, setPassphrase] = React.useState<string | undefined>(
    undefined,
  );
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    props
      .getExistingSSHTunnelInfo?.()
      .then(info => {
        if (info) {
          setHost(info.host);
          setPort(info.port.toString());
          setUsername(info.username);
          setPrivateKey(info.privateKey);
          setPassphrase(info.passphrase);
        }
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [props.getExistingSSHTunnelInfo, setLoaded]);

  if (!loaded) {
    return <></>;
  }

  return (
    <Modal visible={props.visible} style={styles.modalContainer}>
      <View style={styles.modal}>
        <Text>SSH Host</Text>
        <TextInput
          placeholder="SSH Host"
          defaultValue={host}
          onChangeText={setHost}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
        />
        <Text>SSH Port</Text>
        <TextInput
          placeholder="SSH Port"
          defaultValue={port}
          onChangeText={setPort}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
        />
        <Text>Username</Text>
        <TextInput
          placeholder="Username"
          defaultValue={username}
          onChangeText={setUsername}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
        />
        <Text>Private Key</Text>
        <View
          style={{
            ...styles.modalEntry,
            ...styles.filePickerContainer,
          }}>
          <View style={styles.filePickerButton}>
            <Button
              title="Open File"
              onPress={async () => {
                try {
                  const data = await PickFileData('utf8');
                  if (data) {
                    setPrivateKey(data);
                  }
                } catch (e: any) {
                  Alert.alert('Failed to Pick File', e.message);
                }
              }}
            />
          </View>
          <Text style={styles.filePickerText}>
            {privateKey
              ? `Copied from: ${path.basename(privateKey?.uri)}`
              : 'No Private Key'}
          </Text>
        </View>
        <Text>Passphrase</Text>
        <TextInput
          placeholder="Passphrase"
          defaultValue={passphrase}
          onChangeText={setPassphrase}
          style={styles.modalEntry}
          secureTextEntry={true}
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
        />
        <View style={styles.modalActions}>
          <View
            style={{
              ...styles.modalActionContainer,
              ...styles.modalActionLeft,
            }}>
            <Button
              title="Save"
              onPress={async () => {
                const info: SSHTunnelInfo = {
                  host: host!,
                  username: username!,
                  port: parseInt(port!, 10),
                  authenticationMethod: SSHTunnelAuthenticationMethod.PublicKey,
                  privateKey: privateKey!,
                  passphrase: passphrase!,
                };
                const error = await props.onSetTunnel(info, true);

                props.changeVisibleTo(false);

                // Show Alert if failed.
                if (error) {
                  Alert.alert(
                    'Failed to Connect to SSH Tunnel',
                    error.message,
                    [
                      {
                        text: 'Ignore',
                        onPress: async () => {
                          await props.onSetTunnel(info, false);
                        },
                      },
                      {
                        text: 'Cancel',
                        onPress: () => props.changeVisibleTo(true),
                      },
                    ],
                  );
                } else {
                  Alert.alert('Success', 'SSH Tunnel Connected');
                }
              }}
            />
          </View>
          <View
            style={{
              ...styles.modalActionContainer,
              ...styles.modalActionRight,
            }}>
            <Button
              title="Cancel"
              onPress={() => {
                props.changeVisibleTo(false);
              }}
            />
          </View>
          <View
            style={{
              ...styles.modalActionContainer,
              ...styles.modalActionRight,
            }}>
            <Button
              title="Delete"
              onPress={async () => {
                await props.onSetTunnel(null, false);
                props.changeVisibleTo(false);

                // reset form
                setHost(undefined);
                setPort('22');
                setUsername(undefined);
                setPrivateKey(undefined);
                setPassphrase(undefined);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    overflow: 'hidden',
    width: 300,
    borderRadius: 10,
    padding: 10,
    ...Platform.select({
      ios: {
        backgroundColor: '#d1d1d1',
      },
      android: {
        backgroundColor: '#d1d1d1',
      },
      default: {
        backgroundColor: '#404040',
      },
    }),
  },
  modalEntry: {
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalActionContainer: {
    flexBasis: 1,
    flexGrow: 1,
  },
  modalActionLeft: {
    marginRight: 2,
  },
  modalActionRight: {
    marginLeft: 2,
  },
  filePickerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filePickerButton: {
    marginRight: 5,
  },
  filePickerText: {},
});
