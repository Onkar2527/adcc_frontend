import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/branches`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  create(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/roles`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  create(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class MasterUserService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/users`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  create(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class LoanTypeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/loan-types`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  create(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AuditSectionService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-sections`;

  findAll(): Observable<{ data: any[] } | any[]> {
    return this.http.get<{ data: any[] } | any[]>(this.apiUrl);
  }
  create(data: {
    name: string;
    audit_type_id?: string;
  }) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(
    id: string | number,
    data: {
      name: string;
      audit_type_id?: string;
    },
  ) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  toggleStatus(id: string | number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

export interface AuditTypePayload {
  code: string;
  name: string;
  description?: string | null;
  is_system: number;
  is_active: number;
}

@Injectable({ providedIn: 'root' })
export class AuditTypeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-types`;

  findAll(): Observable<{ data: any[] } | any[]> {
    return this.http.get<{ data: any[] } | any[]>(this.apiUrl);
  }

  create(data: AuditTypePayload) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string | number, data: AuditTypePayload) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: string | number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  getQuestionSetups(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}/question-setups`);
  }

  saveQuestionSetups(
    id: string | number,
    controlMasterIds: number[],
  ) {
    return this.http.put<any>(`${this.apiUrl}/${id}/question-setups`, {
      control_master_ids: controlMasterIds,
    });
  }
}

export interface CreateAuditUnitDto {
  section_type_id: number;
  audit_unit_code: string;
  name: string;
  branch_head_id: number;
  branch_subhead_id?: number | null;
  last_audit_date: string;
  frequency: number;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateAuditUnitDto extends Partial<CreateAuditUnitDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditUnitService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-units`;

  findAll() {
    return this.http.get<any>(this.apiUrl);
  }
  findOne(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  create(data: CreateAuditUnitDto) {
    return this.http.post<any>(this.apiUrl, data);
  }
  update(id: string | number, data: UpdateAuditUnitDto) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }
  toggleStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }
  updateFrequency(id: string | number, frequency: number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/frequency`, { frequency });
  }
  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  getLookups() {
    return this.http.get<any>(`${this.apiUrl}/lookups`);
  }
  getFrequencyOptions() {
    return this.http.get<any>(`${this.apiUrl}/frequency-options`);
  }
  getByAuditByUnit(auditUnitId: number) {
    return this.http.get<any>(`${this.apiUrl}/get-target/${auditUnitId}`);
  }
  getByAuditAndYear(auditUnitId: number, yearId: number) {
    return this.http.get(`${this.apiUrl}/audit-unit/${auditUnitId}/year/${yearId}`);
  }
  createTarget(data: any) {
    return this.http.post(`${this.apiUrl}/create-target`, data);
  }
  updateTarget(id: number, data: any) {
    return this.http.patch(`${this.apiUrl}/update-target/${id}`, data);
  }
  removeTarget(id: number) {
    return this.http.delete(`${this.apiUrl}/remove-target/${id}`);
  }
  getYears() {
    return this.http.get(`${this.apiUrl}/years`);
  }
}

export interface Employee {
  id: number;
  emp_code: string;
  user_type_id: number;
  name: string;
  email: string;
  mobile: string;
  designation?: string;
  gender: string;
  is_active: number;
  audit_unit_authority?: string;
  region_name?: string;
  created_at?: string;
}

export interface CreateEmployeeDto {
  emp_code: string;
  user_type_id: number;
  name: string;
  email: string;
  mobile: string;
  designation?: string;
  gender: string;
  password?: string;
  is_active?: number;
  audit_unit_authority?: string;
  unit_ids?: number[];
  region_name?: string;
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  id?: number;
}

export interface BulkUploadEmployeesDto {
  rows: CreateEmployeeDto[];
}

export interface MasterBulkUploadDto {
  rows: any[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/employees`;

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }
  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }
  createEmployee(data: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, data);
  }
  bulkUploadEmployees(data: BulkUploadEmployeesDto): Observable<{ successCount: number; errors: string[]; data?: Employee[] }> {
    return this.http.post<{ successCount: number; errors: string[]; data?: Employee[] }>(`${this.apiUrl}/bulk-upload`, data);
  }
  updateEmployee(id: number, data: UpdateEmployeeDto): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
  }
  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  toggleStatus(id: number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}/status`, {});
  }
  setPassword(id: number, password: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/password`, { password });
  }
  updateAuthority(id: number, unitIds: number[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/authority`, { unit_ids: unitIds });
  }
}

export interface AuditUnit {
  id: number;
  name: string;
  audit_unit_code: string;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-units`;

  getUnits(): Observable<AuditUnit[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => {
        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.rows)
              ? response.rows
              : [];

        return rows
          .filter((unit: any) => Number(unit?.is_active ?? 1) === 1)
          .map((unit: any) => ({
            id: Number(unit.id),
            name: unit.audit_unit_code ? `${unit.name} (${unit.audit_unit_code})` : unit.name,
            audit_unit_code: unit.audit_unit_code || '',
          }));
      }),
    );
  }
}

export interface PasswordPolicy {
  id?: number;
  min_length: number;
  num_cnt: number;
  uppercase_cnt: number;
  lowercase_cnt: number;
  symbol_cnt: number;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordPolicyService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/password-policy`;

  getPolicy(): Observable<PasswordPolicy> {
    return this.http.get<PasswordPolicy>(this.apiUrl);
  }
  updatePolicy(data: PasswordPolicy): Observable<PasswordPolicy> {
    return this.http.post<PasswordPolicy>(this.apiUrl, data);
  }
}

export interface MenuMaster {
  id: number;
  section_name: string;
  menu_name: string;
  is_active: number;
}

export interface CreateMenuMasterDto {
  section_type_id: number;
  name: string;
  is_active: number;
}

export interface UpdateMenuMasterDto extends Partial<CreateMenuMasterDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class MenuMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/menu-masters`;

  getMenuMasters(): Observable<MenuMaster[]> {
    return this.http.get<MenuMaster[]>(this.apiUrl);
  }
  getMenuMaster(id: number): Observable<MenuMaster> {
    return this.http.get<MenuMaster>(`${this.apiUrl}/${id}`);
  }
  createMenuMaster(data: CreateMenuMasterDto): Observable<MenuMaster> {
    return this.http.post<MenuMaster>(this.apiUrl, data);
  }
  updateMenuMaster(id: number, data: UpdateMenuMasterDto): Observable<MenuMaster> {
    return this.http.patch<MenuMaster>(`${this.apiUrl}/${id}`, data);
  }
  deleteMenuMaster(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  toggleStatus(id: string | number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}

export interface CreateSchemeDto {
  scheme_type_id: number;
  category_id: number;
  scheme_code: string;
  name: string;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateSchemeDto extends Partial<CreateSchemeDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditSchemeMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/audit-schemes`;

  findAll() {
    return this.http.get<any>(this.apiUrl);
  }

  findOne(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateSchemeDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string | number, data: UpdateSchemeDto) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getCategories(schemeTypeId: number) {
    return this.http.get<any>(`${this.apiUrl}/categories/${schemeTypeId}`);
  }
}

export interface CreateQuestionSetDto {
  name: string;
  set_type_id: number;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateQuestionSetDto extends Partial<CreateQuestionSetDto> {
  id?: number;
}

export interface CreateQuestionHeaderDto {
  question_set_id: number;
  name: string;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateQuestionHeaderDto extends Partial<CreateQuestionHeaderDto> {
  id?: number;
}

export interface CreateQuestionDto {
  set_id: number;
  header_id: number;
  annexure_id: number;
  subset_multi_id: string;
  question: string;
  question_type_id: number;
  option_id: number;
  applicable_id: number;
  area_of_audit_id: number;
  control_risk_id: number;
  key_aspect_id: number;
  residual_risk_id: number;
  show_instances: number;
  audit_ev_upload: number;
  compliance_ev_upload: number;
  risk_category_id: number;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {
  id?: number;
}

export interface CreateQuestionRiskMappingDto {
  question_id: number;
  risk_type: string;
  business_risk: string;
  control_risk: string;
  admin_id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditQuestionMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/audit-question-master`;

  // Question Set
  findAllSets() {
    return this.http.get<any>(`${this.apiUrl}/sets`);
  }

  findOneSet(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/sets/${id}`);
  }

  createSet(data: CreateQuestionSetDto) {
    return this.http.post<any>(`${this.apiUrl}/sets`, data);
  }

  updateSet(id: string | number, data: UpdateQuestionSetDto) {
    return this.http.patch<any>(`${this.apiUrl}/sets/${id}`, data);
  }

  toggleSetStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/sets/${id}/status`, {});
  }

  removeSet(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/sets/${id}`);
  }

  // Question Header

  findHeadersBySet(setId: string | number) {
    return this.http.get<any>(`${this.apiUrl}/headers/${setId}`);
  }

  findOneHeader(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/header/${id}`);
  }

  createHeader(data: CreateQuestionHeaderDto) {
    return this.http.post<any>(`${this.apiUrl}/headers`, data);
  }

  updateHeader(id: string | number, data: UpdateQuestionHeaderDto) {
    return this.http.patch<any>(`${this.apiUrl}/headers/${id}`, data);
  }

  toggleHeaderStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/headers/${id}/status`, {});
  }

  removeHeader(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/headers/${id}`);
  }

  // Question Master

  findQuestionsByHeader(headerId: string | number) {
    return this.http.get<any>(`${this.apiUrl}/questions/${headerId}`);
  }

  findOneQuestion(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/question/${id}`);
  }

  createQuestion(data: CreateQuestionDto) {
    return this.http.post<any>(`${this.apiUrl}/questions`, data);
  }

  updateQuestion(id: string | number, data: UpdateQuestionDto) {
    return this.http.patch<any>(`${this.apiUrl}/questions/${id}`, data);
  }

  toggleQuestionStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/questions/${id}/status`, {});
  }

  removeQuestion(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/questions/${id}`);
  }

  getQuestionLookups() {
    return this.http.get<any>(`${this.apiUrl}/lookups`);
  }

  findQuestionsBySet(setId: string | number) {
    return this.http.get<any>(`${this.apiUrl}/questions-set/${setId}`);
  }

  // Question Risk Mapping

  findRiskMappings(questionId: string | number) {
    return this.http.get<any>(`${this.apiUrl}/question-risk-mapping/${questionId}`);
  }

  createRiskMapping(data: CreateQuestionRiskMappingDto) {
    return this.http.post<any>(`${this.apiUrl}/question-risk-mapping`, data);
  }

  removeRiskMapping(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/question-risk-mapping/${id}`);
  }
}
export interface CreateCategoryDto {
  menu_id: number;

  name: string;

  question_set_ids?: string;

  is_cc_acc_category?: number;

  is_active?: number;

  admin_id?: number;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

@Injectable({
  providedIn: 'root',
})
export class AuditCategoryMasterService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/audit-category-master`;

  findAll() {
    return this.http.get<any>(this.apiUrl);
  }

  findOne(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateCategoryDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string | number, data: UpdateCategoryDto) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getLookups() {
    return this.http.get<any>(`${this.apiUrl}/lookups`);
  }

  // Question Set Mapping

  getQuestionMapping(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/question-mapping/${id}`);
  }

  updateQuestionMapping(
    id: string | number,

    question_set_ids: string,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/question-mapping/${id}`, {
      question_set_ids,
    });
  }
}

export interface CreateAnnexureDto {
  name: string;
  risk_defination_id: number;
  risk_category_id: number;
  business_risk: number;
  control_risk: number;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateAnnexureDto extends Partial<CreateAnnexureDto> {
  id?: number;
}

export interface CreateAnnexureColumnDto {
  annexure_id: number;
  name: string;
  column_type_id: number;
  options?: string[];
  admin_id?: number;
}

export interface UpdateAnnexureColumnDto extends Partial<CreateAnnexureColumnDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditAnnexureMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/audit-annexure-master`;

  // Annexure

  findAll() {
    return this.http.get<any>(this.apiUrl);
  }

  findOne(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateAnnexureDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: string | number, data: UpdateAnnexureDto) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getLookups() {
    return this.http.get<any>(`${this.apiUrl}/lookups`);
  }

  // Annexure Columns

  getColumns(annexureId: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${annexureId}/columns`);
  }

  createColumn(data: CreateAnnexureColumnDto) {
    return this.http.post<any>(`${this.apiUrl}/columns`, data);
  }

  updateColumn(id: string | number, data: UpdateAnnexureColumnDto) {
    return this.http.put<any>(`${this.apiUrl}/columns/${id}`, data);
  }

  deleteColumn(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/columns/${id}`);
  }
}

// Risk Masters - Risk Category

export interface CreateRiskCategoryDto {
  risk_category: string;

  is_active?: number;

  admin_id?: number;
}

export interface UpdateRiskCategoryDto extends Partial<CreateRiskCategoryDto> {
  id?: number;
}

export interface CreateRiskCategoryWeightDto {
  risk_category_id: number;

  year_id: number;

  risk_weight: number;

  risk_appetite_percent: number;

  is_active?: number;

  admin_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RiskCategoryMasterService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/risk-categories`;

  findAll() {
    return this.http.get<any>(this.apiUrl);
  }

  findOne(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateRiskCategoryDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(
    id: string | number,

    data: UpdateRiskCategoryDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Risk Category Weights

  findAllWeights(riskCategoryId: number) {
    return this.http.get<any>(`${this.apiUrl}/${riskCategoryId}/weights`);
  }

  createWeight(data: CreateRiskCategoryWeightDto) {
    return this.http.post<any>(`${this.apiUrl}/weights`, data);
  }

  updateWeight(
    id: string | number,

    data: CreateRiskCategoryWeightDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/weights/${id}`, data);
  }

  removeWeight(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/weights/${id}`);
  }

  getYears() {
    return this.http.get<any>(`${this.apiUrl}/lookups/years`);
  }
}

// Risk Control

export interface CreateRiskControlDto {
  name: string;

  is_active?: number;

  admin_id?: number;
}

export interface CreateRiskControlKeyAspectDto {
  risk_control_id: number;

  name: string;

  is_active?: number;

  admin_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RiskControlMasterService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/risk-controls`;

  findAllRiskControls() {
    return this.http.get<any>(this.apiUrl);
  }

  findOneRiskControl(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createRiskControl(data: CreateRiskControlDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateRiskControl(
    id: string | number,

    data: CreateRiskControlDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleRiskControlStatus(id: string | number) {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  removeRiskControl(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // KEY ASPECT

  findAllKeyAspects(riskControlId: number) {
    return this.http.get<any>(`${this.apiUrl}/${riskControlId}/key-aspects`);
  }

  createKeyAspect(data: CreateRiskControlKeyAspectDto) {
    return this.http.post<any>(`${this.apiUrl}/key-aspects`, data);
  }

  updateKeyAspect(
    id: string | number,

    data: CreateRiskControlKeyAspectDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/key-aspects/${id}`, data);
  }

  removeKeyAspect(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/key-aspects/${id}`);
  }
}

// Risk Composite

export interface CreateRiskCompositeDto {
  business_risk: number;

  control_risk: number;

  name: string;

  admin_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class RiskCompositeMasterService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/risk-composites`;

  findAllRiskComposites() {
    return this.http.get<any>(this.apiUrl);
  }

  findOneRiskComposite(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createRiskComposite(data: CreateRiskCompositeDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateRiskComposite(
    id: string | number,

    data: CreateRiskCompositeDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  removeRiskComposite(id: string | number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

// Risk Matrix

export interface RiskMatrixRow {
  risk_parameter: number;

  business_risk_app: number;

  business_risk_score: number;

  control_risk_app: number;

  control_risk_score: number;

  residual_risk_app: number;
}

export interface CreateRiskMatrixDto {
  rows: RiskMatrixRow[];
}

@Injectable({
  providedIn: 'root',
})
export class RiskMatrixService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/risk-matrix`;

  findRiskMatrixByYear(yearId: number) {
    return this.http.get<any>(`${this.apiUrl}/${yearId}`);
  }

  saveRiskMatrix(
    yearId: number,

    data: CreateRiskMatrixDto,
  ) {
    return this.http.post<any>(`${this.apiUrl}/${yearId}`, data);
  }
}

// Branch Rating

export interface CreateBranchRatingDto {
  year_id: number;

  audit_unit_id: number;

  audit_type_id: number;

  high_range_from: string;

  high_range_to: string;

  medium_range_from: string;

  medium_range_to: string;

  low_range_from: string;

  low_range_to: string;

  admin_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BranchRatingService {
  private http = inject(HttpClient);

  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/branch-rating`;

  findBranchRatingsByYear(yearId: number) {
    return this.http.get<any>(`${this.apiUrl}/year/${yearId}`);
  }

  findOneBranchRating(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createBranchRating(data: CreateBranchRatingDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateBranchRating(
    id: number,

    data: CreateBranchRatingDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  removeBranchRating(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
export interface BroaderAreaMaster {
  id: number;
  name: string;
  appetite_percent: string;
  occurance_percent: string;
  magnitude: string;
  frequency: string;
  average_qualitative_count: string;
  average_quantitative_count: string;
}

export interface CreateBroaderAreaMasterDto {
  name: string;
  appetite_percent: string;
  occurance_percent: string;
  magnitude: string;
  frequency: string;
  average_qualitative_count: string;
  average_quantitative_count: string;
}

export interface UpdateBroaderAreaMasterDto extends Partial<CreateBroaderAreaMasterDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class BroaderAreaMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/broader-area-masters`;

  getBroaderAreas(): Observable<BroaderAreaMaster[]> {
    return this.http.get<BroaderAreaMaster[]>(this.apiUrl);
  }
  getBroaderArea(id: number): Observable<BroaderAreaMaster> {
    return this.http.get<BroaderAreaMaster>(`${this.apiUrl}/${id}`);
  }
  createBroaderArea(data: CreateBroaderAreaMasterDto): Observable<BroaderAreaMaster> {
    return this.http.post<BroaderAreaMaster>(this.apiUrl, data);
  }
  updateBroaderArea(id: number, data: UpdateBroaderAreaMasterDto): Observable<BroaderAreaMaster> {
    return this.http.put<BroaderAreaMaster>(`${this.apiUrl}/${id}`, data);
  }
  deleteBroaderArea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
export interface ManageAssessmentMaster {
  id: number;
  audit_unit_id: number;
  audit_unit_code: number;
  name: string;
  assesment_period_from: Date;
  assesment_period_to: Date;
  audit_status_id: number;
  audit_start_date: Date;
  audit_end_date: Date;
  audit_due_date: Date;
  compliance_start_date: Date;
  compliance_end_date: Date;
  compliance_due_date: Date;
  compliance_review_reject_limit: number;
  is_limit_blocked: number;
}

export interface UpdateManageAssessmentMasterDto extends Partial<ManageAssessmentMaster> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class ManageAssessmentMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/manage-assessment-masters
`;

  getManageAssessmentMaster(
    assesment_period_from: string,
    assesment_period_to: string,
    audit_unit_id: number,
  ): Observable<ManageAssessmentMaster[]> {
    return this.http.get<ManageAssessmentMaster[]>(
      `${this.apiUrl}?assesment_period_from=${assesment_period_from}&assesment_period_to=${assesment_period_to}&audit_unit_id=${audit_unit_id}`,
    );
  }
  updateManageAssessmentMaster(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  getEligibleAuditors(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiUrl}/manage-assessment-masters/${id}/eligible-auditors`);
  }

  getQuestionAssignments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiUrl}/manage-assessment-masters/${id}/question-assignments`);
  }

  getAssessmentQuestions(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiUrl}/manage-assessment-masters/${id}/questions`);
  }

  assignQuestions(id: number, assignments: any[]): Observable<any> {
    return this.http.post<any>(`${this.config.apiUrl}/manage-assessment-masters/${id}/assign-questions`, { assignments });
  }
}
export interface PeriodwiseQuestionsMaster {
  id: number;

  year_id: number;
  section_type_id: number;
  user_type_id: number;
  audit_unit_id: number;

  start_month_year: string;
  end_month_year: string;

  menu_ids: string;
  cat_ids: string;
  header_ids: string;
  question_ids: string;

  advances_scheme_ids: string;
  deposits_scheme_ids: string;

  admin_id: number;

  created_at?: string;
  updated_at?: string;
}

export interface CreatePeriodwiseQuestionsMasterDto {
  audit_type_ids: number[];
  year_id: number;
  section_type_id: number;
  user_type_id: number;
  audit_unit_id: number;

  start_month_year: string;
  end_month_year: string;

  menu_ids?: string;
  cat_ids?: string;
  header_ids?: string;
  question_ids?: string;

  advances_scheme_ids?: string;
  deposits_scheme_ids?: string;

  admin_id?: number;
}

export interface UpdatePeriodwiseQuestionsMasterDto extends Partial<CreatePeriodwiseQuestionsMasterDto> {
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PeriodwiseQuestionsMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/periodwise-questions-masters`;

  getAll(): Observable<PeriodwiseQuestionsMaster[]> {
    return this.http.get<PeriodwiseQuestionsMaster[]>(this.apiUrl);
  }

  getQuestionData(id: number): Observable<PeriodwiseQuestionsMaster> {
    return this.http.get<PeriodwiseQuestionsMaster>(`${this.apiUrl}/${id}`);
  }
  getById(id: number): Observable<PeriodwiseQuestionsMaster> {
    return this.http.get<PeriodwiseQuestionsMaster>(`${this.apiUrl}/${id}`);
  }

  create(data: CreatePeriodwiseQuestionsMasterDto): Observable<PeriodwiseQuestionsMaster> {
    return this.http.post<PeriodwiseQuestionsMaster>(this.apiUrl, data);
  }

  update(
    id: number,
    data: UpdatePeriodwiseQuestionsMasterDto,
  ): Observable<PeriodwiseQuestionsMaster> {
    return this.http.put<PeriodwiseQuestionsMaster>(`${this.apiUrl}/${id}`, data);
  }
  updateAdvancesSchemes(
    id: number,
    advances_scheme_ids: string,
  ): Observable<PeriodwiseQuestionsMaster> {
    return this.http.put<PeriodwiseQuestionsMaster>(`${this.apiUrl}/advances-schemes/${id}`, {
      advances_scheme_ids,
    });
  }
  updateDepositsSchemes(
    id: number,
    deposits_scheme_ids: string,
  ): Observable<PeriodwiseQuestionsMaster> {
    return this.http.put<PeriodwiseQuestionsMaster>(`${this.apiUrl}/deposit-schemes/${id}`, {
      deposits_scheme_ids,
    });
  }
  updateMenus(id: number, menu_ids: string): Observable<PeriodwiseQuestionsMaster> {
    return this.http.put<PeriodwiseQuestionsMaster>(`${this.apiUrl}/menu/${id}`, { menu_ids });
  }
  updateCategories(id: number, cat_ids: string): Observable<PeriodwiseQuestionsMaster> {
    return this.http.put<PeriodwiseQuestionsMaster>(`${this.apiUrl}/category/${id}`, { cat_ids });
  }
  updateQuestionHeaders(
    id: number,

    header_ids: string,

    question_ids: string,
  ) {
    return this.http.put(
      `${this.apiUrl}/question-and-headers/${id}`,

      {
        header_ids,
        question_ids,
      },
    );
  }

  updateMultipleAuditors(
    id: number,
    is_multiple_auditors: boolean,
  ): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/multiple-auditors/${id}`, { is_multiple_auditors });
  }

  getEligibleAuditors(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/eligible-auditors`);
  }

  getCategoryAssignments(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/category-assignments`);
  }

  assignCategories(
    id: number,
    assignments: { category_id: number; audit_emp_id: number }[],
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/assign-categories`, { assignments });
  }

  syncAllBranches(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/sync-all-branches`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

// Manage Accounts Data

export interface DepositAccountFilters {
  search?: string;

  search_type?: string;

  branch_id?: number;

  scheme_id?: number;

  period_from?: string;

  period_to?: string;

  page?: number;

  limit?: number;
}

export interface CreateDepositAccountDto {
  branch_id: number;

  scheme_id: number;

  account_no: string;

  account_holder_name: string;

  ucic: string;

  customer_type: string;

  intrest_rate: string;

  principal_amount: string;

  account_opening_date?: string;

  balance: string;

  balance_date?: string;

  maturity_date?: string;

  maturity_amount: string;

  upload_date: string;

  upload_period_from: string;

  upload_period_to: string;

  close_date?: string;

  account_status: string;

  sampling_filter?: number;

  assesment_period_id: number;

  admin_id?: number;

  kyc?: string;
}

export interface AdvancesAccountFilters {
  search?: string;

  search_type?: string;

  branch_id?: number;

  scheme_id?: number;

  period_from?: string;

  period_to?: string;

  page?: number;

  limit?: number;
}

export interface CreateAdvanceAccountDto {
  branch_id: number;

  scheme_id: number;

  account_no: string;

  account_holder_name: string;

  ucic: string;

  customer_type: string;

  intrest_rate: string;

  // principal_amount: string;

  account_opening_date?: string;

  // balance: string;

  balance_date?: string;

  // maturity_date?: string;

  // maturity_amount: string;

  upload_date: string;

  upload_period_from: string;

  upload_period_to: string;

  // close_date?: string;

  renewal_date?: string;

  npa_status?: string;

  sanction_amount?: string;

  outstanding_balance?: string;

  due_date?: string;

  account_status: string;

  sampling_filter?: number;

  assesment_period_id: number;

  admin_id?: number;

  npa_classification?: string;

  kyc?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ManageAccountsDataService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);

  private apiUrl = `${this.config.apiUrl}/deposit-accounts`;
  private apiUrl1 = `${this.config.apiUrl}/advance-accounts`;

  findAllDepositAccounts(filters?: DepositAccountFilters) {
    return this.http.get<any>(this.apiUrl, {
      params: filters as any,
    });
  }

  findOneDepositAccount(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createDepositAccount(data: CreateDepositAccountDto) {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateDepositAccount(
    id: number,

    data: CreateDepositAccountDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  removeDepositAccount(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getUploadDumps() {
    return this.http.get<any[]>(`${this.apiUrl}/upload-dumps`);
  }

  private formatUploadDate(value: any) {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      const year = value.getFullYear();

      const month = String(value.getMonth() + 1).padStart(2, '0');

      const day = String(value.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    return String(value);
  }

  validateDepositCsv(file: File, payload: any) {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('upload_date', this.formatUploadDate(payload.upload_date));

    formData.append('period_from', this.formatUploadDate(payload.period_from));

    formData.append('period_to', this.formatUploadDate(payload.period_to));

    const params = {
      upload_date: this.formatUploadDate(payload.upload_date),
      period_from: this.formatUploadDate(payload.period_from),
      period_to: this.formatUploadDate(payload.period_to),
    };

    return this.http.post<any>(
      `${this.apiUrl}/validate-upload`,

      formData,
      {
        params,
      },
    );
  }

  addDepositDump(uploadKey: string) {
    return this.http.post<any>(
      `${this.apiUrl}/add-dump`,

      {
        uploadKey,
      },
    );
  }

  // Advance Dump

  findAllAdvanceAccounts(filters?: AdvancesAccountFilters) {
    return this.http.get<any>(this.apiUrl1, {
      params: filters as any,
    });
  }

  findOneAdvanceAccount(id: number) {
    return this.http.get<any>(`${this.apiUrl1}/${id}`);
  }

  createAdvanceAccount(data: CreateAdvanceAccountDto) {
    return this.http.post<any>(this.apiUrl1, data);
  }

  updateAdvanceAccount(
    id: number,

    data: CreateAdvanceAccountDto,
  ) {
    return this.http.patch<any>(`${this.apiUrl1}/${id}`, data);
  }

  removeAdvanceAccount(id: number) {
    return this.http.delete<any>(`${this.apiUrl1}/${id}`);
  }

  getUploadDumpsAdvance() {
    return this.http.get<any[]>(`${this.apiUrl1}/upload-dumps`);
  }

  validateAdvanceCsv(file: File, payload: any) {
    const formData = new FormData();

    formData.append('file', file);

    formData.append('upload_date', this.formatUploadDate(payload.upload_date));

    formData.append('period_from', this.formatUploadDate(payload.period_from));

    formData.append('period_to', this.formatUploadDate(payload.period_to));

    const params = {
      upload_date: this.formatUploadDate(payload.upload_date),
      period_from: this.formatUploadDate(payload.period_from),
      period_to: this.formatUploadDate(payload.period_to),
    };

    return this.http.post<any>(
      `${this.apiUrl1}/validate-upload`,

      formData,
      {
        params,
      },
    );
  }

  addAdvanceDump(uploadKey: string) {
    return this.http.post<any>(
      `${this.apiUrl1}/add-dump`,

      {
        uploadKey,
      },
    );
  }

  // Advance Dump
}

@Injectable({ providedIn: 'root' })
export class PolicyDocumentsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/policy-documents`;

  findAll(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res: any) => {
        const data = res.data || res;
        return Array.isArray(data) ? data : [];
      }),
    );
  }

  findOne(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res: any) => res.data || res));
  }

  create(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  update(id: number | string, formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, formData);
  }

  toggleStatus(id: number | string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getNextCode(): Observable<{ success: boolean; code: string }> {
    return this.http.get<{ success: boolean; code: string }>(`${this.apiUrl}/next-code`);
  }

  getViewUrl(id: number | string): string {
    return `${this.apiUrl}/${id}/view`;
  }
}

@Injectable({ providedIn: 'root' })
export class AuditCalendarService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-calendar`;

  findAll(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((res: any) => {
        const data = res.data || res;
        return Array.isArray(data) ? data : [];
      }),
    );
  }

  findOne(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((res: any) => res.data || res));
  }

  getLookups(): Observable<{ units: any[]; schemes: any[]; auditors: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/lookups`).pipe(map((res: any) => res.data || res));
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: number | string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: number | string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getSchedulingData(
    userId?: number | string,
    userTypeId?: number | string,
    auditUnitAuthority?: string,
  ): Observable<any> {
    let params: any = {};
    if (userId !== undefined) {
      params['userId'] = String(userId);
    }
    if (userTypeId !== undefined) {
      params['userTypeId'] = String(userTypeId);
    }
    if (auditUnitAuthority !== undefined) {
      params['auditUnitAuthority'] = String(auditUnitAuthority);
    }
    return this.http.get<any>(`${this.apiUrl}/scheduling`, { params });
  }

  setFrequencies(frequencies: Record<string, number>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/set-frequencies`, { frequencies });
  }

  getRiskFrequencies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/risk-frequencies`);
  }

  updateRiskFrequencies(
    frequencies: { risk_type_id: number; frequency: number }[],
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/risk-frequencies`, { frequencies });
  }
}

export interface Region {
  id: number;
  region_name: string;
  audit_unit_ids: string;
  unit_ids: number[];
  units: { id: number; name: string; audit_unit_code: string }[];
  is_active: number;
  admin_id?: number;
  created_at?: string;
}

export interface CreateRegionDto {
  region_name: string;
  unit_ids: number[];
  is_active?: number;
  admin_id?: number;
}

export interface UpdateRegionDto extends Partial<CreateRegionDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class RegionMasterService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/regions`;

  findAll(): Observable<Region[]> {
    return this.http.get<Region[]>(this.apiUrl);
  }

  findUniqueNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/names`);
  }

  findOne(id: number | string): Observable<Region> {
    return this.http.get<Region>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateRegionDto): Observable<Region> {
    return this.http.post<Region>(this.apiUrl, data);
  }

  update(id: number | string, data: UpdateRegionDto): Observable<Region> {
    return this.http.patch<Region>(`${this.apiUrl}/${id}`, data);
  }

  toggleStatus(id: number | string): Observable<Region> {
    return this.http.patch<Region>(`${this.apiUrl}/${id}/status`, {});
  }

  remove(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class MasterBulkUploadApiService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/master-bulk-upload`;

  upload(masterKey: string, data: MasterBulkUploadDto): Observable<{ successCount: number; errors: string[]; data?: any[] }> {
    return this.http.post<{ successCount: number; errors: string[]; data?: any[] }>(`${this.apiUrl}/${masterKey}`, data);
  }
}

export interface SpecialAuditPayload {
  audit_type_id: number;
  title: string;
  year_id: number;
  audit_unit_id: number;
  control_master_id: number;
  auditor_id: number;
  assesment_period_from: string;
  assesment_period_to: string;
  audit_due_date?: string;
}

@Injectable({ providedIn: 'root' })
export class SpecialAuditService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/special-audit`;

  findAll() {
    return this.http.get<any>(this.apiUrl).pipe(map((res: any) => res.data || res));
  }

  lookups() {
    return this.http.get<any>(`${this.apiUrl}/lookups`).pipe(map((res: any) => res.data || res));
  }

  create(data: SpecialAuditPayload) {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: number | string, data: SpecialAuditPayload) {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }
}
