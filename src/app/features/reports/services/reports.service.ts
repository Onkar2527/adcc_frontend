import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/services/config/config.token';

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
  type?: 'text' | 'date' | 'status' | 'assessmentPeriod';
  expiredKey?: string;
  dueDateKey?: string;
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
    return this.http.get<ReportDefinition>(
      `${this.apiUrl}/${reportSlug}/definition`,
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

    return this.http.get<any>(
      `${this.apiUrl}/${reportSlug}/data`,
      {
        params,
      },
    );
  }
}
