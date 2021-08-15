const { Client } = require('pg')
const client = new Client({
  user: 'postgres',
  database: 'api',
});

async function getTables() {
  await client.connect();

  const res = await client.query('select * from information_schema.tables where table_catalog = \'api\' and table_schema = \'public\'');
  return JSON.stringify(res.rows.map(r => r.table_name));
}

module.exports = {
  getTables,
};
