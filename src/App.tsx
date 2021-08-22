import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, View, Text, Button, ScrollView} from 'react-native';
import Editor from './components/Editor';
import PostgresDriver from './drivers/postgres';

const driver = new PostgresDriver();

export default function App() {
  const [sql, setSQL] = useState('SELECT * FROM INFORMATION_SCHEMA.TABLES;');
  const [results, setResults] = useState('');

  return (
    <View style={styles.container}>
      <Button
        title="Run"
        onPress={() => {
          driver
            .connect(
              'Username=postgres;Host=192.168.1.10;Port=5432;Database=api;',
            )
            .then(() => {
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
