import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
  TextFieldComponent,
  FormActionsComponent,
  SelectFieldComponent,
  CheckboxFieldComponent
} from '../../../shared/components/form';

import {
  AuditSectionService,
  BorderAreaMasterService,
  MenuMasterService
} from '../services/masters.service';

@Component({
  selector: 'app-border-area-master-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    SelectFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
   <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="grid">

      <!-- Broader Area -->
      <div class="col-12">
        <app-text-field
          label="Broader Area of Non-Compliance"
          [field]="name"
          placeholder="Broader Area"
        ></app-text-field>
      </div>

      <!-- Risk Appetite -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Risk Appetite"
          [field]="appetite_percent"
          placeholder="Risk appetite"
        ></app-text-field>
      </div>

      <!-- Probability -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Probability Of Occurrence"
          [field]="occurance_percent"
          placeholder="Probability of occurrence %"
        ></app-text-field>
      </div>

      <!-- Magnitude -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Magnitude"
          [field]="magnitude"
          placeholder="Magnitude"
        ></app-text-field>
      </div>

      <!-- Frequency -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Frequency"
          [field]="frequency"
          placeholder="Frequency"
        ></app-text-field>
      </div>

      <!-- Average Qualitative Count -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Average Qualitative Count"
          [field]="average_qualitative_count"
          placeholder="Average qualitative count"
        ></app-text-field>
      </div>

      <!-- Average Quantitative Count -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Average Quantitative Count"
          [field]="average_quantitative_count"
          placeholder="Average quantitative count"
        ></app-text-field>
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
export class BorderAreaMasterFormComponent {

  private ref = inject(FormDrawerRef);
  private borderAreaService = inject(BorderAreaMasterService);
  private sectionTypeService = inject(AuditSectionService);

  
  name = signal('');
  appetite_percent = signal('');
  occurance_percent = signal('');
  magnitude = signal('');
  frequency = signal('');
  average_qualitative_count = signal('');
  average_quantitative_count = signal('');
  

  saving = signal(false);
  isEdit = false;

  sectionTypeOptions = signal<any[]>([]);

  constructor() {
    this.getsectionTypeOptions();

    const data = this.ref.data;

   if (data) {
  this.isEdit = true;

  
  this.name.set(data.name || '');
  this.appetite_percent.set(data.appetite_percent || '');
  this.occurance_percent.set(data.occurance_percent || '');
  this.magnitude.set(data.magnitude || '');
  this.frequency.set(data.frequency || '');
  this.average_qualitative_count.set(data.average_qualitative_count || '');
  this.average_quantitative_count.set(data.average_quantitative_count || '');
}
  }

  save() {

    const sectionName = this.name().trim().toUpperCase();

    if (!sectionName) return;

    this.saving.set(true);

    const payload = {
      name: sectionName,
      appetite_percent: this.appetite_percent(),
      occurance_percent: this.occurance_percent(),
      magnitude: this.magnitude(),
      frequency: this.frequency(),
      average_qualitative_count: this.average_qualitative_count(),
      average_quantitative_count: this.average_quantitative_count()
    };

    const obs = this.isEdit
      ? this.borderAreaService.updateBorderArea(this.ref.data.id, payload)
      : this.borderAreaService.createBorderArea(payload);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
  tableDropdownOptions = [
    { label: 'None', value: 0 },
    { label: 'Branch Master', value: 1 },
    { label: 'Menu Master', value: 2 },
    { label: 'User Master', value: 3 }
  ];

  getsectionTypeOptions() {
    this.sectionTypeService.findAll().subscribe({
      next: (res: any) => {

        const rows = Array.isArray(res)
          ? res
          : res?.rows || [];

        this.sectionTypeOptions.set(
          rows.map((item: any) => ({
            label: item.name,
            value: Number(item.id)
          }))
        );
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}