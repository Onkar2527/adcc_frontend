import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  CheckboxFieldComponent,
  FormActionsComponent,
  TextareaFieldComponent,
  TextFieldComponent,
} from '../../../shared/components/form';
import { AuditTypeService } from '../services/masters.service';

@Component({
  selector: 'app-audit-type-master-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent,
  ],
  template: `
    <div class="max-h-[90vh] p-4 overflow-y-auto">
      <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">
        <div class="flex flex-column gap-4">
          <div class="grid">
            <div class="col-12 md:col-6">
              <app-text-field
                label="Code"
                [field]="code"
                [required]="true"
                [maxlength]="50"
                [error]="codeError()"
              ></app-text-field>
            </div>

            <div class="col-12 md:col-6">
              <app-text-field
                label="Audit Type Name"
                [field]="name"
                [required]="true"
                [maxlength]="150"
                [error]="nameError()"
              ></app-text-field>
            </div>
          </div>

          <div class="grid">
            <div class="col-12">
              <app-textarea-field
                label="Description"
                [field]="description"
                [rows]="4"
                [maxlength]="500"
              ></app-textarea-field>
            </div>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6 flex align-items-center pt-2">
              <app-checkbox-field
                label="Is Active"
                [field]="isActive"
              ></app-checkbox-field>
            </div>
          </div>
        </div>

        <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">
          <app-form-actions
            [loading]="saving()"
            [saveDisabled]="!isValid()"
            (save)="save()"
            (cancel)="cancel()"
          ></app-form-actions>
        </div>
      </div>
    </div>
  `,
})
export class AuditTypeMasterFormComponent {
  private ref = inject(FormDrawerRef);
  private auditTypeService = inject(AuditTypeService);

  code = signal('');
  name = signal('');
  description = signal('');
  isSystem = signal(false);
  isActive = signal(true);
  codeError = signal('');
  nameError = signal('');
  saving = signal(false);

  isEdit = false;
  originalIsSystem = false;

  constructor() {
    const data = this.ref.data;
    if (!data) return;

    this.isEdit = true;
    this.originalIsSystem = Number(data.is_system) === 1;
    this.code.set(data.code || '');
    this.name.set(data.name || '');
    this.description.set(data.description || '');
    this.isSystem.set(this.originalIsSystem);
    this.isActive.set(Number(data.is_active) === 1);
  }

  isValid(): boolean {
    return Boolean(this.code().trim() && this.name().trim());
  }

  save(): void {
    this.validate();
    if (!this.isValid()) return;

    this.saving.set(true);
    const payload = {
      code: this.normalizedCode(),
      name: this.name().trim(),
      description: this.description().trim() || null,
      is_system: this.isSystem() ? 1 : 0,
      is_active: this.isActive() ? 1 : 0,
    };

    const request = this.isEdit
      ? this.auditTypeService.update(this.ref.data.id, payload)
      : this.auditTypeService.create(payload);

    request.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: response });
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.ref.close();
  }

  private validate(): void {
    this.codeError.set(this.code().trim() ? '' : 'Audit type code is required');
    this.nameError.set(this.name().trim() ? '' : 'Audit type name is required');
  }

  private normalizedCode(): string {
    return this.code()
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
