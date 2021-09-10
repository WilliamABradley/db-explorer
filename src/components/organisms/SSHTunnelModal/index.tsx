import * as React from 'react';
import {View, Button, Text, TextInput, Alert, StyleSheet} from 'react-native';
import Modal from 'react-native-root-modal';
import {SSHTunnelAuthenticationMethod, SSHTunnelInfo} from '../../../tunnel';

export type SSHTunnelModalProps = {
  visible: boolean;
  changeVisibleTo: (visible: boolean) => void;
  getExistingSSHTunnelInfo?: () => Promise<SSHTunnelInfo | null>;
  onSetTunnel: (info: SSHTunnelInfo | null) => Promise<Error | undefined>;
};

export default function SSHTunnelModal(
  props: SSHTunnelModalProps,
): JSX.Element {
  const [host, setHost] = React.useState<string | undefined>(undefined);
  const [port, setPort] = React.useState<string | undefined>('22');
  const [username, setUsername] = React.useState<string | undefined>(undefined);
  const [privateKey, setPrivateKey] = React.useState<string | undefined>(
    undefined,
  );
  const [passphrase, setPassphrase] = React.useState<string | undefined>(
    undefined,
  );

  React.useEffect(() => {
    props.getExistingSSHTunnelInfo?.().then(info => {
      if (info) {
        setHost(info.host);
        setPort(info.port);
        setUsername(info.username);
        setPrivateKey(info.privateKey);
        setPassphrase(info.passphrase);
      }
    });
  }, [props.getExistingSSHTunnelInfo]);

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
        />
        <Text>SSH Port</Text>
        <TextInput
          placeholder="SSH Port"
          defaultValue={port}
          onChangeText={setPort}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
        />
        <Text>Username</Text>
        <TextInput
          placeholder="Username"
          defaultValue={username}
          onChangeText={setUsername}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
        />
        <Text>Private Key Data</Text>
        <TextInput
          placeholder="Private Key Data"
          defaultValue={privateKey}
          onChangeText={setPrivateKey}
          style={styles.modalEntry}
          secureTextEntry={true}
          autoCorrect={false}
          spellCheck={false}
        />
        <Text>Passphrase</Text>
        <TextInput
          placeholder="Passphrase"
          defaultValue={passphrase}
          onChangeText={setPassphrase}
          style={styles.modalEntry}
          secureTextEntry={true}
          autoCorrect={false}
          spellCheck={false}
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
                const error = await props.onSetTunnel({
                  host: host!,
                  username: username!,
                  port: port!,
                  authenticationMethod: SSHTunnelAuthenticationMethod.PublicKey,
                  privateKey: privateKey!,
                  passphrase: passphrase!,
                });

                props.changeVisibleTo(false);

                // Show Alert if failed.
                if (error) {
                  Alert.alert(
                    'Failed to Connect to SSH Tunnel',
                    error.message,
                    [
                      {
                        text: 'OK',
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
              onPress={() => {
                props.onSetTunnel(null);
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
    width: 300,
    backgroundColor: '#404040',
    borderRadius: 10,
    padding: 10,
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
});
