import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Employee, CreateEmployeeDto } from '../models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Output() save = new EventEmitter<CreateEmployeeDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  userTypeOptions = [
    { label: 'Admin', value: 1 },
    { label: 'Auditor', value: 2 },
    { label: 'Employee', value: 3 },
    { label: 'Reviewer', value: 4 },
    { label: 'Top Level Management', value: 5 }
  ];

  form: FormGroup = this.fb.group({
    emp_code: ['', Validators.required],
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', Validators.required],
    designation: [''],
    gender: ['', Validators.required],
    user_type_id: [null, Validators.required],
  });

  ngOnInit() {
    if (this.employee) {
      this.form.patchValue(this.employee);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
