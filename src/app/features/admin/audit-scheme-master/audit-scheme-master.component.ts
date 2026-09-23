import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { RouterModule } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

import { TableColumn } from '../../../shared/components/table/table.component';
import { TableComponent } from '../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import { AuditSchemeMasterService } from '../services/masters.service';

import { AuditSchemeFormComponent } from './audit-scheme-form.component';
import { AuditSchemeQuestionMappingComponent } from './audit-scheme-question-mapping.component';
import { MasterBulkUploadComponent } from '../shared/master-bulk-upload/master-bulk-upload.component';
import { MasterBulkUploadService } from '../services/master-bulk-upload.service';

@Component({
    selector: 'app-scheme-master',
    standalone: true,
    imports: [
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule,
    ],
    providers: [MessageService, ConfirmationService],
    template: `
  <div class="card">

    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        Scheme Master
      </h5>
    </div>

    <app-table
      [columns]="columns"
      [data]="schemes()"
      [loading]="loading()"
      [globalFilterFields]="globalFilterFields"
      [actionDisplayMode]="'buttons'"
      (onAdd)="openForm()"
      (onActionClick)="onAction($event)"
      (onRefresh)="loadSchemes()"
    >
      <button
        toolbar-actions
        pButton
        type="button"
        icon="pi pi-upload"
        label="Bulk Upload"
        class="p-button-outlined"
        (click)="openBulkUpload()"
      ></button>
    </app-table>

  </div>

  <p-toast></p-toast>
  <p-confirmDialog></p-confirmDialog>
`,
})
export class AuditSchemeMasterComponent implements OnInit {
    private schemeService = inject(AuditSchemeMasterService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private bulkUploadService = inject(MasterBulkUploadService);

    schemes = signal<any[]>([]);
    loading = signal(false);

    globalFilterFields = [
        'scheme_type_name',
        'scheme_code',
        'name',
        'category_name',
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
            field: 'scheme_type_name',
            header: 'Scheme Type',
            width: '180px',
        },

        {
            field: 'scheme_code',
            header: 'Scheme Code',
            width: '180px',
        },

        {
            field: 'name',
            header: 'Scheme Name',
            width: '250px',
        },

        {
            field: 'category_name',
            header: 'Category',
            width: '250px',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
        },

        {
            field: '_mapping',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-link',
            actionName: 'mapping',
            width: '50px',
            align: 'center',
            tooltip: 'Question Mapping',
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
        this.loadSchemes();
    }

    loadSchemes() {
        this.loading.set(true);

        this.schemeService.findAll().subscribe({
            next: (result) => {
                this.schemes.set(this.parseRows(result));
                this.loading.set(false);
            },

            error: () => {
                this.loading.set(false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load schemes',
                });
            },
        });
    }

    private parseRows(res: any): any[] {
        if (Array.isArray(res)) return res;

        if (Array.isArray(res?.data)) return res.data;

        if (Array.isArray(res?.rows)) return res.rows;

        return [];
    }

    async openForm(row?: any) {
        const res = await this.drawer.open(
            AuditSchemeFormComponent,
            {
                header: row
                    ? 'Edit Scheme'
                    : 'Create New Scheme',

                data: row,

                width: 'min(700px, 100vw)',
            },
        );

        if (res?.saved) {
            this.loadSchemes();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Scheme ${row ? 'updated' : 'created'
                    } successfully`,
            });
        }
    }

    async openQuestionMapping(row: any) {
        const res = await this.drawer.open(
            AuditSchemeQuestionMappingComponent,
            {
                header: 'Scheme Question Set Mapping',
                data: row,
                width: 'min(900px, 100vw)',
            },
        );

        if (res?.saved) {
            this.loadSchemes();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Scheme question mapping updated successfully',
            });
        }
    }

    async openBulkUpload() {
        const res = await this.drawer.open(MasterBulkUploadComponent, {
            header: 'Audit Scheme Bulk Upload',
            data: {
                config: this.bulkUploadService.getConfig('schemes'),
            },
            width: 'min(1100px, 100vw)',
        });

        if (res?.saved) {
            this.loadSchemes();
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

        if (event.name === 'mapping') {
            this.openQuestionMapping(event.row);
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.deleteScheme(event.row);
            return;
        }
    }

    private toggleStatus(row: any) {
        this.schemeService
            .toggleStatus(row.id)
            .subscribe({
                next: () => {
                    this.loadSchemes();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Scheme ${Number(row.is_active) === 1
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

    private deleteScheme(row: any) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this scheme?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.confirmationService.close();
                this.schemeService
                    .remove(row.id)
                    .subscribe({
                        next: () => {
                            this.loadSchemes();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Deleted',
                                detail:
                                    'Scheme deleted successfully',
                            });
                        },

                        error: () => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail:
                                    'Unable to delete scheme',
                            });
                        },
                    });
            },
        });
    }
}
