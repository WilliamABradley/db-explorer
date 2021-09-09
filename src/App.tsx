import * as React from 'react';
import {StyleSheet, View, Button, SafeAreaView, Platform} from 'react-native';
import StorybookUI from '../Storybook';
import TableView from './components/molecules/TableView';
import Editor from './components/atoms/Editor';
import SSHTunnelModal from './components/organisms/SSHTunnelModal';
import DatabaseDriver from './drivers/DatabaseDriver';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import PostgresDriver from './drivers/postgres';
import SSHTunnel from './tunnel';

let driver: DatabaseDriver;
let tunnel: SSHTunnel | null;
let driverConnect: Promise<void> | undefined;

export default function App() {
  const [openSSHTunnelModal, setOpenSSHTunnelModal] = React.useState(false);
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
          onSetTunnel={async info => {
            // Close existing tunnel.
            if (tunnel) {
              await tunnel.close();
              tunnel = null;
            }
            if (info) {
              console.log(info);
              tunnel = new SSHTunnel(info);
              try {
                await tunnel.connect();
              } catch (e: any) {
                return e;
              }
            }
            return undefined;
          }}
        />
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
            setOpenSSHTunnelModal(true);
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
});
