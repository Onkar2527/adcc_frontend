import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

export interface Incident {
  id?: number;
  audit_unit_id: number;
  incident_type: string;
  description: string;
  reported_by?: number;
  reported_by_name?: string;
  audit_unit_name?: string;
  audit_unit_code?: string;
  reported_date?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IncidentService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/incident-management`;

  findAll(employeeId: number): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}?employeeId=${employeeId}`);
  }

  findOne(id: number): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/${id}`);
  }

  create(data: any, employeeId: number): Observable<Incident> {
    return this.http.post<Incident>(`${this.apiUrl}?employeeId=${employeeId}`, data);
  }

  update(id: number, data: any): Observable<Incident> {
    return this.http.patch<Incident>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
