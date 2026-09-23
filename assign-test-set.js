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

  const res = await client.query("SELECT id, scheme_code, name, category_id, question_set_ids FROM scheme_master WHERE (UPPER(name) LIKE '%PRERNA%' OR UPPER(name) LIKE '%SOLAR%') AND deleted_at IS NULL");
  console.log('Matching Schemes:', res.rows);

  if (res.rows.length > 0) {
    for (const scheme of res.rows) {
      await client.query('UPDATE scheme_master SET question_set_ids = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['3', scheme.id]);
      console.log('Updated Scheme ID', scheme.id, '(', scheme.name, ') with question_set_ids = "3"');
    }
  }

  const check = await client.query("SELECT id, scheme_code, name, category_id, question_set_ids FROM scheme_master WHERE (UPPER(name) LIKE '%PRERNA%' OR UPPER(name) LIKE '%SOLAR%') AND deleted_at IS NULL");
  console.log('Verified Schemes in DB:', check.rows);

  await client.end();
}
run().catch(e => console.error(e));
