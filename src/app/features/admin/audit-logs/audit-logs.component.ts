import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { AuditLogsService } from '../services/audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    DialogModule,
    DrawerModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    TableComponent
  ],
  providers: [MessageService],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  private auditLogsService = inject(AuditLogsService);
  private messageService = inject(MessageService);

  // Data signals
  logs = signal<any[]>([]);
  loading = signal(false);

  // Dropdown filter options
  eventTypesOptions = signal<any[]>([]);
  employeesOptions = signal<any[]>([]);
  branchesOptions = signal<any[]>([]);

  // Selected filter values
  selectedEmployee = signal<number | null>(null);
  selectedEventType = signal<string | null>(null);
  selectedBranch = signal<number | null>(null);
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  // Global search fields
  globalFilterFields = [
    'employee_name',
    'employee_code',
    'employee_role',
    'event_type',
    'branch_name',
    'event_description'
  ];

  // Table columns definition
  columns: TableColumn[] = [
    { field: '_details', header: 'Action', type: 'action', actionIcon: 'pi pi-search-plus', actionName: 'view-details', width: '70px', align: 'center', tooltip: 'View Log Details' },
    { field: 'event_datetime', header: 'Date & Time', type: 'date', pipeFormat: 'dd-MM-yyyy HH:mm:ss', width: '180px', align: 'center' },
    { field: 'event_type', header: 'Event Type', width: '160px', align: 'center' },
    { field: 'employee_name', header: 'Employee Name', width: '220px' },
    { field: 'employee_code', header: 'Code', width: '110px', align: 'center' },
    { field: 'employee_role', header: 'Role', width: '140px' },
    { field: 'branch_name', header: 'Branch / Unit', width: '180px' },
    { field: 'audit_assesment_id', header: 'Assessment ID', width: '120px', align: 'center' },
    { field: 'ip_address', header: 'IP Address', width: '130px', align: 'center' }
  ];

  // Details dialog controls
  displayDetailsDialog = false;
  selectedLog = signal<any>(null);

  ngOnInit() {
    this.loadFilterOptions();
    this.loadLogs();
  }

  loadFilterOptions() {
    this.auditLogsService.getFilterOptions().subscribe({
      next: (options) => {
        this.eventTypesOptions.set(options.eventTypes || []);
        
        this.employeesOptions.set(
          (options.employees || []).map((emp: any) => ({
            label: `${emp.name} (${emp.emp_code})`,
            value: emp.id
          }))
        );

        this.branchesOptions.set(
          (options.branches || []).map((br: any) => ({
            label: br.audit_unit_code ? `${br.name} (${br.audit_unit_code})` : br.name,
            value: br.id
          }))
        );
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load filter dropdowns' });
      }
    });
  }

  loadLogs() {
    this.loading.set(true);
    const filters: any = {};
    if (this.selectedEmployee()) filters.employeeId = this.selectedEmployee();
    if (this.selectedEventType()) filters.eventType = this.selectedEventType();
    if (this.selectedBranch()) filters.branchId = this.selectedBranch();
    if (this.startDate()) filters.startDate = this.formatDate(this.startDate());
    if (this.endDate()) filters.endDate = this.formatDate(this.endDate());

    this.auditLogsService.getLogs(filters).subscribe({
      next: (data) => {
        this.logs.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load audit logs' });
      }
    });
  }

  resetFilters() {
    this.selectedEmployee.set(null);
    this.selectedEventType.set(null);
    this.selectedBranch.set(null);
    this.startDate.set(null);
    this.endDate.set(null);
    this.loadLogs();
  }

  onActionClick(event: { name: string; row: any }) {
    if (event.name === 'view-details') {
      this.selectedLog.set(event.row);
      this.displayDetailsDialog = true;
    }
  }

  getAvatarInitial(name: string): string {
    return (name || 'U').charAt(0).toUpperCase();
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
