import {
  Component,
  inject,
  signal,
} from '@angular/core';

import { CommonModule }
  from '@angular/common';

import { ButtonModule }
  from 'primeng/button';

import { TableModule }
  from 'primeng/table';

import { MessageService }
  from 'primeng/api';

import { FormActionsComponent }
  from '../../../../shared/components/form/form-actions/form-actions.component';

import { DateFieldComponent }
  from '../../../../shared/components/form/date-field/date-field.component';

import { FormDrawerRef }
  from '../../../../core/services/drawer/form-drawer.ref';

import { ManageAccountsDataService }
  from '../../services/masters.service';

@Component({
  selector:
    'app-deposit-upload',

  standalone: true,

  imports: [

    CommonModule,

    ButtonModule,

    TableModule,

    FormActionsComponent,

    DateFieldComponent,
  ],

  template: `
    <div
      class="max-h-[90vh] overflow-y-auto p-4"
    >

      <div
        class="border-1 border-gray-300 border-round-lg bg-white shadow-1 p-4"
      >
        <!-- INFO -->

        <div
          class="surface-100 border-round p-3 mb-4 text-sm line-height-3"
        >

          <div>
            • Upload only CSV files
          </div>

          <div>
            • File must follow sample format
          </div>

          <div>
            • Duplicate account details (same account number and UCIC) are not allowed
          </div>

          <div>
            • Invalid rows will be rejected
          </div>

        </div>

        <!-- DATES -->

        <div class="grid mb-4">

          <div class="col-12 md:col-4">

            <app-date-field
              label="Dump Upload Date"
              [field]="uploadDate"
              [required]="true"
            ></app-date-field>

          </div>

          <div class="col-12 md:col-4">

            <app-date-field
              label="Period From"
              [field]="periodFrom"
              [required]="true"
            ></app-date-field>

          </div>

          <div class="col-12 md:col-4">

            <app-date-field
              label="Period To"
              [field]="periodTo"
              [required]="true"
            ></app-date-field>

          </div>

        </div>

        <!-- FILE SELECT -->

        <div
          class="border-2 border-dashed border-300 border-round p-5 text-center"
        >

          <input
            #fileInput
            type="file"
            accept=".csv"
            hidden
            (change)="onFileSelect($event)"
          />

          <button
            pButton
            type="button"
            icon="pi pi-upload"
            label="Choose CSV File"
            (click)="fileInput.click()"
          ></button>

          @if (selectedFileName().length > 0) {

            <div
              class="mt-3 text-sm font-medium text-primary"
            >
              {{ selectedFileName() }}
            </div>
          }

        </div>

        <!-- ACTIONS -->

        <div
          class="flex justify-content-between align-items-center mt-4"
        >

          <button
            pButton
            type="button"
            severity="contrast"
            icon="pi pi-download"
            label="Download Sample CSV"
            (click)="downloadSample()"
          ></button>

          <app-form-actions
            [loading]="uploading()"
            saveLabel="Validate CSV"
            (save)="upload()"
            (cancel)="cancel()"
          ></app-form-actions>

        </div>

        <!-- PREVIEW TABLE -->

        @if (previewRows().length > 0) {

          @if (hasValidationErrors()) {

          <div class="surface-100 border-left-3 border-red-500 p-3 mt-4 text-sm">

          <div
            class="font-semibold text-red-600 mb-2"
          >
            Validation Errors Found
          </div>

          <ul class="m-0 pl-3">

            @for (
              error of errorSummary();
              track error
            ) {

              <li>
                {{ error }}
              </li>
            }

          </ul>

        </div>

          } @else {

            <div class="surface-100 border-left-3 border-green-500 p-3 mt-4 text-sm">
              <div class="font-semibold text-green-700 mb-1">
                CSV is ready to add
              </div>
              <div class="text-700">
                {{ totalRows() }} rows validated successfully. Click Add Dump to insert the records.
              </div>
            </div>

          }

          <div class="mt-4">

            <div class="text-600 text-sm mb-2">
              {{ previewCaption() }}
            </div>

            <p-table
              [value]="previewRows()"
              styleClass="p-datatable-sm"
            >

              <ng-template pTemplate="header">

                <tr>

                  <th>Sr No</th>

                  <th>Branch</th>

                  <th>Scheme</th>

                  <th>Account No</th>

                  <th>Account Holder</th>

                  <th>Status</th>

                </tr>

              </ng-template>

              <ng-template
                pTemplate="body"
                let-row
              >

                <tr>

                  <td>
                    {{ row.sr_no }}
                  </td>

                  <td>
                    {{ row.branch_code }}
                  </td>

                  <td>
                    {{ row.scheme_code }}
                  </td>

                  <td>
                    {{ row.account_no }}
                  </td>

                  <td>
                    {{ row.account_holder_name }}
                  </td>

                  <td>

                    <span
                      [class]="
                        row.status === 'VALID'
                          ? 'text-green-600 font-medium'
                          : 'text-red-500 font-medium'
                      "
                    >
                      {{ row.status }}
                    </span>

                  </td>

                </tr>

              </ng-template>

            </p-table>

          </div>

          <!-- ADD DUMP -->

          <div
            class="flex justify-content-end mt-4"
          >

            <button
              pButton
              type="button"
              label="Add Dump"
              icon="pi pi-check"
              severity="success"
              [disabled]="!validated() || uploading()"
              [loading]="uploading()"
              (click)="addDump()"
            ></button>

          </div>
        }

      </div>

    </div>
  `,
})
export class DepositUploadComponent {

  private ref =
    inject(FormDrawerRef);

  private messageService =
    inject(MessageService);

  private service =
    inject(ManageAccountsDataService);

  uploading =
    signal(false);

  selectedFile =
    signal<File | null>(null);

  errorSummary =
    signal<string[]>([]);

  selectedFileName =
    signal('');

  previewRows =
    signal<any[]>([]);

  totalRows =
    signal(0);

  validatedRows =
    signal<any[]>([]);

  uploadKey =
    signal('');

  validated =
    signal(false);

  hasValidationErrors =
    signal(false);

  uploadDate =
    signal<Date | null>(
      new Date(),
    );

  periodFrom =
    signal<Date | null>(null);

  periodTo =
    signal<Date | null>(null);

  onFileSelect(
    event: Event,
  ) {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith('.csv')
    ) {

      this.messageService.add({

        severity: 'error',

        summary:
          'Invalid File',

        detail:
          'Please select CSV file only',
      });

      return;
    }

    this.selectedFile.set(file);

    this.selectedFileName.set(
      file.name,
    );

    this.previewRows.set([]);
    this.validatedRows.set([]);
    this.uploadKey.set('');
    this.validated.set(false);
    this.hasValidationErrors.set(false);
    this.errorSummary.set([]);
    this.totalRows.set(0);
  }

  downloadSample() {

    const link =
      document.createElement('a');

    link.href =
      'assets/csv/sample_csv_deposits.csv';

    link.download =
      'deposit-sample.csv';

    link.click();
  }

  upload() {

    if (!this.selectedFile()) {

      this.messageService.add({

        severity: 'warn',

        summary:
          'Validation',

        detail:
          'Please select CSV file',
      });

      return;
    }

    if (
      !this.periodFrom()
      || !this.periodTo()
    ) {

      this.messageService.add({

        severity: 'warn',

        summary:
          'Validation',

        detail:
          'Please select period dates',
      });

      return;
    }

    this.uploading.set(true);

    this.service
      .validateDepositCsv(
        this.selectedFile()!,
        {

          upload_date:
            this.uploadDate(),

          period_from:
            this.periodFrom(),

          period_to:
            this.periodTo(),
        },
      )

      .subscribe({

        next: (res: { rows: string | any[]; validRows: any; hasErrors: any; errorSummary?: string[]; uploadKey?: string; totalRows?: number; validCount?: number; }) => {

          this.uploading.set(false);

          const rows =
            Array.isArray(res.rows)
              ? res.rows
              : [];

          this.totalRows.set(
            Number(res.totalRows || rows.length),
          );

          this.previewRows.set(
            rows.slice(0, 200),
          );

          this.validatedRows.set(
            Array.isArray(res.validRows)
              ? res.validRows
              : [],
          );

          this.uploadKey.set(
            res.uploadKey || '',
          );

          this.validated.set(
            !res.hasErrors && !!res.uploadKey,
          );

          this.hasValidationErrors.set(
            !!res.hasErrors,
          );

          this.errorSummary.set(
            Array.isArray(
              res.errorSummary,
            )

              ? [...new Set(
                res.errorSummary,
              )]

              : [],
          );

          if (res.hasErrors) {

            this.messageService.add({

              severity: 'warn',

              summary:
                'Validation Errors Found',

              detail:
                'Please review duplicate/invalid rows',
            });

            return;
          }

          this.messageService.add({

            severity: 'success',

              summary:
                'Validation Successful',

              detail:
              `${res.validCount || res.totalRows || rows.length} rows validated`,
          });
        },

        error: (err: { error: { message: any; }; }) => {

          this.uploading.set(false);

          this.messageService.add({

            severity: 'error',

            summary:
              'Validation Failed',

            detail:
              err?.error?.message
              || 'Something went wrong',
          });
        },
      });
  }

  addDump() {

    if (!this.uploadKey()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Required',
        detail: 'Please validate the CSV before adding dump',
      });

      return;
    }

    this.uploading.set(true);

    this.service
      .addDepositDump(
        this.uploadKey(),
      )

      .subscribe({

        next: (res: { inserted: any; }) => {

          this.uploading.set(false);

          this.messageService.add({

            severity: 'success',

            summary:
              'Dump Added',

            detail:
              `${res.inserted} records inserted successfully`,
          });

          this.ref.close({
            uploaded: true,
          });
        },

        error: (err: { error: { message: any; }; }) => {

          this.uploading.set(false);

          this.messageService.add({

            severity: 'error',

            summary:
              'Add Dump Failed',

            detail:
              err?.error?.message
              || 'Something went wrong',
          });
        },
      });
  }

  cancel() {

    this.ref.close();
  }

  previewCaption() {
    if (this.hasValidationErrors()) {
      return `Showing ${this.previewRows().length} row(s) requiring attention. Total CSV rows: ${this.totalRows()}.`;
    }

    return `Showing first ${this.previewRows().length} row(s) for preview. Total CSV rows: ${this.totalRows()}.`;
  }
}
