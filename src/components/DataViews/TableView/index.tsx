import * as React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Table, Row, Cell, TableWrapper} from 'react-native-table-component';
import {TextEncoder} from 'util';
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
      row[col.name] = val;
      return row;
    }, {} as Record<string, any>);
  });

  return (
    <View style={styles.container}>
      <ScrollView horizontal={true}>
        <View>
          <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
            <Row
              data={headData}
              style={styles.header}
              textStyle={styles.text}
            />
          </Table>
          <ScrollView style={styles.dataWrapper}>
            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
              {tableData.map((rowData, index) => (
                <TableWrapper key={index} style={styles.row}>
                  {rowData.map((cellData: any, cellIndex: number) => (
                    <Cell
                      key={cellIndex}
                      data={cellData}
                      textStyle={styles.text}
                    />
                  ))}
                </TableWrapper>
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
  text: {textAlign: 'center', fontWeight: '100'},
  dataWrapper: {marginTop: -1},
  row: {height: 40, backgroundColor: '#E7E6E1'},
});
