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
    CreateDepositAccountDto,
    ManageAccountsDataService,
} from '../../services/masters.service';

@Component({
    selector:
        'app-deposit-account-form',

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

        <div
          class="text-lg font-semibold mt-5 mb-4"
        >
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
              label="Principal Amount"

              [field]="principalAmount"

              [required]="true"
              [error]="principalAmountError()"
            ></app-text-field>

          </div>

          <div class="col-12 md:col-4">

            <app-text-field
              label="Balance"

              [field]="balance"

              [required]="true"
              [error]="balanceError()"
            ></app-text-field>

          </div>

        </div>

        <div class="grid">

          <div class="col-12 md:col-4">

            <app-text-field
              label="Maturity Amount"

              [field]="maturityAmount"

              [required]="true"
              [error]="maturityAmountError()"
            ></app-text-field>

          </div>

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
                label="KYC"

                [field]="kyc"
            ></app-text-field>

            </div>

        </div>

        <!-- DATES -->

        <div
          class="text-lg font-semibold mt-5 mb-4"
        >
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
              label="Maturity Date"

              [field]="maturityDate"
              [required]="true"
              [error]="maturityDateError()"
            ></app-date-field>

          </div>

        </div>

        <div class="grid">

          <div class="col-12 md:col-4">

            <app-date-field
              label="Close Date"

              [field]="closeDate"
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
export class DepositAccountFormComponent {

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

    principalAmount =
        signal('');

    balance = signal('');

    maturityAmount =
        signal('');

    accountStatus =
        signal<string>('');

    kyc = signal('');

    accountOpeningDate =
        signal<Date | null>(null);

    balanceDate =
        signal<Date | null>(null);

    maturityDate =
        signal<Date | null>(null);

    closeDate =
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

    principalAmountError = computed(() =>
        this.amountError(this.principalAmount(), 'Principal amount'),
    );

    balanceError = computed(() =>
        this.amountError(this.balance(), 'Balance'),
    );

    maturityAmountError = computed(() =>
        this.amountError(this.maturityAmount(), 'Maturity amount'),
    );

    accountStatusError = computed(() =>
        this.accountStatus().trim() ? '' : 'Account status is required',
    );

    accountOpeningDateError = computed(() =>
        this.accountOpeningDate() ? '' : 'Opening date is required',
    );

    balanceDateError = computed(() =>
        this.balanceDate() ? '' : 'Balance date is required',
    );

    maturityDateError = computed(() =>
        this.maturityDate() ? '' : 'Maturity date is required',
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

        this.principalAmount.set(
            this.row
                .principal_amount
            ?? '',
        );

        this.balance.set(
            this.row.balance ?? '',
        );

        this.maturityAmount.set(
            this.row
                .maturity_amount
            ?? '',
        );

        this.accountStatus.set(
            this.row
                .account_status
            ?? 'ACTIVE',
        );

        this.kyc.set(
            this.row.kyc ?? '',
        );

        this.accountOpeningDate.set(
            this.row.account_opening_date
                ? this.parseDate(
                    this.row.account_opening_date,
                )
                : null,
        );

        this.balanceDate.set(
            this.row.balance_date
                ? this.parseDate(
                    this.row.balance_date,
                )
                : null,
        );

        this.maturityDate.set(
            this.row.maturity_date
                ? this.parseDate(
                    this.row.maturity_date,
                )
                : null,
        );

        this.closeDate.set(
            this.row.close_date
                ? this.parseDate(
                    this.row.close_date,
                )
                : null,
        );

        this.uploadDate.set(
            this.row.upload_date
                ? this.parseDate(
                    this.row.upload_date,
                )
                : new Date(),
        );

        this.uploadPeriodFrom.set(
            this.row.upload_period_from
                ? this.parseDate(
                    this.row.upload_period_from,
                )
                : this.uploadPeriodFrom(),
        );

        this.uploadPeriodTo.set(
            this.row.upload_period_to
                ? this.parseDate(
                    this.row.upload_period_to,
                )
                : this.uploadPeriodTo(),
        );
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
            || this.principalAmountError()
            || this.balanceError()
            || this.maturityAmountError()
            || this.accountStatusError()
            || this.accountOpeningDateError()
            || this.balanceDateError()
            || this.maturityDateError()
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
            this.principalAmountError(),
            this.balanceError(),
            this.maturityAmountError(),
            this.accountStatusError(),
            this.accountOpeningDateError(),
            this.balanceDateError(),
            this.maturityDateError(),
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

    private parseDate(value: string): Date | null {
        if (value.includes('T')) {
            const parsed =
                new Date(value);

            return Number.isNaN(parsed.getTime())
                ? null
                : parsed;
        }

        const datePart =
            value.split(' ')[0];

        const match =
            datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (match) {
            return new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3]),
            );
        }

        const displayMatch =
            datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);

        if (displayMatch) {
            return new Date(
                Number(displayMatch[3]),
                Number(displayMatch[2]) - 1,
                Number(displayMatch[1]),
            );
        }

        const parsed =
            new Date(value);

        return Number.isNaN(parsed.getTime())
            ? null
            : parsed;
    }

    save() {

        if (!this.validate()) {
            return;
        }

        this.saving.set(true);

        const payload:
            CreateDepositAccountDto =
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

            principal_amount:
                this.principalAmount(),

            balance:
                this.balance(),

            maturity_amount:
                this.maturityAmount(),

            account_status:
                this.accountStatus(),

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

            maturity_date:
                this.formatDate(
                    this.maturityDate(),
                ),

            close_date:
                this.formatDate(
                    this.closeDate(),
                ),

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
                .updateDepositAccount(
                    this.row.id,
                    payload,
                )

            : this.service
                .createDepositAccount(
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
