import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/branches`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/roles`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class MasterUserService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/users`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class LoanTypeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/loan-types`;

  findAll(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(this.apiUrl);
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class AuditSectionService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-sections`;

  findAll(): Observable<{ data: any[] } | any[]> {
    return this.http.get<{ data: any[] } | any[]>(this.apiUrl);
  }
  create(data: { name: string }) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string | number, data: { name: string }) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  toggleStatus(id: string | number) { return this.http.put<any>(`${this.apiUrl}/${id}/toggle-status`, {}); }
  remove(id: string | number) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
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

  findAll() { return this.http.get<any>(this.apiUrl); }
  findOne(id: string | number) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: CreateAuditUnitDto) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string | number, data: UpdateAuditUnitDto) { return this.http.patch<any>(`${this.apiUrl}/${id}`, data); }
  toggleStatus(id: string | number) { return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {}); }
  updateFrequency(id: string | number, frequency: number) { return this.http.patch<any>(`${this.apiUrl}/${id}/frequency`, { frequency }); }
  remove(id: string | number) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
  getLookups() { return this.http.get<any>(`${this.apiUrl}/lookups`); }
  getFrequencyOptions() { return this.http.get<any>(`${this.apiUrl}/frequency-options`); }
  getByAuditByUnit(auditUnitId: number) { return this.http.get<any>(`${this.apiUrl}/get-target/${auditUnitId}`) }
  getByAuditAndYear(auditUnitId: number, yearId: number) { return this.http.get(`${this.apiUrl}/audit-unit/${auditUnitId}/year/${yearId}`) }
  createTarget(data: any) { return this.http.post(`${this.apiUrl}/create-target`, data) }
  updateTarget(id: number, data: any) { return this.http.patch(`${this.apiUrl}/update-target/${id}`, data) }
  removeTarget(id: number) { return this.http.delete(`${this.apiUrl}/remove-target/${id}`) }
  getYears() { return this.http.get(`${this.apiUrl}/years`) };
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
}

export interface UpdateEmployeeDto extends Partial<CreateEmployeeDto> {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/employees`;

  getEmployees(): Observable<Employee[]> { return this.http.get<Employee[]>(this.apiUrl); }
  getEmployee(id: number): Observable<Employee> { return this.http.get<Employee>(`${this.apiUrl}/${id}`); }
  createEmployee(data: CreateEmployeeDto): Observable<Employee> { return this.http.post<Employee>(this.apiUrl, data); }
  updateEmployee(id: number, data: UpdateEmployeeDto): Observable<Employee> { return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data); }
  deleteEmployee(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/${id}`); }
  toggleStatus(id: number): Observable<Employee> { return this.http.patch<Employee>(`${this.apiUrl}/${id}/status`, {}); }
  setPassword(id: number, password: string): Observable<any> { return this.http.patch(`${this.apiUrl}/${id}/password`, { password }); }
  updateAuthority(id: number, unitIds: number[]): Observable<any> { return this.http.patch(`${this.apiUrl}/${id}/authority`, { unit_ids: unitIds }); }
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
  private apiUrl = `${this.config.apiUrl}/units`;

  getUnits(): Observable<AuditUnit[]> { return this.http.get<AuditUnit[]>(this.apiUrl); }
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

  getPolicy(): Observable<PasswordPolicy> { return this.http.get<PasswordPolicy>(this.apiUrl); }
  updatePolicy(data: PasswordPolicy): Observable<PasswordPolicy> { return this.http.post<PasswordPolicy>(this.apiUrl, data); }
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

  update(
    id: string | number,
    data: UpdateSchemeDto,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      data,
    );
  }

  toggleStatus(id: string | number) {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/status`,
      {},
    );
  }

  remove(id: string | number) {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
    );
  }

  getCategories(schemeTypeId: number) {
    return this.http.get<any>(
      `${this.apiUrl}/categories/${schemeTypeId}`,
    );
  }
}

export interface CreateQuestionSetDto {
  name: string;
  set_type_id: number;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateQuestionSetDto
  extends Partial<CreateQuestionSetDto> {
  id?: number;
}

export interface CreateQuestionHeaderDto {
  question_set_id: number;
  name: string;
  is_active?: number;
  admin_id?: number;
}

export interface UpdateQuestionHeaderDto
  extends Partial<CreateQuestionHeaderDto> {
  id?: number;
}

export interface CreateQuestionDto {
  set_id: number;
  header_id: number;
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

export interface UpdateQuestionDto
  extends Partial<CreateQuestionDto> {
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

  private apiUrl =
    `${this.config.apiUrl}/audit-question-master`;

  // Question Set
  findAllSets() {
    return this.http.get<any>(
      `${this.apiUrl}/sets`,
    );
  }

  findOneSet(id: string | number) {
    return this.http.get<any>(
      `${this.apiUrl}/sets/${id}`,
    );
  }

  createSet(data: CreateQuestionSetDto) {
    return this.http.post<any>(
      `${this.apiUrl}/sets`,
      data,
    );
  }

  updateSet(
    id: string | number,
    data: UpdateQuestionSetDto,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/sets/${id}`,
      data,
    );
  }

  toggleSetStatus(id: string | number) {
    return this.http.patch<any>(
      `${this.apiUrl}/sets/${id}/status`,
      {},
    );
  }

  removeSet(id: string | number) {
    return this.http.delete<any>(
      `${this.apiUrl}/sets/${id}`,
    );
  }

  // Question Header 

  findHeadersBySet(setId: string | number) {
    return this.http.get<any>(
      `${this.apiUrl}/headers/${setId}`,
    );
  }

  findOneHeader(id: string | number) {
    return this.http.get<any>(
      `${this.apiUrl}/header/${id}`,
    );
  }

  createHeader(data: CreateQuestionHeaderDto) {
    return this.http.post<any>(
      `${this.apiUrl}/headers`,
      data,
    );
  }

  updateHeader(
    id: string | number,
    data: UpdateQuestionHeaderDto,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/headers/${id}`,
      data,
    );
  }

  toggleHeaderStatus(id: string | number) {
    return this.http.patch<any>(
      `${this.apiUrl}/headers/${id}/status`,
      {},
    );
  }

  removeHeader(id: string | number) {
    return this.http.delete<any>(
      `${this.apiUrl}/headers/${id}`,
    );
  }

  // Question Master

  findQuestionsByHeader(
    headerId: string | number,
  ) {
    return this.http.get<any>(
      `${this.apiUrl}/questions/${headerId}`,
    );
  }

  findOneQuestion(id: string | number) {
    return this.http.get<any>(
      `${this.apiUrl}/question/${id}`,
    );
  }

  createQuestion(data: CreateQuestionDto) {
    return this.http.post<any>(
      `${this.apiUrl}/questions`,
      data,
    );
  }

  updateQuestion(
    id: string | number,
    data: UpdateQuestionDto,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/questions/${id}`,
      data,
    );
  }

  toggleQuestionStatus(
    id: string | number,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/questions/${id}/status`,
      {},
    );
  }

  removeQuestion(id: string | number) {
    return this.http.delete<any>(
      `${this.apiUrl}/questions/${id}`,
    );
  }

  getQuestionLookups() {
    return this.http.get<any>(
      `${this.apiUrl}/lookups`,
    );
  }

  findQuestionsBySet(
    setId: string | number,
  ) {
    return this.http.get<any>(
      `${this.apiUrl}/questions-set/${setId}`,
    );
  }

  // Question Risk Mapping

  findRiskMappings(
    questionId: string | number,
  ) {
    return this.http.get<any>(
      `${this.apiUrl}/question-risk-mapping/${questionId}`,
    );
  }

  createRiskMapping(
    data: CreateQuestionRiskMappingDto,
  ) {
    return this.http.post<any>(
      `${this.apiUrl}/question-risk-mapping`,
      data,
    );
  }

  removeRiskMapping(
    id: string | number,
  ) {
    return this.http.delete<any>(
      `${this.apiUrl}/question-risk-mapping/${id}`,
    );
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

export interface UpdateCategoryDto
  extends Partial<CreateCategoryDto> { }

@Injectable({
  providedIn: 'root',
})
export class AuditCategoryMasterService {

  private http =
    inject(HttpClient);

  private config =
    inject(APP_CONFIG);

  private apiUrl =
    `${this.config.apiUrl}/audit-category-master`;

  findAll() {
    return this.http.get<any>(
      this.apiUrl,
    );
  }

  findOne(
    id: string | number,
  ) {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
    );
  }

  create(
    data: CreateCategoryDto,
  ) {
    return this.http.post<any>(
      this.apiUrl,
      data,
    );
  }

  update(
    id: string | number,
    data: UpdateCategoryDto,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      data,
    );
  }

  toggleStatus(
    id: string | number,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/status`,
      {},
    );
  }

  remove(
    id: string | number,
  ) {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
    );
  }

  getLookups() {
    return this.http.get<any>(
      `${this.apiUrl}/lookups`,
    );
  }

  // Question Set Mapping

  getQuestionMapping(
    id: string | number,
  ) {
    return this.http.get<any>(
      `${this.apiUrl}/question-mapping/${id}`,
    );
  }

  updateQuestionMapping(

    id: string | number,

    question_set_ids: string,
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/question-mapping/${id}`,
      {
        question_set_ids,
      },
    );
  }
}


