import * as React from 'react';
import {useState, useEffect} from 'react';
import {StyleSheet, View, Text} from 'react-native';
//import Editor from './components/Editor';

export default function App() {
  const [result, setResult] = useState<number | undefined>();

  useEffect(() => {
    setResult(3 * 7);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
      {/* <Editor /> */}
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
