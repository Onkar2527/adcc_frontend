const { Client } = require('d:/adcc-auditpro/adcc_audit_backend/node_modules/pg');
require('d:/adcc-auditpro/adcc_audit_backend/node_modules/dotenv').config({ path: 'd:/adcc-auditpro/adcc_audit_backend/.env' });
const http = require('http');

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

  await client.query("UPDATE employee_master SET audit_unit_authority = '1029,1028' WHERE id = 184");
  await client.end();

  http.get('http://localhost:3581/internal-audit/38/category/9108?employee_id=184&dump_id=18705', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('API Status:', res.statusCode);
      const json = JSON.parse(data);
      console.log('Category Name:', json.category?.name);
      console.log('Selected Account Scheme:', json.selected_account?.scheme_name);
      console.log('Returned Question Sets for Dump 18705:', json.sets?.map(s => ({ set_id: s.set_id, set_name: s.set_name })));
    });
  });
}
run().catch(e => console.error(e));
