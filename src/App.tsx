import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, View, Text, Button, ScrollView} from 'react-native';
import Editor from './components/Editor';
import PostgresDriver from './drivers/postgres';

const driver = new PostgresDriver({
  host: '192.168.1.10',
  port: '5432',
  username: 'postgres',
  database: 'api',
  ssl: false,
});

export default function App() {
  const [sql, setSQL] = useState('SELECT * FROM INFORMATION_SCHEMA.TABLES;');
  const [results, setResults] = useState('');

  return (
    <View style={styles.container}>
      <Button
        title="Run"
        onPress={() => {
          driver.connect().then(() => {
            driver
              .execute(sql)
              .then(results =>
                setResults(JSON.stringify(JSON.parse(results), null, 4)),
              );
          });
        }}
      />
      <Editor value={sql} onChange={setSQL} />
      <Text>Results:</Text>
      <ScrollView>
        <Text>{results}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
});
