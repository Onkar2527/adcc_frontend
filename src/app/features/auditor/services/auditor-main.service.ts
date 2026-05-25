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
) {

    return this.http.get(
        `${this.apiUrl}/executive-summary/${assessment_id}`,
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
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}`,

      {
        params: {
          employee_id:
            employeeId,
        },
      },
    );
  }

  saveInternalAuditCategoryAnswers(
    assessmentId: number,
    categoryId: number,
    employeeId: number,
    answers: any[],
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/answers`,

      {
        employee_id:
          employeeId,
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
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure`,

      {
        ...payload,
        employee_id:
          employeeId,
      },
    );
  }

  deleteInternalAuditAnnexureRow(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    annexureRowId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure/${annexureRowId}/delete`,

      {
        employee_id:
          employeeId,
      },
    );
  }

  getInternalAuditAnnexureSample(
    assessmentId: number,
    categoryId: number,
    questionId: number,
    employeeId: number,
  ) {

    return this.http.get<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/question/${questionId}/annexure/sample`,

      {
        params: {
          employee_id:
            employeeId,
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
  ) {

    return this.http.get(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/evidence/${evidenceId}/view`,

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

  deleteInternalAuditEvidence(
    assessmentId: number,
    categoryId: number,
    evidenceId: number,
    employeeId: number,
  ) {

    return this.http.post<any>(

      `${this.config.apiUrl}/internal-audit/${assessmentId}/category/${categoryId}/evidence/${evidenceId}/delete`,

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
