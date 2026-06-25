import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
    SpecialAuditPayload,
    SpecialAuditService,
} from '../services/masters.service';
import {
    DateFieldComponent,
    FormActionsComponent,
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

type Option = {
    id: number;
    label: string;
    [key: string]: any;
};

@Component({
    selector: 'app-special-audit-form',
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        TextFieldComponent,
        SelectFieldComponent,
        DateFieldComponent,
        FormActionsComponent,
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="max-h-[90vh] p-4 overflow-y-auto">
            <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">
                <div class="flex flex-column gap-3">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <app-select-field
                                label="Audit Type"
                                [field]="auditTypeId"
                                [options]="lookups().audit_types"
                                optionLabel="label"
                                optionValue="id"
                                [required]="true"
                                [filter]="true"
                                filterBy="label"
                                [virtualScroll]="false"
                                (onChange)="onSetupFilterChange()"
                            ></app-select-field>
                        </div>

                        <div class="col-12 md:col-6">
                            <app-text-field
                                label="Title"
                                [field]="title"
                                [required]="true"
                            ></app-text-field>
                        </div>

                        <div class="col-12 md:col-6">
                            <app-select-field
                                label="Audit Unit"
                                [field]="auditUnitId"
                                [options]="lookups().audit_units"
                                optionLabel="label"
                                optionValue="id"
                                [required]="true"
                                [filter]="true"
                                filterBy="label"
                                [virtualScroll]="false"
                                (onChange)="onSetupFilterChange()"
                            ></app-select-field>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <app-select-field
                                label="Auditor"
                                [field]="auditorId"
                                [options]="lookups().auditors"
                                optionLabel="label"
                                optionValue="id"
                                [required]="true"
                                [filter]="true"
                                filterBy="label"
                                [virtualScroll]="false"
                            ></app-select-field>
                        </div>

                        <div class="col-12 md:col-6">
                            <app-select-field
                                label="Year"
                                [field]="yearId"
                                [options]="lookups().years"
                                optionLabel="label"
                                optionValue="id"
                                [required]="true"
                                [virtualScroll]="false"
                                (onChange)="onSetupFilterChange()"
                            ></app-select-field>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="col-12">
                            <app-select-field
                                label="Question Setup"
                                [field]="controlMasterId"
                                [options]="filteredQuestionSetups()"
                                optionLabel="label"
                                optionValue="id"
                                [required]="true"
                                [filter]="true"
                                filterBy="label"
                                [virtualScroll]="false"
                            ></app-select-field>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-4">
                            <app-date-field
                                label="Period From"
                                [field]="periodFrom"
                                [required]="true"
                                dateFormat="dd/mm/yy"
                            ></app-date-field>
                        </div>

                        <div class="col-12 md:col-4">
                            <app-date-field
                                label="Period To"
                                [field]="periodTo"
                                [required]="true"
                                dateFormat="dd/mm/yy"
                            ></app-date-field>
                        </div>

                        <div class="col-12 md:col-4">
                            <app-date-field
                                label="Audit Due Date"
                                [field]="auditDueDate"
                                dateFormat="dd/mm/yy"
                            ></app-date-field>
                        </div>
                    </div>

                    <app-form-actions
                        saveLabel="Create Special Audit"
                        [loading]="saving()"
                        (save)="save()"
                        (cancel)="cancel()"
                    ></app-form-actions>
                </div>
            </div>
        </div>
    `,
})
export class SpecialAuditFormComponent implements OnInit {
    private ref = inject(FormDrawerRef);
    private service = inject(SpecialAuditService);
    private messageService = inject(MessageService);

    saving = signal(false);
    auditTypeId = signal<number | null>(null);
    title = signal('');
    yearId = signal<number | null>(null);
    auditUnitId = signal<number | null>(null);
    controlMasterId = signal<number | null>(null);
    auditorId = signal<number | null>(null);
    periodFrom = signal<Date | null>(null);
    periodTo = signal<Date | null>(null);
    auditDueDate = signal<Date | null>(null);

    lookups = signal<{
        years: Option[];
        audit_units: Option[];
        auditors: Option[];
        audit_types: Option[];
        periodwise_questions: Option[];
    }>({
        years: [],
        audit_units: [],
        auditors: [],
        audit_types: [],
        periodwise_questions: [],
    });

    ngOnInit() {
        this.patchForm(this.ref.data);

        this.service.lookups().subscribe({
            next: (res: any) => {
                const lookups = res?.data || res || {};

                this.lookups.set({
                    years: this.asArray(lookups.years),
                    audit_units: this.asArray(lookups.audit_units),
                    auditors: this.asArray(lookups.auditors),
                    audit_types: this.asArray(lookups.audit_types),
                    periodwise_questions: this.asArray(lookups.periodwise_questions),
                });
                this.patchForm(this.ref.data);
            },
            error: () => this.showError('Unable to load special audit setup data.'),
        });
    }

    filteredQuestionSetups() {
        const auditTypeId = Number(this.auditTypeId() || 0);
        if (!auditTypeId) return [];

        const unitId = Number(this.auditUnitId() || 0);
        const yearId = Number(this.yearId() || 0);
        const setups = this.lookups().periodwise_questions;

        const filtered = setups.filter((item) => {
            const itemAuditTypeId = Number(item['audit_type_id'] || 0);
            const itemUnitId = Number(item['audit_unit_id'] || 0);
            const itemYearId = Number(item['year_id'] || 0);

            return itemAuditTypeId === auditTypeId
                && (!unitId || !itemUnitId || itemUnitId === unitId)
                && (!yearId || !itemYearId || itemYearId === yearId);
        });

        return filtered;
    }

    onSetupFilterChange() {
        const selectedSetup = this.lookups().periodwise_questions.find(
            (item) => Number(item.id) === Number(this.controlMasterId()),
        );

        if (selectedSetup && !this.isSetupAllowed(selectedSetup)) {
            this.controlMasterId.set(null);
        }
    }

    save() {
        const error = this.validationMessage();

        if (error) {
            this.showError(error);
            return;
        }

        this.saving.set(true);

        const request = this.ref.data?.id
            ? this.service.update(this.ref.data.id, this.payload())
            : this.service.create(this.payload());

        request.subscribe({
            next: (res) => {
                this.saving.set(false);
                this.ref.close(res);
            },
            error: (err) => {
                this.saving.set(false);
                this.showError(err?.error?.message || 'Unable to create special audit.');
            },
        });
    }

    cancel() {
        this.ref.close();
    }

    private validationMessage() {
        if (!this.title().trim()) return 'Special audit title is required.';
        if (!this.auditTypeId()) return 'Audit type is required.';
        if (!this.auditUnitId()) return 'Audit unit is required.';
        if (!this.auditorId()) return 'Auditor is required.';
        if (!this.yearId()) return 'Year is required.';
        if (!this.controlMasterId()) return 'Question setup is required.';
        const selectedSetup = this.lookups().periodwise_questions.find(
            (item) => Number(item.id) === Number(this.controlMasterId()),
        );
        if (!selectedSetup || !this.isSetupAllowed(selectedSetup)) {
            return 'Selected question setup does not match audit type, unit and year.';
        }
        if (!this.periodFrom() || !this.periodTo()) {
            return 'Assessment period dates are required.';
        }
        if (this.formatDate(this.periodFrom()) > this.formatDate(this.periodTo())) {
            return 'Period from date cannot be after period to date.';
        }

        return '';
    }

    private patchForm(data: any) {
        if (!data) {
            return;
        }

        this.title.set(data.title || '');
        this.auditTypeId.set(Number(data.audit_type_id || 0) || null);
        this.yearId.set(Number(data.year_id || 0) || null);
        this.auditUnitId.set(Number(data.audit_unit_id || 0) || null);
        this.controlMasterId.set(Number(data.control_master_id || 0) || null);
        this.auditorId.set(Number(data.auditor_id || 0) || null);
        this.periodFrom.set(this.toDate(data.assesment_period_from));
        this.periodTo.set(this.toDate(data.assesment_period_to));
        this.auditDueDate.set(this.toDate(data.audit_due_date));
    }

    private asArray(value: any) {
        const rows = Array.isArray(value)
            ? value
            : Array.isArray(value?.rows)
                ? value.rows
                : Array.isArray(value?.data)
                    ? value.data
                    : [];

        return rows.map((row: any) => ({
            ...row,
            id: Number(row.id),
            value: row.value !== undefined
                ? Number(row.value)
                : row.value,
            year_id: row.year_id !== undefined
                ? Number(row.year_id)
                : row.year_id,
            audit_unit_id: row.audit_unit_id !== undefined
                ? Number(row.audit_unit_id)
                : row.audit_unit_id,
        }));
    }

    private isSetupAllowed(item: Option) {
        const auditTypeId = Number(this.auditTypeId() || 0);
        const unitId = Number(this.auditUnitId() || 0);
        const yearId = Number(this.yearId() || 0);
        const itemAuditTypeId = Number(item['audit_type_id'] || 0);
        const itemUnitId = Number(item['audit_unit_id'] || 0);
        const itemYearId = Number(item['year_id'] || 0);

        return itemAuditTypeId === auditTypeId
            && (!unitId || !itemUnitId || itemUnitId === unitId)
            && (!yearId || !itemYearId || itemYearId === yearId);
    }

    private payload(): SpecialAuditPayload {
        return {
            audit_type_id: Number(this.auditTypeId()),
            title: this.title().trim(),
            year_id: Number(this.yearId()),
            audit_unit_id: Number(this.auditUnitId()),
            control_master_id: Number(this.controlMasterId()),
            auditor_id: Number(this.auditorId()),
            assesment_period_from: this.formatDate(this.periodFrom()),
            assesment_period_to: this.formatDate(this.periodTo()),
            audit_due_date: this.auditDueDate()
                ? this.formatDate(this.auditDueDate())
                : undefined,
        };
    }

    private formatDate(date: Date | null) {
        if (!date) {
            return '';
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private toDate(value: string | null | undefined) {
        if (!value) {
            return null;
        }

        const text = String(value);
        const parsed = new Date(text);

        if (!Number.isNaN(parsed.getTime())) {
            return new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate(),
            );
        }

        const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (dateOnlyMatch) {
            return new Date(
                Number(dateOnlyMatch[1]),
                Number(dateOnlyMatch[2]) - 1,
                Number(dateOnlyMatch[3]),
            );
        }

        return null;
    }

    private showError(detail: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail,
        });
    }
}
