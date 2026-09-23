const fs = require('fs');

function patchBackend(backendRoot) {
  console.log('Patching backend at:', backendRoot);

  // 1. DTO
  const dtoPath = `${backendRoot}/src/modules/admin/audit-scheme-master/dto/audit-schemes.dto.ts`;
  if (fs.existsSync(dtoPath)) {
    let dtoContent = fs.readFileSync(dtoPath, 'utf8');
    if (!dtoContent.includes('UpdateSchemeQuestionMappingDto')) {
      dtoContent = dtoContent.replace(
        /is_active\?:\s*number;/,
        'question_set_ids?: string;\n\n  @IsOptional()\n  @IsInt()\n  is_active?: number;'
      );
      dtoContent += `
export class UpdateSchemeQuestionMappingDto {
  @IsOptional()
  @IsString()
  question_set_ids?: string;
}
`;
      fs.writeFileSync(dtoPath, dtoContent, 'utf8');
      console.log('Updated DTO');
    }
  }

  // 2. Service
  const svcPath = `${backendRoot}/src/modules/admin/audit-scheme-master/audit-schemes.service.ts`;
  if (fs.existsSync(svcPath)) {
    let svcContent = fs.readFileSync(svcPath, 'utf8');
    if (!svcContent.includes('getQuestionMapping')) {
      svcContent = svcContent.replace(
        "UpdateSchemeDto,\n} from './dto/audit-schemes.dto';",
        "UpdateSchemeDto,\n  UpdateSchemeQuestionMappingDto,\n} from './dto/audit-schemes.dto';"
      );
      svcContent = svcContent.replace(
        "name: string;",
        "name: string;\n  question_set_ids?: string;"
      );
      svcContent = svcContent.replace(
        "scheme_code,\n        name,\n        is_active,\n        admin_id\n      )\n      VALUES ($1, $2, $3, $4, $5, $6)",
        "scheme_code,\n        name,\n        question_set_ids,\n        is_active,\n        admin_id\n      )\n      VALUES ($1, $2, $3, $4, $5, $6, $7)"
      );
      svcContent = svcContent.replace(
        "data.name.toUpperCase(),\n        data.is_active ?? 1,\n        data.admin_id ?? 1,\n      ],",
        "data.name.toUpperCase(),\n        data.question_set_ids ?? '',\n        data.is_active ?? 1,\n        data.admin_id ?? 1,\n      ],"
      );
      svcContent = svcContent.replace(
        "name = COALESCE($5, name),\n        is_active = COALESCE($6, is_active),\n        admin_id = COALESCE($7, admin_id),\n        updated_at = CURRENT_TIMESTAMP\n      WHERE id = $1",
        "name = COALESCE($5, name),\n        question_set_ids = COALESCE($6, question_set_ids),\n        is_active = COALESCE($7, is_active),\n        admin_id = COALESCE($8, admin_id),\n        updated_at = CURRENT_TIMESTAMP\n      WHERE id = $1"
      );
      svcContent = svcContent.replace(
        "data.name?.toUpperCase(),\n        data.is_active,\n        data.admin_id,\n      ],",
        "data.name?.toUpperCase(),\n        data.question_set_ids,\n        data.is_active,\n        data.admin_id,\n      ],"
      );

      const lastBrace = svcContent.lastIndexOf('}');
      const methods = `
  async getQuestionMapping(id: number) {
    const scheme = await this.findOne(id);
    const questionSets = await this.queryRows(
      \`
      SELECT id::int AS value, name AS label
      FROM question_set_master
      WHERE set_type_id = 1
        AND deleted_at IS NULL
        AND is_active = 1
      ORDER BY name
      \`
    );
    return {
      scheme,
      questionSets,
    };
  }

  async updateQuestionMapping(id: number, data: UpdateSchemeQuestionMappingDto) {
    await this.findOne(id);
    return this.queryOne(
      \`
      UPDATE scheme_master
      SET question_set_ids = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      \`,
      [data.question_set_ids ?? '', id],
    );
  }
}
`;
      svcContent = svcContent.slice(0, lastBrace) + methods;
      fs.writeFileSync(svcPath, svcContent, 'utf8');
      console.log('Updated Service');
    }
  }

  // 3. Controller
  const ctrlPath = `${backendRoot}/src/modules/admin/audit-scheme-master/audit-schemes.controller.ts`;
  if (fs.existsSync(ctrlPath)) {
    let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');
    if (!ctrlContent.includes('question-mapping')) {
      ctrlContent = ctrlContent.replace(
        "UpdateSchemeDto\n} from './dto/audit-schemes.dto';",
        "UpdateSchemeDto,\n  UpdateSchemeQuestionMappingDto\n} from './dto/audit-schemes.dto';"
      );
      const insertIndex = ctrlContent.indexOf('@Get()');
      const mappingRoutes = `  @Get('question-mapping/:id')
  getQuestionMapping(@Param('id', ParseIntPipe) id: number) {
    return this.service.getQuestionMapping(id);
  }

  @Patch('question-mapping/:id')
  updateQuestionMapping(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSchemeQuestionMappingDto,
  ) {
    return this.service.updateQuestionMapping(id, dto);
  }

`;
      ctrlContent = ctrlContent.slice(0, insertIndex) + mappingRoutes + ctrlContent.slice(insertIndex);
      fs.writeFileSync(ctrlPath, ctrlContent, 'utf8');
      console.log('Updated Controller');
    }
  }

  // 4. Update internal-audit.service.ts runtime scheme question loading
  const internalAuditPath = `${backendRoot}/src/modules/auditor/internal-audit/internal-audit.service.ts`;
  if (fs.existsSync(internalAuditPath)) {
    let iaContent = fs.readFileSync(internalAuditPath, 'utf8');
    
    // In getCategory question query
    if (!iaContent.includes('scheme_question_set_ids')) {
      // Find question query in getCategory
      iaContent = iaContent.replace(
        `        [
          category.question_set_ids || '',
          this.getSetIdsFromQuestionScope(
            category.question_set_ids || '',
          ),`,
        `        [
          activeQuestionSetIds,
          this.getSetIdsFromQuestionScope(
            activeQuestionSetIds,
          ),`
      );

      iaContent = iaContent.replace(
        `    const questionResult =
      await this.db.query(`,
        `    let activeQuestionSetIds = category.question_set_ids || '';
    if (dumpId > 0 && [1, 2].includes(Number(category.linked_table_id))) {
      const dumpTable = Number(category.linked_table_id) === 1 ? 'dump_deposits' : 'dump_advances';
      const dumpAccount = await this.db.findOne(
        \`SELECT d.scheme_id, sm.question_set_ids AS scheme_question_set_ids
         FROM \${dumpTable} d
         LEFT JOIN scheme_master sm ON sm.id = d.scheme_id AND sm.deleted_at IS NULL
         WHERE d.id = $1 LIMIT 1\`,
        [dumpId]
      );
      if (dumpAccount?.scheme_question_set_ids && String(dumpAccount.scheme_question_set_ids).trim()) {
        activeQuestionSetIds = dumpAccount.scheme_question_set_ids;
      }
    }

    const questionResult =
      await this.db.query(`
      );

      // In auto-fill query
      iaContent = iaContent.replace(
        `        for (const dumpId of dumpIds) {
          const questionsRes = await client.query(`,
        `        for (const dumpId of dumpIds) {
          let activeQuestionSetIds = catRow.question_set_ids || '';
          if (dumpId > 0 && [1, 2].includes(Number(catRow.linked_table_id))) {
            const dumpTable = Number(catRow.linked_table_id) === 1 ? 'dump_deposits' : 'dump_advances';
            const dumpAccount = await client.query(
              \`SELECT d.scheme_id, sm.question_set_ids AS scheme_question_set_ids
               FROM \${dumpTable} d
               LEFT JOIN scheme_master sm ON sm.id = d.scheme_id AND sm.deleted_at IS NULL
               WHERE d.id = $1 LIMIT 1\`,
              [dumpId]
            );
            if (dumpAccount.rows[0]?.scheme_question_set_ids && String(dumpAccount.rows[0].scheme_question_set_ids).trim()) {
              activeQuestionSetIds = dumpAccount.rows[0].scheme_question_set_ids;
            }
          }
          const questionsRes = await client.query(`
      );

      iaContent = iaContent.replace(
        `              catRow.question_set_ids || '',
            ]
          );`,
        `              activeQuestionSetIds,
            ]
          );`
      );

      fs.writeFileSync(internalAuditPath, iaContent, 'utf8');
      console.log('Updated internal-audit.service.ts');
    }
  }
}

patchBackend('d:/adcc-auditpro/adcc_audit_backend');
patchBackend('d:/ideal_auditpro/audit_backend');
