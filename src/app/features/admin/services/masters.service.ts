import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/branches`;

  findAll(): Observable<{ data: any[] }> { 
    return this.http.get<{ data: any[] }>(this.apiUrl); 
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/roles`;

  findAll(): Observable<{ data: any[] }> { 
    return this.http.get<{ data: any[] }>(this.apiUrl); 
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class MasterUserService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/users`;

  findAll(): Observable<{ data: any[] }> { 
    return this.http.get<{ data: any[] }>(this.apiUrl); 
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class LoanTypeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/loan-types`;

  findAll(): Observable<{ data: any[] }> { 
    return this.http.get<{ data: any[] }>(this.apiUrl); 
  }
  findOne(id: string) { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(data: any) { return this.http.post<any>(this.apiUrl, data); }
  update(id: string, data: any) { return this.http.put<any>(`${this.apiUrl}/${id}`, data); }
  remove(id: string) { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
