import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/admin/audit-logs`;

  getLogs(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
    if (filters.eventType) params = params.set('eventType', filters.eventType);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    if (filters.auditUnitId) params = params.set('auditUnitId', filters.auditUnitId);
    if (filters.assessmentId) params = params.set('assessmentId', filters.assessmentId);

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  getFilterOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/filter-options`);
  }
}
