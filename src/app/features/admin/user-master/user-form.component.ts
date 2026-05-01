import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { 
  TextFieldComponent, 
  SelectFieldComponent,
  CheckboxFieldComponent, 
  FormActionsComponent 
} from '../../../shared/components/form';
import { MasterUserService, RoleService, BranchService } from '../services/masters.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, 
    TextFieldComponent, 
    SelectFieldComponent,
    CheckboxFieldComponent, 
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4">
      <div class="flex-grow-1 overflow-y-auto">
        <app-text-field
          label="Full Name"
          [field]="fullName"
          placeholder="Enter full name"
          class="mb-3"
        ></app-text-field>

        <div class="grid">
          <div class="col-6">
            <app-text-field
              label="Username"
              [field]="username"
              placeholder="Username"
              class="mb-3"
            ></app-text-field>
          </div>
          <div class="col-6">
            <app-text-field
              label="Password"
              [field]="password"
              placeholder="Leave blank to keep current"
              type="password"
              class="mb-3"
            ></app-text-field>
          </div>
        </div>

        <div class="grid">
          <div class="col-6">
            <app-select-field
              label="Role"
              [field]="roleId"
              [options]="roleOptions()"
              optionValue="value"
              placeholder="Select role"
              class="mb-3"
            ></app-select-field>
          </div>
          <div class="col-6">
            <app-select-field
              label="Branch"
              [field]="branchId"
              [options]="branchOptions()"
              optionValue="value"
              placeholder="Select branch"
              class="mb-3"
            ></app-select-field>
          </div>
        </div>

        <app-text-field
          label="Email Address"
          [field]="email"
          placeholder="email@example.com"
          class="mb-3"
        ></app-text-field>

        <app-text-field
          label="Mobile Number"
          [field]="mobileNumber"
          placeholder="Enter mobile number"
          class="mb-3"
        ></app-text-field>

        <app-checkbox-field
          label="Is Active"
          [field]="isActive"
        ></app-checkbox-field>
      </div>

      <app-form-actions
        class="mt-auto pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        (onSave)="save()"
        (onCancel)="cancel()"
      ></app-form-actions>
    </div>
  `
})
export class UserFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private userService = inject(MasterUserService);
  private roleService = inject(RoleService);
  private branchService = inject(BranchService);

  fullName = signal('');
  username = signal('');
  password = signal('');
  email = signal('');
  mobileNumber = signal('');
  roleId = signal<string | null>(null);
  branchId = signal<string | null>(null);
  isActive = signal(true);
  
  saving = signal(false);
  isEdit = false;

  roleOptions = signal<any[]>([]);
  branchOptions = signal<any[]>([]);

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.fullName.set(data.full_name);
      this.username.set(data.username);
      this.email.set(data.email || '');
      this.mobileNumber.set(data.mobile_number || '');
      this.roleId.set(data.role_id);
      this.branchId.set(data.branch_id);
      this.isActive.set(data.is_active);
    }
  }

  ngOnInit() {
    this.loadOptions();
  }

  loadOptions() {
    forkJoin({
      roles: this.roleService.findAll(),
      branches: this.branchService.findAll()
    }).subscribe({
      next: (res: any) => {
        this.roleOptions.set(res.roles.data.map((r: any) => ({ label: r.role_name, value: r.id })));
        this.branchOptions.set(res.branches.data.map((b: any) => ({ label: b.branch_name, value: b.id })));
      }
    });
  }

  save() {
    if (!this.username() || !this.fullName()) return;

    this.saving.set(true);
    const payload: any = {
      username: this.username(),
      full_name: this.fullName(),
      email: this.email(),
      mobile_number: this.mobileNumber(),
      role_id: this.roleId(),
      branch_id: this.branchId(),
      is_active: this.isActive()
    };

    if (this.password()) {
      payload.password = this.password();
    }

    const obs = this.isEdit 
      ? this.userService.update(this.ref.data.id, payload)
      : this.userService.create(payload);

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
}
