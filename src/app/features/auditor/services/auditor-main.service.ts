import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';
import { FREE_AUDIT_FLOW } from '../../admin/services/required-data';
import { audit_flow_config } from '../../admin/services/required-data';

@Injectable({ providedIn: 'root' })
export class AuditDashboardService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/audit-dashboard`;


  findAll(payload: any) {

    return this.http.post(

      `${this.apiUrl}`,

      payload,
    );
  }

  getHomeStats(employeeId: number, auditUnitId?: number, assesPeriodId?: string) {
    const params: any = { employee_id: employeeId };
    if (auditUnitId) params.audit_unit_id = auditUnitId;
    if (assesPeriodId) params.asses_period = assesPeriodId;
    return this.http.get<any>(`${this.apiUrl}/home-stats`, { params });
  }

  getAdminDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin`);
  }

  getUnitDashboardDetails(auditUnitId: number, employeeId: number, userTypeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unit-details/${auditUnitId}`, {
      params: { employeeId: String(employeeId), userTypeId: String(userTypeId) }
    });
  }

  getUnitChartsData(auditUnitId: number, assessmentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unit-charts/${auditUnitId}`, {
      params: { assessmentId }
    });
  }

  getManagementDashboardData(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/management`, {
      params: { employeeId: String(employeeId) }
    });
  }

  getBranchDaysTakenData(auditUnitId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/days-taken/${auditUnitId}`);
  }
  // service.ts (frontend)

  getExecutiveSummary(
    assessment_id: number,
    employeeId: number,
  ) {

    return this.http.get(
      `${this.apiUrl}/executive-summary/${assessment_id}`,
      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );

  }
  saveExecutiveSummary(
    payload: any,
  ) {

    return this.http.post(
      `${this.apiUrl}/save-executive-summary`,
      payload,
    );

  }
  saveExecutiveSummaryBasic(
    payload: any,
  ) {

    return this.http.post(
      `${this.apiUrl}/save-executive-summary-basic`,
      payload,
    );

  }
  saveExecutiveSummaryFinancials(
    payload: any,
  ) {

    return this.http.post(
      `${this.apiUrl}/save-executive-summary-financials`,
      payload,
    );

  }
  saveExecutiveSummaryReview(
    payload: any,
  ) {

    return this.http.post(
      `${this.apiUrl}/save-executive-summary-review`,
      payload,
    );

  }
  getBranchFinancialPosition(
    branch_id: number,
    assessmentId?: number,
  ) {
    const params: any = {};
    if (assessmentId) {
      params.assessment_id = String(assessmentId);
    }
    return this.http.get(
      `${this.apiUrl}/branch-financial-position/${branch_id}`,
      { params },
    );

  }

  openAssessment(payload: any) {

    return this.http.post(

      `${this.apiUrl}/open-assessment`,

      payload,
    );
  }

  getSpecialAudits(
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/special-audit`,

      {
        params: {
          employee_id:
            employeeId,
        },
      },
    );
  }

  getInternalAuditMenu(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/menu`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  private getLanguageId(): string | undefined {
    const lang = localStorage.getItem('selected_lang') || 'en';
    if (lang === 'mr') return '2';
    if (lang === 'en') return '1';
    return undefined;
  }

  getInternalAuditCategory(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    dumpId = 0,
  ) {
    const params: any = {
      employee_id: employeeId,
      dump_id: dumpId,
    };
    const langId = this.getLanguageId();
    if (langId) {
      params.language_id = langId;
    }

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}`,

      {
        params
      },
    );
  }

  getInternalAuditSubmissionPreview(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/submission-preview`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  submitInternalAudit(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/submit`,

      {
        employee_id:
          employeeId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  getReviewerPending(
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/pending`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  getReviewerAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/${assessmentId}`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  getReviewerComplianceAssessment(
    assessmentId: number,
    employeeId: number,
    liveManagerCompliance = false,
  ) {
    return this.http.get<any>(
      `${this.config.apiUrl}/internal-audit/reviewer/compliance/${assessmentId}`,
      {
        params: {
          employee_id: String(employeeId),
          live_manager_compliance: liveManagerCompliance ? 'true' : 'false',
        },
      },
    );
  }

  saveReviewerAction(
    assessmentId: number,
    targetType: 'answer' | 'annexure',
    observationId: number,
    employeeId: number,
    action: number,
    comment: string,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/${assessmentId}/observation/${targetType}/${observationId}/action`,

      {
        employee_id:
          employeeId,
        action,
        comment,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  saveReviewerComplianceAction(
    assessmentId: number,
    targetType: 'answer' | 'annexure',
    observationId: number,
    employeeId: number,
    action: number,
    comment: string,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/compliance/${assessmentId}/observation/${targetType}/${observationId}/action`,

      {
        employee_id:
          employeeId,
        action,
        comment,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  viewReviewerEvidence(
    assessmentId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/reviewer/${assessmentId}/evidence/${evidenceId}/view`,

      {
        params: {
          employee_id:
            employeeId,
        },
        responseType:
          'blob',
      },
    );
  }

  viewReviewerComplianceEvidence(
    assessmentId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/reviewer/compliance/${assessmentId}/evidence/${evidenceId}/view`,

      {
        params: {
          employee_id:
            employeeId,
        },
        responseType:
          'blob',
      },
    );
  }

  submitReviewerAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/${assessmentId}/submit`,

      {
        employee_id:
          employeeId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  submitReviewerComplianceAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/compliance/${assessmentId}/submit`,

      {
        employee_id:
          employeeId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  getCompliancePending(
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/compliance/pending`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  getComplianceAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  saveComplianceResponse(
    assessmentId: number,
    targetType: 'answer' | 'annexure',
    observationId: number,
    employeeId: number,
    response: string,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/observation/${targetType}/${observationId}/response`,

      {
        employee_id:
          employeeId,
        response,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  saveAuditorLiveComplianceAction(
    assessmentId: number,
    targetType: 'answer' | 'annexure',
    observationId: number,
    employeeId: number,
    action: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/live-compliance/observation/${targetType}/${observationId}/action`,

      {
        employee_id:
          employeeId,
        action,
      },
    );
  }

  getComplianceSubmissionPreview(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/submission-preview`,

      {
        params: {
          employee_id:
            employeeId,
          live_manager_compliance:
            audit_flow_config.liveManagerCompliance,
        },
      },
    );
  }

  viewComplianceEvidence(
    assessmentId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/evidence/${evidenceId}/view`,

      {
        params: {
          employee_id:
            employeeId,
        },
        responseType:
          'blob',
      },
    );
  }

  viewComplianceUploadedEvidence(
    assessmentId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/compliance-evidence/${evidenceId}/view`,

      {
        params: {
          employee_id:
            employeeId,
        },
        responseType:
          'blob',
      },
    );
  }

  uploadComplianceEvidence(
    assessmentId: number,
    targetType: 'answer' | 'annexure',
    observationId: number,
    employeeId: number,
    file: File,
  ) {

    const formData =
      new FormData();

    formData.append(
      'employee_id',
      String(employeeId),
    );

    formData.append(
      'file',
      file,
    );

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/observation/${targetType}/${observationId}/evidence/upload`,

      formData,
    );
  }

  deleteComplianceEvidence(
    assessmentId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/evidence/${evidenceId}/delete`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  submitComplianceAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/submit`,

      {
        employee_id:
          employeeId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  getInternalAuditRemarks(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/remarks`,

      {
        params: {
          employee_id:
            employeeId,
        },
      },
    );
  }

  saveInternalAuditRemark(
    assessmentId: number,
    employeeId: number,
    payload: any,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/remarks`,

      {
        ...payload,
        employee_id:
          employeeId,
      },
    );
  }

  markInternalAuditRemarkRead(
    assessmentId: number,
    remarkId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/remarks/${remarkId}/read`,

      {
        employee_id:
          employeeId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
      },
    );
  }

  deleteInternalAuditRemark(
    assessmentId: number,
    remarkId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/remarks/${remarkId}/delete`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  saveInternalAuditCategoryAnswers(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    answers: any[],
    dumpId = 0,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/answers`,

      {
        employee_id:
          employeeId,
        dump_id:
          dumpId,
        live_manager_compliance:
          audit_flow_config.liveManagerCompliance,
        answers,
      },
    );
  }

  saveInternalAuditAnnexureRow(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    employeeId: number,
    payload: any,
    dumpId = 0,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure`,

      {
        ...payload,
        employee_id:
          employeeId,
        dump_id:
          dumpId,
      },
    );
  }

  deleteInternalAuditAnnexureRow(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    annexureRowId: number,
    employeeId: number,
    dumpId = 0,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure/${annexureRowId}/delete`,

      {
        employee_id:
          employeeId,
        dump_id:
          dumpId,
      },
    );
  }

  getInternalAuditAnnexureSample(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    employeeId: number,
    dumpId = 0,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure/sample`,

      {
        params: {
          employee_id:
            employeeId,
          dump_id:
            dumpId,
        },
      },
    );
  }

  uploadInternalAuditAnnexureCsv(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    employeeId: number,
    file: File,
    dumpId = 0,
  ) {

    const formData =
      new FormData();

    formData.append(
      'employee_id',
      String(employeeId),
    );

    formData.append(
      'file',
      file,
    );
    formData.append(
      'dump_id',
      String(dumpId),
    );

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure/upload`,

      formData,
    );
  }

  uploadInternalAuditEvidence(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    annexureRowId: number,
    employeeId: number,
    file: File,
    dumpId = 0,
  ) {

    const formData =
      new FormData();

    formData.append(
      'employee_id',
      String(employeeId),
    );
    formData.append(
      'file',
      file,
    );
    formData.append(
      'dump_id',
      String(dumpId),
    );

    const targetPath =
      annexureRowId
        ? `/annexure/${annexureRowId}/evidence/upload`
        : '/evidence/upload';

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}${targetPath}`,

      formData,
    );
  }

  viewInternalAuditEvidence(
    assessmentId: number,
    categoryId: number,
    evidenceId: number,
    employeeId: number,
    dumpId = 0,
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/evidence/${evidenceId}/view`,

      {
        params: {
          employee_id:
            employeeId,
          dump_id:
            dumpId,
        },
        responseType:
          'blob',
      },
    );
  }

  deleteInternalAuditEvidence(
    assessmentId: number,
    categoryId: number,
    evidenceId: number,
    employeeId: number,
    dumpId = 0,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/evidence/${evidenceId}/delete`,

      {
        employee_id:
          employeeId,
        dump_id:
          dumpId,
      },
    );
  }

  completeInternalAuditAccount(
    assessmentId: number,
    categoryId: number,
    dumpId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/account/${dumpId}/complete`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  completeInternalAuditRemainingAccounts(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/accounts/complete-remaining`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  getInternalAuditCarryForwardPoints(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/carry-forward`,

      {
        params: {
          employee_id:
            employeeId,
        },
      },
    );
  }

  saveInternalAuditCarryForwardComment(
    assessmentId: number,
    annexureId: number,
    employeeId: number,
    comment: string,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/carry-forward/${annexureId}/comment`,

      {
        employee_id:
          employeeId,
        comment,
      },
    );
  }

  getInternalAuditAccountSampling(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    filterType = 0,
    primaryValue = '',
    secondaryValue = '',
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/sampling`,

      {
        params: {
          employee_id:
            employeeId,
          filter_type:
            filterType,
          primary_value:
            primaryValue,
          secondary_value:
            secondaryValue,
        },
      },
    );
  }

  applyInternalAuditAccountSampling(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    accountIds: number[],
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/sampling/apply`,

      {
        employee_id:
          employeeId,
        account_ids:
          accountIds,
      },
    );
  }

  removeInternalAuditAccountSampling(
    assessmentId: number,
    categoryId: number,
    dumpId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/account/${dumpId}/remove-sampling`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  getAuditUnitDashboard(
    auditUnitId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/unit/${auditUnitId}`,

      {
        params: {
          employee_id:
            employeeId,
          free_flow: FREE_AUDIT_FLOW ? '1' : '0',
        },
      },
    );
  }

  getStartAssessmentPreview(
    auditUnitId: number,
    yearId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/unit/${auditUnitId}/start/${yearId}`,

      {
        params: {
          employee_id:
            employeeId,
          free_flow: FREE_AUDIT_FLOW ? '1' : '0',
        },
      },
    );
  }

  startAssessment(
    auditUnitId: number,
    yearId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/unit/${auditUnitId}/start/${yearId}`,

      {
        employee_id:
          employeeId,
        free_flow: FREE_AUDIT_FLOW,
      },
    );
  }

  getInternalAuditCategorySubsetSet(
    assessmentId: number,
    categoryId: number,
    subsetSetId: number,
    employeeId: number,
    dumpId = 0,
  ) {
    const params: any = {
      employee_id: String(employeeId),
      dump_id: String(dumpId || 0),
    };
    const langId = this.getLanguageId();
    if (langId) {
      params.language_id = langId;
    }

    return this.http.get<any>(
      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/subset/${subsetSetId}`,
      {
        params
      },
    );
  }
}
