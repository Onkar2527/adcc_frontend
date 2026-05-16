import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { TableColumn } from '../../../../shared/components/table/table.component';

import { TableComponent } from '../../../../shared/components/table/table.component';

import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ToastModule } from 'primeng/toast';

import { RiskCategoryMasterService } from '../../services/masters.service';

import { RiskCategoryFormComponent } from './risk-category-form.component';
import { Router } from '@angular/router';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

@Component({
    selector: 'app-risk-category',

    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
        DynamicDialogModule,
        ConfirmDialogModule,
        ToastModule,
    ],

    providers: [
        DialogService,
        ConfirmationService,
        MessageService,
    ],

    template: `
  <div class="card">

    <div
      class="flex align-items-center justify-content-between mb-4"
    >

      <h5 class="m-0 text-xl font-semibold">
        Risk Category Master
      </h5>

    </div>

    <app-table
      [columns]="columns"

      [data]="rows()"

      [loading]="loading()"

      [globalFilterFields]="
        globalFilterFields
      "

      [actionDisplayMode]="'buttons'"

      (onAdd)="openForm()"

      (onActionClick)="
        onAction($any($event))
      "

      (onRefresh)="loadData()"
    ></app-table>

  </div>

  <p-toast></p-toast>

  <p-confirmDialog></p-confirmDialog>
`,
})
export class RiskCategoryComponent
    implements OnInit {

    private service = inject(
        RiskCategoryMasterService,
    );

    private dialogService =
        inject(DialogService);

    private confirmationService =
        inject(ConfirmationService);

    private drawer = inject(FormDrawerService);

    private messageService =
        inject(MessageService);

    private router = inject(Router);

    loading = signal(false);

    rows = signal<any[]>([]);

    globalFilterFields = [
        'risk_category',
        'risk_weight'
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
            field: '_weights',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-percentage',
            actionName: 'weights',
            width: '50px',
            align: 'center',
            tooltip: 'Manage Weights',
        },

        {
            field: 'risk_category',
            header: 'Risk Category',
            width: '400px',
        },

        {
            field: 'weight_summary',

            header: 'Weight Summary',

            width: '300px',

            cssClass: 'whitespace-pre-line',
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
            actionName: 'status',
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
        this.loadData();
    }

    loadData() {

        this.loading.set(true);

        this.service.findAll().subscribe({

            next: (res) => {

                this.rows.set(
                    Array.isArray(res)
                        ? res
                        : [],
                );

                this.loading.set(false);
            },

            error: () => {

                this.loading.set(false);
            },
        });
    }

    async openForm(row?: any) {

        const res = await this.drawer.open(
            RiskCategoryFormComponent,
            {
                header: row
                    ? 'Edit Risk Category'
                    : 'Create New Risk Category',

                data: row,

                width: 'min(600px, 100vw)',
            },
        );

        if (res?.saved) {

            this.loadData();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Risk category ${row
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

            this.openForm(event.row);

            return;
        }

        if (event.name === 'status') {

            this.toggleStatus(event.row);

            return;
        }

        if (event.name === 'delete') {

            this.remove(event.row);

            return;
        }

        if (event.name === 'weights') {

            this.manageWeights(event.row);

            return;
        }
    }

    toggleStatus(row: any) {

        this.service
            .toggleStatus(row.id)
            .subscribe({

                next: () => {

                    this.messageService.add({
                        severity: 'success',

                        summary: 'Success',

                        detail:
                            'Status updated successfully',
                    });

                    this.loadData();
                },
            });
    }

    manageWeights(row: any) {

        this.router.navigate([
            '/admin/risk-categories',
            row.id,
            'weights',
        ]);
    }

    remove(row: any) {

        this.confirmationService.confirm({

            message:
                'Are you sure you want to delete this risk category?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .remove(row.id)
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Risk category deleted successfully',
                            });

                            this.loadData();
                        },
                    });
            },
        });
    }
}