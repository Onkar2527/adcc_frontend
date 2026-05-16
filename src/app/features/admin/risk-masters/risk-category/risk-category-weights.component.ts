import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';



import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { RiskCategoryMasterService } from '../../services/masters.service';

import { RiskCategoryWeightFormComponent } from './risk-category-weights-form.component';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-risk-category-weight',

    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
        DynamicDialogModule,
        ToastModule,
        ConfirmDialogModule, ButtonModule
    ],

    providers: [
        DialogService,
        ConfirmationService,
        MessageService,
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

        <h5 class="m-0 text-xl font-semibold">
          Risk Category Weights
        </h5>

      </div>

    </div>

    <!-- INFO CARD -->

    <div
      class="border-1 border-gray-300 border-round-lg p-4 mb-4 bg-gray-50"
    >

      <div class="grid">

        <div class="col-12 md:col-4">

          <div
            class="text-sm text-gray-500 mb-1"
          >
            Risk Category
          </div>

          <div
            class="font-semibold text-lg"
          >
            {{
              category()?.risk_category
                || '-'
            }}
          </div>

        </div>

        <div class="col-12 md:col-4">

          <div
            class="text-sm text-gray-500 mb-1"
          >
            Status
          </div>

          <div class="font-semibold">
            {{
              category()?.is_active == 1
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
export class RiskCategoryWeightComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    private service = inject(
        RiskCategoryMasterService,
    );

    private drawer = inject(FormDrawerService);

    private dialogService =
        inject(DialogService);

    private confirmationService =
        inject(ConfirmationService);

    private messageService =
        inject(MessageService);

    private router = inject(Router);

    loading = signal(false);

    rows = signal<any[]>([]);

    category = signal<any>(null);

    riskCategoryId = 0;

    globalFilterFields = [
        'year',
        'risk_weight',
        'risk_appetite_percent',
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
            field: 'year',
            header: 'Financial Year',
            width: '220px',
        },

        {
            field: 'risk_weight',
            header: 'Risk Weight',
            width: '180px',
            align: 'center',
        },

        {
            field: 'risk_appetite_percent',
            header: 'Risk Appetite %',
            width: '220px',
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

        this.riskCategoryId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        this.loadCategory();

        this.load();
    }

    loadCategory() {

        this.service
            .findOne(this.riskCategoryId)
            .subscribe({

                next: (res) => {

                    this.category.set(res);
                },
            });
    }

    load() {

        this.loading.set(true);

        this.service
            .findAllWeights(
                this.riskCategoryId,
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

    goBack() {

        this.router.navigate([
            '/admin/risk-categories',
        ]);
    }

    async openForm(row?: any) {

        const res = await this.drawer.open(
            RiskCategoryWeightFormComponent,
            {
                header: row
                    ? 'Edit Weight'
                    : 'Create New Weight',

                data: {
                    row,
                    riskCategoryId:
                        this.riskCategoryId,
                },

                width: 'min(600px, 100vw)',
            },
        );

        if (res?.saved) {

            this.load();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Weight ${row
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
                'Are you sure you want to delete this weight?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeWeight(row.id)
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Weight deleted successfully',
                            });

                            this.load();
                        },
                    });
            },
        });
    }
}