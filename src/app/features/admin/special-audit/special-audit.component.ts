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
        <p-toast></p-toast>

        <section class="special-audit">
            <header class="special-audit__header">
                <div>
                    <span>Audit Setup</span>
                    <h1>Special Audit</h1>
                    <p>
                        Create one-off or multiple special audits for selected branches without
                        disturbing the regular internal audit cycle.
                    </p>
                </div>

            </header>

            <div class="special-audit__summary">
                <div>
                    <small>Total Special Audits</small>
                    <strong>{{ audits().length }}</strong>
                </div>
            </div>

            <div class="card">
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

            <div class="special-audit__note">
                <i class="pi pi-info-circle"></i>
                <span>
                    Special Audit uses the same question engine as Internal Audit, but it is created
                    independently from branch frequency cycles.
                </span>
            </div>
        </section>

    `,
    styles: [`
        .special-audit {
            display: grid;
            gap: 1rem;
        }

        .special-audit__header,
        .special-audit__summary,
        .special-audit__note {
            border: 1px solid var(--surface-border);
            border-radius: .45rem;
            background: var(--surface-card);
        }

        .special-audit__header {
            padding: 1rem 1.15rem;
            border-left: .25rem solid var(--primary-color);
        }

        .special-audit__header span {
            color: var(--primary-color);
            font-size: .72rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .special-audit__header h1 {
            margin: .2rem 0;
            color: var(--text-color);
            font-size: 1.35rem;
        }

        .special-audit__header p {
            max-width: 58rem;
            margin: 0;
            color: var(--text-color-secondary);
            line-height: 1.4;
        }

        .special-audit__summary {
            padding: .85rem 1rem;
        }

        .special-audit__summary div {
            display: grid;
            gap: .15rem;
        }

        .special-audit__summary small,
        .special-audit__note {
            color: var(--text-color-secondary);
        }

        .special-audit__summary strong {
            color: var(--text-color);
            font-size: 1.4rem;
        }

        .special-audit__note {
            display: flex;
            align-items: center;
            gap: .5rem;
            padding: .85rem 1rem;
            font-size: .9rem;
            line-height: 1.4;
        }
    `],
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
