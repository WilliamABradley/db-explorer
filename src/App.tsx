import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, View, Text, Button} from 'react-native';
import Editor from './components/Editor';

export default function App() {
  const [sql, setSQL] = useState('SELECT * FROM INFORMATION_SCHEMA.TABLES;');
  const [results, setResults] = useState('');

  return (
    <View style={styles.container}>
      <Button
        title="Run"
        onPress={() => {
          setResults(sql);
        }}
      />
      <Editor value={sql} onChange={setSQL} />
      <Text>SQL:</Text>
      <Text>{sql}</Text>
      <Text>Results:</Text>
      <Text>{results}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
