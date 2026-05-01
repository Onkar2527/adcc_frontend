import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { 
  TextFieldComponent, 
  CheckboxFieldComponent, 
  TextareaFieldComponent, 
  FormActionsComponent 
} from '../../../shared/components/form';
import { RoleService } from '../services/masters.service';

@Component({
  selector: 'app-role-form',
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
      <div class="flex-grow-1">
        <app-text-field
          label="Role Name"
          [field]="roleName"
          placeholder="e.g. administrator"
          class="mb-3"
        ></app-text-field>

        <app-textarea-field
          label="Description"
          [field]="description"
          placeholder="Enter role description"
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
export class RoleFormComponent {
  private ref = inject(FormDrawerRef);
  private roleService = inject(RoleService);

  roleName = signal('');
  description = signal('');
  isActive = signal(true);
  
  saving = signal(false);
  isEdit = false;

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.roleName.set(data.role_name);
      this.description.set(data.description || '');
      this.isActive.set(data.is_active);
    }
  }

  save() {
    if (!this.roleName()) return;

    this.saving.set(true);
    const payload = {
      role_name: this.roleName(),
      description: this.description(),
      is_active: this.isActive()
    };

    const obs = this.isEdit 
      ? this.roleService.update(this.ref.data.id, payload)
      : this.roleService.create(payload);

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
