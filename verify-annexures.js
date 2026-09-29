const { Client } = require('d:/adcc-auditpro/adcc_audit_backend/node_modules/pg');

const client = new Client({
  host: 'db.kredpool.ai',
  port: 5432,
  user: 'postgres',
  password: 'dms@kredpool450',
  database: 'adcc_auditpro',
  ssl: false
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a.name, a.mr_name, a.layout_type, 
           (SELECT count(*) FROM annexure_columns WHERE annexure_id = a.id) as item_count,
           a.matrix_columns
    FROM annexure_master a
    WHERE a.id BETWEEN 338 AND 347
    ORDER BY a.id
  `);
  console.log('\n================ ALL 10 ANNEXURES DATABASE STATUS ================');
  for (const r of res.rows) {
    console.log(`\nID ${r.id}: [${r.layout_type.toUpperCase()}] ${r.name} / ${r.mr_name}`);
    console.log(`  - Row/Input Count (annexure_columns): ${r.item_count}`);
    console.log(`  - Header Matrix (matrix_columns): ${r.matrix_columns}`);
  }
  await client.end();
}

check().catch(console.error);
