import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  SelectFieldComponent,
  TextareaFieldComponent,
  FormActionsComponent,
} from '../../../shared/components/form';
import { IncidentService } from '../services/incident.service';
import { UnitsService } from '../services/masters.service';

@Component({
  selector: 'app-incident-form',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SelectFieldComponent,
    TextareaFieldComponent,
    FormActionsComponent,
  ],
  template: `
    <div class="flex flex-column h-full p-4" style="max-height: 90vh; overflow-y: auto;">
      <div class="flex-grow-1 overflow-y-auto pr-2">
        <div class="grid">
          <div class="col-12 mb-3">
            <app-select-field
              label="Audit Unit"
              [field]="auditUnitId"
              [options]="unitOptions()"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Audit Unit..."
              [required]="true"
              [filter]="true"
            ></app-select-field>
          </div>

          <div class="col-12 mb-3">
            <app-select-field
              label="Incident Type"
              [field]="incidentType"
              [options]="incidentTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Incident Type..."
              [required]="true"
              [filter]="false"
            ></app-select-field>
          </div>

          <div class="col-12 mb-3">
            <app-textarea-field
              label="Description"
              [field]="description"
              placeholder="Enter incident details (e.g. description of issue, staff involved, etc.)"
              [rows]="5"
              [required]="true"
            ></app-textarea-field>
          </div>
        </div>
      </div>

      <app-form-actions
        class="mt-4 pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        [saveDisabled]="!isValid()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>
    </div>
  `,
})
export class IncidentFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private incidentService = inject(IncidentService);
  private unitsService = inject(UnitsService);

  auditUnitId = signal<number | null>(null);
  incidentType = signal<string>('');
  description = signal<string>('');

  saving = signal(false);
  isEdit = false;

  unitOptions = signal<any[]>([]);
  incidentTypeOptions = [
    { label: 'Light Issue', value: 'light issue' },
    { label: 'Network Issue', value: 'network issue' },
    { label: 'Staff Issues', value: 'staff issue' },
    { label: 'Other Issues', value: 'other issue' },
  ];

  ngOnInit() {
    this.loadUnits();
  }

  loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (unitsList) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleId = String(user.user_type_id || '');
        const authorityStr = user.audit_unit_authority || '';

        if (roleId === '2' || roleId === '3') {
          const authIds = authorityStr
            .split(',')
            .map((id: string) => parseInt(id, 10))
            .filter((id: number) => !isNaN(id));

          this.unitOptions.set(unitsList.filter((u) => authIds.includes(u.id)));
        } else {
          this.unitOptions.set(unitsList);
        }
      },
      error: (err) => {
        console.error('Failed to load units', err);
      },
    });
  }

  constructor() {
    const data = this.ref.data;
    if (data && data.id) {
      this.isEdit = true;
      this.auditUnitId.set(Number(data.audit_unit_id));
      this.incidentType.set(data.incident_type || '');
      this.description.set(data.description || '');
    }
  }

  isValid(): boolean {
    const hasUnit = this.auditUnitId() !== null;
    const hasType = !!this.incidentType();
    const hasDesc = !!this.description().trim();

    return hasUnit && hasType && hasDesc;
  }

  save() {
    if (!this.isValid()) return;

    this.saving.set(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const employeeId = Number(user.id || 0);

    const payload = {
      audit_unit_id: this.auditUnitId(),
      incident_type: this.incidentType(),
      description: this.description().trim(),
    };

    const obs = this.isEdit
      ? this.incidentService.update(this.ref.data.id, payload)
      : this.incidentService.create(payload, employeeId);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: (err) => {
        console.error('Failed to save incident', err);
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.ref.close();
  }
}
