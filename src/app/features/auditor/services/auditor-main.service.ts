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
