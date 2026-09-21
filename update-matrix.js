const { Client } = require('d:/adcc-auditpro/adcc_audit_backend/node_modules/pg');
require('d:/adcc-auditpro/adcc_audit_backend/node_modules/dotenv').config({ path: 'd:/adcc-auditpro/adcc_audit_backend/.env' });

async function run() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
  });
  await client.connect();

  const sixColumns = JSON.stringify([
    {
      key: 'limit',
      label: 'मंजूर मर्यादा (Limit)',
      type: 'number'
    },
    {
      key: 'dp',
      label: 'ड्रॉईंग पॉवर (DP)',
      type: 'number'
    },
    {
      key: 'balance',
      label: 'चालू बाकी (Balance)',
      type: 'number'
    },
    {
      key: 'overdue',
      label: 'थकबाकी (Overdue)',
      type: 'number'
    },
    {
      key: 'npa',
      label: 'NPA वर्गवारी',
      type: 'select',
      options: ['Standard (नियमित)', 'SMA-0', 'SMA-1', 'SMA-2', 'Substandard (अनुत्पादक)', 'Doubtful (संशयास्पद)', 'Loss (बुडीत)']
    },
    {
      key: 'remark',
      label: 'शेरा (Remarks)',
      type: 'text'
    }
  ]);

  await client.query('UPDATE annexure_master SET layout_type = $1, matrix_columns = $2 WHERE id = $3', ['form', sixColumns, 36]);

  const check = await client.query('SELECT id, name, layout_type, matrix_columns FROM annexure_master WHERE id = 36');
  console.log('Annexure 36 DB Record Updated to 6 Columns:', check.rows[0]);
  await client.end();
}
run();
