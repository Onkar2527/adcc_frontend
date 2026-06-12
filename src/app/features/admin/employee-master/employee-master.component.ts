import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { Employee, EmployeeService } from '../services/masters.service';
import { EmployeeFormComponent } from './employee-form.component';

@Component({
  selector: 'app-employee-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Employee Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="employees()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadEmployees()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class EmployeeMasterComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  employees = signal<any[]>([]);
  loading = signal(false);
  globalFilterFields = ['emp_code', 'name', 'email', 'mobile', 'designation', 'user_type_name'];

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
    { field: 'emp_code', header: 'Emp Code', width: '120px' },
    { field: 'name', header: 'Name', width: '220px' },
    { field: 'email', header: 'Email', width: '240px' },
    { field: 'mobile', header: 'Mobile', width: '140px' },
    { field: 'designation', header: 'Designation', width: '180px' },
    { field: 'user_type_name', header: 'Employee Type', width: '170px' },
    { field: 'is_active', header: 'Status', type: 'status', width: '110px', align: 'center' },
    { field: '_status', header: '', type: 'action', actionIcon: 'pi pi-sync', actionName: 'toggle-status', width: '50px', align: 'center', tooltip: 'Toggle Status' },
  ];

  private userTypeMap: Record<number, string> = {
    1: 'Admin',
    2: 'Auditor',
    3: 'Employee',
    4: 'Reviewer',
    5: 'Top Level Management',
    6: 'Division'
  };

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees.set(employees.map((employee) => ({
          ...employee,
          user_type_name: this.userTypeMap[Number(employee.user_type_id)] || '-'
        })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load employees' });
      }
    });
  }

  async openForm(employee?: Employee) {
    const res = await this.drawer.open(EmployeeFormComponent, {
      header: employee ? 'Edit Employee' : 'Create New Employee',
      data: employee,
      width: 'min(820px, 150vw)'
    });

    if (res.saved) {
      this.loadEmployees();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Employee ${employee ? 'updated' : 'created'} successfully`
      });
    }
  }

  onAction(event: { name: string; row: Employee }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
      return;
    }

    if (event.name === 'toggle-status') {
      this.toggleStatus(event.row);
    }
  }

  private toggleStatus(employee: Employee) {
    this.employeeService.toggleStatus(employee.id).subscribe({
      next: () => {
        this.loadEmployees();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Employee ${Number(employee.is_active) === 1 ? 'deactivated' : 'activated'} successfully`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to update employee status' });
      }
    });
  }
}
