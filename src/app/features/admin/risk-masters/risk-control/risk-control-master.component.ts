import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

import { RiskControlFormComponent } from './risk-control-form.component';

import { RiskControlMasterService } from '../../services/masters.service';

@Component({
    selector: 'app-risk-control',

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
          Risk Control Master
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
export class RiskControlComponent
    implements OnInit {

    private service =
        inject(RiskControlMasterService);

    private drawer = inject(
        FormDrawerService,
    );

    private router = inject(Router);

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    loading = signal(false);

    rows = signal<any[]>([]);

    globalFilterFields = [
        'name',
        'key_aspect_summary',
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
            field: '_aspects',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-list',
            actionName: 'aspects',
            width: '50px',
            align: 'center',
            tooltip: 'Manage Key Aspects',
        },

        {
            field: 'name',
            header: 'Risk Control',
            width: '250px',
        },

        {
            field: 'key_aspect_summary',
            header: 'Key Aspect Summary',
            width: '350px',
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
        this.loadData();
    }

    loadData() {

        this.loading.set(true);

        this.service
            .findAllRiskControls()
            .subscribe({

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
            RiskControlFormComponent,
            {
                header: row
                    ? 'Edit Risk Control'
                    : 'Create New Risk Control',

                data: row,

                width: 'min(600px, 100vw)',
            },
        );

        if (res?.saved) {

            this.loadData();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Risk control ${row
                    ? 'updated'
                    : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: any) {

        if (event.name === 'edit') {

            this.openForm(event.row);

            return;
        }

        if (event.name === 'aspects') {

            this.manageAspects(
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

        if (event.name === 'delete') {

            this.remove(event.row);

            return;
        }
    }

    manageAspects(row: any) {

        this.router.navigate([
            '/admin/risk-controls',
            row.id,
            'key-aspects',
        ]);
    }

    toggleStatus(row: any) {

        this.service
            .toggleRiskControlStatus(
                row.id,
            )
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

    remove(row: any) {

        this.confirmationService.confirm({

            message:
                'Are you sure you want to delete this risk control?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeRiskControl(
                        row.id,
                    )
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Risk control deleted successfully',
                            });

                            this.loadData();
                        },
                    });
            },
        });
    }
}