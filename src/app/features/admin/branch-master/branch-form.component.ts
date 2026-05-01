import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { 
  TextFieldComponent, 
  CheckboxFieldComponent, 
  TextareaFieldComponent, 
  FormActionsComponent 
} from '../../../shared/components/form';
import { BranchService } from '../services/masters.service';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [
    CommonModule, 
    TextFieldComponent, 
    CheckboxFieldComponent, 
    TextareaFieldComponent, 
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4">
      <div class="flex-grow-1 overflow-y-auto">
        <app-text-field
          label="Branch Code"
          [field]="branchCode"
          placeholder="e.g. BR001"
          class="mb-3"
        ></app-text-field>

        <app-text-field
          label="Branch Name"
          [field]="branchName"
          placeholder="Enter branch name"
          class="mb-3"
        ></app-text-field>

        <app-text-field
          label="Contact Number"
          [field]="contactNumber"
          placeholder="Enter contact number"
          class="mb-3"
        ></app-text-field>

        <app-textarea-field
          label="Address"
          [field]="address"
          placeholder="Enter branch address"
          [rows]="3"
          class="mb-3"
        ></app-textarea-field>

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
export class BranchFormComponent {
  private ref = inject(FormDrawerRef);
  private branchService = inject(BranchService);

  branchCode = signal('');
  branchName = signal('');
  contactNumber = signal('');
  address = signal('');
  isActive = signal(true);
  
  saving = signal(false);
  isEdit = false;

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.branchCode.set(data.branch_code);
      this.branchName.set(data.branch_name);
      this.contactNumber.set(data.contact_number || '');
      this.address.set(data.address || '');
      this.isActive.set(data.is_active);
    }
  }

  save() {
    if (!this.branchCode() || !this.branchName()) return;

    this.saving.set(true);
    const payload = {
      branch_code: this.branchCode(),
      branch_name: this.branchName(),
      contact_number: this.contactNumber(),
      address: this.address(),
      is_active: this.isActive()
    };

    const obs = this.isEdit 
      ? this.branchService.update(this.ref.data.id, payload)
      : this.branchService.create(payload);

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
