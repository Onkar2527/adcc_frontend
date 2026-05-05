import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

export interface AuditUnit {
  id: number;
  name: string;
  audit_unit_code: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnitsService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/units`;

  getUnits(): Observable<AuditUnit[]> {
    return this.http.get<AuditUnit[]>(this.apiUrl);
  }
}
