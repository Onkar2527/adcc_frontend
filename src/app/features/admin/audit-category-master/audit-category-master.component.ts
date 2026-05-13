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

import { TableColumn } from '../../../shared/components/table/table.component';
import { TableComponent } from '../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import { AuditCategoryMasterService } from '../services/masters.service';

import { AuditCategoryFormComponent } from './audit-category-form.component';
import { AuditCategoryQuestionMappingComponent } from './audit-category-question-mapping.component';

@Component({
    selector: 'app-category-master',
    standalone: true,
    imports: [
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
    ],
    template: `
  <div class="card">

    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        Category Master
      </h5>
    </div>

    <app-table
      [columns]="columns"
      [data]="categories()"
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
export class AuditCategoryMasterComponent {
    private service = inject(AuditCategoryMasterService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    categories = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'menu_name',
        'name',
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
            field: 'menu_name',
            header: 'Menu',
            width: '220px',
        },

        {
            field: 'name',
            header: 'Category',
            width: '280px',
        },

        {
            field: 'is_cc_acc_category',
            header: 'CC Category',
            type: 'boolean',
            width: '140px',
            align: 'center',
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
            width: '60px',
            align: 'center',
            tooltip: 'Question Mapping',
        },

        {
            field: '_status',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-sync',
            actionName: 'toggle-status',
            width: '60px',
            align: 'center',
            tooltip: 'Toggle Status',
        },

        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '60px',
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

        this.service.findAll()
            .subscribe({

                next: (res: any) => {

                    const rows =
                        Array.isArray(res)
                            ? res
                            : Array.isArray(res?.data)
                                ? res.data
                                : [];

                    this.categories.set(
                        rows,
                    );

                    this.loading.set(false);
                },

                error: () => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            'Unable to load categories',
                    });
                },
            });
    }

    async openForm(
        row?: any,
    ) {

        let formData = {};

        if (row?.id) {

            const fullData =
                await this.service
                    .findOne(row.id)
                    .toPromise();

            formData = {
                ...fullData,
            };
        }

        const res =
            await this.drawer.open(
                AuditCategoryFormComponent,
                {
                    header: row
                        ? 'Update Category'
                        : 'Create Category',

                    data: formData,

                    width:
                        'min(650px, 100vw)',
                },
            );

        if (res?.saved) {

            this.load();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Category ${row
                    ? 'updated'
                    : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: {
        name: string;
        row: any;
    }) {

        if (event.name === 'edit') {

            this.openForm(
                event.row,
            );

            return;
        }

        if (
            event.name === 'mapping'
        ) {

            this.openQuestionMapping(
                event.row,
            );

            return;
        }

        if (
            event.name === 'toggle-status'
        ) {

            this.toggleStatus(
                event.row,
            );

            return;
        }

        if (
            event.name === 'delete'
        ) {

            this.confirmDelete(
                event.row,
            );

            return;
        }
    }

    toggleStatus(row: any) {

        this.service
            .toggleStatus(row.id)
            .subscribe({

                next: () => {

                    this.load();

                    this.messageService.add({
                        severity: 'success',

                        summary: 'Success',

                        detail:
                            'Status updated successfully',
                    });
                },
            });
    }

    async openQuestionMapping(
        row: any,
    ) {

        const res =
            await this.drawer.open(
                AuditCategoryQuestionMappingComponent,
                {
                    header:
                        'Question Set Mapping',

                    data: row,

                    width:
                        'min(900px, 100vw)',
                },
            );

        if (res?.saved) {

            this.messageService.add({

                severity: 'success',

                summary: 'Success',

                detail:
                    'Question mapping updated successfully',
            });
        }
    }

    confirmDelete(row: any) {

        this.confirmationService
            .confirm({

                message:
                    'Are you sure you want to delete this category?',

                header:
                    'Delete Confirmation',

                icon:
                    'pi pi-exclamation-triangle',

                accept: () => {
                    this.confirmationService.close();

                    this.service
                        .remove(row.id)
                        .subscribe({

                            next: () => {

                                this.load();

                                this.messageService.add({
                                    severity:
                                        'success',

                                    summary:
                                        'Success',

                                    detail:
                                        'Category deleted successfully',
                                });
                            },
                        });
                },
            });
    }


}