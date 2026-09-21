const fs = require('fs');

const distPath = 'd:/adcc-auditpro/adcc_audit_backend/dist/modules/auditor/internal-audit/internal-audit.service.js';
let dist = fs.readFileSync(distPath, 'utf8');

const oldBlock = `                annexure: row.annexure_id
                    ? {
                        id: row.annexure_id,
                        name: row.annexure_name,
                        risk_defination_id: row.annexure_risk_defination_id,
                        columns: row.annexure_columns || [],
                    }
                    : null,`;

const newBlock = `                annexure: row.annexure_id
                    ? {
                        id: row.annexure_id,
                        name: row.annexure_name,
                        layout_type: row.annexure_layout_type || 'grid',
                        matrix_columns: row.annexure_matrix_columns || [],
                        risk_defination_id: row.annexure_risk_defination_id,
                        columns: row.annexure_columns || [],
                    }
                    : null,`;

console.log('Includes oldBlock:', dist.includes(oldBlock));
dist = dist.replaceAll(oldBlock, newBlock);
fs.writeFileSync(distPath, dist, 'utf8');
console.log('Successfully patched dist at line 3698');
