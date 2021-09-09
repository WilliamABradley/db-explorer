import * as React from 'react';
import Editor from '.';

export default {
  title: 'Editor',
};

let value = 'SELECT * from INFORMATION_SCHEMA.TABLES;';

export const Default = (args: any) => (
  <Editor {...args} onChange={newVal => (value = newVal)} />
);
Default.args = {
  value,
};
