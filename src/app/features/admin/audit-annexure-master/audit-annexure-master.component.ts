import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import {
    TableComponent,
    TableColumn,
} from '../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import {
    AuditAnnexureMasterService,
} from '../services/masters.service';

import { AuditAnnexureFormComponent } from './audit-annexure-form.component';

@Component({
    selector: 'app-audit-annexure-master',
    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
    ],

    providers: [
        MessageService,
        ConfirmationService,
    ],

    template: `
    <div class="card">

      <div
        class="flex align-items-center justify-content-between mb-4"
      >
        <h5 class="m-0 text-xl font-semibold">
          Annexure Master
        </h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="annexures()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"

        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="load()"
      ></app-table>

    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
})
export class AuditAnnexureMasterComponent
    implements OnInit {
    private annexureService = inject(
        AuditAnnexureMasterService,
    );

    private drawer = inject(FormDrawerService);

    private messageService = inject(
        MessageService,
    );

    private confirmationService = inject(
        ConfirmationService,
    );

    private router = inject(Router);

    annexures = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'name',
        'risk_definition_name',
        'risk_category_name',
        'business_risk_name',
        'control_risk_name',
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
            field: '_columns',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-table',
            actionName: 'columns',
            width: '50px',
            align: 'center',
            tooltip: 'Manage Columns',
        },

        {
            field: 'name',
            header: 'Annexure Name',
            width: '300px',
        },

        {
            field: 'risk_definition_name',
            header: 'Risk Definition',
            width: '180px',
        },

        {
            field: 'risk_category_name',
            header: 'Risk Category',
            width: '220px',
        },

        {
            field: 'business_risk_name',
            header: 'Business Risk',
            width: '160px',
            cssClass: 'uppercase',
        },

        {
            field: 'control_risk_name',
            header: 'Control Risk',
            width: '160px',
            cssClass: 'uppercase',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
        },

        {
            field: '_status',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-sync',
            actionName: 'toggle-status',
            width: '50px',
            align: 'center',
            tooltip: 'Toggle Status',
        },

        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '50px',
            align: 'center',
            tooltip: 'Delete',
            cssClass: 'text-danger',
        },
    ];

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);

        this.annexureService.findAll().subscribe({
            next: (res: any) => {
                const rows = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.rows)
                            ? res.rows
                            : [];

                this.annexures.set(rows);

                this.loading.set(false);
            },

            error: () => {
                this.loading.set(false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load annexures',
                });
            },
        });
    }

    async openForm(row?: any) {
        const res = await this.drawer.open(
            AuditAnnexureFormComponent,
            {
                header: row
                    ? 'Edit Annexure'
                    : 'Create New Annexure',

                data: row,

                width: 'min(720px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Annexure ${row ? 'updated' : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: {
        name: string;
        row: any;
    }) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'columns') {
            this.router.navigate([
                '/admin/audit-annexure-master',
                event.row.id,
                'columns',
            ]);

            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.delete(event.row);
            return;
        }
    }

    private toggleStatus(row: any) {
        this.annexureService
            .toggleStatus(row.id)
            .subscribe({
                next: () => {
                    this.load();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Annexure ${Number(row.is_active) === 1
                            ? 'deactivated'
                            : 'activated'
                            } successfully`,
                    });
                },

                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Unable to update status',
                    });
                },
            });
    }

    private delete(row: any) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this annexure?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.annexureService
                    .remove(row.id)
                    .subscribe({
                        next: () => {
                            this.load();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail:
                                    'Annexure deleted successfully',
                            });
                        },

                        error: () => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail:
                                    'Unable to delete annexure',
                            });
                        },
                    });
            },
        });
    }
}