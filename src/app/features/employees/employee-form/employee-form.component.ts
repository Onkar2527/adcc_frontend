import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import { UnitsService, AuditUnit } from '../services/units.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    PasswordModule
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<CreateEmployeeDto | UpdateEmployeeDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private unitsService = inject(UnitsService);

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    // { label: 'Other', value: 'Other' }
  ];

  userTypeOptions = [
    { label: 'Admin', value: 1 },
    { label: 'Auditor', value: 2 },
    { label: 'Employee', value: 3 },
    { label: 'Reviewer', value: 4 },
    { label: 'Top Level Management', value: 5 }
  ];

  units: AuditUnit[] = [];

  form: FormGroup = this.fb.group({
    emp_code: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', Validators.required],
    designation: [''],
    gender: ['', Validators.required],
    user_type_id: [null, Validators.required],
    password: [''],
    unit_ids: [[]]
  });

  ngOnInit() {
    this.loadUnits();
    if (this.employee) {
      const formData = { ...this.employee };
      console.log("Form Data", formData);


      // Parse authority string into array for MultiSelect
      let unitIds: number[] = [];
      if (this.employee.audit_unit_authority) {
        unitIds = this.employee.audit_unit_authority.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      }

      this.form.patchValue({
        ...formData,
        user_type_id: formData.user_type_id ? Number(formData.user_type_id) : null,
        unit_ids: unitIds,
        password: '' // Don't show hashed password in form
      });
    }
  }

  loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (data) => {
        this.units = data;
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
