import { Component, computed, inject, signal } from '@angular/core';
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
            [error]="sectionTypeError()"
          ></app-select-field>
        </div>

        <!-- Audit Unit Code -->
        <div class="col-12 md:col-6">
          <app-text-field
            label="Audit Unit Code"
            [field]="auditUnitCode"
            placeholder="Enter unit code"
            [required]="true"
            [error]="auditUnitCodeError()"
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
            [error]="nameError()"
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
            [error]="branchHeadError()"
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
            [error]="branchSubheadError()"
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
            [error]="lastAuditDateError()"
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
            [error]="frequencyError()"
            [filter]="false"
            [virtualScroll]="false"
            scrollHeight="180px"
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
        [saveDisabled]="false"
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

  sectionTypeError = computed(() =>
    this.sectionTypeId()
      ? ''
      : 'Audit section is required',
  );

  auditUnitCodeError = computed(() =>
    this.auditUnitCode().trim()
      ? ''
      : 'Audit unit code is required',
  );

  nameError = computed(() =>
    this.name().trim()
      ? ''
      : 'Audit unit name is required',
  );

  branchHeadError = computed(() =>
    this.branchHeadId()
      ? ''
      : 'Head of audit unit is required',
  );

  branchSubheadError = computed(() =>
    this.branchSubheadId() && this.branchHeadId() === this.branchSubheadId()
      ? 'Head and assistant cannot be the same'
      : '',
  );

  lastAuditDateError = computed(() =>
    this.lastAuditDate()
      ? ''
      : 'Last audit date is required',
  );

  frequencyError = computed(() =>
    this.frequency()
      ? ''
      : 'Audit frequency is required',
  );

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
      this.frequency.set(
        data.frequency !== null && data.frequency !== undefined
          ? Number(data.frequency)
          : null
      );
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
              : Array.isArray(res?.data?.rows)
                ? res.data.rows
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
      ? this.formatDateForApi(lastAuditDateValue)
      : null;
    const is_active = this.isActive() ? 1 : 0;

    if (
      this.sectionTypeError()
      || this.auditUnitCodeError()
      || this.nameError()
      || this.branchHeadError()
      || this.branchSubheadError()
      || this.lastAuditDateError()
      || this.frequencyError()
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: this.firstValidationError(),
      });
      return;
    }

    const validSectionTypeId =
      Number(section_type_id);
    const validBranchHeadId =
      Number(branch_head_id);
    const validFrequency =
      Number(frequency);
    const validLastAuditDate =
      String(last_audit_date);

    this.saving.set(true);
    const payload: CreateAuditUnitDto = {
      section_type_id: validSectionTypeId,
      audit_unit_code,
      name,
      branch_head_id: validBranchHeadId,
      branch_subhead_id: branch_subhead_id ?? null,
      last_audit_date: validLastAuditDate,
      frequency: validFrequency,
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
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to save audit unit details',
        });
      }
    });
  }

  private firstValidationError() {
    return [
      this.sectionTypeError(),
      this.auditUnitCodeError(),
      this.nameError(),
      this.branchHeadError(),
      this.branchSubheadError(),
      this.lastAuditDateError(),
      this.frequencyError(),
    ].find(Boolean) || 'Please correct the highlighted fields';
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cancel() {
    this.ref.close();
  }
}
