import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

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
getBranchFinancialPosition(
    branch_id: number,
) {

    return this.http.get(
        `${this.apiUrl}/branch-financial-position/${branch_id}`,
    );

}

  openAssessment(payload: any) {

    return this.http.post(

      `${this.apiUrl}/open-assessment`,

      payload,
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
        },
      },
    );
  }

  getInternalAuditCategory(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    dumpId = 0,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}`,

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
        },
      },
    );
  }

  getReviewerComplianceAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/reviewer/compliance/${assessmentId}`,

      {
        params: {
          employee_id:
            employeeId,
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

  submitComplianceAssessment(
    assessmentId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/compliance/${assessmentId}/submit`,

      {
        employee_id:
          employeeId,
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
      },
    );
  }
}
