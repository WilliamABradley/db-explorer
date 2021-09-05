import * as React from 'react';
import TableView from '.';

export default {
  title: 'DataViews/TableView',
};

const ofColumn = (name: string, dataType: string = 'text') => {
  return {
    name,
    dataType,
  };
};

export const Default = (args: any) => (
  <TableView
    data={{
      columns: args.columns,
      rows: args.rows,
    }}
  />
);
Default.args = {
  columns: [ofColumn('id'), ofColumn('name')],
  rows: [['1', 'Bob Stevens']],
};
