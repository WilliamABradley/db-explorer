import * as React from 'react';
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import FindFreePort from 'react-native-find-free-port';
import StorybookUI from '../Storybook';
import TableView from './components/molecules/TableView';
import Editor from './components/atoms/Editor';
import SSHTunnelModal from './components/organisms/SSHTunnelModal';
import DatabaseConnectionModal from './components/organisms/DatabaseConnectionModal';
import DatabaseDriver from './drivers/DatabaseDriver';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import PostgresDriver from './drivers/postgres';
import SSHTunnel, {SSHTunnelInfo} from './tunnel';
import DatabaseConnectionInfo from './drivers/models/DatabaseConnectionInfo';
import {
  deleteSecureData,
  getSecureData,
  setSecureData,
} from './utils/secureStorage';
import {
  registerEventEmitter,
  unregisterEventEmitter,
} from './utils/driverManager';

const DRIVER_KEY = 'database_connection';
const TUNNEL_KEY = 'tunnel_configuration';

let _driver: DatabaseDriver | null = null;
let _driver_info: DatabaseConnectionInfo | null = null;
let _tunnel: SSHTunnel | null = null;
let _tunnel_port: string | null = null;

const getTunnel = async (): Promise<SSHTunnel | null> => {
  if (!_tunnel) {
    const tunnelInfo = await getSecureData<SSHTunnelInfo>(TUNNEL_KEY);
    if (tunnelInfo) {
      _tunnel = new SSHTunnel(tunnelInfo);
      _tunnel_port = '3000'; //(await FindFreePort.getFirstStartingFrom(1024)).toString();
    }
  }
  return _tunnel;
};

const setTunnel = async (
  tunnelInfo: SSHTunnelInfo | null,
): Promise<SSHTunnel | null> => {
  if (tunnelInfo !== null) {
    await setSecureData(TUNNEL_KEY, tunnelInfo);
    _tunnel = new SSHTunnel(tunnelInfo);
  } else {
    await deleteSecureData(TUNNEL_KEY);
    _tunnel = null;
  }

  // re-register driver.
  if (_driver) {
    await _driver.close();
    await getDriver();
  }
  return _tunnel;
};

const getDriver = async (
  info?: DatabaseConnectionInfo,
): Promise<DatabaseDriver | null> => {
  if (!_driver) {
    _driver_info =
      info || (await getSecureData<DatabaseConnectionInfo>(DRIVER_KEY));
    if (_driver_info) {
      if (_tunnel_port) {
        _driver = new PostgresDriver({
          ..._driver_info,
          host: '127.0.0.1',
          port: _tunnel_port,
        });
      } else {
        _driver = new PostgresDriver(_driver_info);
      }
    }
  }
  return _driver;
};

const setDriver = async (
  connectionInfo: DatabaseConnectionInfo | null,
): Promise<DatabaseDriver | null> => {
  if (connectionInfo !== null) {
    await setSecureData(DRIVER_KEY, connectionInfo);
    _driver = await getDriver();
  } else {
    await deleteSecureData(DRIVER_KEY);
    _driver = null;
  }
  return _driver;
};

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
    registerEventEmitter();
    return () => unregisterEventEmitter();
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
            getSecureData<SSHTunnelInfo>(TUNNEL_KEY)
          }
          onSetTunnel={async info => {
            const existingTunnel = await getTunnel();

            // Close existing tunnel.
            if (existingTunnel) {
              await existingTunnel.close();
            }

            if (info) {
              const newTunnel = await setTunnel(info);
              if (newTunnel) {
                try {
                  await newTunnel.testAuth();
                } catch (e: any) {
                  return e;
                }
              }
            } else {
              await setTunnel(null);
            }
            return undefined;
          }}
        />
        <DatabaseConnectionModal
          visible={openDatabaseConnectionModal}
          changeVisibleTo={setOpenDatabaseConnectionModal}
          getExistingConnection={() =>
            getSecureData<DatabaseConnectionInfo>(DRIVER_KEY)
          }
          onSetDatabaseConnection={async info => {
            const existingDriver = await getDriver();

            // Close existing driver.
            if (existingDriver?.connected) {
              await existingDriver.close();
            }

            if (info) {
              const tunnel = await getTunnel();
              const newDriver = await setDriver(info);

              if (newDriver) {
                try {
                  if (tunnel) {
                    await tunnel.connect({
                      remoteHost: info.host,
                      remotePort: info.port,
                      localPort: _tunnel_port || undefined,
                    });
                  }

                  await newDriver.connect();
                } catch (e: any) {
                  return e;
                }
              }
            } else {
              await setDriver(null);
            }
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
          <View style={styles.appBarButton}>
            <Button
              title="Open Tunnel for Port"
              onPress={async () => {
                try {
                  const tunnel = await getTunnel();
                  await getDriver();

                  if (!_driver_info) {
                    Alert.alert(
                      'Error',
                      'No database connection has been configured.',
                    );
                    return;
                  }

                  if (tunnel && !tunnel.connected) {
                    try {
                      await tunnel.connect({
                        remoteHost: _driver_info.host,
                        remotePort: _driver_info.port,
                        localPort: _tunnel_port || undefined,
                      });
                    } catch (e: any) {
                      Alert.alert('SSH Tunnel Connection Failed', e.message);
                      return;
                    }
                  }
                } catch (e: any) {
                  Alert.alert('SSH Tunnel Failed', e.message);
                }
              }}
            />
          </View>
          <View style={styles.appBarButton}>
            <Button
              title="Test Port"
              onPress={async () => {
                try {
                  const tunnel = await getTunnel();
                  if (tunnel) {
                    const isOpen = await tunnel.testPort();
                    Alert.alert(
                      'Tunnel Status',
                      isOpen ? 'Tunnel is Open' : "Tunnel can't be reached",
                    );
                  } else {
                    Alert.alert('Tunnel not configured');
                  }
                } catch (e: any) {
                  Alert.alert('SSH Tunnel Port Test Failed', e.message);
                }
              }}
            />
          </View>
          <View style={styles.appBarButton}>
            <Button
              title="Run"
              onPress={async () => {
                const tunnel = await getTunnel();
                const driver = await getDriver();

                if (!_driver_info) {
                  Alert.alert(
                    'Error',
                    'No database connection has been configured.',
                  );
                  return;
                }

                if (tunnel && !tunnel.connected) {
                  try {
                    await tunnel.connect({
                      remoteHost: _driver_info.host,
                      remotePort: _driver_info.port,
                      localPort: _tunnel_port || undefined,
                    });
                  } catch (e: any) {
                    Alert.alert('SSH Tunnel Connection Failed', e.message);
                    return;
                  }
                }

                if (!driver) {
                  throw new Error('Invalid state');
                }

                if (!driver.connected) {
                  try {
                    await driver.connect();
                  } catch (e: any) {
                    Alert.alert('Driver Connection Failed', e.message);
                    return;
                  }
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
        </View>
        <Editor value={sql} onChange={setSQL} />
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
