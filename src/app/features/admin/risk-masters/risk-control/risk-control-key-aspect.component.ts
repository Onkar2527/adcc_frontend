import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

import { RiskControlMasterService } from '../../services/masters.service';

import { RiskControlKeyAspectFormComponent } from './risk-control-key-aspect-form.component';
import { ButtonModule } from 'primeng/button';

@Component({
    selector:
        'app-risk-control-key-aspect',

    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule, ButtonModule
    ],

    providers: [
        MessageService,
        ConfirmationService,
    ],

    template: `
    <div class="card">

      <!-- HEADER -->

      <div
        class="flex align-items-center justify-content-between mb-4"
      >

        <div
          class="flex align-items-center gap-3"
        >

          <button
            pButton
            type="button"
            icon="pi pi-arrow-left"
            class="p-button-text p-button-sm"
            (click)="goBack()"
          ></button>

          <h5
            class="m-0 text-xl font-semibold"
          >
            Risk Control Key Aspects
          </h5>

        </div>

      </div>

      <!-- INFO CARD -->

      <div
        class="border-1 border-gray-300 border-round-lg p-4 mb-4 bg-gray-50"
      >

        <div class="grid">

          <div
            class="col-12 md:col-4"
          >

            <div
              class="text-sm text-gray-500 mb-1"
            >
              Risk Control
            </div>

            <div
              class="font-semibold text-lg"
            >
              {{
                control()?.name
                  || '-'
              }}
            </div>

          </div>

          <div
            class="col-12 md:col-4"
          >

            <div
              class="text-sm text-gray-500 mb-1"
            >
              Status
            </div>

            <div
              class="font-semibold"
            >
              {{
                control()?.is_active
                  == 1
                    ? 'Active'
                    : 'Inactive'
              }}
            </div>

          </div>

        </div>

      </div>

      <!-- TABLE -->

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

        (onRefresh)="load()"
      ></app-table>

    </div>

    <p-toast></p-toast>

    <p-confirmDialog></p-confirmDialog>
  `,
})
export class RiskControlKeyAspectComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(RiskControlMasterService);

    private drawer = inject(
        FormDrawerService,
    );

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    loading = signal(false);

    rows = signal<any[]>([]);

    control = signal<any>(null);

    riskControlId = 0;

    globalFilterFields = [
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
            field: 'name',
            header: 'Key Aspect',
            width: '350px',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
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

        this.riskControlId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        this.loadControl();

        this.load();
    }

    loadControl() {

        this.service
            .findOneRiskControl(
                this.riskControlId,
            )
            .subscribe({

                next: (res) => {

                    this.control.set(res);
                },
            });
    }

    load() {

        this.loading.set(true);

        this.service
            .findAllKeyAspects(
                this.riskControlId,
            )
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
            RiskControlKeyAspectFormComponent,
            {
                header: row
                    ? 'Edit Key Aspect'
                    : 'Create New Key Aspect',

                data: {
                    row,
                    riskControlId:
                        this.riskControlId,
                },

                width: 'min(600px, 100vw)',
            },
        );

        if (res?.saved) {

            this.load();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Key aspect ${row
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
                'Are you sure you want to delete this key aspect?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeKeyAspect(
                        row.id,
                    )
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Key aspect deleted successfully',
                            });

                            this.load();
                        },
                    });
            },
        });
    }

    goBack() {

        this.router.navigate([
            '/admin/risk-controls',
        ]);
    }
}