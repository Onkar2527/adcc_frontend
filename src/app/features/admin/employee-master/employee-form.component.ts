import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  CheckboxFieldComponent,
  FormActionsComponent,
  MultiSelectFieldComponent,
  PasswordFieldComponent,
  SelectFieldComponent,
  TextFieldComponent
} from '../../../shared/components/form';
import {
  AuditUnit,
  CreateEmployeeDto,
  Employee,
  EmployeeService,
  PasswordPolicyService,
  UnitsService,
  UpdateEmployeeDto,
  RegionMasterService
} from '../services/masters.service';
import { MessageService } from 'primeng/api';
import { ValidationService } from '../../../core/services/validation/validation.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldComponent,
    SelectFieldComponent,
    MultiSelectFieldComponent,
    PasswordFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
  <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <!-- Row 1 -->
    <div class="grid">
      <div class="col-12 md:col-6">
        <app-text-field
          label="Employee Code"
          [field]="empCode"
          [required]="true"
          [error]="empCodeError()"
        ></app-text-field>
      </div>

      <div class="col-12 md:col-6">
        <app-text-field
          label="Full Name"
          [field]="name"
          [required]="true"
          [error]="nameError()"
        ></app-text-field>
      </div>
    </div>

    <!-- Row 2 -->
    <div class="grid">
      <div class="col-12 md:col-6">
        <app-text-field
          label="Email"
          [field]="email"
          [required]="true"
          [error]="emailError()"
        ></app-text-field>
      </div>

      <div class="col-12 md:col-6">
        <app-text-field
          label="Mobile"
          [field]="mobile"
          [required]="true"
          [maxlength]="10"
          [keyfilter]="'int'"
          [error]="mobileError()"
        ></app-text-field>
      </div>
    </div>

    <!-- Row 3 -->
    <div class="grid">
      <div class="col-12 md:col-6">
        <app-text-field
          label="Designation"
          [field]="designation"
        ></app-text-field>
      </div>

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
          [error]="genderError()"
        ></app-select-field>
      </div>
    </div>

    <!-- Row 4 -->
    <div class="grid">
      <div class="col-12 md:col-6">
        <app-select-field
          label="Employee Type"
          [field]="userTypeId"
          [options]="userTypeOptions"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [error]="userTypeError()"
        ></app-select-field>
      </div>

      <div class="col-12 md:col-6">
        <app-password-field
          label="Password"
          [field]="password"
          [required]="!isEdit"
          [feedback]="!isEdit"
          [error]="passwordError()"
          [helperText]="passwordHelperText()"
          (onChange)="onPasswordChange($event)"
        ></app-password-field>
      </div>
    </div>

    <!-- Row 5 -->
    @if (showAuditUnits()) {
      <div class="grid">
        <div class="col-12 md:col-6">
          <app-multi-select-field
            label="Authorized Audit Units"
            [field]="unitIds"
            [options]="units()"
            optionLabel="name"
            optionValue="id"
            display="chip"
            [required]="showAuditUnits()"
            [error]="unitIdsError()"
          ></app-multi-select-field>
        </div>

        <div class="col-12 md:col-6 flex align-items-center pt-4">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
        </div>
      </div>
    }

    <!-- Row 5: Region -->
    @if (showRegion()) {
      <div class="grid">
        <div class="col-12 md:col-6">
          <app-select-field
            label="Assigned Region"
            [field]="regionName"
            [options]="regionNameOptions()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            [error]="regionNameError()"
          ></app-select-field>
        </div>

        <div class="col-12 md:col-6 flex align-items-center pt-4">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
        </div>
      </div>
    }

    <!-- Row 6 -->
    @if (!showAuditUnits() && !showRegion()) {
      <div class="grid">
        <div class="col-12 md:col-6 flex align-items-center pt-2">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
        </div>
      </div>
    }

    <!-- Footer Buttons -->
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
export class EmployeeFormComponent {
  private ref = inject(FormDrawerRef);
  private employeeService = inject(EmployeeService);
  private unitsService = inject(UnitsService);
  private messageService = inject(MessageService);
  private policyService = inject(PasswordPolicyService);
  private validationService = inject(ValidationService);
  private regionService = inject(RegionMasterService);
  empCode = signal('');
  name = signal('');
  email = signal('');
  mobile = signal('');
  designation = signal('');
  gender = signal<string | null>(null);
  userTypeId = signal<number | null>(null);
  password = signal('');
  unitIds = signal<number[]>([]);
  regionName = signal('');
  isActive = signal(true);
  units = signal<AuditUnit[]>([]);
  regionOptions = signal<string[]>([]);
  saving = signal(false);
  isEdit = false;
  minLength = signal<number | null>(8);
  numCnt = signal<number | null>(1);
  uppercaseCnt = signal<number | null>(1);
  lowercaseCnt = signal<number | null>(1);
  symbolCnt = signal<number | null>(1);
  passwordError = signal('');
  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];

  userTypeOptions = [
    { label: 'Admin', value: 1 },
    { label: 'Auditor', value: 2 },
    { label: 'Employee', value: 3 },
    { label: 'Reviewer', value: 4 },
    { label: 'Top Level Management', value: 5 },
    { label: 'Division', value: 6 },
    { label: 'Sub-Head', value: 10 },
    { label: 'Super Reviewer', value: 11 }
  ];

  showAuditUnits = computed(() => {
    const userTypeId = Number(this.userTypeId());
    return userTypeId === 2 || userTypeId === 4 || userTypeId === 11;
  });

  showRegion = computed(() => {
    const userTypeId = Number(this.userTypeId());
    return userTypeId === 6;
  });

  regionNameOptions = computed(() => {
    return this.regionOptions().map(name => ({ label: name, value: name }));
  });

  empCodeError = computed(() =>
    this.empCode().trim()
      ? ''
      : 'Employee code is required',
  );

  nameError = computed(() =>
    this.name().trim()
      ? ''
      : 'Full name is required',
  );

  emailError = computed(() =>
    this.validationService.getEmailError(
      this.email(),
      true,
    ),
  );

  mobileError = computed(() =>
    this.validationService.getMobileError(
      this.mobile(),
      true,
    ),
  );

  genderError = computed(() =>
    this.gender()
      ? ''
      : 'Gender is required',
  );

  userTypeError = computed(() =>
    this.userTypeId()
      ? ''
      : 'Employee type is required',
  );

  unitIdsError = computed(() =>
    this.showAuditUnits() && !this.unitIds().length
      ? 'Select at least one authorized audit unit'
      : '',
  );

  regionNameError = computed(() =>
    this.showRegion() && !this.regionName().trim()
      ? 'Select an assigned region'
      : '',
  );

  passwordHelperText = computed(() =>
    this.passwordError()
      ? ''
      : `Minimum ${this.minLength() || 0} characters with ${this.uppercaseCnt() || 0} uppercase, ${this.lowercaseCnt() || 0} lowercase, ${this.numCnt() || 0} number and ${this.symbolCnt() || 0} special character.`,
  );

  isValid = computed(() => {
    return !this.empCodeError()
      && !this.nameError()
      && !this.emailError()
      && !this.mobileError()
      && !this.genderError()
      && !this.userTypeError()
      && !this.unitIdsError()
      && !this.regionNameError()
      && (
        this.isEdit
        || !!this.password().trim()
      );
  });
  onPasswordChange(value: string) {

    this.password.set(value);

    this.validatePassword();
  }
  constructor() {
    this.loadUnits();
    this.loadRegions();
    this.loadPolicy();
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
      this.regionName.set(data.region_name || '');
      this.isActive.set(Number(data.is_active) === 1);
    }
  }

  save() {

    if (!this.isValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: this.firstValidationError(),
      });
      return;
    }

    if (!this.validatePassword()) {
      return;
    }

    this.saving.set(true);

    const payload:
      CreateEmployeeDto
      |
      UpdateEmployeeDto = {

      emp_code:
        this.empCode().trim(),

      name:
        this.name().trim(),

      email:
        this.email().trim(),

      mobile:
        this.mobile().trim(),

      designation:
        this.designation().trim(),

      gender:
        this.gender() || '',

      user_type_id:
        this.userTypeId() || 0,

      is_active:
        this.isActive() ? 1 : 0,

      unit_ids:
        this.showAuditUnits()
          ? this.unitIds()
          : [],

      region_name:
        this.showRegion()
          ? this.regionName()
          : undefined
    };

    if (this.password().trim()) {

      payload.password =
        this.password().trim();
    }

    const obs =
      this.isEdit

        ? this.employeeService.updateEmployee(
          this.ref.data.id,
          payload,
        )

        : this.employeeService.createEmployee(
          payload as CreateEmployeeDto,
        );

    obs.subscribe({

      next: (res) => {

        this.saving.set(false);

        this.ref.close(res);
      },

      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to save employee details',
        });
      }
    });
  }

  loadPolicy() {

    this.policyService.getPolicy().subscribe({
      next: (policy) => {
        if (policy) {
          this.minLength.set(Number(policy.min_length));
          this.numCnt.set(Number(policy.num_cnt));
          this.uppercaseCnt.set(Number(policy.uppercase_cnt));
          this.lowercaseCnt.set(Number(policy.lowercase_cnt));
          this.symbolCnt.set(Number(policy.symbol_cnt));
        }

      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load password policy' });
      }
    });
  }
  validatePassword(): boolean {

    const password =
      this.password();

    // EDIT MODE + EMPTY PASSWORD
    if (
      this.isEdit &&
      !password.trim()
    ) {

      this.passwordError.set('');
      return true;
    }

    const minLength =
      this.minLength() || 0;

    const numCnt =
      this.numCnt() || 0;

    const uppercaseCnt =
      this.uppercaseCnt() || 0;

    const lowercaseCnt =
      this.lowercaseCnt() || 0;

    const symbolCnt =
      this.symbolCnt() || 0;

    // MIN LENGTH
    if (
      password.length < minLength
    ) {

      this.passwordError.set(
        `Password must be at least ${minLength} characters long`,
      );

      return false;
    }

    // UPPERCASE
    const uppercaseMatches =
      password.match(/[A-Z]/g) || [];

    if (
      uppercaseMatches.length < uppercaseCnt
    ) {

      this.passwordError.set(
        `Password must contain at least ${uppercaseCnt} uppercase letter(s)`,
      );

      return false;
    }

    // LOWERCASE
    const lowercaseMatches =
      password.match(/[a-z]/g) || [];

    if (
      lowercaseMatches.length < lowercaseCnt
    ) {

      this.passwordError.set(
        `Password must contain at least ${lowercaseCnt} lowercase letter(s)`,
      );

      return false;
    }

    // NUMBER
    const numberMatches =
      password.match(/[0-9]/g) || [];

    if (
      numberMatches.length < numCnt
    ) {

      this.passwordError.set(
        `Password must contain at least ${numCnt} number(s)`,
      );

      return false;
    }

    // SYMBOL
    const symbolMatches =
      password.match(
        /[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/g,
      ) || [];

    if (
      symbolMatches.length < symbolCnt
    ) {

      this.passwordError.set(
        `Password must contain at least ${symbolCnt} special character(s)`,
      );

      return false;
    }

    this.passwordError.set('');

    return true;
  }
  cancel() {
    this.ref.close();
  }

  private loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (units) => this.units.set(units),
      error: () => {
        this.units.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load authorized audit units',
        });
      }
    });
  }

  private loadRegions() {
    this.regionService.findUniqueNames().subscribe({
      next: (names: string[]) => this.regionOptions.set(names),
      error: () => {
        this.regionOptions.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load region names',
        });
      }
    });
  }

  private firstValidationError() {
    return [
      this.empCodeError(),
      this.nameError(),
      this.emailError(),
      this.mobileError(),
      this.genderError(),
      this.userTypeError(),
      this.unitIdsError(),
      this.regionNameError(),
      (!this.isEdit && !this.password().trim())
        ? 'Password is required'
        : '',
    ].find(Boolean) || 'Please correct the highlighted fields';
  }

  private parseUnitIds(authority?: string): number[] {
    if (!authority) return [];
    return authority
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id));
  }


}
