const fs = require('fs');

const distPath = 'd:/adcc-auditpro/adcc_audit_backend/dist/modules/auditor/internal-audit/internal-audit.service.js';
let dist = fs.readFileSync(distPath, 'utf8');

const target = `annexure: row.annexure_id
                    ? {
                        id: row.annexure_id,
                        name: row.annexure_name,
                        risk_defination_id: row.annexure_risk_defination_id,
                        columns: row.annexure_columns || [],
                    }
                    : null,`;

const replacement = `annexure: row.annexure_id
                    ? {
                        id: row.annexure_id,
                        name: row.annexure_name,
                        layout_type: row.annexure_layout_type || 'grid',
                        matrix_columns: row.annexure_matrix_columns || [],
                        risk_defination_id: row.annexure_risk_defination_id,
                        columns: row.annexure_columns || [],
                    }
                    : null,`;

console.log('Includes target:', dist.includes(target));
dist = dist.replace(target, replacement);
fs.writeFileSync(distPath, dist, 'utf8');
console.log('Updated dist successfully');
