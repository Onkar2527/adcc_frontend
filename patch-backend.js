const fs = require('fs');

function patchFile(filePath, handler) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  content = handler(content);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched:', filePath);
}

const complianceEvidenceSqlFix = (c) => {
  return c.replace(
    /CASE\s+WHEN\s+COALESCE\(ad\.audit_compulsary_ev_upload,\s*0\)\s*=\s*1\s+THEN\s*1\s+WHEN\s+COALESCE\(ad\.compliance_compulsary_ev_upload,\s*0\)\s+IN\s+\(1,\s*2\)\s+THEN\s*1\s+WHEN\s+COALESCE\(qm\.compliance_ev_upload,\s*0\)\s*=\s*1\s+THEN\s*1\s+ELSE\s*0\s+END\s+AS\s+compliance_evidence_upload/g,
    `CASE
                WHEN COALESCE(ad.audit_compulsary_ev_upload, 0) = 1 THEN 1
                WHEN COALESCE(ad.compliance_compulsary_ev_upload, 0) IN (1, 2) THEN 1
                ELSE 0
            END AS compliance_evidence_upload`
  );
};

patchFile('d:/adcc-auditpro/adcc_audit_backend/src/modules/auditor/internal-audit/services/compliance.service.ts', complianceEvidenceSqlFix);
patchFile('d:/adcc-auditpro/adcc_audit_backend/dist/modules/auditor/internal-audit/services/compliance.service.js', complianceEvidenceSqlFix);
