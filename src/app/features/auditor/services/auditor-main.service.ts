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
}