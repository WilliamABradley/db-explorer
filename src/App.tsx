import * as React from 'react';
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import StorybookUI from '../Storybook';
import TableView from './components/molecules/TableView';
import Editor from './components/atoms/Editor';
import SSHTunnelModal from './components/organisms/SSHTunnelModal';
import DatabaseConnectionModal from './components/organisms/DatabaseConnectionModal';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import SSHTunnel from './tunnel';
import {
  registerEventEmitters,
  unregisterEventEmitters,
} from './utils/driverManager';
import DatabaseConnection, {LoadConnection} from './connection';

export default function App() {
  const [openSSHTunnelModal, setOpenSSHTunnelModal] = React.useState(false);
  const [openDatabaseConnectionModal, setOpenDatabaseConnectionModal] =
    React.useState(false);
  const [showStorybook, setShowStorybook] = React.useState(false);
  const [sql, setSQL] = React.useState('SELECT * FROM public.user;');
  const [response, setResponse] = React.useState<DatabaseQueryResult | null>(
    null,
  );

  React.useEffect(() => {
    registerEventEmitters();
    //return () => unregisterEventEmitters();
  });

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
        <SSHTunnelModal
          visible={openSSHTunnelModal}
          changeVisibleTo={setOpenSSHTunnelModal}
          getExistingSSHTunnelInfo={() =>
            LoadConnection().then(c => c.config.tunnel)
          }
          onSetTunnel={async (info, test) => {
            const existingConnection = await LoadConnection();
            // Close existing connections
            await existingConnection.close();

            // Test connection.
            if (info && test) {
              const testTunnel = new SSHTunnel(info);
              try {
                await testTunnel.testAuth();
              } catch (e: any) {
                return e;
              }
            }

            await existingConnection.setTunnel(info);
            return undefined;
          }}
        />
        <DatabaseConnectionModal
          visible={openDatabaseConnectionModal}
          changeVisibleTo={setOpenDatabaseConnectionModal}
          getExistingConnection={() =>
            LoadConnection().then(c => c.config.database)
          }
          onSetDatabaseConnection={async (info, test) => {
            const existingConnection = await LoadConnection();
            // Close existing connections
            await existingConnection.close();

            // Test connection.
            if (info && test) {
              const testConnection = new DatabaseConnection(
                {
                  ...existingConnection.config,
                  database: info,
                },
                true,
              );
              try {
                const testDriver = await testConnection.getConnectedDriver();
                await testDriver?.close();
              } catch (e: any) {
                return e;
              }
            }

            await existingConnection.setDatabase(info);
            return undefined;
          }}
        />
        <View style={styles.appBar}>
          <View style={styles.appBarButton}>
            <Button
              title="View Storybook"
              onPress={() => setShowStorybook(true)}
            />
          </View>
          <View style={styles.appBarButton}>
            <Button
              title="Configure Tunnel"
              onPress={() => {
                setOpenSSHTunnelModal(true);
              }}
            />
          </View>
          <View style={styles.appBarButton}>
            <Button
              title="Configure Database"
              onPress={() => {
                setOpenDatabaseConnectionModal(true);
              }}
            />
          </View>
        </View>
        <Editor value={sql} onChange={setSQL} />
        <View>
          <View>
            <Button
              title="Open Tunnel for Port"
              onPress={async () => {
                const connection = await LoadConnection();
                if (!connection.config.tunnel) {
                  Alert.alert(
                    'Error',
                    'No SSH connection has been configured.',
                  );
                  return;
                }
                if (!connection.config.database) {
                  Alert.alert(
                    'Error',
                    'No database connection has been configured.',
                  );
                  return;
                }

                try {
                  const tunnel = new SSHTunnel(connection.config.tunnel);
                  await tunnel.connect({
                    remoteHost: connection.config.database.host,
                    remotePort: connection.config.database.port,
                    localPort: 0,
                  });
                } catch (e: any) {
                  Alert.alert('SSH Tunnel Connection Failed', e.message);
                  return;
                }
              }}
            />
          </View>
          <View>
            <Button
              title="Test Port"
              onPress={async () => {
                const connection = await LoadConnection();
                const tunnel = connection.getTunnel();
                if (!tunnel) {
                  Alert.alert('Tunnel not configured');
                  return;
                }

                try {
                  let tempOpen = false;
                  if (!tunnel.connected) {
                    tempOpen = true;
                    await tunnel.connect({
                      remoteHost: 'localhost',
                      remotePort: 0,
                      localPort: 0,
                    });
                  }
                  console.debug('Testing Port: ', tunnel.localPort);
                  const isOpen = await tunnel.testPort();
                  if (tempOpen) {
                    await tunnel.close();
                  }
                  Alert.alert(
                    'Tunnel Status',
                    isOpen ? 'Tunnel is Open' : "Tunnel can't be reached",
                  );
                } catch (e: any) {
                  Alert.alert('SSH Tunnel Port Test Failed', e.message);
                }
              }}
            />
          </View>
          <Button
            title="Run"
            onPress={async () => {
              const connection = await LoadConnection();
              const driver = await connection.getConnectedDriver().catch(e => {
                Alert.alert('Driver Connection Failed', e.message);
                return undefined;
              });

              if (driver === undefined) {
                return;
              }

              if (driver === null) {
                Alert.alert(
                  'Error',
                  'No database connection has been configured.',
                );
                return;
              }

              driver
                .query(sql)
                .then(setResponse)
                .catch(e => {
                  console.error(e);
                  Alert.alert('Query Failed', e.message);
                });
            }}
          />
        </View>
        <View style={styles.dataView}>
          <TableView data={response} />
        </View>
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
  appBar: {
    display: 'flex',
    flexDirection: 'row',
  },
  appBarButton: {
    marginRight: 5,
  },
  dataView: {
    borderStyle: 'solid',
    borderColor: '#404040',
    borderTopWidth: 2,
    width: '100%',
    height: '100%',
  },
});
