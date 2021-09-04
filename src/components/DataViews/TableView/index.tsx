import * as React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Table, Row, Cell, TableWrapper} from 'react-native-table-component';
import {TextEncoder} from 'text-encoding';
import Convert from '../../../dialects/postgres/types/Convert';
import PgTypeInfo from '../../../dialects/postgres/types/PgTypeInfo';
import DatabaseQueryResult from '../../../drivers/models/DatabaseQueryResult';

export default function TableView(props: {
  data: DatabaseQueryResult | null;
}): JSX.Element {
  const {data} = props;
  if (!data) {
    return <></>;
  }

  const headData = data.columns.map(c => c.name);
  const tableData = data.rows.map(r => {
    return r.reduce((row, c, i) => {
      const col = data.columns[i];
      const pgType = new PgTypeInfo(col.dataType);
      const encoder = new TextEncoder();
      const rawVal =
        c !== null ? Buffer.from(encoder.encode(c as unknown as string)) : c;
      let val = rawVal;
      if (val !== null) {
        val = Convert(val, pgType);
      }
      row.push(val);
      return row;
    }, [] as any[]);
  });

  const widthArr = data.columns.map(c => {
    switch (c.dataType) {
      default:
        return 300;
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView horizontal={true}>
        <View>
          <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
            <Row widthArr={widthArr} data={headData} style={styles.header} />
          </Table>
          <ScrollView style={styles.dataWrapper}>
            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
              {tableData.map((rowData, index) => (
                <Row
                  key={index}
                  widthArr={widthArr}
                  data={rowData.map(d => JSON.stringify(d))}
                />
              ))}
            </Table>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff'},
  header: {height: 50, backgroundColor: '#537791'},
  dataWrapper: {marginTop: -1},
  row: {backgroundColor: '#E7E6E1'},
});
