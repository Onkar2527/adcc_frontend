import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  CheckboxFieldComponent,
  FormActionsComponent,
  MultiSelectFieldComponent,
  SelectFieldComponent,
  TextFieldComponent
} from '../../../shared/components/form';
import {
  AuditUnit,
  CreateEmployeeDto,
  Employee,
  EmployeeService,
  UnitsService,
  UpdateEmployeeDto
} from '../services/masters.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PasswordModule,
    TextFieldComponent,
    SelectFieldComponent,
    MultiSelectFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4">
      <div class="flex-grow-1 overflow-y-auto">
        <div class="grid">
          <div class="col-12 md:col-6">
            <app-text-field label="Employee Code" [field]="empCode" [required]="true" class="mb-3"></app-text-field>
          </div>
          <div class="col-12 md:col-6">
            <app-text-field label="Full Name" [field]="name" [required]="true" class="mb-3"></app-text-field>
          </div>
        </div>

        <div class="grid">
          <div class="col-12 md:col-6">
            <app-text-field label="Email" [field]="email" [required]="true" class="mb-3"></app-text-field>
          </div>
          <div class="col-12 md:col-6">
            <app-text-field label="Mobile" [field]="mobile" [required]="true" class="mb-3"></app-text-field>
          </div>
        </div>

        <app-text-field label="Designation" [field]="designation" class="mb-3"></app-text-field>

        <div class="grid">
          <div class="col-12 md:col-6">
            <app-select-field
              label="Gender"
              [field]="gender"
              [options]="genderOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
              [virtualScroll]="false"
              scrollHeight="90px"
              class="mb-3"
            ></app-select-field>
          </div>
          <div class="col-12 md:col-6">
            <app-select-field
              label="Employee Type"
              [field]="userTypeId"
              [options]="userTypeOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
              class="mb-3"
            ></app-select-field>
          </div>
        </div>

        <div class="mb-3">
          <label class="font-medium mb-2 block">
            Password
            @if (!isEdit) {
              <span class="text-red-500">*</span>
            }
          </label>
          <p-password
            [ngModel]="password()"
            (ngModelChange)="password.set($event)"
            [toggleMask]="true"
            [feedback]="!isEdit"
            placeholder="Enter password"
            styleClass="w-full"
            inputStyleClass="w-full"
            [style]="{ width: '100%' }"
          ></p-password>
        </div>

        @if (showAuditUnits()) {
          <app-multi-select-field
            label="Authorized Audit Units"
            [field]="unitIds"
            [options]="units()"
            optionLabel="name"
            optionValue="id"
            display="chip"
            class="mb-3"
          ></app-multi-select-field>
        }

        <app-checkbox-field label="Is Active" [field]="isActive"></app-checkbox-field>
      </div>

      <app-form-actions
        class="mt-auto pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        [saveDisabled]="!isValid()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>
    </div>
  `
})
export class EmployeeFormComponent {
  private ref = inject(FormDrawerRef);
  private employeeService = inject(EmployeeService);
  private unitsService = inject(UnitsService);

  empCode = signal('');
  name = signal('');
  email = signal('');
  mobile = signal('');
  designation = signal('');
  gender = signal<string | null>(null);
  userTypeId = signal<number | null>(null);
  password = signal('');
  unitIds = signal<number[]>([]);
  isActive = signal(true);
  units = signal<AuditUnit[]>([]);
  saving = signal(false);
  isEdit = false;

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];

  userTypeOptions = [
    { label: 'Admin', value: 1 },
    { label: 'Auditor', value: 2 },
    { label: 'Employee', value: 3 },
    { label: 'Reviewer', value: 4 },
    { label: 'Top Level Management', value: 5 }
  ];

  showAuditUnits = computed(() => {
    const userTypeId = Number(this.userTypeId());
    return userTypeId === 2 || userTypeId === 4;
  });

  isValid = computed(() => {
    return !!this.empCode().trim()
      && !!this.name().trim()
      && !!this.email().trim()
      && !!this.mobile().trim()
      && !!this.gender()
      && !!this.userTypeId()
      && (this.isEdit || !!this.password().trim());
  });

  constructor() {
    this.loadUnits();

    const data = this.ref.data as Employee | null;
    if (data) {
      this.isEdit = true;
      this.empCode.set(data.emp_code || '');
      this.name.set(data.name || '');
      this.email.set(data.email || '');
      this.mobile.set(data.mobile || '');
      this.designation.set(data.designation || '');
      this.gender.set(data.gender || null);
      this.userTypeId.set(data.user_type_id ? Number(data.user_type_id) : null);
      this.unitIds.set(this.parseUnitIds(data.audit_unit_authority));
      this.isActive.set(Number(data.is_active) === 1);
    }
  }

  save() {
    if (!this.isValid()) return;

    this.saving.set(true);
    const payload: CreateEmployeeDto | UpdateEmployeeDto = {
      emp_code: this.empCode().trim(),
      name: this.name().trim(),
      email: this.email().trim(),
      mobile: this.mobile().trim(),
      designation: this.designation().trim(),
      gender: this.gender() || '',
      user_type_id: this.userTypeId() || 0,
      is_active: this.isActive() ? 1 : 0,
      unit_ids: this.showAuditUnits() ? this.unitIds() : []
    };

    if (this.password().trim()) {
      payload.password = this.password().trim();
    }

    const obs = this.isEdit
      ? this.employeeService.updateEmployee(this.ref.data.id, payload)
      : this.employeeService.createEmployee(payload as CreateEmployeeDto);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close(res);
      },
      error: () => this.saving.set(false)
    });
  }

  cancel() {
    this.ref.close();
  }

  private loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (units) => this.units.set(units)
    });
  }

  private parseUnitIds(authority?: string): number[] {
    if (!authority) return [];
    return authority
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id));
  }
}
