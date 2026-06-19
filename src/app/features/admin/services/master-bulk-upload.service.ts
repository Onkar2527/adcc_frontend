import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AuditCalendarService,
  AuditSchemeMasterService,
  AuditSectionService,
  AuditUnitService,
  BroaderAreaMasterService,
  BranchService,
  CreateAuditUnitDto,
  CreateBroaderAreaMasterDto,
  CreateEmployeeDto,
  CreateRegionDto,
  CreateSchemeDto,
  EmployeeService,
  MasterBulkUploadApiService,
  RegionMasterService,
  UnitsService,
} from './masters.service';

export interface BulkUploadPreviewField {
  field: string;
  header: string;
}

export interface BulkUploadPreviewRow {
  rowNumber: number;
  status: 'VALID' | 'ERROR';
  message: string;
  normalized?: any;
  [key: string]: any;
}

export interface BulkUploadResult {
  successCount: number;
  errors: string[];
}

export interface MasterBulkUploadConfig {
  key: string;
  title: string;
  entityLabel: string;
  expectedHeaders: string[];
  sampleRows: string[][];
  previewFields: BulkUploadPreviewField[];
  loadContext: () => Observable<any>;
  createSession?: (context: any) => any;
  validateRow: (
    row: Record<string, string>,
    rowNumber: number,
    context: any,
    session: any,
  ) => BulkUploadPreviewRow;
  upload: (rows: any[], context: any) => Observable<BulkUploadResult>;
}

type OptionRecord = { id: number; name: string };

@Injectable({ providedIn: 'root' })
export class MasterBulkUploadService {
  private employeeService = inject(EmployeeService);
  private masterBulkUploadApiService = inject(MasterBulkUploadApiService);
  private schemeService = inject(AuditSchemeMasterService);
  private auditUnitService = inject(AuditUnitService);
  private regionService = inject(RegionMasterService);
  private unitsService = inject(UnitsService);
  private auditSectionService = inject(AuditSectionService);
  private broaderAreaService = inject(BroaderAreaMasterService);
  private auditCalendarService = inject(AuditCalendarService);
  private branchService = inject(BranchService);

  private readonly employeeTypeMap: Record<string, number> = {
    admin: 1,
    auditor: 2,
    employee: 3,
    reviewer: 4,
    'top level management': 5,
    division: 6,
  };

  private readonly genderMap: Record<string, string> = {
    male: 'Male',
    female: 'Female',
  };

  private readonly frequencyMap: Record<string, number> = {
    '1': 1,
    '1 month': 1,
    '3': 3,
    '3 months': 3,
    '6': 6,
    '6 months': 6,
    '12': 12,
    '12 months': 12,
  };

  private readonly riskTypeMap: Record<string, number> = {
    'high risk': 1,
    'medium risk': 2,
    'low risk': 3,
  };

  getConfig(key: string): MasterBulkUploadConfig {
    const config = this.getConfigs()[key];
    if (!config) {
      throw new Error(`Bulk upload config not found for ${key}`);
    }
    return config;
  }

  private getConfigs(): Record<string, MasterBulkUploadConfig> {
    return {
      employees: this.createEmployeeConfig(),
      schemes: this.createSchemeConfig(),
      auditUnits: this.createAuditUnitConfig(),
      regions: this.createRegionConfig(),
      frequencies: this.createFrequencyConfig(),
      sections: this.createSectionConfig(),
      broaderAreas: this.createBroaderAreaConfig(),
    };
  }

  private createEmployeeConfig(): MasterBulkUploadConfig {
    return {
      key: 'employees',
      title: 'Employee Master Bulk Upload',
      entityLabel: 'employees',
      expectedHeaders: [
        'employee_code',
        'full_name',
        'email',
        'mobile',
        'designation',
        'gender',
        'employee_type',
        'password',
        'audit_units',
        'region_name',
        'is_active',
      ],
      sampleRows: [[
        'EMP101',
        'Asha Patil',
        'asha@example.com',
        '9876543210',
        'Auditor',
        'Female',
        'Auditor',
        'Audit@123',
        'UPDATED BRANCH (1)|RADHA NAGARI BRANCH (10)',
        '',
        'Yes',
      ]],
      previewFields: [
        { field: 'emp_code', header: 'Employee Code' },
        { field: 'name', header: 'Full Name' },
        { field: 'email', header: 'Email' },
        { field: 'userTypeLabel', header: 'Employee Type' },
      ],
      loadContext: () =>
        forkJoin({
          employees: this.employeeService.getEmployees(),
          units: this.unitsService.getUnits(),
          regionNames: this.regionService.findUniqueNames(),
        }),
      createSession: (context) => ({
        empCodes: new Set(
          context.employees.map((item: any) => this.normalizeValue(item.emp_code)),
        ),
        emails: new Set(
          context.employees.map((item: any) => this.normalizeValue(item.email)),
        ),
        seenEmpCodes: new Set<string>(),
        seenEmails: new Set<string>(),
      }),
      validateRow: (row, rowNumber, context, session) => {
        const empCode = (row['employee_code'] || '').trim();
        const name = (row['full_name'] || '').trim();
        const email = (row['email'] || '').trim();
        const mobile = (row['mobile'] || '').trim();
        const designation = (row['designation'] || '').trim();
        const genderKey = this.normalizeValue(row['gender']);
        const employeeTypeKey = this.normalizeValue(row['employee_type']);
        const password = (row['password'] || '').trim();
        const auditUnitsRaw = (row['audit_units'] || '').trim();
        const regionName = (row['region_name'] || '').trim();
        const isActive = this.parseBoolean(row['is_active'], true);

        const errors: string[] = [];
        const userTypeId = this.employeeTypeMap[employeeTypeKey];
        const gender = this.genderMap[genderKey];

        if (!empCode) errors.push('Employee code is required');
        if (!name) errors.push('Full name is required');
        if (!email) {
          errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Email format is invalid');
        }
        if (!/^\d{10}$/.test(mobile)) {
          errors.push('Mobile must be 10 digits');
        }
        if (!gender) errors.push('Gender must be Male or Female');
        if (!userTypeId) errors.push('Employee type is invalid');
        if (!password) errors.push('Password is required');

        const normalizedEmpCode = this.normalizeValue(empCode);
        const normalizedEmail = this.normalizeValue(email);

        if (session.empCodes.has(normalizedEmpCode) || session.seenEmpCodes.has(normalizedEmpCode)) {
          errors.push('Employee code already exists');
        }
        if (session.emails.has(normalizedEmail) || session.seenEmails.has(normalizedEmail)) {
          errors.push('Email already exists');
        }

        let unitIds: number[] = [];
        if (userTypeId === 2 || userTypeId === 4) {
          unitIds = this.parseNamedIds(auditUnitsRaw, context.units, 'name');
          if (!unitIds.length) {
            errors.push('Authorized audit units are required for Auditor/Reviewer');
          }
        }

        if (userTypeId === 6) {
          const regionExists = context.regionNames.some(
            (value: string) => this.normalizeValue(value) === this.normalizeValue(regionName),
          );
          if (!regionName || !regionExists) {
            errors.push('Assigned region is invalid');
          }
        }

        if (!errors.length) {
          session.seenEmpCodes.add(normalizedEmpCode);
          session.seenEmails.add(normalizedEmail);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          emp_code: empCode,
          name,
          email,
          userTypeLabel: row['employee_type'] || '',
          normalized: errors.length
            ? undefined
            : ({
                emp_code: empCode,
                name,
                email,
                mobile,
                designation,
                gender,
                user_type_id: userTypeId,
                password,
                unit_ids: unitIds,
                region_name: userTypeId === 6 ? regionName : undefined,
                is_active: isActive ? 1 : 0,
              } satisfies CreateEmployeeDto),
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('employees', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload employees'),
            }),
          ),
        ),
    };
  }

  private createSchemeConfig(): MasterBulkUploadConfig {
    return {
      key: 'schemes',
      title: 'Audit Scheme Master Bulk Upload',
      entityLabel: 'schemes',
      expectedHeaders: [
        'scheme_type',
        'category',
        'scheme_code',
        'scheme_name',
        'is_active',
      ],
      sampleRows: [[
        'Deposit',
        'SAVING ACCOUNT',
        'SB001',
        'Regular Savings Account',
        'Yes',
      ]],
      previewFields: [
        { field: 'scheme_type', header: 'Scheme Type' },
        { field: 'category_name', header: 'Category' },
        { field: 'scheme_code', header: 'Scheme Code' },
        { field: 'name', header: 'Scheme Name' },
      ],
      loadContext: () =>
        forkJoin({
          schemes: this.schemeService.findAll(),
          depositCategories: this.schemeService.getCategories(1),
          advanceCategories: this.schemeService.getCategories(2),
        }).pipe(
          map((ctx) => ({
            schemes: this.extractRows(ctx.schemes),
            depositCategories: this.extractRows(ctx.depositCategories),
            advanceCategories: this.extractRows(ctx.advanceCategories),
          })),
        ),
      createSession: (context) => ({
        schemeCodes: new Set(
          context.schemes.map((item: any) => this.normalizeValue(item.scheme_code)),
        ),
        seenSchemeCodes: new Set<string>(),
      }),
      validateRow: (row, rowNumber, context, session) => {
        const schemeTypeRaw = this.normalizeValue(row['scheme_type']);
        const categoryName = (row['category'] || '').trim();
        const schemeCode = (row['scheme_code'] || '').trim().toUpperCase();
        const name = (row['scheme_name'] || '').trim();
        const isActive = this.parseBoolean(row['is_active'], true);
        const errors: string[] = [];

        const schemeTypeId =
          schemeTypeRaw === 'deposit' || schemeTypeRaw === '1'
            ? 1
            : schemeTypeRaw === 'advances' || schemeTypeRaw === 'advance' || schemeTypeRaw === '2'
            ? 2
            : 0;

        const categories = schemeTypeId === 1 ? context.depositCategories : context.advanceCategories;
        const category = categories.find(
          (item: any) =>
            this.normalizeValue(item.name || item.category_name) === this.normalizeValue(categoryName),
        );

        if (!schemeTypeId) errors.push('Scheme type must be Deposit or Advances');
        if (!category) errors.push('Category is invalid');
        if (!schemeCode) errors.push('Scheme code is required');
        if (!name) errors.push('Scheme name is required');

        const normalizedCode = this.normalizeValue(schemeCode);
        if (session.schemeCodes.has(normalizedCode) || session.seenSchemeCodes.has(normalizedCode)) {
          errors.push('Scheme code already exists');
        }

        if (!errors.length) {
          session.seenSchemeCodes.add(normalizedCode);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          scheme_type: schemeTypeId === 1 ? 'Deposit' : 'Advances',
          category_name: categoryName,
          scheme_code: schemeCode,
          name,
          normalized: errors.length
            ? undefined
            : ({
                scheme_type_id: schemeTypeId,
                category_id: Number(category.id),
                scheme_code: schemeCode,
                name,
                is_active: isActive ? 1 : 0,
              } satisfies CreateSchemeDto),
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('schemes', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload schemes'),
            }),
          ),
        ),
    };
  }

  private createAuditUnitConfig(): MasterBulkUploadConfig {
    return {
      key: 'auditUnits',
      title: 'Audit Unit Master Bulk Upload',
      entityLabel: 'audit units',
      expectedHeaders: [
        'audit_section',
        'audit_unit_code',
        'audit_unit_name',
        'head_of_audit_unit',
        'assistant_to_head',
        'last_audit_date',
        'audit_frequency',
        'is_active',
      ],
      sampleRows: [[
        'Branch',
        '501',
        'Sample Branch',
        'RAJ KULKARNI',
        '',
        '2026-06-19',
        '6 Months',
        'Yes',
      ]],
      previewFields: [
        { field: 'section_name', header: 'Audit Section' },
        { field: 'audit_unit_code', header: 'Unit Code' },
        { field: 'name', header: 'Unit Name' },
        { field: 'frequency_label', header: 'Frequency' },
      ],
      loadContext: () =>
        forkJoin({
          units: this.auditUnitService.findAll(),
          sections: this.auditSectionService.findAll(),
          employees: this.employeeService.getEmployees(),
        }).pipe(
          map((ctx) => ({
            units: this.extractRows(ctx.units),
            sections: this.extractRows(ctx.sections),
            employees: ctx.employees,
          })),
        ),
      createSession: (context) => ({
        unitCodes: new Set(
          context.units.map((item: any) => this.normalizeValue(item.audit_unit_code)),
        ),
        seenUnitCodes: new Set<string>(),
      }),
      validateRow: (row, rowNumber, context, session) => {
        const sectionName = (row['audit_section'] || '').trim();
        const auditUnitCode = (row['audit_unit_code'] || '').trim();
        const name = (row['audit_unit_name'] || '').trim();
        const headName = (row['head_of_audit_unit'] || '').trim();
        const assistantName = (row['assistant_to_head'] || '').trim();
        const lastAuditDate = (row['last_audit_date'] || '').trim();
        const frequencyRaw = this.normalizeValue(row['audit_frequency']);
        const isActive = this.parseBoolean(row['is_active'], true);
        const errors: string[] = [];

        const section = context.sections.find(
          (item: any) => this.normalizeValue(item.name) === this.normalizeValue(sectionName),
        );
        const head = context.employees.find(
          (item: any) => this.normalizeValue(item.name) === this.normalizeValue(headName),
        );
        const assistant = assistantName
          ? context.employees.find(
              (item: any) => this.normalizeValue(item.name) === this.normalizeValue(assistantName),
            )
          : null;
        const frequency = this.frequencyMap[frequencyRaw];

        if (!section) errors.push('Audit section is invalid');
        if (!auditUnitCode) errors.push('Audit unit code is required');
        if (!name) errors.push('Audit unit name is required');
        if (!head) errors.push('Head of audit unit is invalid');
        if (assistantName && !assistant) errors.push('Assistant to head is invalid');
        if (head && assistant && Number(head.id) === Number(assistant.id)) {
          errors.push('Head and assistant cannot be the same');
        }
        if (!this.isIsoDate(lastAuditDate)) errors.push('Last audit date must be in YYYY-MM-DD format');
        if (!frequency) errors.push('Audit frequency is invalid');

        const normalizedCode = this.normalizeValue(auditUnitCode);
        if (session.unitCodes.has(normalizedCode) || session.seenUnitCodes.has(normalizedCode)) {
          errors.push('Audit unit code already exists');
        }

        if (!errors.length) {
          session.seenUnitCodes.add(normalizedCode);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          section_name: sectionName,
          audit_unit_code: auditUnitCode,
          name,
          frequency_label: row['audit_frequency'] || '',
          normalized: errors.length
            ? undefined
            : ({
                section_type_id: Number(section.id),
                audit_unit_code: auditUnitCode,
                name,
                branch_head_id: Number(head.id),
                branch_subhead_id: assistant ? Number(assistant.id) : null,
                last_audit_date: lastAuditDate,
                frequency,
                is_active: isActive ? 1 : 0,
              } satisfies CreateAuditUnitDto),
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('auditUnits', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload audit units'),
            }),
          ),
        ),
    };
  }

  private createRegionConfig(): MasterBulkUploadConfig {
    return {
      key: 'regions',
      title: 'Region Master Bulk Upload',
      entityLabel: 'regions',
      expectedHeaders: [
        'region_name',
        'audit_units',
        'is_active',
      ],
      sampleRows: [[
        'Kolhapur Region',
        'UPDATED BRANCH (1)|RADHA NAGARI BRANCH (10)',
        'Yes',
      ]],
      previewFields: [
        { field: 'region_name', header: 'Region Name' },
        { field: 'units_text', header: 'Audit Units' },
      ],
      loadContext: () =>
        forkJoin({
          regions: this.regionService.findAll(),
          units: this.unitsService.getUnits(),
        }),
      createSession: (context) => ({
        regionNames: new Set(
          context.regions.map((item: any) => this.normalizeValue(item.region_name)),
        ),
        seenRegionNames: new Set<string>(),
      }),
      validateRow: (row, rowNumber, context, session) => {
        const regionName = (row['region_name'] || '').trim();
        const auditUnitsRaw = (row['audit_units'] || '').trim();
        const isActive = this.parseBoolean(row['is_active'], true);
        const errors: string[] = [];

        if (!regionName) errors.push('Region name is required');
        const normalizedName = this.normalizeValue(regionName);
        if (session.regionNames.has(normalizedName) || session.seenRegionNames.has(normalizedName)) {
          errors.push('Region name already exists');
        }

        const unitIds = this.parseNamedIds(auditUnitsRaw, context.units, 'name');
        if (!unitIds.length) errors.push('At least one audit unit is required');

        if (!errors.length) {
          session.seenRegionNames.add(normalizedName);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          region_name: regionName,
          units_text: auditUnitsRaw,
          normalized: errors.length
            ? undefined
            : ({
                region_name: regionName,
                unit_ids: unitIds,
                is_active: isActive ? 1 : 0,
              } satisfies CreateRegionDto),
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('regions', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload regions'),
            }),
          ),
        ),
    };
  }

  private createFrequencyConfig(): MasterBulkUploadConfig {
    return {
      key: 'frequencies',
      title: 'Audit Frequency Master Bulk Upload',
      entityLabel: 'risk frequency mappings',
      expectedHeaders: [
        'risk_type',
        'frequency_months',
      ],
      sampleRows: [
        ['HIGH RISK', '1'],
        ['MEDIUM RISK', '3'],
        ['LOW RISK', '6'],
      ],
      previewFields: [
        { field: 'risk_name', header: 'Risk Type' },
        { field: 'frequency', header: 'Frequency (Months)' },
      ],
      loadContext: () => this.auditCalendarService.getRiskFrequencies(),
      createSession: () => ({
        seenRiskTypes: new Set<string>(),
      }),
      validateRow: (row, rowNumber, _context, session) => {
        const riskTypeRaw = this.normalizeValue(row['risk_type']);
        const frequencyValue = Number((row['frequency_months'] || '').trim());
        const riskTypeId = this.riskTypeMap[riskTypeRaw];
        const errors: string[] = [];

        if (!riskTypeId) errors.push('Risk type must be HIGH RISK, MEDIUM RISK or LOW RISK');
        if (!Number.isFinite(frequencyValue) || frequencyValue <= 0) {
          errors.push('Frequency must be a positive number');
        }
        if (session.seenRiskTypes.has(riskTypeRaw)) {
          errors.push('Duplicate risk type found in CSV');
        }

        if (!errors.length) {
          session.seenRiskTypes.add(riskTypeRaw);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          risk_name: row['risk_type'] || '',
          frequency: row['frequency_months'] || '',
          normalized: errors.length
            ? undefined
            : {
                risk_type_id: riskTypeId,
                frequency: frequencyValue,
              },
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('frequencies', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to update audit frequencies'),
            }),
          ),
        ),
    };
  }

  private createSectionConfig(): MasterBulkUploadConfig {
    return {
      key: 'sections',
      title: 'Audit Section Master Bulk Upload',
      entityLabel: 'audit sections',
      expectedHeaders: [
        'section_name',
      ],
      sampleRows: [['Branch']],
      previewFields: [
        { field: 'name', header: 'Section Name' },
      ],
      loadContext: () => this.auditSectionService.findAll(),
      createSession: (context) => ({
        names: new Set(
          this.extractRows(context).map((item: any) => this.normalizeValue(item.name)),
        ),
        seenNames: new Set<string>(),
      }),
      validateRow: (row, rowNumber, _context, session) => {
        const name = (row['section_name'] || '').trim().toUpperCase();
        const errors: string[] = [];

        if (!name) errors.push('Section name is required');
        const normalizedName = this.normalizeValue(name);
        if (session.names.has(normalizedName) || session.seenNames.has(normalizedName)) {
          errors.push('Section name already exists');
        }

        if (!errors.length) {
          session.seenNames.add(normalizedName);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          name,
          normalized: errors.length ? undefined : { name },
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('sections', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload audit sections'),
            }),
          ),
        ),
    };
  }

  private createBroaderAreaConfig(): MasterBulkUploadConfig {
    return {
      key: 'broaderAreas',
      title: 'Broader Area Master Bulk Upload',
      entityLabel: 'broader areas',
      expectedHeaders: [
        'name',
        'appetite_percent',
        'occurance_percent',
        'magnitude',
        'frequency',
        'average_qualitative_count',
        'average_quantitative_count',
      ],
      sampleRows: [[
        'CASH MANAGEMENT',
        '10',
        '20',
        '5',
        '12',
        '4',
        '6',
      ]],
      previewFields: [
        { field: 'name', header: 'Broader Area' },
        { field: 'appetite_percent', header: 'Appetite %' },
        { field: 'occurance_percent', header: 'Occurrence %' },
      ],
      loadContext: () => this.broaderAreaService.getBroaderAreas(),
      createSession: (context) => ({
        names: new Set(
          this.extractRows(context).map((item: any) => this.normalizeValue(item.name)),
        ),
        seenNames: new Set<string>(),
      }),
      validateRow: (row, rowNumber, _context, session) => {
        const name = (row['name'] || '').trim().toUpperCase();
        const appetitePercent = (row['appetite_percent'] || '').trim();
        const occurancePercent = (row['occurance_percent'] || '').trim();
        const magnitude = (row['magnitude'] || '').trim();
        const frequency = (row['frequency'] || '').trim();
        const averageQualitativeCount = (row['average_qualitative_count'] || '').trim();
        const averageQuantitativeCount = (row['average_quantitative_count'] || '').trim();
        const errors: string[] = [];

        if (!name) errors.push('Name is required');
        const normalizedName = this.normalizeValue(name);
        if (session.names.has(normalizedName) || session.seenNames.has(normalizedName)) {
          errors.push('Broader area already exists');
        }

        for (const [label, value] of [
          ['Appetite percent', appetitePercent],
          ['Occurrence percent', occurancePercent],
          ['Magnitude', magnitude],
          ['Frequency', frequency],
          ['Average qualitative count', averageQualitativeCount],
          ['Average quantitative count', averageQuantitativeCount],
        ]) {
          if (value && Number.isNaN(Number(value))) {
            errors.push(`${label} must be numeric`);
          }
        }

        if (!errors.length) {
          session.seenNames.add(normalizedName);
        }

        return {
          rowNumber,
          status: errors.length ? 'ERROR' : 'VALID',
          message: errors.join('; ') || 'Ready to upload',
          name,
          appetite_percent: appetitePercent,
          occurance_percent: occurancePercent,
          normalized: errors.length
            ? undefined
            : ({
                name,
                appetite_percent: appetitePercent,
                occurance_percent: occurancePercent,
                magnitude,
                frequency,
                average_qualitative_count: averageQualitativeCount,
                average_quantitative_count: averageQuantitativeCount,
              } satisfies CreateBroaderAreaMasterDto),
        };
      },
      upload: (rows) =>
        this.masterBulkUploadApiService.upload('broaderAreas', { rows }).pipe(
          map((result) => ({
            successCount: Number(result?.successCount || 0),
            errors: Array.isArray(result?.errors) ? result.errors : [],
          })),
          catchError((error) =>
            of({
              successCount: 0,
              errors: this.extractBulkErrors(error, 'Unable to bulk upload broader areas'),
            }),
          ),
        ),
    };
  }

  private extractRows(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.rows)) return response.rows;
    return [];
  }

  private normalizeValue(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private parseNamedIds(rawValue: string, options: OptionRecord[], key: 'name'): number[] {
    if (!rawValue.trim()) return [];
    const parts = rawValue
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);

    const ids = parts
      .map((part) =>
        options.find(
          (option) => this.normalizeValue(option[key]) === this.normalizeValue(part),
        )?.id,
      )
      .filter((id): id is number => Number.isFinite(id));

    return [...new Set(ids)];
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    const normalized = this.normalizeValue(value);
    if (!normalized) return defaultValue;
    return ['1', 'true', 'yes', 'y', 'active'].includes(normalized);
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private extractErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.message ||
      error?.message ||
      fallback
    );
  }

  private extractBulkErrors(error: any, fallback: string): string[] {
    if (Array.isArray(error?.error?.errors) && error.error.errors.length) {
      return error.error.errors;
    }

    const message = error?.error?.message;
    if (Array.isArray(message) && message.length) {
      return message;
    }

    return [this.extractErrorMessage(error, fallback)];
  }
}
