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
import DatabaseDriver from './drivers/DatabaseDriver';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import PostgresDriver from './drivers/postgres';
import SSHTunnel, {SSHTunnelInfo} from './tunnel';
import DatabaseConnectionInfo from './drivers/models/DatabaseConnectionInfo';
import {getSecureData, setSecureData} from './utils/secureStorage';

const DRIVER_KEY = 'database_connection';
const TUNNEL_KEY = 'tunnel_configuration';

let _driver: DatabaseDriver | null = null;
let _tunnel: SSHTunnel | null = null;

const getDriver = async (): Promise<DatabaseDriver | null> => {
  if (!_driver) {
    const driverInfo = await getSecureData<DatabaseConnectionInfo>(DRIVER_KEY);
    if (driverInfo) {
      _driver = new PostgresDriver(driverInfo);
    }
  }
  return _driver;
};

const setDriver = async (
  connectionInfo: DatabaseConnectionInfo | null,
): Promise<DatabaseDriver | null> => {
  if (connectionInfo !== null) {
    await setSecureData(DRIVER_KEY, connectionInfo);
    _driver = new PostgresDriver(connectionInfo);
  } else {
    _driver = null;
  }
  return _driver;
};

const getTunnel = async (): Promise<SSHTunnel | null> => {
  if (!_tunnel) {
    const tunnelInfo = await getSecureData<SSHTunnelInfo>(TUNNEL_KEY);
    if (tunnelInfo) {
      _tunnel = new SSHTunnel(tunnelInfo);
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
    _tunnel = null;
  }
  return _tunnel;
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
                  await newTunnel.connect();
                } catch (e: any) {
                  return e;
                }
              }
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
              const newDriver = await setDriver(info);
              if (newDriver) {
                try {
                  await newDriver.connect();
                } catch (e: any) {
                  return e;
                }
              }
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
              title="Run"
              onPress={async () => {
                const tunnel = await getTunnel();
                if (tunnel && !tunnel.connected) {
                  try {
                    await tunnel.connect();
                  } catch (e: any) {
                    Alert.alert('SSH Tunnel Connection Failed', e.message);
                    return;
                  }
                }

                const driver = await getDriver();
                if (!driver) {
                  Alert.alert(
                    'Error',
                    'No database connection has been configured.',
                  );
                  return;
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
