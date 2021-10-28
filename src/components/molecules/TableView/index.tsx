import * as React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import {Table, Row} from 'react-native-table-component';
import Convert from '../../../database/dialects/postgres/types/Convert';
import PgTypeInfo from '../../../database/dialects/postgres/types/PgTypeInfo';
import DatabaseQueryResult from '../../../database/models/DatabaseQueryResult';

export default function TableView(props: {
  data: DatabaseQueryResult | null;
}): JSX.Element {
  const {data} = props;
  const [isReady, setReady] = React.useState(false);
  const [componentHeight, setHeight] = React.useState(0);
  const [componentWidth, setWidth] = React.useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const {x, y, height, width} = e.nativeEvent.layout;
    setHeight(height);
    setWidth(width);

    // Wait for one layout call before drawing.
    if (!isReady) {
      setReady(true);
    }
  };

  if (!isReady || !data) {
    return <View style={styles.container} onLayout={onLayout} />;
  }

  const headData = data.columns.map(c => c.name);
  const rowData = data.rows.map(r => {
    return r.reduce((row, c, i) => {
      const col = data.columns[i];
      const pgType = new PgTypeInfo(col.dataType);
      const rawVal =
        c !== null ? Buffer.from(c as unknown as string, 'base64') : c;
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

  // Fill the remaining width to make the table look full.
  let isUnderWidth = false;
  const totalWidth = widthArr.reduce((sum, curr) => sum + curr, 0);
  const remainingWidth = componentWidth - totalWidth;
  if (remainingWidth > 0) {
    isUnderWidth = true;
    widthArr.push(remainingWidth);
    headData.push('');
  }

  // Fill the remaining table height with dummy rows, if under the height.
  let isUnderHeight = false;
  const rowHeight = 20;
  const totalHeight = rowData.length * rowHeight;
  const remainingHeight = componentHeight - totalHeight;
  if (remainingHeight > 0) {
    isUnderHeight = true;
    const numFillerRows = Math.ceil(remainingHeight / rowHeight);
    for (let i = 0; i < numFillerRows; i++) {
      const dummyData = [];
      for (const _ of headData) {
        dummyData.push(undefined);
      }
      rowData.push(dummyData);
    }
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        persistentScrollbar={true}
        showsVerticalScrollIndicator={true}
        scrollEnabled={!isUnderWidth}>
        <View>
          <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
            <Row widthArr={widthArr} data={headData} style={styles.header} />
          </Table>
          <ScrollView
            style={styles.dataWrapper}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
            scrollEnabled={!isUnderHeight}>
            <Table borderStyle={{borderWidth: 1, borderColor: '#C1C0B9'}}>
              {rowData.map((rowData, index) => (
                <Row
                  key={index}
                  widthArr={widthArr}
                  data={[
                    ...rowData.map(d => (
                      <Text
                        style={{...styles.rowData, height: rowHeight}}
                        numberOfLines={1}>
                        {JSON.stringify(d)}
                      </Text>
                    )),
                    // Pad with undefined for empty column fill.
                    undefined,
                  ]}
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
  container: {flex: 1, backgroundColor: '#fff'},
  header: {height: 30, backgroundColor: '#537791', minWidth: '100%'},
  dataWrapper: {marginTop: -1},
  row: {backgroundColor: '#E7E6E1'},
  rowData: {color: 'black'},
});
