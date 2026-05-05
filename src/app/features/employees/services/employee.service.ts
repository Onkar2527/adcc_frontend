import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private apiUrl = `${this.config.apiUrl}/employees`;

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  createEmployee(data: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, data);
  }

  updateEmployee(id: number, data: UpdateEmployeeDto): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}/status`, {});
  }

  setPassword(id: number, password: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/password`, { password });
  }

  updateAuthority(id: number, unitIds: number[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/authority`, { unit_ids: unitIds });
  }
}
