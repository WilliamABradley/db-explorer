import * as React from 'react';
import {useState} from 'react';
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  Platform,
  Text,
  TextInput,
} from 'react-native';
import Modal from 'react-native-root-modal';
import StorybookUI from '../Storybook';
import TableView from './components/DataViews/TableView';
import Editor from './components/Editor';
import DatabaseDriver from './drivers/DatabaseDriver';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import PostgresDriver from './drivers/postgres';
import SSHTunnel, {
  SSHTunnelAuthenticationMethod,
  SSHTunnelInfo,
} from './tunnel';

let driver: DatabaseDriver;
let tunnel: SSHTunnel;
let driverConnect: Promise<void> | undefined;
let tunnelData: SSHTunnelInfo | undefined;
let tunnelConnect: Promise<void> | undefined;

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [host, setHost] = useState<string | undefined>(undefined);
  const [port, setPort] = useState<string | undefined>('22');
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [privateKey, setPrivateKey] = useState<string | undefined>(undefined);
  const [passphrase, setPassphrase] = useState<string | undefined>(undefined);
  const [showStorybook, setShowStorybook] = useState(false);
  const [sql, setSQL] = useState('SELECT * FROM public.user;');
  const [response, setResponse] = useState<DatabaseQueryResult | null>(null);

  if (showStorybook) {
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Button
            title="Hide Storybook"
            onPress={() => setShowStorybook(false)}
          />
          <StorybookUI />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Modal visible={modalVisible} style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text>SSH Host</Text>
            <TextInput
              placeholder="SSH Host"
              value={host}
              onChangeText={setHost}
              style={styles.modalEntry}
            />
            <Text>SSH Port</Text>
            <TextInput
              placeholder="SSH Port"
              value={port}
              onChangeText={setPort}
              style={styles.modalEntry}
            />
            <Text>Username</Text>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.modalEntry}
            />
            <Text>Private Key Data</Text>
            <TextInput
              placeholder="Private Key Data"
              value={privateKey}
              onChangeText={setPrivateKey}
              secureTextEntry={true}
              style={styles.modalEntry}
            />
            <Text>Passphrase</Text>
            <TextInput
              placeholder="Passphrase"
              value={passphrase}
              onChangeText={setPassphrase}
              secureTextEntry={true}
              style={styles.modalEntry}
            />
            <View style={styles.modalActions}>
              <View
                style={{
                  ...styles.modalActionContainer,
                  ...styles.modalActionLeft,
                }}>
                <Button
                  title="Save"
                  onPress={() => {
                    tunnelData = {
                      host: host!,
                      username: username!,
                      port: port!,
                      authenticationMethod:
                        SSHTunnelAuthenticationMethod.PublicKey,
                      privateKey: privateKey!,
                      passphrase: passphrase!,
                    };
                    tunnel = new SSHTunnel(tunnelData);
                    tunnel.connect().then(res => {
                      console.log(res);
                      setModalVisible(false);
                    });
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
                    tunnelData = undefined;
                    setModalVisible(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
        <Button title="View Storybook" onPress={() => setShowStorybook(true)} />
        <Editor value={sql} onChange={setSQL} />
        <Button
          title="Run"
          onPress={() => {
            if (!driver) {
              driver = new PostgresDriver({
                host: '192.168.1.10',
                port: '5432',
                username: 'postgres',
                database: 'api',
                ssl: false,
              });
              driverConnect = driver.connect();
            }

            driverConnect!
              .then(() => driver.query(sql))
              .then(setResponse)
              .catch(e => {
                console.error(e);
              });
          }}
        />
        <Button
          title="Open Tunnel"
          onPress={() => {
            setModalVisible(true);
          }}
        />
        <TableView data={response} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: Platform.OS === 'android' ? 'white' : undefined,
  },
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
    flexBasis: 'auto',
    flexGrow: 1,
  },
  modalActionLeft: {
    marginRight: 2,
  },
  modalActionRight: {
    marginLeft: 2,
  },
});
