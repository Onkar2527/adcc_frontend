import { Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list/employee-list.component';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
  }
];
