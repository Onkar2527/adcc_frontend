import {
  Component,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
  CheckboxFieldComponent,
  FormActionsComponent,
  SelectFieldComponent,
  TextFieldComponent,
} from '../../../shared/components/form';

import {
  AuditAnnexureMasterService,
  CreateAnnexureDto,
} from '../services/masters.service';

@Component({
  selector: 'app-audit-annexure-form',

  standalone: true,

  imports: [
    CommonModule,
    TextFieldComponent,
    SelectFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent,
  ],

  template: `
  <div class="max-h-[90vh] p-4 overflow-y-auto">

    <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

      <div class="flex flex-column gap-3">

        <!-- Annexure Name -->

        <div>
          <app-text-field
            label="Annexure Name"
            [field]="name"
            placeholder="Enter annexure name"
            [required]="true"
          ></app-text-field>
        </div>

        <!-- Layout Type (Grid vs Vertical Form) -->

        <div>
          <app-select-field
            label="Annexure Layout Type"
            [field]="layoutType"
            [options]="layoutOptions"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            [virtualScroll]="false"
          ></app-select-field>
        </div>

        <!-- Risk Definition + Risk Category -->

        <div class="grid">

          <div class="col-12 md:col-6">
            <app-select-field
              label="Risk Definition"
              [field]="riskDefinationId"
              [options]="riskDefinitionOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
              [virtualScroll]= "false"
            ></app-select-field>
          </div>

          <div class="col-12 md:col-6">
            <app-select-field
              label="Risk Category"
              [field]="riskCategoryId"
              [options]="riskCategories()"
              optionLabel="label"
              optionValue="value"
              [required]="true"
            ></app-select-field>
          </div>

        </div>

        <!-- Business Risk + Control Risk -->

        <div class="grid">

          <div class="col-12 md:col-6">
            <app-select-field
              label="Business Risk"
              [field]="businessRisk"
              [options]="riskOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
              [virtualScroll]= "false"
            ></app-select-field>
          </div>

          <div class="col-12 md:col-6">
            <app-select-field
              label="Control Risk"
              [field]="controlRisk"
              [options]="riskOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
              [virtualScroll]= "false"
            ></app-select-field>
          </div>

        </div>

        <!-- Active -->

        <div class="pt-2">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
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
`,
})
export class AuditAnnexureFormComponent {
  private ref = inject(FormDrawerRef);

  private annexureService = inject(
    AuditAnnexureMasterService,
  );

  private messageService = inject(
    MessageService,
  );

  name = signal('');

  riskDefinationId = signal<number | null>(
    null,
  );

  riskCategoryId = signal<number | null>(
    null,
  );

  businessRisk = signal<number | null>(
    null,
  );

  controlRisk = signal<number | null>(
    null,
  );

  layoutType = signal<string>('grid');

  isActive = signal(true);

  saving = signal(false);

  riskCategories = signal<
    { label: string; value: number }[]
  >([]);

  layoutOptions = [
    {
      label: 'Table Grid (Horizontal Multi-Row List)',
      value: 'grid',
    },
    {
      label: 'Vertical Form (तपशिल & शेरा 2-Column Key-Value)',
      value: 'form',
    },
  ];

  riskDefinitionOptions = [
    {
      label: 'Default',
      value: 0,
    },
    {
      label: 'Custom',
      value: 1,
    },
  ];

  riskOptions = [
    {
      label: 'High',
      value: 1,
    },
    {
      label: 'Medium',
      value: 2,
    },
    {
      label: 'Low',
      value: 3,
    },
  ];

  constructor() {
    this.loadRiskCategories();

    const data = this.ref.data;

    if (data) {
      this.name.set(data.name ?? '');
      this.layoutType.set(data.layout_type || 'grid');

      this.riskDefinationId.set(
        data.risk_defination_id !== null &&
          data.risk_defination_id !== undefined
          ? Number(data.risk_defination_id)
          : null,
      );

      this.riskCategoryId.set(
        data.risk_category_id !== null &&
          data.risk_category_id !== undefined
          ? Number(data.risk_category_id)
          : null,
      );

      this.businessRisk.set(
        data.business_risk !== null &&
          data.business_risk !== undefined
          ? Number(data.business_risk)
          : null,
      );

      this.controlRisk.set(
        data.control_risk !== null &&
          data.control_risk !== undefined
          ? Number(data.control_risk)
          : null,
      );

      this.isActive.set(
        Number(data.is_active) !== 0,
      );
    }
  }

  private loadRiskCategories() {
    this.annexureService
      .getLookups()
      .subscribe({
        next: (res: any) => {

          const rows = Array.isArray(res?.riskCategories)
            ? res.riskCategories
            : [];

          this.riskCategories.set(
            rows.map((item: any) => ({
              label:
                item.label ??
                item.risk_category ??
                item.name ??
                '-',

              value:
                item.value ??
                item.id,
            })),
          );
        },

        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              'Unable to load risk categories',
          });
        },
      });
  }

  save() {
    const name = this.name().trim();

    const risk_defination_id =
      this.riskDefinationId();

    const risk_category_id =
      this.riskCategoryId();

    const business_risk =
      this.businessRisk();

    const control_risk =
      this.controlRisk();

    const is_active = this.isActive()
      ? 1
      : 0;

    if (
      !name ||
      risk_defination_id === null ||
      risk_category_id === null ||
      business_risk === null ||
      control_risk === null
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail:
          'Please fill required fields',
      });

      return;
    }

    this.saving.set(true);

    const payload: CreateAnnexureDto = {
      name,

      risk_defination_id,

      risk_category_id,

      business_risk,

      control_risk,

      layout_type: this.layoutType() || 'grid',

      is_active,
    };

    const obs = this.ref.data
      ? this.annexureService.update(
        this.ref.data.id,
        payload,
      )
      : this.annexureService.create(
        payload,
      );

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);

        this.ref.close({
          saved: true,
          data: res,
        });
      },

      error: () => {
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.ref.close();
  }
}