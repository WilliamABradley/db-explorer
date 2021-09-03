import * as React from 'react';
import {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import Editor from './components/Editor';
import Convert from './dialects/postgres/types/Convert';
import PgTypeInfo from './dialects/postgres/types/PgTypeInfo';
import DatabaseDriver from './drivers/DatabaseDriver';
import PostgresDriver from './drivers/postgres';

let driver: DatabaseDriver;
let driverConnect: Promise<void> | undefined;

export default function App() {
  const [sql, setSQL] = useState('SELECT * FROM public.user;');
  const [results, setResults] = useState('');

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
              .then(results => {
                const formattedResults = results.rows.map(r => {
                  return r.reduce((row, c, i) => {
                    const col = results.columns[i];
                    const pgType = new PgTypeInfo(col.dataType);
                    const rawVal = Array.isArray(c) ? Buffer.from(c) : c;
                    let val = rawVal;
                    if (val !== null) {
                      val = Convert(val, pgType);
                    }
                    row[col.name] = val;
                    return row;
                  }, {} as Record<string, any>);
                });
                setResults(JSON.stringify(formattedResults, null, 4));
              })
              .catch(e => {
                console.error(e);
              });
          }}
        />
        <Text>Results:</Text>
        <ScrollView>
          <Text>{results}</Text>
        </ScrollView>
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
