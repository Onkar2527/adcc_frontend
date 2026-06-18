import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { PeriodwiseQuestionsMasterService } from '../services/masters.service';

type PeriodwiseRow = {
    id: number;
    audit_unit_id: number;
    audit_unit_name?: string;
    year?: string;
    start_month_year?: string;
    end_month_year?: string;
    is_multiple_auditors?: boolean | number;
};

type CategoryAssignmentRow = {
    category_id: number;
    category_name: string;
    menu_name: string;
    audit_emp_id: number | null;
};

@Component({
    selector: 'app-multiple-auditor-assignment',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SelectModule,
        ButtonModule,
        ToastModule,
        ProgressSpinnerModule,
    ],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 class="m-0 text-xl font-semibold">Multiple Auditor Assignment</h5>
                    <div class="text-600 mt-2">
                        Select a branch and periodwise setup, then assign an auditor to each category.
                    </div>
                </div>
            </div>

            <div class="grid">
                <div class="col-12 md:col-6">
                    <label class="block text-sm font-semibold text-700 mb-2">Branch</label>
                    <p-select
                        [options]="branchOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        [ngModel]="selectedBranchId()"
                        (ngModelChange)="onBranchChange($event)"
                        placeholder="Please select branch"
                        styleClass="w-full"
                    ></p-select>
                </div>

                <div class="col-12 md:col-6">
                    <label class="block text-sm font-semibold text-700 mb-2">Periodwise Audit</label>
                    <p-select
                        [options]="periodwiseOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        [disabled]="!selectedBranchId()"
                        [ngModel]="selectedPeriodwiseId()"
                        (ngModelChange)="onPeriodwiseChange($event)"
                        placeholder="Please select periodwise audit"
                        styleClass="w-full"
                    ></p-select>
                </div>
            </div>

            <div
                *ngIf="selectedPeriodwiseRow() as selectedRow"
                class="surface-50 border-1 border-200 border-round p-3 mt-3"
            >
                <div class="grid">
                    <div class="col-12 md:col-4">
                        <div class="text-xs font-semibold text-500 mb-1">Audit Unit</div>
                        <div class="font-medium">{{ selectedRow.audit_unit_name || '-' }}</div>
                    </div>
                    <div class="col-12 md:col-4">
                        <div class="text-xs font-semibold text-500 mb-1">Financial Year</div>
                        <div class="font-medium">{{ selectedRow.year || '-' }}</div>
                    </div>
                    <div class="col-12 md:col-4">
                        <div class="text-xs font-semibold text-500 mb-1">Period</div>
                        <div class="font-medium">
                            {{ selectedRow.start_month_year || '-' }} - {{ selectedRow.end_month_year || '-' }}
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="categoriesLoading()" class="flex justify-content-center py-6">
                <p-progressSpinner strokeWidth="4" styleClass="w-3rem h-3rem"></p-progressSpinner>
            </div>

            <div *ngIf="!categoriesLoading() && selectedPeriodwiseId() && categoryRows().length" class="mt-4">
                <div class="flex align-items-center justify-content-between mb-3">
                    <div>
                        <div class="font-semibold text-lg">Category Assignments</div>
                        <div class="text-600 text-sm mt-1">
                            Each category below can be assigned to a different auditor.
                        </div>
                    </div>
                    <p-button
                        label="Save Assignments"
                        icon="pi pi-save"
                        [loading]="saving()"
                        (onClick)="saveAssignments()"
                    ></p-button>
                </div>

                <div class="border-1 border-200 border-round overflow-hidden">
                    <div
                        *ngFor="let category of categoryRows(); trackBy: trackByCategory"
                        class="grid align-items-center px-3 py-3 border-bottom-1 border-200 category-row"
                    >
                        <div class="col-12 md:col-4">
                            <div class="text-xs font-semibold text-500 mb-1">{{ category.menu_name }}</div>
                            <div class="font-medium">{{ category.category_name }}</div>
                        </div>
                        <div class="col-12 md:col-8">
                            <label class="block text-xs font-semibold text-500 mb-2">Assign Auditor</label>
                            <p-select
                                [options]="auditorOptions()"
                                optionLabel="label"
                                optionValue="value"
                                [filter]="true"
                                filterBy="label"
                                [ngModel]="category.audit_emp_id"
                                (ngModelChange)="onCategoryAuditorChange(category.category_id, $event)"
                                placeholder="Please select auditor"
                                styleClass="w-full"
                            ></p-select>
                        </div>
                    </div>
                </div>
            </div>

            <div
                *ngIf="!categoriesLoading() && selectedPeriodwiseId() && !categoryRows().length"
                class="surface-50 border-1 border-200 border-round p-4 text-600 mt-4"
            >
                No categories are available for the selected periodwise audit.
            </div>
        </div>
        <p-toast></p-toast>
    `,
    styles: [`
        :host ::ng-deep .p-select {
            width: 100%;
        }

        .category-row:last-child {
            border-bottom: 0;
        }
    `],
})
export class MultipleAuditorAssignmentComponent {
    private periodwiseService = inject(PeriodwiseQuestionsMasterService);
    private messageService = inject(MessageService);

    loading = signal(false);
    categoriesLoading = signal(false);
    saving = signal(false);

    periodwiseRows = signal<PeriodwiseRow[]>([]);
    categoryRows = signal<CategoryAssignmentRow[]>([]);
    eligibleAuditors = signal<any[]>([]);

    selectedBranchId = signal<number | null>(null);
    selectedPeriodwiseId = signal<number | null>(null);

    branchOptions = computed(() => {
        const map = new Map<number, string>();
        this.periodwiseRows().forEach((row) => {
            const branchId = Number(row.audit_unit_id || 0);
            if (branchId > 0 && !map.has(branchId)) {
                map.set(branchId, row.audit_unit_name || `Branch ${branchId}`);
            }
        });

        return Array.from(map.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    });

    periodwiseOptions = computed(() => {
        const branchId = Number(this.selectedBranchId() || 0);
        if (!branchId) {
            return [];
        }

        return this.periodwiseRows()
            .filter((row) => Number(row.audit_unit_id) === branchId)
            .map((row) => ({
                value: Number(row.id),
                label: `${row.start_month_year || '-'} to ${row.end_month_year || '-'}${row.year ? ` (F.Y. ${row.year})` : ''}`,
            }));
    });

    selectedPeriodwiseRow = computed(() =>
        this.periodwiseRows().find(
            (row) => Number(row.id) === Number(this.selectedPeriodwiseId() || 0),
        ) || null,
    );

    auditorOptions = computed(() =>
        this.eligibleAuditors().map((auditor: any) => ({
            value: Number(auditor.id),
            label: `${auditor.name}${auditor.emp_code ? ` (${auditor.emp_code})` : ''}`,
        })),
    );

    constructor() {
        this.loadPeriodwiseRows();
    }

    loadPeriodwiseRows() {
        this.loading.set(true);
        this.periodwiseService.getAll().subscribe({
            next: (res: any) => {
                this.periodwiseRows.set(this.parseRows(res));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.showError('Unable to load periodwise audits.');
            },
        });
    }

    onBranchChange(value: any) {
        this.selectedBranchId.set(value ? Number(value) : null);
        this.selectedPeriodwiseId.set(null);
        this.categoryRows.set([]);
        this.eligibleAuditors.set([]);
    }

    onPeriodwiseChange(value: any) {
        const periodwiseId = value ? Number(value) : null;
        this.selectedPeriodwiseId.set(periodwiseId);
        this.categoryRows.set([]);
        this.eligibleAuditors.set([]);

        if (!periodwiseId) {
            return;
        }

        this.loadAssignmentsForPeriodwise(periodwiseId);
    }

    loadAssignmentsForPeriodwise(periodwiseId: number) {
        this.categoriesLoading.set(true);

        let questionData: any;
        let auditors: any[] = [];
        let assignments: any[] = [];
        let pending = 3;

        const finish = () => {
            pending -= 1;
            if (pending === 0) {
                const parsedCategories = this.buildCategoryRows(questionData, assignments);
                this.categoryRows.set(parsedCategories);
                this.eligibleAuditors.set(auditors);
                this.categoriesLoading.set(false);
            }
        };

        this.periodwiseService.getQuestionData(periodwiseId).subscribe({
            next: (res: any) => {
                questionData = res;
                finish();
            },
            error: () => {
                this.categoriesLoading.set(false);
                this.showError('Unable to load categories for the selected periodwise audit.');
            },
        });

        this.periodwiseService.getEligibleAuditors(periodwiseId).subscribe({
            next: (res: any) => {
                auditors = this.parseRows(res);
                finish();
            },
            error: () => {
                this.categoriesLoading.set(false);
                this.showError('Unable to load eligible auditors.');
            },
        });

        this.periodwiseService.getCategoryAssignments(periodwiseId).subscribe({
            next: (res: any) => {
                assignments = this.parseRows(res);
                finish();
            },
            error: () => {
                this.categoriesLoading.set(false);
                this.showError('Unable to load saved category assignments.');
            },
        });
    }

    onCategoryAuditorChange(categoryId: number, auditorId: any) {
        const normalizedAuditorId = auditorId ? Number(auditorId) : null;
        this.categoryRows.set(
            this.categoryRows().map((row) =>
                Number(row.category_id) === Number(categoryId)
                    ? { ...row, audit_emp_id: normalizedAuditorId }
                    : row,
            ),
        );
    }

    saveAssignments() {
        const periodwiseId = Number(this.selectedPeriodwiseId() || 0);
        if (!periodwiseId) {
            this.showWarn('Please select a periodwise audit first.');
            return;
        }

        if (!this.categoryRows().length) {
            this.showWarn('No categories are available to assign.');
            return;
        }

        const unassigned = this.categoryRows().filter(
            (row) => !Number(row.audit_emp_id || 0),
        );
        if (unassigned.length) {
            this.showWarn('Please assign an auditor to every category before saving.');
            return;
        }

        const assignments = this.categoryRows().map((row) => ({
            category_id: Number(row.category_id),
            audit_emp_id: Number(row.audit_emp_id),
        }));

        this.saving.set(true);
        this.periodwiseService.updateMultipleAuditors(periodwiseId, true).subscribe({
            next: () => {
                this.periodwiseService.assignCategories(periodwiseId, assignments).subscribe({
                    next: () => {
                        this.saving.set(false);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Saved',
                            detail: 'Multiple auditor assignments saved successfully.',
                        });
                        this.loadAssignmentsForPeriodwise(periodwiseId);
                    },
                    error: () => {
                        this.saving.set(false);
                        this.showError('Unable to save multiple auditor assignments.');
                    },
                });
            },
            error: () => {
                this.saving.set(false);
                this.showError('Unable to switch this periodwise audit to multiple-auditor mode.');
            },
        });
    }

    trackByCategory = (_: number, row: CategoryAssignmentRow) => row.category_id;

    private buildCategoryRows(questionData: any, assignments: any[]) {
        const rows = this.parseRows(questionData?.rows ? questionData.rows : questionData);
        const assignmentMap = new Map<number, number>();

        assignments.forEach((item: any) => {
            const categoryId = Number(item.category_id || 0);
            const auditorId = Number(item.audit_emp_id || 0);
            if (categoryId > 0 && auditorId > 0) {
                assignmentMap.set(categoryId, auditorId);
            }
        });

        const categoryMap = new Map<number, CategoryAssignmentRow>();
        rows.forEach((row: any) => {
            const categoryId = Number(row.category_id || 0);
            if (!categoryId || categoryMap.has(categoryId)) {
                return;
            }

            categoryMap.set(categoryId, {
                category_id: categoryId,
                category_name: row.category_name || '-',
                menu_name: row.menu_name || '-',
                audit_emp_id: assignmentMap.get(categoryId) || null,
            });
        });

        return Array.from(categoryMap.values()).sort((a, b) => {
            const menuCompare = a.menu_name.localeCompare(b.menu_name);
            return menuCompare !== 0
                ? menuCompare
                : a.category_name.localeCompare(b.category_name);
        });
    }

    private parseRows(res: any): any[] {
        if (Array.isArray(res)) {
            return res;
        }
        if (Array.isArray(res?.rows)) {
            return res.rows;
        }
        if (Array.isArray(res?.data)) {
            return res.data;
        }
        return [];
    }

    private showWarn(detail: string) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Validation',
            detail,
        });
    }

    private showError(detail: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail,
        });
    }
}
