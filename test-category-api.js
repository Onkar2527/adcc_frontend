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
  const aud = await client.query('SELECT * FROM audit_auditors_map WHERE assesment_id = 38');
  console.log('Auditors Map for 38:', aud.rows);
  const empId = aud.rows[0]?.employee_id || 184;
  await client.end();

  http.get(`http://localhost:3581/internal-audit/38/category/2?employee_id=${empId}&dump_id=0`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', data);
    });
  });
}
run();
