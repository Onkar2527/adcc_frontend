import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';
import { FormActionsComponent } from '../../../../shared/components/form';
import {
  BulkUploadPreviewRow,
  MasterBulkUploadConfig,
} from '../../services/master-bulk-upload.service';

@Component({
  selector: 'app-master-bulk-upload',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    FormActionsComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="max-h-[90vh] overflow-y-auto p-4">
      <div class="border-1 border-gray-300 border-round-lg bg-white shadow-1 p-4">
        <div class="surface-100 border-round p-3 mb-4 text-sm line-height-3">
          <div>• Upload only CSV files</div>
          <div>• Header names must match the sample CSV</div>
          <div>• Invalid rows are shown with row-level errors before upload</div>
          <div>• Upload starts only when every row is valid</div>
        </div>

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
            <div class="mt-3 text-sm font-medium text-primary">
              {{ selectedFileName() }}
            </div>
          }
        </div>

        <div class="flex justify-content-between align-items-center mt-4 gap-3 flex-wrap">
          <button
            pButton
            type="button"
            severity="contrast"
            icon="pi pi-download"
            label="Download Sample CSV"
            (click)="downloadSample()"
          ></button>

          <app-form-actions
            [loading]="validating()"
            saveLabel="Validate CSV"
            (save)="validateCsv()"
            (cancel)="cancel()"
          ></app-form-actions>
        </div>

        @if (previewRows().length > 0) {
          @if (hasErrors()) {
            <div class="surface-100 border-left-3 border-red-500 p-3 mt-4 text-sm">
              <div class="font-semibold text-red-600 mb-2">Validation Errors Found</div>
              <ul class="m-0 pl-3">
                @for (error of errorSummary(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            </div>
          } @else {
            <div class="surface-100 border-left-3 border-green-500 p-3 mt-4 text-sm">
              <div class="font-semibold text-green-700 mb-1">CSV is ready to upload</div>
              <div class="text-700">
                {{ validRows().length }} row(s) validated successfully.
              </div>
            </div>
          }

          <div class="mt-4">
            <div class="text-600 text-sm mb-2">
              Showing {{ previewRows().length }} of {{ totalRows() }} row(s)
            </div>

            <p-table
              [value]="previewRows()"
              styleClass="p-datatable-sm"
              [scrollable]="true"
              scrollHeight="420px"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Row</th>
                  @for (field of config.previewFields; track field.field) {
                    <th>{{ field.header }}</th>
                  }
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.rowNumber }}</td>
                  @for (field of config.previewFields; track field.field) {
                    <td>{{ row[field.field] || '-' }}</td>
                  }
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
                  <td>{{ row.message }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="flex justify-content-end mt-4">
            <button
              pButton
              type="button"
              label="Upload Rows"
              icon="pi pi-check"
              severity="success"
              [disabled]="hasErrors() || !validRows().length || uploading()"
              [loading]="uploading()"
              (click)="uploadRows()"
            ></button>
          </div>
        }
      </div>
    </div>
  `,
})
export class MasterBulkUploadComponent {
  private ref = inject(FormDrawerRef);
  private messageService = inject(MessageService);

  readonly config: MasterBulkUploadConfig = this.ref.data.config;

  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  previewRows = signal<BulkUploadPreviewRow[]>([]);
  validRows = signal<any[]>([]);
  errorSummary = signal<string[]>([]);
  validating = signal(false);
  uploading = signal(false);
  totalRows = signal(0);
  context = signal<any>(null);

  hasErrors = computed(() => this.previewRows().some((row) => row.status === 'ERROR'));

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a CSV file only',
      });
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.previewRows.set([]);
    this.validRows.set([]);
    this.errorSummary.set([]);
    this.totalRows.set(0);
  }

  validateCsv() {
    if (!this.selectedFile()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please select a CSV file',
      });
      return;
    }

    this.validating.set(true);

    this.readFileText(this.selectedFile()!)
      .then((content) => {
        const parsed = this.parseCsv(content);
        if (!parsed.headers.length) {
          throw new Error('CSV file is empty');
        }

        const headerErrors = this.validateHeaders(parsed.headers);
        if (headerErrors.length) {
          this.previewRows.set([]);
          this.validRows.set([]);
          this.errorSummary.set(headerErrors);
          this.totalRows.set(0);
          this.messageService.add({
            severity: 'warn',
            summary: 'Header Validation Failed',
            detail: headerErrors[0],
          });
          this.validating.set(false);
          return;
        }

        this.config.loadContext().subscribe({
          next: (context) => {
            const session = this.config.createSession ? this.config.createSession(context) : {};
            const previewRows = parsed.rows.map((row, index) =>
              this.config.validateRow(row, index + 2, context, session),
            );
            const validRows = previewRows
              .filter((row) => row.status === 'VALID' && row.normalized)
              .map((row) => row.normalized);
            const errors = [
              ...new Set(
                previewRows
                  .filter((row) => row.status === 'ERROR')
                  .map((row) => `Row ${row.rowNumber}: ${row.message}`),
              ),
            ];

            this.context.set(context);
            this.previewRows.set(previewRows.slice(0, 200));
            this.validRows.set(validRows);
            this.errorSummary.set(errors);
            this.totalRows.set(previewRows.length);
            this.validating.set(false);

            this.messageService.add({
              severity: errors.length ? 'warn' : 'success',
              summary: errors.length ? 'Validation Errors Found' : 'Validation Successful',
              detail: errors.length
                ? 'Please review the invalid rows'
                : `${validRows.length} row(s) validated successfully`,
            });
          },
          error: (error) => {
            this.validating.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Validation Failed',
              detail: error?.error?.message || error?.message || 'Unable to validate CSV',
            });
          },
        });
      })
      .catch((error) => {
        this.validating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Failed',
          detail: error?.message || 'Unable to read CSV file',
        });
      });
  }

  uploadRows() {
    if (!this.validRows().length || this.hasErrors()) {
      return;
    }

    this.uploading.set(true);
    this.config.upload(this.validRows(), this.context()).subscribe({
      next: (result) => {
        this.uploading.set(false);

        if (result.errors.length) {
          this.errorSummary.set(result.errors);
          this.messageService.add({
            severity: 'warn',
            summary: 'Upload Completed With Errors',
            detail: `${result.successCount} row(s) uploaded. ${result.errors.length} row(s) failed.`,
          });
          return;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Upload Successful',
          detail: `${result.successCount} ${this.config.entityLabel} uploaded successfully`,
        });
        this.ref.close({ saved: true, count: result.successCount });
      },
      error: (error) => {
        this.uploading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: error?.error?.message || error?.message || 'Unable to upload rows',
        });
      },
    });
  }

  downloadSample() {
    const csv = this.buildCsv([
      this.config.expectedHeaders,
      ...this.config.sampleRows,
    ]);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${this.config.key}-sample.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  cancel() {
    this.ref.close();
  }

  private validateHeaders(headers: string[]): string[] {
    const actual = headers.map((header) => this.normalizeKey(header));
    const expected = this.config.expectedHeaders.map((header) => this.normalizeKey(header));

    const missing = expected.filter((header) => !actual.includes(header));
    if (!missing.length) {
      return [];
    }

    return [
      `Missing required columns: ${missing.join(', ')}`,
    ];
  }

  private parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const rows: string[][] = [];
    let current = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i += 1) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i += 1;
        }
        row.push(current.trim());
        current = '';
        if (row.some((item) => item.length > 0)) {
          rows.push(row);
        }
        row = [];
        continue;
      }

      current += char;
    }

    if (current.length || row.length) {
      row.push(current.trim());
      if (row.some((item) => item.length > 0)) {
        rows.push(row);
      }
    }

    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => header.trim());
    const mappedRows = dataRows.map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[this.normalizeKey(header)] = (cells[index] || '').trim();
      });
      return record;
    });

    return { headers, rows: mappedRows };
  }

  private buildCsv(rows: string[][]): string {
    return rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
  }

  private normalizeKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  private readFileText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read selected file'));
      reader.readAsText(file);
    });
  }
}
