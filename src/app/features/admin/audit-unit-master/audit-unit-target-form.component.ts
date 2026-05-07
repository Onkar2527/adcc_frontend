import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  CheckboxFieldComponent,
  DateFieldComponent,
  FormActionsComponent,
  SelectFieldComponent,
  TextFieldComponent
} from '../../../shared/components/form';
import { AuditSectionService, AuditUnitService, CreateAuditUnitDto, EmployeeService } from '../services/masters.service';

@Component({
  selector: 'app-audit-unit-target-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    SelectFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
  <div class="flex flex-column gap-2">
    <app-select-field label="Year" [field]="yearId" [options]="years()"  optionLabel="label" optionValue="value"></app-select-field>
    <app-text-field label="Deposit Target" [field]="deposit"></app-text-field>
    <app-text-field label="Advances Target" [field]="advances"></app-text-field>
    <app-text-field label="NPA Target" [field]="npa"></app-text-field>
  </div>

    <app-form-actions (save)="save()" (cancel)="cancel()" [loading]="saving()"></app-form-actions>
  `
})
export class AuditUnitTargetFormComponent {
  @Input() loading = false;
  private ref = inject(FormDrawerRef);
  private auditUnitService = inject(AuditUnitService);

  yearId = signal<number | null>(null);
  deposit = signal('');
  advances = signal('');
  npa = signal('');

  years = signal<any[]>([]);

  saving = signal(false);


  constructor() {
    this.loadYears();
    const data = this.ref.data;

    if (data) {
      this.yearId.set(data.year_id ?? null);
      this.deposit.set(data.deposit_target ?? '');
      this.advances.set(data.advances_target ?? '');
      this.npa.set(data.npa_target ?? '')
    }
  }

  private loadYears() {
    this.auditUnitService.getYears().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.rows)
              ? res.rows
              : [];

        this.years.set(
          rows.map((item: any) => ({
            label: item.year ?? item.label,
            value: item.id ?? item.value
          }))
        );
      }
    });
  }

  save() {
    const yearId = this.yearId();

    if (!yearId) {
      console.warn('Year not selected');
      return;
    }

    const payload = {
      audit_unit_id: this.ref.data?.audit_unit_id,
      year_id: Number(yearId),
      deposit_target: this.deposit(),
      advances_target: this.advances(),
      npa_target: this.npa()
    };

    this.saving.set(true);

    const obs = this.ref.data?.id
      ? this.auditUnitService.updateTarget(this.ref.data.id, payload)
      : this.auditUnitService.createTarget(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close({ saved: true });
      },
      error: (err) => {
        this.saving.set(false);
        console.error(err);
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
