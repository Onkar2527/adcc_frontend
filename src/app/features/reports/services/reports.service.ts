import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/services/config/config.token';
import { FREE_AUDIT_FLOW, audit_flow_config } from '../../admin/services/required-data';

export interface ReportFilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'checkbox';
  required?: boolean;
  dependsOn?: string;
  optionParentKey?: string;
  options?: Array<{
    value: string;
    label: string;
    [key: string]: any;
  }>;
}

export interface ReportColumnDefinition {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'date' | 'status' | 'assessmentPeriod' | 'trend' | 'commentWithAuthor';
  expiredKey?: string;
  dueDateKey?: string;
  authorKey?: string;
}

export interface ReportDefinition {
  slug: string;
  title: string;
  category: string;
  page: 'A4' | 'A4L';
  fileName: string;
  brand?: {
    logoUrl?: string;
    bankName?: string;
  };
  defaultFilters: Record<string, any>;
  filters: ReportFilterDefinition[];
  columns: ReportColumnDefinition[];
  summaryCards?: Array<{
    key: string;
    label: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/reports`;

  getReportDefinition(reportSlug: string) {
    let params = new HttpParams()
      .set('freeFlow', FREE_AUDIT_FLOW ? 'true' : 'false')
      .set('live_manager_compliance', audit_flow_config.liveManagerCompliance ? 'true' : 'false')
      .set('_t', String(Date.now()));
    return this.http.get<ReportDefinition>(
      `${this.apiUrl}/${reportSlug}/definition`,
      { params }
    );
  }

  getReportData(reportSlug: string, filters: Record<string, any>) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      params = params.set(
        key,
        Array.isArray(value)
          ? value.join(',')
          : String(value ?? ''),
      );
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
      params = params.set('user_type_id', String(user.user_type_id || ''));
      params = params.set('audit_unit_authority', String(user.audit_unit_authority || ''));
      params = params.set('employee_id', String(user.id || user.employee_id || user.emp_id || ''));
    }

    params = params.set('freeFlow', FREE_AUDIT_FLOW ? 'true' : 'false')
      .set('live_manager_compliance', audit_flow_config.liveManagerCompliance ? 'true' : 'false')
      .set('_t', String(Date.now()));

    return this.http.get<any>(
      `${this.apiUrl}/${reportSlug}/data`,
      {
        params,
      },
    );
  }
}
