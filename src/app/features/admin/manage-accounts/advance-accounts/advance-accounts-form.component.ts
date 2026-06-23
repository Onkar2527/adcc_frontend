import {
    Component,
    computed,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';

import { DateFieldComponent } from '../../../../shared/components/form/date-field/date-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';

import {
    AuditSchemeMasterService,
    AuditUnitService,
    CreateAdvanceAccountDto,
    ManageAccountsDataService,
} from '../../services/masters.service';

@Component({
    selector:
        'app-advance-account-form',

    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        SelectFieldComponent,
        DateFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div
      class="max-h-[90vh] p-4 overflow-y-auto"
    >

      <div
        class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4"
      >

        <!-- BASIC DETAILS -->

        <div
          class="text-lg font-semibold mb-4"
        >
          Basic Details
        </div>

        <div class="grid">

          <div class="col-12 md:col-6">

            <app-select-field
              label="Branch"

              [field]="branchId"

              [options]="branches()"

              optionLabel="name"

              optionValue="id"

              filterBy="name"

              [required]="true"
              [error]="branchError()"
            ></app-select-field>

          </div>

          <div class="col-12 md:col-6">

            <app-select-field
              label="Scheme"

              [field]="schemeId"

              [options]="schemes()"

              optionLabel="name"

              optionValue="id"

              filterBy="name,scheme_code"

              [required]="true"
              [error]="schemeError()"
            ></app-select-field>

          </div>

        </div>

        <div class="grid">

          <div class="col-12 md:col-4">

            <app-text-field
              label="Account Number"

              [field]="accountNo"

              [required]="true"
              [error]="accountNoError()"
            ></app-text-field>

          </div>

          <div class="col-12 md:col-4">

            <app-text-field
              label="UCIC"

              [field]="ucic"

              [required]="true"
              [error]="ucicError()"
            ></app-text-field>

          </div>

          <div class="col-12 md:col-4">

            <app-text-field
              label="Customer Type"

              [field]="customerType"

              [required]="true"
              [error]="customerTypeError()"
            ></app-text-field>

          </div>

        </div>

        <div class="mt-3">

          <app-text-field
            label="Account Holder Name"

            [field]="accountHolderName"

            [required]="true"
            [error]="accountHolderNameError()"
          ></app-text-field>

        </div>

        <!-- ACCOUNT DETAILS -->

<div class="text-lg font-semibold mt-5 mb-4">
  Account Details
</div>

<div class="grid">

  <div class="col-12 md:col-4">

    <app-text-field
      label="Interest Rate"
      [field]="interestRate"
      [required]="true"
      [error]="interestRateError()"
    ></app-text-field>

  </div>

  <div class="col-12 md:col-4">

    <app-text-field
      label="Outstanding Balance"
      [field]="outstandingBalance"
      [required]="true"
      [error]="outstandingBalanceError()"
    ></app-text-field>

  </div>

  <div class="col-12 md:col-4">

    <app-text-field
      label="Sanction Amount"
      [field]="sanctionAmount"
      [required]="true"
      [error]="sanctionAmountError()"
    ></app-text-field>

  </div>

</div>

<div class="grid">

  <div class="col-12 md:col-4">

    <app-text-field
      label="Account Status"
      [field]="accountStatus"
      [required]="true"
      [error]="accountStatusError()"
    ></app-text-field>

  </div>

  <div class="col-12 md:col-4">

    <app-text-field
      label="NPA Status"
      [field]="npaStatus"
      [required]="true"
      [error]="npaStatusError()"
    ></app-text-field>

  </div>

  <div class="col-12 md:col-4">

    <app-text-field
      label="NPA Classification"
      [field]="npaClassification"
    ></app-text-field>

  </div>

  <div class="col-12 md:col-4">

    <app-text-field
      label="KYC"
      [field]="kyc"
    ></app-text-field>

  </div>

</div>

<!-- DATES -->

<div class="text-lg font-semibold mt-5 mb-4">
  Dates
</div>

<div class="grid">

  <div class="col-12 md:col-4">

    <app-date-field
      label="Opening Date"
      [field]="accountOpeningDate"
      [required]="true"
      [error]="accountOpeningDateError()"
    ></app-date-field>

  </div>

  <div class="col-12 md:col-4">

    <app-date-field
      label="Balance Date"
      [field]="balanceDate"
      [required]="true"
      [error]="balanceDateError()"
    ></app-date-field>

  </div>

  <div class="col-12 md:col-4">

    <app-date-field
      label="Renewal Date"
      [field]="renewalDate"
      [required]="true"
      [error]="renewalDateError()"
    ></app-date-field>

  </div>

</div>

<div class="grid">

  <div class="col-12 md:col-4">

    <app-date-field
      label="Due Date"
      [field]="dueDate"
      [required]="true"
      [error]="dueDateError()"
    ></app-date-field>

  </div>

  <div class="col-12 md:col-4">

    <app-date-field
      label="Upload Date"
      [field]="uploadDate"
      [required]="true"
      [error]="uploadDateError()"
    ></app-date-field>

  </div>

  <div class="col-12 md:col-4">

    <app-date-field
      label="Upload Period From"
      [field]="uploadPeriodFrom"
      [required]="true"
      [error]="uploadPeriodFromError()"
    ></app-date-field>

  </div>

  <div class="col-12 md:col-4">

    <app-date-field
      label="Upload Period To"
      [field]="uploadPeriodTo"
      [required]="true"
      [error]="uploadPeriodToError()"
    ></app-date-field>

  </div>

</div>

        <!-- ACTIONS -->

        <div
          class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200"
        >

          <app-form-actions
            [loading]="saving()"
            [saveDisabled]="false"

            (save)="save()"

            (cancel)="cancel()"
          ></app-form-actions>

        </div>

      </div>

    </div>
  `,
})
export class AdvanceAccountFormComponent {

    private service =
        inject(ManageAccountsDataService);

    private unitService =
        inject(AuditUnitService);

    private schemeService =
        inject(AuditSchemeMasterService);

    private ref =
        inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    saving = signal(false);

    branches = signal<any[]>([]);

    schemes = signal<any[]>([]);

    uploadDate =
        signal<Date | null>(new Date());

    uploadPeriodFrom =
        signal<Date | null>(
            new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
            ),
        );

    uploadPeriodTo =
        signal<Date | null>(

            new Date(

                new Date().getFullYear(),

                new Date().getMonth() + 1,

                0,
            ),
        );

    branchId =
        signal<number | null>(null);

    schemeId =
        signal<number | null>(null);

    accountNo = signal('');

    accountHolderName =
        signal('');

    ucic = signal('');

    customerType =
        signal('');

    interestRate =
        signal('');

    // principalAmount =
    //     signal('');

    // balance = signal('');

    outstandingBalance = signal('');

    maturityAmount =
        signal('');

    sanctionAmount =
        signal('');

    accountStatus =
        signal<string>('');

    npaStatus =
        signal<string>('');

    npaClassification =
        signal<string>('');

    kyc =
        signal<string>('');

    accountOpeningDate =
        signal<Date | null>(null);

    balanceDate =
        signal<Date | null>(null);

    maturityDate =
        signal<Date | null>(null);

    closeDate =
        signal<Date | null>(null);

    renewalDate =
        signal<Date | null>(null);

    dueDate =
        signal<Date | null>(null);

    row: any = null;

    branchError = computed(() =>
        this.branchId() ? '' : 'Branch is required',
    );

    schemeError = computed(() =>
        this.schemeId() ? '' : 'Scheme is required',
    );

    accountNoError = computed(() =>
        this.accountNo().trim() ? '' : 'Account number is required',
    );

    accountHolderNameError = computed(() =>
        this.accountHolderName().trim() ? '' : 'Account holder name is required',
    );

    ucicError = computed(() =>
        this.ucic().trim() ? '' : 'UCIC is required',
    );

    customerTypeError = computed(() =>
        this.customerType().trim() ? '' : 'Customer type is required',
    );

    interestRateError = computed(() =>
        this.amountError(this.interestRate(), 'Interest rate'),
    );

    outstandingBalanceError = computed(() =>
        this.amountError(this.outstandingBalance(), 'Outstanding balance'),
    );

    sanctionAmountError = computed(() =>
        this.amountError(this.sanctionAmount(), 'Sanction amount'),
    );

    accountStatusError = computed(() =>
        this.accountStatus().trim() ? '' : 'Account status is required',
    );

    npaStatusError = computed(() =>
        this.npaStatus().trim() ? '' : 'NPA status is required',
    );

    accountOpeningDateError = computed(() =>
        this.accountOpeningDate() ? '' : 'Opening date is required',
    );

    balanceDateError = computed(() =>
        this.balanceDate() ? '' : 'Balance date is required',
    );

    renewalDateError = computed(() =>
        this.renewalDate() ? '' : 'Renewal date is required',
    );

    dueDateError = computed(() =>
        this.dueDate() ? '' : 'Due date is required',
    );

    uploadDateError = computed(() =>
        this.uploadDate() ? '' : 'Upload date is required',
    );

    uploadPeriodFromError = computed(() =>
        this.uploadPeriodFrom() ? '' : 'Upload period from date is required',
    );

    uploadPeriodToError = computed(() => {
        if (!this.uploadPeriodTo()) {
            return 'Upload period to date is required';
        }

        if (this.uploadPeriodFrom() && this.uploadPeriodTo()! < this.uploadPeriodFrom()!) {
            return 'Upload period to date cannot be before from date';
        }

        return '';
    });

    constructor() {

        this.row =
            this.ref.data;

        this.loadDropdowns();

        if (this.row) {

            this.patchData();
        }
    }

    loadDropdowns() {

        this.unitService
            .findAll()
            .subscribe({

                next: (res: any) => {

                    this.branches.set(
                        Array.isArray(res)

                            ? res.map(
                                (x: any) => ({

                                    ...x,

                                    id: Number(
                                        x.id,
                                    ),
                                }),
                            )

                            : [],
                    );
                },
            });

        this.schemeService
            .findAll()
            .subscribe({

                next: (res: any) => {

                    this.schemes.set(
                        Array.isArray(res)

                            ? res.map(
                                (x: any) => ({

                                    ...x,

                                    id: Number(
                                        x.id,
                                    ),
                                }),
                            )

                            : [],
                    );
                },
            });
    }

    patchData() {

        this.branchId.set(
            Number(
                this.row.branch_id,
            ),
        );

        this.schemeId.set(
            Number(
                this.row.scheme_id,
            ),
        );

        this.accountNo.set(
            this.row.account_no ?? '',
        );

        this.accountHolderName.set(
            this.row
                .account_holder_name
            ?? '',
        );

        this.ucic.set(
            this.row.ucic ?? '',
        );

        this.customerType.set(
            this.row.customer_type
            ?? '',
        );

        this.interestRate.set(
            this.row.intrest_rate
            ?? '',
        );

        // this.principalAmount.set(
        //     this.row
        //         .principal_amount
        //     ?? '',
        // );

        this.sanctionAmount.set(
            this.row
                .sanction_amount
            ?? '',
        );

        // this.balance.set(
        //     this.row.balance ?? '',
        // );

        this.outstandingBalance.set(
            this.row.outstanding_balance ?? '',
        );

        // this.maturityAmount.set(
        //     this.row
        //         .maturity_amount
        //     ?? '',
        // );

        this.accountStatus.set(
            this.row
                .account_status
            ?? '',
        );

        this.npaStatus.set(
            this.row
                .npa_status
            ?? '',
        );

        this.npaClassification.set(
            this.row.npa_classification ?? '',
        );

        this.kyc.set(
            this.row.kyc ?? '',
        );

        this.accountOpeningDate.set(
            this.row.account_opening_date
                ? new Date(
                    this.row.account_opening_date,
                )
                : null,
        );

        this.balanceDate.set(
            this.row.balance_date
                ? new Date(
                    this.row.balance_date,
                )
                : null,
        );

        this.renewalDate.set(
            this.row.renewal_date
                ? new Date(
                    this.row.renewal_date,
                )
                : null,
        );

        this.dueDate.set(
            this.row.due_date
                ? new Date(
                    this.row.due_date,
                )
                : null,
        );

        this.uploadDate.set(
            this.row.upload_date
                ? new Date(
                    this.row.upload_date,
                )
                : new Date(),
        );

        this.uploadPeriodFrom.set(
            this.row.upload_period_from
                ? new Date(
                    this.row.upload_period_from,
                )
                : this.uploadPeriodFrom(),
        );

        this.uploadPeriodTo.set(
            this.row.upload_period_to
                ? new Date(
                    this.row.upload_period_to,
                )
                : this.uploadPeriodTo(),
        );

        // this.maturityDate.set(
        //     this.row.maturity_date
        //         ? new Date(
        //             this.row.maturity_date,
        //         )
        //         : null,
        // );

        // this.closeDate.set(
        //     this.row.close_date
        //         ? new Date(
        //             this.row.close_date,
        //         )
        //         : null,
        // );
    }

    validate() {

        if (
            this.branchError()
            || this.schemeError()
            || this.accountNoError()
            || this.accountHolderNameError()
            || this.ucicError()
            || this.customerTypeError()
            || this.interestRateError()
            || this.outstandingBalanceError()
            || this.sanctionAmountError()
            || this.accountStatusError()
            || this.npaStatusError()
            || this.accountOpeningDateError()
            || this.balanceDateError()
            || this.renewalDateError()
            || this.dueDateError()
            || this.uploadDateError()
            || this.uploadPeriodFromError()
            || this.uploadPeriodToError()
        ) {

            this.messageService.add({
                severity: 'warn',

                summary: 'Validation Failed',

                detail: this.firstValidationError(),
            });

            return false;
        }

        return true;
    }

    private amountError(value: string, label: string) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return `${label} is required`;
        }

        if (Number.isNaN(Number(trimmedValue))) {
            return `${label} must be a valid number`;
        }

        return '';
    }

    private firstValidationError() {
        return [
            this.branchError(),
            this.schemeError(),
            this.accountNoError(),
            this.accountHolderNameError(),
            this.ucicError(),
            this.customerTypeError(),
            this.interestRateError(),
            this.outstandingBalanceError(),
            this.sanctionAmountError(),
            this.accountStatusError(),
            this.npaStatusError(),
            this.accountOpeningDateError(),
            this.balanceDateError(),
            this.renewalDateError(),
            this.dueDateError(),
            this.uploadDateError(),
            this.uploadPeriodFromError(),
            this.uploadPeriodToError(),
        ].find(Boolean) || 'Please correct the highlighted fields';
    }

    private formatDate(
        date: Date | null,
    ): string | undefined {

        if (!date) {
            return undefined;
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1,
            ).padStart(2, '0');

        const day =
            String(
                date.getDate(),
            ).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    save() {

        if (!this.validate()) {
            return;
        }

        this.saving.set(true);

        const payload:
            CreateAdvanceAccountDto =
        {

            branch_id:
                Number(
                    this.branchId(),
                ),

            scheme_id:
                Number(
                    this.schemeId(),
                ),

            account_no:
                this.accountNo(),

            account_holder_name:
                this.accountHolderName(),

            ucic:
                this.ucic(),

            customer_type:
                this.customerType(),

            intrest_rate:
                this.interestRate(),

            // principal_amount:
            //     this.principalAmount(),

            sanction_amount:
                this.sanctionAmount(),

            // balance:
            //     this.balance(),

            outstanding_balance:
                this.outstandingBalance(),

            // maturity_amount:
            //     this.maturityAmount(),

            account_status:
                this.accountStatus(),

            npa_status:
                this.npaStatus(),

            npa_classification:
                this.npaClassification(),

            kyc:
                this.kyc(),

            account_opening_date:
                this.formatDate(
                    this.accountOpeningDate(),
                ),

            balance_date:
                this.formatDate(
                    this.balanceDate(),
                ),

            due_date:
                this.formatDate(
                    this.dueDate(),
                ),

            renewal_date:
                this.formatDate(
                    this.renewalDate(),
                ),

            // maturity_date:
            //     this.formatDate(
            //         this.maturityDate(),
            //     ),

            // close_date:
            //     this.formatDate(
            //         this.closeDate(),
            //     ),

            upload_date:
                this.formatDate(
                    this.uploadDate(),
                )!,

            upload_period_from:
                this.formatDate(
                    this.uploadPeriodFrom(),
                )!,

            upload_period_to:
                this.formatDate(
                    this.uploadPeriodTo(),
                )!,
            sampling_filter: 0,

            assesment_period_id: 0,
        };

        const obs = this.row

            ? this.service
                .updateAdvanceAccount(
                    this.row.id,
                    payload,
                )

            : this.service
                .createAdvanceAccount(
                    payload,
                );

        obs.subscribe({

            next: (res) => {

                this.saving.set(false);

                this.ref.close({
                    saved: true,
                    data: res,
                });
            },

            error: (err) => {

                this.saving.set(false);

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
    }

    cancel() {
        this.ref.close();
    }
}
