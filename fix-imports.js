const fs = require('fs');

function fix(backendDir) {
  // 1. DTO
  const dtoPath = backendDir + '/src/modules/admin/audit-scheme-master/dto/audit-schemes.dto.ts';
  if (fs.existsSync(dtoPath)) {
    let dto = fs.readFileSync(dtoPath, 'utf8');
    dto = dto.replace('@IsOptional()\n  @IsInt()\n  question_set_ids?: string;', '@IsOptional()\n  @IsString()\n  question_set_ids?: string;');
    if (!dto.includes('export class UpdateSchemeQuestionMappingDto')) {
      dto += '\nexport class UpdateSchemeQuestionMappingDto {\n  @IsOptional()\n  @IsString()\n  question_set_ids?: string;\n}\n';
    }
    fs.writeFileSync(dtoPath, dto, 'utf8');
  }

  // 2. Controller
  const ctrlPath = backendDir + '/src/modules/admin/audit-scheme-master/audit-schemes.controller.ts';
  if (fs.existsSync(ctrlPath)) {
    let ctrl = fs.readFileSync(ctrlPath, 'utf8');
    ctrl = ctrl.replace(
      /import\s*\{\s*CreateAuditSchemeDto,\s*UpdateSchemeDto,?\s*\}\s*from\s*['"]\.\/dto\/audit-schemes\.dto['"];/,
      "import {\n  CreateAuditSchemeDto,\n  UpdateSchemeDto,\n  UpdateSchemeQuestionMappingDto,\n} from './dto/audit-schemes.dto';"
    );
    fs.writeFileSync(ctrlPath, ctrl, 'utf8');
  }

  // 3. Service
  const svcPath = backendDir + '/src/modules/admin/audit-scheme-master/audit-schemes.service.ts';
  if (fs.existsSync(svcPath)) {
    let svc = fs.readFileSync(svcPath, 'utf8');
    svc = svc.replace(
      /import\s*\{\s*CreateAuditSchemeDto,\s*UpdateSchemeDto,?\s*\}\s*from\s*['"]\.\/dto\/audit-schemes\.dto['"];/,
      "import {\n  CreateAuditSchemeDto,\n  UpdateSchemeDto,\n  UpdateSchemeQuestionMappingDto,\n} from './dto/audit-schemes.dto';"
    );
    fs.writeFileSync(svcPath, svc, 'utf8');
  }

  console.log('Fixed imports in', backendDir);
}

fix('d:/adcc-auditpro/adcc_audit_backend');
fix('d:/ideal_auditpro/audit_backend');
