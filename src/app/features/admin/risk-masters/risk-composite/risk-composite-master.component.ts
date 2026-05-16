import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

import { RiskCompositeMasterService } from '../../services/masters.service';

import { RiskCompositeFormComponent } from './risk-composite-form.component';

@Component({
    selector: 'app-risk-composite',

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
          Composite Risk Master
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
export class RiskCompositeComponent
    implements OnInit {

    private service =
        inject(RiskCompositeMasterService);

    private drawer = inject(
        FormDrawerService,
    );

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    loading = signal(false);

    rows = signal<any[]>([]);

    globalFilterFields = [

        'business_risk_name',

        'control_risk_name',

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
            field: 'business_risk_name',
            header: 'Business Risk',
            width: '220px',
            cssClass: 'uppercase',
        },

        {
            field: 'control_risk_name',
            header: 'Control Risk',
            width: '220px',
            cssClass: 'uppercase',
        },

        {
            field: 'name',
            header: 'Composite Risk',
            width: '220px',
            cssClass: 'uppercase',
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
            .findAllRiskComposites()
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
            RiskCompositeFormComponent,
            {
                header: row
                    ? 'Edit Composite Risk'
                    : 'Create New Composite Risk',

                data: row,

                width: 'min(600px, 100vw)',
            },
        );

        if (res?.saved) {

            this.loadData();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Composite risk ${row
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

        if (event.name === 'delete') {

            this.remove(event.row);

            return;
        }
    }

    remove(row: any) {

        this.confirmationService.confirm({

            message:
                'Are you sure you want to delete this composite risk?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeRiskComposite(
                        row.id,
                    )
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Composite risk deleted successfully',
                            });

                            this.loadData();
                        },
                    });
            },
        });
    }
}