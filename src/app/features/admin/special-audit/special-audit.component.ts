import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SpecialAuditService } from '../services/masters.service';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { SpecialAuditFormComponent } from './special-audit-form.component';
import {
    TableColumn,
    TableComponent,
} from '../../../shared/components/table/table.component';

@Component({
    selector: 'app-special-audit',
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        TableComponent,
    ],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex align-items-center justify-content-between mb-4">
                <h5 class="m-0 text-xl font-semibold">Special Audit</h5>
            </div>

            <app-table
                [columns]="columns"
                [data]="audits()"
                [loading]="loading()"
                [globalFilterFields]="globalFilterFields"
                [actionDisplayMode]="'buttons'"
                (onAdd)="openCreate()"
                (onActionClick)="onAction($event)"
                (onRefresh)="loadData()"
            ></app-table>
        </div>
        <p-toast></p-toast>
    `,
})
export class SpecialAuditComponent implements OnInit {
    private service = inject(SpecialAuditService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);

    private auditStatusMap: Record<number, string> = {
        1: 'AUDIT (PENDING / ACTIVE)',
        2: 'REVIEW (PENDING / ACTIVE)',
        3: 'RE AUDIT (PENDING / ACTIVE)',
        4: 'COMPLIANCE (PENDING / ACTIVE)',
        5: 'REVIEW (PENDING / ACTIVE)',
        6: 'RE COMPLIANCE (PENDING / ACTIVE)',
        7: 'ASSESMENT COMPLETED',
    };

    audits = signal<any[]>([]);
    loading = signal(false);
    globalFilterFields = [
        'audit_unit_name',
        'audit_unit_code',
        'title',
        'audit_type_name',
        'auditor_name',
        'assessment_period',
        'audit_due_date_display',
        'audit_status_name',
    ];

    columns: TableColumn[] = [
        {
            field: '_edit',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-pencil',
            actionName: 'edit',
            width: '50px',
            align: 'center',
            tooltip: 'Edit',
        },
        {
            field: 'title',
            header: 'Title',
            width: '240px',
        },
        {
            field: 'audit_type_name',
            header: 'Audit Type',
            width: '220px',
        },
        {
            field: 'audit_unit_display',
            header: 'Audit Unit',
            width: '260px',
        },
        {
            field: 'auditor_name',
            header: 'Auditor',
            width: '220px',
        },
        {
            field: 'assessment_period',
            header: 'Assessment Period',
            width: '260px',
        },
        {
            field: 'audit_due_date_display',
            header: 'Due Date',
            width: '150px',
        },
        {
            field: 'audit_status_name',
            header: 'Status',
            width: '150px',
        },
    ];

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);

        this.service.findAll().subscribe({
            next: (res: any) => {
                const rows = Array.isArray(res) ? res : [];

                this.audits.set(rows.map((row) => ({
                    ...row,
                    audit_unit_display: `${row.audit_unit_name || '-'}${row.audit_unit_code ? ` (${row.audit_unit_code})` : ''}`,
                    assessment_period: `${this.formatDate(row.assesment_period_from)} - ${this.formatDate(row.assesment_period_to)}`,
                    audit_due_date_display: row.audit_due_date
                        ? this.formatDate(row.audit_due_date)
                        : '-',
                    audit_status_name: this.getAuditStatusName(
                        Number(row.audit_status_id || 1),
                    ),
                })));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.showError('Unable to load special audits.');
            },
        });
    }

    async openCreate(row?: any) {
        const res = await this.drawer.open(SpecialAuditFormComponent, {
            header: row ? 'Edit Special Audit' : 'Create Special Audit',
            data: row,
            width: 'min(780px, 100vw)',
        });

        if (res?.saved) {
            this.loadData();
            this.messageService.add({
                severity: 'success',
                summary: 'Special Audit Created',
                detail: 'Special audit assessment has been created successfully.',
            });
        }
    }

    onAction(event: { name: string; row: any }) {
        if (event.name === 'edit') {
            this.openCreate(event.row);
        }
    }

    private showError(detail: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail,
        });
    }

    private formatDate(value: string) {
        if (!value) {
            return '-';
        }

        return new Date(value).toLocaleDateString('en-GB');
    }

    private getAuditStatusName(id: number) {
        return this.auditStatusMap[id] || '-';
    }
}
