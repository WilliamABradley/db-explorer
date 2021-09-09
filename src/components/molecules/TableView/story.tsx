import * as React from 'react';
import TableView from '.';

export default {
  title: 'molecules/TableView',
};

const ofColumn = (name: string, dataType: string = 'text') => {
  return {
    name,
    dataType,
  };
};

const Template = (args: any) => (
  <TableView
    data={{
      columns: args.columns,
      rows: args.rows,
    }}
  />
);

export const Default = Template.bind({});
Default.args = {
  columns: [ofColumn('id'), ofColumn('name')],
  rows: [['1', 'Bob Stevens']],
};

export const StressTest = Template.bind({});
const stressTestRows = [];
for (let i = 0; i < 100; i++) {
  const created = new Date();
  created.setHours(created.getHours() - i);
  stressTestRows.push([i, `Row: ${i}`, created]);
}

StressTest.args = {
  columns: [ofColumn('id'), ofColumn('name'), ofColumn('created')],
  rows: stressTestRows,
};
