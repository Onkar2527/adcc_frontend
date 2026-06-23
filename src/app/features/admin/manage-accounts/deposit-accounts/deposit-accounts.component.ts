import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';

import { DateFieldComponent } from '../../../../shared/components/form/date-field/date-field.component';

import { DepositAccountFormComponent } from './deposit-accounts-form.component';
import { DepositUploadComponent } from './deposit-upload.component';


import { ManageAccountsDataService, AuditUnitService, AuditSchemeMasterService } from '../../services/masters.service';
import { DepositUploadDumpsComponent } from './deposit-upload-dumps.component';

@Component({
    selector: 'app-deposit-accounts',

    standalone: true,

    imports: [
        CommonModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        TableComponent,
        TextFieldComponent,
        SelectFieldComponent,
        DateFieldComponent,
        DatePipe
    ],

    providers: [
        MessageService,
        ConfirmationService,
        DatePipe
    ],

    template: `
    <div class="card">

      <!-- HEADER -->

      <div
        class="flex align-items-center justify-content-between mb-4"
      >

        <h5 class="m-0 text-xl font-semibold">
          Manage Deposit Accounts
        </h5>

        <div class="flex gap-2">

          <button
            pButton
            type="button"
            icon="pi pi-upload"
            label="Upload CSV"
            severity="secondary"
            (click)="openUploadDrawer()"
          ></button>

          <button
            pButton
            type="button"
            icon="pi pi-download"
            label="Sample CSV"
            severity="contrast"
            (click)="downloadSampleCsv()"
          ></button>

          <button
        pButton
        type="button"
        icon="pi pi-eye"
        label="View Upload Dumps"
        severity="info"
        (click)="openUploadDumps()"
        ></button>

        </div>

      </div>

      <!-- FILTERS -->

      <div
        class="border-1 border-gray-300 border-round-lg p-4 mb-4"
      >

        <div class="grid">

          <div class="col-12 md:col-3">

            <app-select-field
              label="Search Type"
              [field]="searchType"
              [options]="searchTypes"
              optionLabel="label"
              optionValue="value"
              [filter]="true"
              filterBy="label"
              [virtualScroll]="false"
            ></app-select-field>

          </div>

          <div class="col-12 md:col-3">

            <app-text-field
              label="Search"
              [field]="search"
              placeholder="Enter search"
            ></app-text-field>

          </div>

          <div class="col-12 md:col-3">

            <app-select-field
              label="Branch"
              [field]="branchId"
              [options]="branches()"
              optionLabel="name"
              optionValue="id"
              [filter]="true"
              filterBy="name"
            ></app-select-field>

          </div>

          <div class="col-12 md:col-3">

            <app-select-field
              label="Scheme"
              [field]="schemeId"
              [options]="schemes()"
              optionLabel="name"
              optionValue="id"
              [filter]="true"
              filterBy="name"
            ></app-select-field>

          </div>

        </div>

        <div class="grid mt-1">

          <div class="col-12 md:col-3">

            <app-date-field
              label="Period From"
              [field]="periodFrom"
            ></app-date-field>

          </div>

          <div class="col-12 md:col-3">

            <app-date-field
              label="Period To"
              [field]="periodTo"
            ></app-date-field>

          </div>

          <div
            class="col-12 md:col-6 flex align-items-end justify-content-end gap-2"
          >

            <button
              pButton
              type="button"
              label="Search"
              icon="pi pi-search"
              (click)="load()"
            ></button>

            <button
              pButton
              type="button"
              label="Reset"
              severity="secondary"
              icon="pi pi-refresh"
              (click)="resetFilters()"
            ></button>

          </div>

        </div>

      </div>

      <!-- TABLE -->

      <app-table
        [columns]="columns"

        [data]="accounts()"

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
export class DepositAccountsComponent
    implements OnInit {

    private service =
        inject(ManageAccountsDataService);

    private unitService =
        inject(AuditUnitService);

    private schemeService =
        inject(AuditSchemeMasterService);

    private drawer =
        inject(FormDrawerService);

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    private datePipe =
        inject(DatePipe);

    loading = signal(false);

    accounts = signal<any[]>([]);

    branches = signal<any[]>([]);

    schemes = signal<any[]>([]);

    search = signal('');

    searchType =
        signal<string | null>(null);

    branchId =
        signal<number | null>(null);

    schemeId =
        signal<number | null>(null);

    periodFrom =
        signal<Date | null>(null);

    periodTo =
        signal<Date | null>(null);

    searchTypes = [

        {
            label: 'Account Number',
            value: 'account_no',
        },

        {
            label: 'Account Holder',
            value:
                'account_holder_name',
        },

        {
            label: 'UCIC',
            value: 'ucic',
        },
    ];

    globalFilterFields = [

        'account_no',

        'account_holder_name',

        'ucic',

        'branch_name',

        'scheme_name',
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
            field: 'account_no',
            header: 'Account No',
            width: '180px',
        },

        {
            field:
                'account_holder_name',
            header: 'Account Holder',
            width: '260px',
        },

        {
            field: 'ucic',
            header: 'UCIC',
            width: '180px',
        },

        {
            field: 'branch_name',
            header: 'Branch',
            width: '220px',
        },

        {
            field: 'scheme_name',
            header: 'Scheme',
            width: '220px',
        },

        {
            field: 'balance',
            header: 'Balance',
            width: '160px',
        },

        {
            field: 'maturity_date',
            header: 'Maturity Date',
            width: '180px',
        },

        {
            field: 'kyc',
            header: 'KYC',
            width: '160px',
        },

        {
            field: 'account_status',
            header: 'Status',
            width: '160px',
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

        this.loadDropdowns();

        // this.loadInitial();
    }

    loadDropdowns() {

        this.unitService
            .findAll()
            .subscribe({

                next: (res: any) => {

                    this.branches.set([
                        ...(Array.isArray(res)
                            ? res
                            : []),
                    ]);
                },
            });

        this.schemeService
            .findAll()
            .subscribe({

                next: (res: any) => {

                    this.schemes.set([
                        ...(Array.isArray(res)
                            ? res
                            : []),
                    ]);
                },
            });
    }

    async openUploadDumps() {

        await this.drawer.open(
            DepositUploadDumpsComponent,
            {

                header:
                    'Deposit Upload Dumps',

                width:
                    '800px',
            },
        );
    }
    load() {

        this.loading.set(true);

        this.service
            .findAllDepositAccounts({

                search:
                    this.search(),

                search_type:
                    this.searchType()
                    ?? undefined,

                branch_id:
                    this.branchId()
                    ?? undefined,

                scheme_id:
                    this.schemeId()
                    ?? undefined,

                period_from:
                    this.formatDate(
                        this.periodFrom(),
                    ),

                period_to:
                    this.formatDate(
                        this.periodTo(),
                    ),

                page: 1,

                limit: 50,
            })
            .subscribe({

                next: (res) => {

                    const rows =
                        Array.isArray(
                            res.data,
                        )
                            ? res.data
                            : [];

                    this.accounts.set(
                        rows.map(
                            (row: any) => ({

                                ...row,
                                maturity_date:
                                    this.datePipe.transform(
                                        row.maturity_date,
                                        'dd-MM-yyyy',
                                    ),

                                can_edit:
                                    Number(
                                        row.assesment_period_id,
                                    ) === 0,

                                can_delete:
                                    Number(
                                        row.sampling_filter,
                                    ) === 0,
                            }),
                        ),
                    );

                    this.loading.set(false);
                },

                error: () => {

                    this.loading.set(false);
                },
            });
    }

    loadInitial() {

        this.loading.set(true);

        this.service
            .findAllDepositAccounts({

                page: 1,

                limit: 50,
            })

            .subscribe({

                next: (res) => {

                    const rows =
                        Array.isArray(
                            res.data,
                        )
                            ? res.data
                            : [];

                    this.accounts.set(

                        rows.map(
                            (row: any) => ({

                                ...row,

                                maturity_date:
                                    this.datePipe.transform(
                                        row.maturity_date,
                                        'dd-MM-yyyy',
                                    ),

                                can_edit:
                                    Number(
                                        row.assesment_period_id,
                                    ) === 0,

                                can_delete:
                                    Number(
                                        row.sampling_filter,
                                    ) === 0,
                            }),
                        ),
                    );

                    this.loading.set(false);
                },

                error: () => {

                    this.loading.set(false);
                },
            });
    }

    async openUploadDrawer() {

        await this.drawer.open(
            DepositUploadComponent,
            {

                header:
                    'Upload Deposit Accounts',

                width:
                    'min(850px, 98vw)',
            },
        );
    }

    downloadSampleCsv() {

        const link =
            document.createElement('a');

        link.href =
            'assets/csv/sample_csv_deposits.csv';

        link.download =
            'deposit-sample.csv';

        link.click();
    }

    formatDate(
        date: Date | null,
    ): string | undefined {

        if (!date) {
            return undefined;
        }

        const year =
            date.getFullYear();

        const month = String(
            date.getMonth() + 1,
        ).padStart(2, '0');

        const day = String(
            date.getDate(),
        ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    resetFilters() {

        this.search.set('');

        this.searchType.set(null);

        this.branchId.set(null);

        this.schemeId.set(null);

        this.periodFrom.set(null);

        this.periodTo.set(null);

        this.load();
    }

    async openForm(row?: any) {

        const res = await this.drawer.open(
            DepositAccountFormComponent,
            {

                header: row
                    ? 'Edit Deposit Account'
                    : 'Add Deposit Account',

                data: row,

                width: 'min(1000px, 100vw)',
            },
        );

        if (res?.saved) {

            this.load();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Deposit account ${row
                    ? 'updated'
                    : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: any) {

        const row = event.row;

        if (
            event.name === 'edit'
        ) {

            if (!row.can_edit) {

                this.messageService.add({
                    severity: 'warn',

                    summary:
                        'Assessment Completed',

                    detail:
                        'Assessment already done for this account',
                });

                return;
            }

            this.openForm(row);

            return;
        }

        if (
            event.name === 'delete'
        ) {

            if (!row.can_delete) {

                this.messageService.add({
                    severity: 'warn',

                    summary:
                        'Sampled Account',

                    detail:
                        'Sampled account cannot be deleted',
                });

                return;
            }

            this.remove(row);
        }
    }

    remove(row: any) {

        this.confirmationService.confirm({

            message:
                'Are you sure you want to delete this deposit account?',

            header:
                'Delete Confirmation',

            icon:
                'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeDepositAccount(
                        row.id,
                    )
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Deposit account deleted successfully',
                            });

                            this.load();
                        },

                        error: (err) => {

                            this.messageService.add({
                                severity: 'error',

                                summary: 'Error',

                                detail:
                                    err?.error
                                        ?.message
                                    || 'Something went wrong',
                            });
                        },
                    });
            },
        });
    }
}