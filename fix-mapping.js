const fs = require('fs');

const srcPath = 'd:/adcc-auditpro/adcc_audit_backend/src/modules/auditor/internal-audit/internal-audit.service.ts';
let src = fs.readFileSync(srcPath, 'utf8');

src = src.replace(
  `        annexure:
          row.annexure_id
            ? {
              id:
                row.annexure_id,
              name:
                row.annexure_name,
              risk_defination_id:
                row.annexure_risk_defination_id,
              columns:
                row.annexure_columns || [],
            }
            : null,`,
  `        annexure:
          row.annexure_id
            ? {
              id:
                row.annexure_id,
              name:
                row.annexure_name,
              layout_type:
                row.annexure_layout_type || 'grid',
              matrix_columns:
                row.annexure_matrix_columns || [],
              risk_defination_id:
                row.annexure_risk_defination_id,
              columns:
                row.annexure_columns || [],
            }
            : null,`
);

fs.writeFileSync(srcPath, src, 'utf8');
console.log('Fixed src');

const distPath = 'd:/adcc-auditpro/adcc_audit_backend/dist/modules/auditor/internal-audit/internal-audit.service.js';
if (fs.existsSync(distPath)) {
  let dist = fs.readFileSync(distPath, 'utf8');
  // Check where annexure object is created in dist
  const matchIdx = dist.indexOf('risk_defination_id: row.annexure_risk_defination_id');
  console.log('Match index in dist:', matchIdx);
  dist = dist.replace(
    /annexure:\s*row\.annexure_id\s*\?\s*\{[^}]*columns:\s*row\.annexure_columns\s*\|\|\s*\[\]\s*\}/g,
    `annexure: row.annexure_id ? { id: row.annexure_id, name: row.annexure_name, layout_type: row.annexure_layout_type || 'grid', matrix_columns: row.annexure_matrix_columns || [], risk_defination_id: row.annexure_risk_defination_id, columns: row.annexure_columns || [] }`
  );
  fs.writeFileSync(distPath, dist, 'utf8');
  console.log('Fixed dist with regex');
}
