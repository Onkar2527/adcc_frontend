import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

export interface PasswordPolicy {
  id?: number;
  min_length: number;
  num_cnt: number;
  uppercase_cnt: number;
  lowercase_cnt: number;
  symbol_cnt: number;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordPolicyService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/password-policy`;

  getPolicy(): Observable<PasswordPolicy> {
    return this.http.get<PasswordPolicy>(this.apiUrl);
  }

  updatePolicy(data: PasswordPolicy): Observable<PasswordPolicy> {
    return this.http.post<PasswordPolicy>(this.apiUrl, data);
  }
}
