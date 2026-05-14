import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  CheckboxFieldComponent,
  DateFieldComponent,
  FormActionsComponent,
  SelectFieldComponent,
  TextFieldComponent
} from '../../../shared/components/form';
import { AuditSectionService, AuditUnitService, CreateAuditUnitDto, EmployeeService } from '../services/masters.service';

@Component({
  selector: 'app-audit-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    SelectFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
  <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="flex flex-column gap-4">

      <!-- Row 1 -->
      <div class="grid">

        <!-- Audit Section -->
        <div class="col-12 md:col-6">
          <app-select-field
            label="Audit Section"
            [field]="sectionTypeId"
            [options]="sections()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>
        </div>

        <!-- Audit Unit Code -->
        <div class="col-12 md:col-6">
          <app-text-field
            label="Audit Unit Code"
            [field]="auditUnitCode"
            placeholder="Enter unit code"
            [required]="true"
          ></app-text-field>
        </div>

      </div>

      <!-- Row 2 -->
      <div class="grid">

        <!-- Audit Unit Name -->
        <div class="col-12">
          <app-text-field
            label="Audit Unit Name"
            [field]="name"
            placeholder="Enter unit name"
            [required]="true"
          ></app-text-field>
        </div>

      </div>

      <!-- Row 3 -->
      <div class="grid">

        <!-- Head of Audit Unit -->
        <div class="col-12 md:col-6">
          <app-select-field
            label="Head of Audit Unit"
            [field]="branchHeadId"
            [options]="employees()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>
        </div>

        <!-- Assistant to Head -->
        <div class="col-12 md:col-6">
          <app-select-field
            label="Assistant to Head"
            [field]="branchSubheadId"
            [options]="employees()"
            optionLabel="label"
            optionValue="value"
          ></app-select-field>
        </div>

      </div>

      <!-- Row 4 -->
      <div class="grid">

        <!-- Last Audit Date -->
        <div class="col-12 md:col-6">
          <app-date-field
            label="Last Audit Date"
            [field]="lastAuditDate"
            [required]="true"
          ></app-date-field>
        </div>

        <!-- Audit Frequency -->
        <div class="col-12 md:col-6">
          <app-select-field
            label="Audit Frequency"
            [field]="frequency"
            [options]="frequencyOptions"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>
        </div>

      </div>

      <!-- Is Active -->
      <div class="grid">

        <div class="col-12 md:col-6 flex align-items-center pt-2">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
        </div>

      </div>

    </div>

    <!-- Footer -->
    <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">

      <app-form-actions
        [loading]="saving()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>

    </div>

  </div>

</div>
  `
})
export class AuditUnitFormComponent {
  private ref = inject(FormDrawerRef);
  private auditUnitService = inject(AuditUnitService);
  private auditSectionService = inject(AuditSectionService);
  private employeeService = inject(EmployeeService);
  private messageService = inject(MessageService);

  sectionTypeId = signal<number | null>(null);
  auditUnitCode = signal('');
  name = signal('');
  branchHeadId = signal<number | null>(null);
  branchSubheadId = signal<number | null>(null);
  frequency = signal<number | null>(null);
  lastAuditDate = signal<Date | null>(null);
  isActive = signal(true);
  saving = signal(false);

  sections = signal<{ label: string; value: number }[]>([]);
  employees = signal<{ label: string; value: number }[]>([]);

  frequencyOptions = [
    { label: '1 Month', value: 1 },
    { label: '3 Months', value: 3 },
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 }
  ];

  constructor() {
    this.loadSections();
    this.loadEmployees();
    const data = this.ref.data;
    if (data) {
      this.sectionTypeId.set(data.section_type_id ?? null);
      this.auditUnitCode.set(data.audit_unit_code ?? '');
      this.name.set(data.name ?? '');
      this.branchHeadId.set(data.branch_head_id ?? null);
      this.branchSubheadId.set(data.branch_subhead_id ?? null);
      this.frequency.set(data.frequency ?? null);
      this.lastAuditDate.set(
        data.last_audit_date ? new Date(data.last_audit_date) : null
      );
      this.isActive.set(Number(data.is_active) !== 0);
    }
  }
  private loadSections() {
    this.auditSectionService.findAll().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.rows)
              ? res.rows
              : [];

        this.sections.set(
          rows.map((item: any) => ({
            label: item.name ?? item.section_name ?? '-',
            value: item.id
          }))
        );
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load audit sections'
        });
      }
    });
  }

  private loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (res) => {
        const rows = Array.isArray(res) ? res : [];
        this.employees.set(rows
          .filter((employee: any) => Number(employee.is_active) === 1)
          .map((employee: any) => ({ label: `${employee.name} (${employee.emp_code})`, value: employee.id }))
        );
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load employees' });
      }
    });
  }

  save() {
    const section_type_id = this.sectionTypeId() ? Number(this.sectionTypeId()) : null;
    const audit_unit_code = this.auditUnitCode().trim().toUpperCase();
    const name = this.name().trim();
    const branch_head_id = this.branchHeadId() ? Number(this.branchHeadId()) : null;
    const branch_subhead_id = this.branchSubheadId()
      ? Number(this.branchSubheadId())
      : null;
    const frequencyValue = this.frequency();
    const frequency = frequencyValue !== null && frequencyValue !== undefined
      ? Number(frequencyValue)
      : null;
    const lastAuditDateValue = this.lastAuditDate();
    const last_audit_date = lastAuditDateValue
      ? lastAuditDateValue.toISOString().split('T')[0]
      : null;
    const is_active = this.isActive() ? 1 : 0;

    if (!section_type_id || !audit_unit_code || !name || !branch_head_id || !last_audit_date || !frequency) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill required fields' });
      return;
    }

    if (branch_subhead_id && branch_head_id === branch_subhead_id) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Head and assistant cannot be the same' });
      return;
    }

    this.saving.set(true);
    const payload: CreateAuditUnitDto = {
      section_type_id,
      audit_unit_code,
      name,
      branch_head_id,
      branch_subhead_id: branch_subhead_id ?? null,
      last_audit_date,
      frequency,
      is_active,
    };

    const obs = this.ref.data
      ? this.auditUnitService.update(this.ref.data.id, payload)
      : this.auditUnitService.create(payload);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
