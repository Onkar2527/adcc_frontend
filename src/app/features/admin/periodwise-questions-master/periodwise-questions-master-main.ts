import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { user_types } from '../services/required-data';
import {
    TextFieldComponent,
    FormActionsComponent,
    SelectFieldComponent,
    CheckboxFieldComponent
} from '../../../shared/components/form';

import {
    AuditSectionService,
    AuditUnitService,
    MenuMasterService,
    PeriodwiseQuestionsMasterService
} from '../services/masters.service';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-menu-master-form',
    standalone: true,
    imports: [
        CommonModule,
        TextFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent
    ],
    template: `
    <div class="h-full flex flex-column p-4">

  <!-- Panel -->
  <div class="border-1 border-gray-300 border-round-lg p-4 shadow-1 bg-white flex-1">

    <div class="grid">

      <!-- Section Type -->
      <div class="col-12 ">
        <app-select-field
          label="User Type"
          [field]="user_type_id"
          [options]="userTypeOptions()"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [virtualScroll]="false"
          scrollHeight="90px"
        ></app-select-field>
      </div>
     
   
      <!-- Linked Table -->
      <div class="col-12 md:col-6">
        <app-select-field
          label="Financial Year"
          [field]="year_id"
          [options]="years()"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [virtualScroll]="false"
          scrollHeight="90px"
        ></app-select-field>
      </div>

      <!-- Active -->
    <div class="col-12 md:col-6">
        <app-select-field
          label="Audit Unit"
          [field]="audit_unit_id"
          [options]="sectionTypeOptions()"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [virtualScroll]="false"
          scrollHeight="90px"
        (onChange)="onAuditUnitChange()"
        ></app-select-field>
      </div>

     <div class="col-12 md:col-6">
  <app-text-field
    label="Start Month"
    [field]="start_month_year"
    placeholder="YYYY-MM"
    [maxlength]="7"
    (input)="validateMonthYear('start')"
  ></app-text-field>
</div>

<div class="col-12 md:col-6">
  <app-text-field
    label="End Month"
    [field]="end_month_year"
    placeholder="YYYY-MM"
    [maxlength]="7"
    (input)="validateMonthYear('end')"
  ></app-text-field>
</div>
    </div>

  </div>

  <!-- Footer -->
  <div class="mt-auto pt-4 border-top-1 border-gray-200">
    <app-form-actions
    *ngIf="isMonthValid()"
      [loading]="saving()"
      (save)="save()"
      (cancel)="cancel()"
    ></app-form-actions>
  </div>

</div>
  `
})
export class PeriodwiseQuestionsMasterFormComponent {

    private ref = inject(FormDrawerRef);
    private PeriodwiseQuestionsMasterService = inject(PeriodwiseQuestionsMasterService);
    private auditUnitService = inject(AuditUnitService);
    private messageService = inject(MessageService);

    audit_unit_id = signal<number | null>(0);
    user_type_id = signal<string | null>('0');
    start_month_year = signal('');
    end_month_year = signal('');
    year_id = signal<string | null>('');
    section_type_id = signal<number | null>(0);
    isMonthValid = signal(true);
    saving = signal(false);
    isEdit = false;

    sectionTypeOptions = signal<any[]>([]);
    userTypeOptions = signal<any[]>([]);
    years = signal<any[]>([]);
    constructor() {

        const data = this.ref.data;

        this.getuserTypeOptions();

        this.loadBranches(data);

        this.loadYears();

        if (data) {

            this.isEdit = true;

            setTimeout(() => {

                this.user_type_id.set(
                    String(data.user_type_id) || '0'
                );

                this.audit_unit_id.set(
                    Number(data.audit_unit_id) || 0
                );
                  this.onAuditUnitChange();
                this.start_month_year.set(
                    data.start_month_year || ''
                );

                this.end_month_year.set(
                    data.end_month_year || ''
                );

                this.year_id.set(
                    String(data.year_id) || ''
                );

            }, 500);

        }

    }

    validateMonthYear(type: 'start' | 'end') {

        this.isMonthValid.set(true);

        const value =
            type === 'start'
                ? this.start_month_year()
                : this.end_month_year();

        // Wait until full value entered
        if (value.length !== 7) {
            this.isMonthValid.set(false);
            return;
        }

        // Strict YYYY-MM validation
        const regex = /^(19|20)\d{2}-(0[1-9]|1[0-2])$/;

        if (!regex.test(value)) {

            this.isMonthValid.set(false);

            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Format',
                detail:
                    'Month format must be YYYY-MM (example: 2025-02)'
            });

            return;
        }

        // Financial year validation
        const selectedYear = this.years().find(
            (y) => y.value == this.year_id()
        );

        if (!selectedYear) {

            this.isMonthValid.set(false);

            this.messageService.add({
                severity: 'warn',
                summary: 'Select Financial Year',
                detail: 'Please select financial year first'
            });

            return;
        }

        const [fyStart, fyEnd] =
            selectedYear.label.split('-').map(Number);

        const [year, month] =
            value.split('-').map(Number);

        let valid = false;


        if (
            year === fyStart &&
            month >= 4 &&
            month <= 12
        ) {
            valid = true;
        }


        if (
            year === fyEnd &&
            month >= 1 &&
            month <= 3
        ) {
            valid = true;
        }

        if (!valid) {

            this.isMonthValid.set(false);

            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Month',
                detail:
                    `Valid range for FY ${selectedYear.label} is:
${fyStart}-04 to ${fyStart}-12
and
${fyEnd}-01 to ${fyEnd}-03`
            });

            return;
        }

        // Start month <= End month validation
        if (
            this.start_month_year().length === 7 &&
            this.end_month_year().length === 7
        ) {

            if (
                this.start_month_year() >
                this.end_month_year()
            ) {

                this.isMonthValid.set(false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Invalid Period',
                    detail:
                        'Start month cannot be greater than end month'
                });

                return;
            }

        }

    }
    onAuditUnitChange() {

        const selectedBranch = this.sectionTypeOptions().find(
            (o: any) => o.value == this.audit_unit_id()
        );

        this.section_type_id.set(
            Number(selectedBranch?.section_type_id || 0)
        );



    }

    save() {




        this.saving.set(true);

        const payload = {
            start_month_year: this.start_month_year(),
            end_month_year: this.end_month_year(),
            year_id: Number(this.year_id()) ?? 0,
            user_type_id: Number(this.user_type_id()) ?? 0,
            audit_unit_id: Number(this.audit_unit_id()) ?? 0,
            section_type_id: Number(this.section_type_id()) ?? 0
        };

        const obs = this.isEdit
            ? this.PeriodwiseQuestionsMasterService.update(this.ref.data.id, payload)
            : this.PeriodwiseQuestionsMasterService.create(payload);

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
    loadBranches(data?: any) {

        this.auditUnitService.findAll().subscribe({

            next: (res: any) => {

                const rows = Array.isArray(res)
                    ? res
                    : res?.data || [];

                const options = rows.map((item: any) => ({
                    label: item.name,
                    value: Number(item.id),
                    section_type_id: item.section_type_id
                }));

                this.sectionTypeOptions.set(options);


            },

            error: () => {

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load branches'
                });

            }

        });

    }

    getuserTypeOptions() {
        this.userTypeOptions.set(user_types.filter((ut) => ut.value === '2') || []);
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

    cancel() {
        this.ref.close();
    }
}