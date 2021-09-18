import * as React from 'react';
import {
  View,
  Button,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  PlatformColor,
} from 'react-native';
import Modal from 'react-native-root-modal';
import CheckBox from '@react-native-community/checkbox';
import DatabaseConnectionInfo from '../../../drivers/models/DatabaseConnectionInfo';

export type DatabaseConnectionModalProps = {
  visible: boolean;
  changeVisibleTo: (visible: boolean) => void;
  getExistingConnection?: () => Promise<DatabaseConnectionInfo | null>;
  onSetDatabaseConnection: (
    info: DatabaseConnectionInfo | null,
    test: boolean,
  ) => Promise<Error | undefined>;
};

export default function DatabaseConnectionModal(
  props: DatabaseConnectionModalProps,
): JSX.Element {
  const [host, setHost] = React.useState<string | undefined>(undefined);
  const [port, setPort] = React.useState<string | undefined>('5432');
  const [username, setUsername] = React.useState<string | undefined>(undefined);
  const [password, setPassword] = React.useState<string | undefined>(undefined);
  const [ssl, setSSL] = React.useState<boolean>(true);
  const [database, setDatabase] = React.useState<string | undefined>(
    'postgres',
  );

  React.useEffect(() => {
    props.getExistingConnection?.().then(connection => {
      if (connection) {
        setHost(connection.host);
        setPort(connection.port.toString());
        setUsername(connection.username);
        setPassword(connection.password);
        setSSL(connection.ssl);
        setDatabase(connection.database);
      }
    });
  }, [props.getExistingConnection]);

  return (
    <Modal visible={props.visible} style={styles.modalContainer}>
      <View style={styles.modal}>
        <Text>Host</Text>
        <TextInput
          placeholder="Host"
          defaultValue={host}
          onChangeText={setHost}
          style={styles.modalEntry}
          autoCorrect={false}
          spellCheck={false}
        />
        <Text>Port</Text>
        <TextInput
          placeholder="Port"
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
        <Text>Password</Text>
        <TextInput
          placeholder="Password"
          defaultValue={password}
          onChangeText={setPassword}
          style={styles.modalEntry}
          secureTextEntry={true}
          autoCorrect={false}
          spellCheck={false}
        />
        <Text>Use SSL</Text>
        <CheckBox value={ssl} onValueChange={setSSL} />
        <Text>Database</Text>
        <TextInput
          placeholder="Database"
          defaultValue={database}
          onChangeText={setDatabase}
          style={styles.modalEntry}
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
                const info: DatabaseConnectionInfo = {
                  host: host!,
                  port: parseInt(port!, 10),
                  username: username!,
                  password: password!,
                  ssl,
                  database: database!,
                };
                const error = await props.onSetDatabaseConnection(info, true);

                props.changeVisibleTo(false);

                // Show Alert if failed.
                if (error) {
                  Alert.alert('Failed to Connect to Database', error.message, [
                    {
                      text: 'OK',
                      onPress: () => props.changeVisibleTo(true),
                    },
                    {
                      text: 'Ignore',
                      onPress: async () => {
                        await props.onSetDatabaseConnection(info, false);
                      },
                    },
                  ]);
                } else {
                  Alert.alert('Success', 'Database Connected');
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
                await props.onSetDatabaseConnection(null, false);
                props.changeVisibleTo(false);

                // reset form
                setHost(undefined);
                setPort('22');
                setUsername(undefined);
                setPassword(undefined);
                setSSL(true);
                setDatabase('postgres');
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
});
