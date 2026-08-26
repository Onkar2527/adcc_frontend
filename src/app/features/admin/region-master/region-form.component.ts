import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  FormActionsComponent,
  MultiSelectFieldComponent,
  TextFieldComponent,
  CheckboxFieldComponent
} from '../../../shared/components/form';
import {
  AuditUnit,
  CreateRegionDto,
  Region,
  RegionMasterService,
  UnitsService,
  UpdateRegionDto
} from '../services/masters.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-region-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextFieldComponent,
    MultiSelectFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="max-h-[90vh] p-4 overflow-y-auto">
      <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">
        
        <!-- Row 1: Region Name -->
        <div class="grid">
          <div class="col-12">
            <app-text-field
              label="Region Name"
              [field]="regionName"
              [required]="true"
              [error]="regionNameError()"
            ></app-text-field>
          </div>
        </div>

        <!-- Row 2: Audit Units MultiSelect -->
        <div class="grid mt-3">
          <div class="col-12">
            <app-multi-select-field
              label="Audit Units"
              [field]="unitIds"
              [options]="units()"
              optionLabel="name"
              optionValue="id"
              display="chip"
              [required]="true"
              [error]="unitIdsError()"
            ></app-multi-select-field>
          </div>
        </div>

        <!-- Row 3: Is Active -->
        <div class="grid mt-3">
          <div class="col-12 flex align-items-center">
            <app-checkbox-field
              label="Is Active"
              [field]="isActive"
            ></app-checkbox-field>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">
          <app-form-actions
            [loading]="saving()"
            [saveDisabled]="false"
            (save)="save()"
            (cancel)="cancel()"
          ></app-form-actions>
        </div>

      </div>
    </div>
  `
})
export class RegionFormComponent {
  private ref = inject(FormDrawerRef);
  private regionService = inject(RegionMasterService);
  private unitsService = inject(UnitsService);
  private messageService = inject(MessageService);

  regionName = signal('');
  unitIds = signal<number[]>([]);
  isActive = signal(true);
  units = signal<AuditUnit[]>([]);
  saving = signal(false);
  isEdit = false;

  regionNameError = computed(() =>
    this.regionName().trim() ? '' : 'Region name is required'
  );

  unitIdsError = computed(() =>
    this.unitIds().length ? '' : 'Select at least one audit unit'
  );

  isValid = computed(() =>
    !this.regionNameError() && !this.unitIdsError()
  );

  constructor() {
    this.loadUnits();
    const data = this.ref.data as Region | null;
    if (data) {
      this.isEdit = true;
      this.regionName.set(data.region_name || '');
      this.unitIds.set(data.unit_ids || []);
      this.isActive.set(Number(data.is_active) === 1);
    }
  }

  save() {
    if (!this.isValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: this.regionNameError() || this.unitIdsError() || 'Please correct the highlighted fields'
      });
      return;
    }

    this.saving.set(true);

    const payload: CreateRegionDto | UpdateRegionDto = {
      region_name: this.regionName().trim(),
      unit_ids: this.unitIds(),
      is_active: this.isActive() ? 1 : 0
    };

    const obs = this.isEdit
      ? this.regionService.update(this.ref.data.id, payload)
      : this.regionService.create(payload as CreateRegionDto);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to save region details'
        });
      }
    });
  }

  cancel() {
    this.ref.close();
  }

  private loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (err) => {
        this.units.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to load audit units'
        });
      }
    });
  }
}
