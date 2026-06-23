import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  TextFieldComponent,
  FormActionsComponent,
  MultiSelectFieldComponent,
} from '../../../shared/components/form';
import {
  AuditSectionService,
  AuditTypeService,
} from '../services/masters.service';

@Component({
  selector: 'app-audit-section-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    MultiSelectFieldComponent,
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

        <div class="col-12">
          <app-multi-select-field
            label="Audit Types"
            [field]="auditTypeIds"
            [options]="auditTypes()"
            optionLabel="label"
            optionValue="value"
            display="chip"
            [filter]="true"
            filterBy="label"
            [required]="true"
            [virtualScroll]="false"
          ></app-multi-select-field>
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
  private auditTypeService = inject(AuditTypeService);

  name = signal('');
  auditTypes = signal<any[]>([]);
  auditTypeIds = signal<number[]>([]);
  saving = signal(false);
  isEdit = false;

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.name.set(data.name || '');
      this.auditTypeIds.set(
        String(data.audit_type_id || '')
          .split(',')
          .map((id) => Number(id.trim()))
          .filter(Boolean),
      );
    }

    this.loadAuditTypes();
  }

  save() {
    const name = this.name().trim().toUpperCase();
    if (!name || !this.auditTypeIds().length) return;

    this.saving.set(true);
    const payload = {
      name,
      audit_type_id: this.auditTypeIds().join(','),
    };

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

  private loadAuditTypes() {
    this.auditTypeService.findAll().subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.rows)
              ? response.rows
              : [];

        this.auditTypes.set(
          rows
            .filter((row: any) => Number(row.is_active) === 1)
            .map((row: any) => ({
              label: row.name,
              value: Number(row.id),
            })),
        );
      },
    });
  }
}
