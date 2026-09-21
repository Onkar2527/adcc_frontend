const fs = require('fs');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add am.matrix_columns to SQL queries
  content = content.replaceAll(
    "COALESCE(am.layout_type, 'grid') AS annexure_layout_type,",
    "COALESCE(am.layout_type, 'grid') AS annexure_layout_type,\n              am.matrix_columns AS annexure_matrix_columns,"
  );

  // 2. Map layout_type and matrix_columns in groupCategoryQuestions
  if (filePath.endsWith('.ts')) {
    content = content.replace(
      `              id:
                row.annexure_id,
              name:
                row.annexure_name,
              risk_defination_id:
                row.annexure_risk_defination_id,
              columns:
                row.annexure_columns || [],`,
      `              id:
                row.annexure_id,
              name:
                row.annexure_name,
              layout_type:
                row.annexure_layout_type || 'grid',
              matrix_columns:
                row.annexure_matrix_columns
                  ? (typeof row.annexure_matrix_columns === 'string'
                      ? JSON.parse(row.annexure_matrix_columns)
                      : row.annexure_matrix_columns)
                  : [],
              risk_defination_id:
                row.annexure_risk_defination_id,
              columns:
                row.annexure_columns || [],`
    );
  } else if (filePath.endsWith('.js')) {
    // For compiled JS in dist
    content = content.replace(
      `id: row.annexure_id, name: row.annexure_name, risk_defination_id: row.annexure_risk_defination_id, columns: row.annexure_columns || []`,
      `id: row.annexure_id, name: row.annexure_name, layout_type: row.annexure_layout_type || 'grid', matrix_columns: row.annexure_matrix_columns ? (typeof row.annexure_matrix_columns === 'string' ? JSON.parse(row.annexure_matrix_columns) : row.annexure_matrix_columns) : [], risk_defination_id: row.annexure_risk_defination_id, columns: row.annexure_columns || []`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched:', filePath);
}

patchFile('d:/adcc-auditpro/adcc_audit_backend/src/modules/auditor/internal-audit/internal-audit.service.ts');
patchFile('d:/adcc-auditpro/adcc_audit_backend/dist/modules/auditor/internal-audit/internal-audit.service.js');
