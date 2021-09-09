import * as React from 'react';
import {
  StyleSheet,
  View,
  Button,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import SecureInfo from 'react-native-sensitive-info';
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

const DRIVER_KEY = 'database_connection';
const TUNNEL_KEY = 'tunnel_configuration';

let _driver: DatabaseDriver | null = null;
let _driver_info: DatabaseConnectionInfo | null = null;

let _tunnel: SSHTunnel | null = null;
let _tunnel_info: SSHTunnelInfo | null = null;

const getDriver = (): DatabaseDriver | null => {
  if (!_driver && _driver_info) {
    _driver = new PostgresDriver(_driver_info);
  }
  return _driver;
};

const setDriver = (
  connectionInfo: DatabaseConnectionInfo | null,
): DatabaseDriver | null => {
  if (connectionInfo !== null) {
    SecureInfo.setItem(DRIVER_KEY, JSON.stringify(connectionInfo), {});
    _driver = new PostgresDriver(connectionInfo);
  } else {
    _driver = null;
  }
  return _driver;
};

const getTunnel = (): SSHTunnel | null => {
  if (!_tunnel && _tunnel_info) {
    _tunnel = new SSHTunnel(_tunnel_info);
  }
  return _tunnel;
};

const setTunnel = (tunnelInfo: SSHTunnelInfo | null): SSHTunnel | null => {
  if (tunnelInfo !== null) {
    SecureInfo.setItem(TUNNEL_KEY, JSON.stringify(tunnelInfo), {});
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

  React.useEffect(() => {
    SecureInfo.getItem(DRIVER_KEY, {}).then(info =>
      setDriver(JSON.parse(info)),
    );

    SecureInfo.getItem(TUNNEL_KEY, {}).then(info =>
      setTunnel(JSON.parse(info)),
    );
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
          onSetTunnel={async info => {
            const existingTunnel = getTunnel();

            // Close existing tunnel.
            if (existingTunnel) {
              await existingTunnel.close();
            }

            if (info) {
              console.log(info);
              const newTunnel = setTunnel(info);
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
          onSetDatabaseConnection={async info => {
            const existingDriver = getDriver();

            // Close existing driver.
            if (existingDriver?.connected) {
              await existingDriver.close();
            }

            if (info) {
              const newDriver = setDriver(info);
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
                const driver = getDriver();
                if (!driver) {
                  Alert.alert(
                    'Error',
                    'No database connection has been configured.',
                  );
                  return;
                }

                if (!driver.connected) {
                  await driver.connect();
                }

                driver
                  .query(sql)
                  .then(setResponse)
                  .catch(e => {
                    console.error(e);
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
