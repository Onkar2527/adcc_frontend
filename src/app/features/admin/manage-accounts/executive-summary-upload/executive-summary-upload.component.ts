import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';
import { AuditUnitService, AuditSchemeMasterService, MasterBulkUploadApiService } from '../../services/masters.service';

interface PreviewRow {
  rowNumber: number;
  audit_unit_code: string;
  gl_code: string;
  march_position: string;
  status: 'VALID' | 'ERROR';
  message: string;
}

@Component({
  selector: 'app-executive-summary-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToastModule,
    SelectFieldComponent
  ],
  providers: [MessageService],
  template: `
    <div class="card p-4">
      <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4">
        <div>
          <h5 class="m-0 text-2xl font-bold text-primary">Executive Summary Bulk Upload</h5>
          <p class="text-500 m-0 mt-1">Upload financial year March Position for audit units and GL codes</p>
        </div>
      </div>

      <div class="grid">
        <!-- LEFT PANEL: UPLOAD CONTROL -->
        <div class="col-12 lg:col-6">
          <div class="card shadow-1 p-4 surface-card border-round-lg border-1 border-300">
            <h6 class="text-lg font-semibold mb-3">Upload Configuration</h6>
            
            <div class="mb-4">
              <app-select-field
                label="Financial Year"
                [field]="selectedYearId"
                [options]="years()"
                optionLabel="label"
                optionValue="value"
                [required]="true"
                placeholder="Select Year">
              </app-select-field>
            </div>

            <div class="border-2 border-dashed border-300 border-round p-5 text-center bg-gray-50 flex flex-column align-items-center justify-content-center cursor-pointer hover:bg-gray-100 transition-colors transition-duration-200"
                 (click)="fileInput.click()">
              <input
                #fileInput
                type="file"
                accept=".csv"
                hidden
                (change)="onFileSelect($event)"
              />
              <i class="pi pi-cloud-upload text-4xl text-primary mb-3"></i>
              <span class="text-600 font-medium mb-2">Drag and drop CSV file here or click to browse</span>
              <span class="text-400 text-xs">Supported format: CSV</span>

              @if (selectedFileName()) {
                <div class="mt-3 px-3 py-1 bg-primary-50 text-primary border-round text-sm font-semibold border-1 border-primary-200">
                  {{ selectedFileName() }}
                </div>
              }
            </div>

            <div class="flex justify-content-between align-items-center mt-4 gap-2 flex-wrap">
              <button
                pButton
                type="button"
                severity="contrast"
                icon="pi pi-download"
                label="Download Sample CSV"
                (click)="downloadSample()"
              ></button>

              <div class="flex gap-2">
                <button
                  pButton
                  type="button"
                  severity="secondary"
                  icon="pi pi-refresh"
                  label="Reset"
                  [disabled]="!selectedFile() && !previewRows().length"
                  (click)="reset()"
                ></button>

                <button
                  pButton
                  type="button"
                  severity="primary"
                  icon="pi pi-check-circle"
                  label="Validate CSV"
                  [loading]="validating()"
                  [disabled]="!selectedFile() || !selectedYearId()"
                  (click)="validateCsv()"
                ></button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: GUIDELINES -->
        <div class="col-12 lg:col-6">
          <div class="card shadow-1 p-4 surface-card border-round-lg border-1 border-300 h-full">
            <h6 class="text-lg font-semibold mb-3">Instructions & Guidelines</h6>
            <div class="flex flex-column gap-3 text-sm line-height-3 text-700">
              <div class="flex align-items-start gap-2">
                <i class="pi pi-info-circle text-primary mt-1"></i>
                <div>
                  <strong>Format:</strong> Only CSV files are supported. Ensure the sheet has the correct column headers.
                </div>
              </div>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-table text-primary mt-1"></i>
                <div>
                  <strong>Headers:</strong> The file must contain exactly these headers:
                  <code class="bg-gray-100 px-1 border-round font-mono">audit_unit_code</code>,
                  <code class="bg-gray-100 px-1 border-round font-mono">gl_code</code>, and
                  <code class="bg-gray-100 px-1 border-round font-mono">march_position</code>.
                </div>
              </div>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-check-circle text-primary mt-1"></i>
                <div>
                  <strong>Audit Unit Code:</strong> Must match an existing code in the Audit Unit Master.
                </div>
              </div>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-tag text-primary mt-1"></i>
                <div>
                  <strong>GL Code:</strong> Must match an existing scheme code from the Scheme Master.
                </div>
              </div>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-money-bill text-primary mt-1"></i>
                <div>
                  <strong>March Position:</strong> Must be a numeric value representing the balance.
                </div>
              </div>
              <div class="flex align-items-start gap-2">
                <i class="pi pi-sync text-primary mt-1"></i>
                <div>
                  <strong>Upsert Logic:</strong> If a record with the same year, audit unit, and GL code already exists, its March position will be updated. Otherwise, a new record is created.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ERROR SUMMARY & ACTIONS -->
      @if (previewRows().length > 0) {
        <div class="mt-4">
          @if (hasErrors()) {
            <div class="surface-100 border-left-3 border-red-500 p-4 border-round-right mb-4">
              <div class="font-bold text-red-700 text-lg mb-2 flex align-items-center gap-2">
                <i class="pi pi-times-circle"></i> Validation Errors Found
              </div>
              <p class="text-700 m-0">The file contains errors in one or more rows. Please resolve them in your file and try uploading again.</p>
            </div>
          } @else {
            <div class="surface-100 border-left-3 border-green-500 p-4 border-round-right mb-4 flex justify-content-between align-items-center">
              <div>
                <div class="font-bold text-green-700 text-lg mb-2 flex align-items-center gap-2">
                  <i class="pi pi-check-circle"></i> CSV Validation Successful
                </div>
                <p class="text-700 m-0">All {{ validRows().length }} rows are valid and ready to commit.</p>
              </div>
              <button
                pButton
                type="button"
                severity="success"
                icon="pi pi-upload"
                label="Save & Commit Upload"
                [loading]="uploading()"
                (click)="uploadRows()"
              ></button>
            </div>
          }

          <!-- PREVIEW TABLE -->
          <div class="card shadow-1 p-3 border-round-lg border-1 border-300">
            <div class="flex justify-content-between align-items-center mb-3">
              <h6 class="text-lg font-semibold m-0">Validation Preview</h6>
              <span class="text-500 text-sm">Showing first 200 rows (Total: {{ totalRows() }})</span>
            </div>
            
            <p-table [value]="previewRows().slice(0, 200)" responsiveLayout="scroll" [rows]="10" [paginator]="true">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 80px">Row #</th>
                  <th>Audit Unit Code</th>
                  <th>GL Code</th>
                  <th>March Position</th>
                  <th style="width: 150px">Status</th>
                  <th>Validation Details</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-row>
                <tr>
                  <td>{{ row.rowNumber }}</td>
                  <td>{{ row.audit_unit_code }}</td>
                  <td>{{ row.gl_code }}</td>
                  <td>{{ row.march_position }}</td>
                  <td>
                    <span [class]="row.status === 'VALID' ? 'px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 border-round' : 'px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 border-round'">
                      {{ row.status }}
                    </span>
                  </td>
                  <td [class]="row.status === 'ERROR' ? 'text-red-600 font-medium' : 'text-500'">
                    {{ row.message || 'Row is valid' }}
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      }
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    .bg-gray-50 { background-color: #f9fafb; }
    .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
    .bg-primary-50 { background-color: #eff6ff; }
    .border-primary-200 { border-color: #bfdbfe; }
  `]
})
export class ExecutiveSummaryUploadComponent implements OnInit {
  private auditUnitService = inject(AuditUnitService);
  private schemeService = inject(AuditSchemeMasterService);
  private uploadApiService = inject(MasterBulkUploadApiService);
  private messageService = inject(MessageService);

  years = signal<any[]>([]);
  selectedYearId = signal<number | null>(null);

  selectedFile = signal<File | null>(null);
  selectedFileName = signal<string>('');
  previewRows = signal<PreviewRow[]>([]);
  validRows = signal<any[]>([]);
  validating = signal(false);
  uploading = signal(false);
  totalRows = signal(0);

  hasErrors = computed(() => this.previewRows().some((row) => row.status === 'ERROR'));

  ngOnInit() {
    this.auditUnitService.getYears().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.years.set(list);
        if (list.length > 0) {
          this.selectedYearId.set(list[0].value);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load financial years'
        });
      }
    });
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: 'Please select a CSV file only'
      });
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.previewRows.set([]);
    this.validRows.set([]);
    this.totalRows.set(0);
  }

  reset() {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.previewRows.set([]);
    this.validRows.set([]);
    this.totalRows.set(0);
  }

  downloadSample() {
    const csv = 'audit_unit_code,gl_code,march_position\n501,166,125000.00\n502,167,450000.50';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'executive_summary_sample.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  validateCsv() {
    if (!this.selectedFile() || !this.selectedYearId()) return;

    this.validating.set(true);

    forkJoin({
      units: this.auditUnitService.findAll(),
      schemes: this.schemeService.findAll()
    }).subscribe({
      next: (ctx) => {
        const units = Array.isArray(ctx.units) ? ctx.units : (ctx.units?.data || ctx.units?.rows || []);
        const schemes = Array.isArray(ctx.schemes) ? ctx.schemes : (ctx.schemes?.data || ctx.schemes?.rows || []);

        const unitCodes = new Set(units.map((u: any) => String(u.audit_unit_code || '').trim().toLowerCase()));
        const schemeCodes = new Set(schemes.map((s: any) => String(s.scheme_code || '').trim().toLowerCase()));

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const content = String(reader.result || '');
            const parsed = this.parseCsv(content);

            if (parsed.rows.length === 0) {
              throw new Error('CSV file is empty or missing data rows');
            }

            const actualHeaders = parsed.headers.map(h => h.trim().toLowerCase());
            const expectedHeaders = ['audit_unit_code', 'gl_code', 'march_position'];
            const missing = expectedHeaders.filter(h => !actualHeaders.includes(h));

            if (missing.length > 0) {
              throw new Error(`Missing required column headers: ${missing.join(', ')}`);
            }

            const preview: PreviewRow[] = [];
            const valid: any[] = [];
            const seenBatchKeys = new Set<string>();

            parsed.rows.forEach((row, index) => {
              const rowNumber = index + 2; // header is row 1
              const unitCode = String(row['audit_unit_code'] || '').trim();
              const glCode = String(row['gl_code'] || '').trim();
              const marchPos = String(row['march_position'] || '').trim();

              const issues: string[] = [];

              if (!unitCode) {
                issues.push('Audit Unit Code is required');
              } else if (!unitCodes.has(unitCode.toLowerCase())) {
                issues.push(`Audit Unit Code '${unitCode}' not found in master`);
              }

              if (!glCode) {
                issues.push('GL Code is required');
              } else if (!schemeCodes.has(glCode.toLowerCase())) {
                issues.push(`GL Code '${glCode}' not found in master`);
              }

              if (marchPos === '') {
                issues.push('March Position is required');
              } else if (isNaN(Number(marchPos))) {
                issues.push('March Position must be numeric');
              }

              if (unitCode && glCode) {
                const batchKey = `${unitCode.toLowerCase()}-${glCode.toLowerCase()}`;
                if (seenBatchKeys.has(batchKey)) {
                  issues.push('Duplicate row for same Audit Unit and GL Code in CSV');
                } else {
                  seenBatchKeys.add(batchKey);
                }
              }

              const status = issues.length > 0 ? 'ERROR' : 'VALID';
              const message = issues.join('; ');

              preview.push({
                rowNumber,
                audit_unit_code: unitCode,
                gl_code: glCode,
                march_position: marchPos,
                status,
                message
              });

              if (status === 'VALID') {
                valid.push({
                  year_id: this.selectedYearId(),
                  audit_unit_code: unitCode,
                  gl_code: glCode,
                  march_position: marchPos,
                  admin_id: 1
                });
              }
            });

            this.previewRows.set(preview);
            this.validRows.set(valid);
            this.totalRows.set(preview.length);
            this.validating.set(false);

            this.messageService.add({
              severity: this.hasErrors() ? 'warn' : 'success',
              summary: this.hasErrors() ? 'Validation Errors Found' : 'Validation Successful',
              detail: this.hasErrors() ? 'Please review the issues in preview' : 'CSV is ready to upload'
            });
          } catch (err: any) {
            this.validating.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Validation Failed',
              detail: err?.message || 'Unable to parse CSV'
            });
          }
        };
        reader.onerror = () => {
          this.validating.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to read CSV file'
          });
        };
        reader.readAsText(this.selectedFile()!);
      },
      error: () => {
        this.validating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load master units and schemes metadata'
        });
      }
    });
  }

  uploadRows() {
    if (this.validRows().length === 0 || this.hasErrors()) return;

    this.uploading.set(true);
    this.uploadApiService.upload('executivesummary', { rows: this.validRows() }).subscribe({
      next: (res) => {
        this.uploading.set(false);
        if (res.errors && res.errors.length > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Upload Completed with Errors',
            detail: `${res.successCount} row(s) uploaded. ${res.errors.length} row(s) failed.`
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Upload Successful',
            detail: `${res.successCount} executive summary record(s) committed successfully`
          });
          this.reset();
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: err?.error?.message || err?.message || 'Failed to save upload rows'
        });
      }
    });
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
        record[header.toLowerCase().replace(/\s+/g, '_')] = (cells[index] || '').trim();
      });
      return record;
    });

    return { headers, rows: mappedRows };
  }
}
