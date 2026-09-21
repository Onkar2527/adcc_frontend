import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { APP_CONFIG } from '../../../core/services/config/config.token';

export interface NonAgriStatementPayload {
  id?: number;
  assessment_id?: number | null;
  year_id?: number | null;
  audit_unit_id?: number | null;
  statement_date?: string;
  statement_type?: string;
  bank_name?: string;
  head_office?: string;
  unit_text?: string;
  inspection_patra?: number;
  inspection_purna?: number;
  inspection_apoorna?: number;
  designation1?: string;
  designation2?: string;
  shares_data?: any;
  statement_data?: any;
  total_yeanebaki_members?: number;
  total_yeanebaki_amount?: number;
  total_thakbaki_members?: number;
  total_thakbaki_amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NonAgriStatementService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/internal-audit/non-agri-statement`;
  private localKey = 'adcc_non_agri_statement_saved';

  saveStatement(payload: NonAgriStatementPayload): Observable<any> {
    // Save to local storage as safety backup
    try {
      localStorage.setItem(this.localKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }

    return this.http.post<any>(this.apiUrl, payload).pipe(
      catchError(err => {
        console.warn('Backend API not reachable or errored, saved to local storage', err);
        return of({ success: true, message: 'Saved locally', data: payload });
      })
    );
  }

  getStatement(assessmentId?: number, auditUnitId?: number, yearId?: number): Observable<any> {
    const params: any = {};
    if (assessmentId) params.assessment_id = assessmentId;
    if (auditUnitId) params.audit_unit_id = auditUnitId;
    if (yearId) params.year_id = yearId;

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap((res) => {
        if (res?.data) {
          try {
            localStorage.setItem(this.localKey, JSON.stringify(res.data));
          } catch {}
        }
      }),
      catchError(() => {
        // Fallback to local storage
        try {
          const saved = localStorage.getItem(this.localKey);
          if (saved) {
            return of({ success: true, data: JSON.parse(saved) });
          }
        } catch {}
        return of({ success: false, data: null });
      })
    );
  }
}
