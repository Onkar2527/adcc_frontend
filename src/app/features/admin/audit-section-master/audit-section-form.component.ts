import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  TextFieldComponent,
  FormActionsComponent
} from '../../../shared/components/form';
import { AuditSectionService } from '../services/masters.service';

@Component({
  selector: 'app-audit-section-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4">
      <div class="flex-grow-1 overflow-y-auto">
        <app-text-field
          label="Section Name"
          [field]="name"
          placeholder="Enter section name"
          class="mb-3"
        ></app-text-field>
      </div>

      <app-form-actions
        class="mt-auto pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>
    </div>
  `
})
export class AuditSectionFormComponent {
  private ref = inject(FormDrawerRef);
  private auditSectionService = inject(AuditSectionService);

  name = signal('');
  saving = signal(false);
  isEdit = false;

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.name.set(data.name || '');
    }
  }

  save() {
    const name = this.name().trim().toUpperCase();
    if (!name) return;

    this.saving.set(true);
    const payload = { name };

    const obs = this.isEdit
      ? this.auditSectionService.update(this.ref.data.id, payload)
      : this.auditSectionService.create(payload);

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
