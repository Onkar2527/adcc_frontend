import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EmployeeService } from '../services/employee.service';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    EmployeeFormComponent,
    TagModule,
    TooltipModule,
    InputTextModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  employees = signal<Employee[]>([]);
  loading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  formDialog = false;
  selectedEmployee: Employee | null = null;

  userTypeOptions = [
    { label: 'Admin', value: 1 },
    { label: 'Auditor', value: 2 },
    { label: 'Employee', value: 3 },
    { label: 'Reviewer', value: 4 },
    { label: 'Top Level Management', value: 5 }
  ];

  getUserTypeName(id: number | string | null | undefined): string {
    if (!id) return '-';
    const typeId = Number(id);
    const found = this.userTypeOptions.find(opt => opt.value === typeId);
    return found ? found.label : '-';
  }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load employees' });
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.selectedEmployee = null;
    this.formDialog = true;
  }

  editEmployee(employee: Employee) {
    this.selectedEmployee = { ...employee };
    this.formDialog = true;
  }

  hideDialog() {
    this.formDialog = false;
    this.selectedEmployee = null;
  }

  saveEmployee(data: CreateEmployeeDto | UpdateEmployeeDto) {
    this.isSaving.set(true);
    if (this.selectedEmployee) {
      this.employeeService.updateEmployee(this.selectedEmployee.id, data).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Employee Updated' });
          this.loadEmployees();
          this.hideDialog();
          this.isSaving.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update employee' });
          this.isSaving.set(false);
        }
      });
    } else {
      this.employeeService.createEmployee(data as CreateEmployeeDto).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Employee Created' });
          this.loadEmployees();
          this.hideDialog();
          this.isSaving.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create employee' });
          this.isSaving.set(false);
        }
      });
    }
  }

  toggleStatus(employee: Employee) {
    this.confirmationService.confirm({
      message: `Are you sure you want to ${employee.is_active ? 'deactivate' : 'activate'} ${employee.name}?`,
      header: 'Confirm Status Change',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.employeeService.toggleStatus(employee.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Status Updated' });
            this.loadEmployees();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' })
        });
      }
    });
  }


}
