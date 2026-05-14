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
   <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="flex flex-column gap-4">

      <!-- Section Name -->
      <div class="grid">

        <div class="col-12 ">
          <app-text-field
            label="Section Name"
            [field]="name"
            placeholder="Enter section name"
          ></app-text-field>
        </div>

      </div>

    </div>

    <!-- Footer -->
    <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">

      <app-form-actions
        [loading]="saving()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>

    </div>

  </div>

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
