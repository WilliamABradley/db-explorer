import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, View, Button, SafeAreaView, Platform} from 'react-native';
import TableView from './components/DataViews/TableView';
import Editor from './components/Editor';
import DatabaseDriver from './drivers/DatabaseDriver';
import DatabaseQueryResult from './drivers/models/DatabaseQueryResult';
import PostgresDriver from './drivers/postgres';

let driver: DatabaseDriver;
let driverConnect: Promise<void> | undefined;

export default function App() {
  const [sql, setSQL] = useState('SELECT * FROM public.user;');
  const [response, setResponse] = useState<DatabaseQueryResult | null>(null);

  return (
    <SafeAreaView>
      <View style={styles.container}>
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
