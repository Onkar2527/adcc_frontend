const fs = require('fs');

const path = 'd:/adcc-auditpro/adcc_audit_backend/src/modules/auditor/internal-audit/internal-audit.service.ts';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

let insertIdx = -1;
let paramIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const questionResult =') && i > 3500 && i < 3700) {
    insertIdx = i;
  }
  if (lines[i].includes('category.question_set_ids || \'\'') && i > 3650 && i < 3750) {
    paramIdx = i;
  }
}

console.log('Found insertIdx:', insertIdx, 'paramIdx:', paramIdx);

if (insertIdx !== -1 && paramIdx !== -1) {
  const insertLines = [
    "    let activeQuestionSetIds = category.question_set_ids || '';",
    "    if (dumpId > 0 && [1, 2].includes(Number(category.linked_table_id))) {",
    "      const dumpTable = Number(category.linked_table_id) === 1 ? 'dump_deposits' : 'dump_advances';",
    "      const dumpAccount = await this.db.findOne(",
    "        `SELECT d.scheme_id, sm.question_set_ids AS scheme_question_set_ids",
    "         FROM ${dumpTable} d",
    "         LEFT JOIN scheme_master sm ON sm.id = d.scheme_id AND sm.deleted_at IS NULL",
    "         WHERE d.id = $1 LIMIT 1`,",
    "        [dumpId]",
    "      );",
    "      if (dumpAccount?.scheme_question_set_ids && String(dumpAccount.scheme_question_set_ids).trim()) {",
    "        activeQuestionSetIds = String(dumpAccount.scheme_question_set_ids).trim();",
    "      }",
    "    }",
    ""
  ];

  lines.splice(insertIdx, 0, ...insertLines);
  
  // Recalculate paramIdx because of inserted lines
  for (let i = insertIdx + insertLines.length; i < lines.length; i++) {
    if (lines[i].includes('category.question_set_ids || \'\'') && i < insertIdx + insertLines.length + 150) {
      lines[i] = lines[i].replace('category.question_set_ids || \'\'', 'activeQuestionSetIds');
    }
    if (lines[i].includes('category.question_set_ids || \'\'') && i < insertIdx + insertLines.length + 150) {
      lines[i] = lines[i].replace('category.question_set_ids || \'\'', 'activeQuestionSetIds');
    }
  }

  fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
  console.log('Successfully updated internal-audit.service.ts!');
}
