import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// PrimeNG
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { AuditQuestionMasterService } from '../services/masters.service';
import { ExportService } from '../../../core/services/export/export.service';

@Component({
  selector: 'app-download-questionnaire',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SelectModule,
    CheckboxModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="card border-round-xl shadow-2 p-4 bg-white">
      
      <!-- Top Title and Back -->
      <div class="flex align-items-center mb-4">
        <button
          pButton
          icon="pi pi-arrow-left"
          class="p-button-text p-button-rounded mr-3 border-circle hover:bg-gray-100"
          (click)="goBack()">
        </button>
        <div>
          <h2 class="m-0 text-2xl font-bold text-gray-800">Download Questionnaire</h2>
          <p class="text-sm text-500 mt-1">Select options to configure and preview your questionnaire export.</p>
        </div>
      </div>

      <!-- Step 1: Select Type -->
      <div class="mb-4">
        <label class="block font-semibold text-gray-700 mb-2">1. Select Questionnaire Target</label>
        <div class="flex gap-4">
          
          <!-- Branch Option Card -->
          <div 
            class="target-card flex-1 p-3 border-2 border-round-lg cursor-pointer transition-all duration-200 flex align-items-center"
            [ngClass]="selectedType() === 'branch' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-400 bg-white'"
            (click)="selectType('branch')">
            <div class="icon-container mr-3 bg-blue-100 text-blue-600 border-circle flex align-items-center justify-content-center w-3rem h-3rem">
              <i class="pi pi-building text-xl"></i>
            </div>
            <div>
              <span class="block font-bold text-lg text-gray-800">Branch</span>
              <span class="text-xs text-500">Download questions for all branches</span>
            </div>
          </div>

          <!-- Department Option Card -->
          <div 
            class="target-card flex-1 p-3 border-2 border-round-lg cursor-pointer transition-all duration-200 flex align-items-center"
            [ngClass]="selectedType() === 'department' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-400 bg-white'"
            (click)="selectType('department')">
            <div class="icon-container mr-3 bg-purple-100 text-purple-600 border-circle flex align-items-center justify-content-center w-3rem h-3rem">
              <i class="pi pi-sitemap text-xl"></i>
            </div>
            <div>
              <span class="block font-bold text-lg text-gray-800">Department</span>
              <span class="text-xs text-500">Download questions for a specific unit/department</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Department Dropdown Selection -->
      <div *ngIf="selectedType() === 'department'" class="mb-4 fadein animation-duration-200">
        <label class="block font-semibold text-gray-700 mb-2" for="deptSelect">Choose Department</label>
        <p-select
          id="deptSelect"
          [options]="departments()"
          [(ngModel)]="selectedDepartmentId"
          optionLabel="name"
          optionValue="id"
          placeholder="-- Select Department --"
          class="w-full md:w-30rem"
          [style]="{'width': '100%'}">
        </p-select>
      </div>

      <!-- Step 2: Filters & Columns Options (Appears once target selected) -->
      <div *ngIf="isTargetSelected()" class="grid grid-nogutter border-1 border-gray-200 border-round-lg p-4 bg-gray-50 mb-4 fadein animation-duration-300">
        
        <div class="col-12 mb-3">
          <h3 class="m-0 text-lg font-bold text-gray-800 border-bottom-1 border-gray-200 pb-2 flex align-items-center">
            <i class="pi pi-filter mr-2 text-primary"></i> Config Filters & Columns
          </h3>
        </div>

        <!-- Left: 10 Risk Categories (Risk Types) Checkboxes -->
        <div class="col-12 md:col-7 pr-4 border-right-1 border-gray-200">
          <label class="block font-bold text-gray-700 mb-3">Risk Categories (Risk Types)</label>
          <div class="grid">
            <div *ngFor="let rc of riskCategories()" class="col-12 sm:col-6 md:col-6 mb-2">
              <div class="flex align-items-center">
                <p-checkbox
                  [name]="'risk_cat_' + rc.id"
                  [value]="rc.id"
                  [(ngModel)]="selectedRiskCatIds"
                  [inputId]="'risk_cat_' + rc.id">
                </p-checkbox>
                <label [for]="'risk_cat_' + rc.id" class="ml-2 text-sm text-gray-700 font-semibold cursor-pointer select-none">
                  {{ rc.risk_category }}
                </label>
              </div>
            </div>
            <div *ngIf="riskCategories().length === 0" class="col-12 text-sm text-500">
              Loading risk types...
            </div>
          </div>
        </div>

        <!-- Right: 3 Risk Levels Checkboxes -->
        <div class="col-12 md:col-5 pl-4">
          <label class="block font-bold text-gray-700 mb-3">Risk Level Rating (Optional)</label>
          <div class="flex flex-column gap-3 mb-4">
            <div class="flex align-items-center">
              <p-checkbox name="risk_lvl" value="1" [(ngModel)]="selectedRiskLevels" inputId="risk_lvl_high"></p-checkbox>
              <label for="risk_lvl_high" class="ml-2 text-sm text-red-600 font-bold cursor-pointer select-none">HIGH RISK</label>
            </div>
            <div class="flex align-items-center">
              <p-checkbox name="risk_lvl" value="2" [(ngModel)]="selectedRiskLevels" inputId="risk_lvl_med"></p-checkbox>
              <label for="risk_lvl_med" class="ml-2 text-sm text-orange-600 font-bold cursor-pointer select-none">MEDIUM RISK</label>
            </div>
            <div class="flex align-items-center">
              <p-checkbox name="risk_lvl" value="3" [(ngModel)]="selectedRiskLevels" inputId="risk_lvl_low"></p-checkbox>
              <label for="risk_lvl_low" class="ml-2 text-sm text-green-600 font-bold cursor-pointer select-none">LOW RISK</label>
            </div>
          </div>

          <!-- Column Toggles -->
          <label class="block font-bold text-gray-700 mb-2">Additional Columns</label>
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center">
              <p-checkbox [(ngModel)]="includeBroaderArea" [binary]="true" inputId="inc_broader"></p-checkbox>
              <label for="inc_broader" class="ml-2 text-sm text-gray-700 font-semibold cursor-pointer select-none">With Broader Area</label>
            </div>
            <div class="flex align-items-center">
              <p-checkbox [(ngModel)]="includeRiskScore" [binary]="true" inputId="inc_risk_score"></p-checkbox>
              <label for="inc_risk_score" class="ml-2 text-sm text-gray-700 font-semibold cursor-pointer select-none">With Risk Score</label>
            </div>
          </div>
        </div>

        <!-- Generate Preview Action -->
        <div class="col-12 mt-4 flex justify-content-end gap-2">
          <button
            pButton
            type="button"
            icon="pi pi-eye"
            label="Generate Preview"
            class="p-button-outlined"
            [loading]="loading()"
            (click)="generatePreview()">
          </button>
        </div>

      </div>

      <!-- Preview Section -->
      <div *ngIf="previewGenerated()" class="mt-5 fadein animation-duration-400">
        
        <div class="flex align-items-center justify-content-between mb-3 border-bottom-1 border-gray-200 pb-2">
          <h3 class="m-0 text-xl font-bold text-gray-800 flex align-items-center">
            <i class="pi pi-table mr-2 text-success"></i> Questionnaire Preview
          </h3>
          
          <div class="flex gap-2">
            <button
              *ngIf="data().length > 0"
              pButton
              type="button"
              icon="pi pi-download"
              label="Export Preview (Table)"
              class="p-button-success shadow-1 font-bold"
              (click)="exportToExcel()">
            </button>
            <button
              *ngIf="data().length > 0"
              pButton
              type="button"
              icon="pi pi-download"
              label="Export Import Template (CSV)"
              class="p-button-info shadow-1 font-bold"
              (click)="exportToImportTemplate()">
            </button>
          </div>
        </div>

        <!-- Summary Statistics Card -->
        <div *ngIf="data().length > 0" class="p-3 bg-blue-50 border-1 border-blue-200 border-round-lg mb-4 flex align-items-center justify-content-between">
          <div>
            <h4 class="m-0 text-blue-900 font-bold text-lg">Questionnaire Summary</h4>
            <p class="m-0 mt-1 text-sm text-blue-700 font-semibold">Total questions matching your parameters: <strong>{{ grandTotalQuestions() }}</strong></p>
          </div>
          <div class="text-3xl font-extrabold text-blue-800 bg-blue-100 border-circle w-4rem h-4rem flex align-items-center justify-content-center">
            {{ grandTotalQuestions() }}
          </div>
        </div>

        <!-- Table Container -->
        <div *ngIf="data().length > 0; else noDataTemplate" class="preview-table-container overflow-x-auto border-1 border-gray-200 border-round-lg shadow-1 bg-white p-2">
          <table id="tbl_exporttable_to_xls" class="w-full border-collapse" style="border: 1px solid #dee2e6; font-family: sans-serif; font-size: 14px;">
            <thead>
              <tr style="background:#f4f6f9; color:#495057;">
                <th [attr.colspan]="getColspan()" style="padding: 15px; text-align: center; border: 1px solid #dee2e6; font-size: 18px; font-weight: bold; background: #e9ecef;">
                  {{ exportFileName() }}
                </th>
              </tr>
            </thead>
            <tbody>
              
              <!-- Loop Menus -->
              <ng-container *ngFor="let menu of data()">
                
                <!-- Menu Row -->
                <tr style="background: #dc3545;">
                  <td [attr.colspan]="getColspan()" style="color: #fff; padding: 12px 15px; font-weight: bold; border: 1px solid #dee2e6; font-size: 15px;">
                    Menu » {{ menu.menu_name }} (Total: {{ menu.total_questions }} Questions)
                  </td>
                </tr>

                <!-- Loop Categories -->
                <ng-container *ngFor="let cat of menu.categories">
                  
                  <!-- Category Row -->
                  <tr style="background: #0d3b66;">
                    <td [attr.colspan]="getColspan()" style="color: #fff; padding: 10px 15px; font-weight: bold; border: 1px solid #dee2e6; font-size: 14px;">
                      Category » {{ cat.category_name }} (Total: {{ cat.total_questions }} Questions)
                    </td>
                  </tr>

                  <!-- Loop Sets -->
                  <ng-container *ngFor="let set of cat.sets">
                    
                    <!-- Set Header Row -->
                    <tr style="background: #e9ecef;">
                      <td [attr.colspan]="getColspan()" style="color: #333; padding: 8px 15px; font-weight: bold; border: 1px solid #dee2e6; font-size: 13px; padding-left: 30px;">
                        Set » {{ set.set_name }} ({{ set.question_count }} Questions)
                      </td>
                    </tr>

                    <!-- Loop Headers -->
                    <ng-container *ngFor="let header of set.headers">
                      
                      <!-- Header Row -->
                      <tr style="background: #17a2b8;">
                        <td [attr.colspan]="getColspan()" style="color: #fff; padding: 8px 15px; font-weight: bold; border: 1px solid #dee2e6; font-size: 13px;">
                          {{ header.header_name }} ({{ header.question_count }} Questions)
                        </td>
                      </tr>

                      <!-- Question Columns Title Row -->
                      <tr style="background: #f8f9fa; color: #495057; font-weight: bold; font-size: 12px; text-align: center;">
                        <th rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; width: 60px;">Set</th>
                        <th rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; width: 60px;">Q ID</th>
                        <th rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; min-width: 250px; text-align: left;">Question</th>
                        <th *ngIf="includeBroaderArea" rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; min-width: 150px;">Broader Area</th>
                        <th rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; width: 140px;">Input Method</th>
                        <th rowspan="2" style="padding: 10px; border: 1px solid #dee2e6; width: 120px;">Risk Type</th>
                        <th colspan="3" style="padding: 6px; border: 1px solid #dee2e6;">Risk Parameters</th>
                        <th *ngIf="includeRiskScore" colspan="5" style="padding: 6px; border: 1px solid #dee2e6; background: #e2e3e5;">Score Parameters</th>
                      </tr>
                      
                      <tr style="background: #f8f9fa; color: #495057; font-weight: bold; font-size: 12px; text-align: center;">
                        <!-- Risk Parameters -->
                        <th style="padding: 6px; border: 1px solid #dee2e6; width: 120px;">Answer</th>
                        <th style="padding: 6px; border: 1px solid #dee2e6; width: 120px;">Business Risk</th>
                        <th style="padding: 6px; border: 1px solid #dee2e6; width: 120px;">Control Risk</th>
                        <!-- Score Parameters -->
                        <th *ngIf="includeRiskScore" style="padding: 6px; border: 1px solid #dee2e6; background: #f1f2f4; width: 90px;">Business Risk</th>
                        <th *ngIf="includeRiskScore" style="padding: 6px; border: 1px solid #dee2e6; background: #f1f2f4; width: 90px;">Control Risk</th>
                        <th *ngIf="includeRiskScore" style="padding: 6px; border: 1px solid #dee2e6; background: #f1f2f4; width: 80px;">Total Score</th>
                        <th *ngIf="includeRiskScore" style="padding: 6px; border: 1px solid #dee2e6; background: #f1f2f4; width: 80px;">Risk Weight</th>
                        <th *ngIf="includeRiskScore" style="padding: 6px; border: 1px solid #dee2e6; background: #f1f2f4; width: 100px;">Total Weight Score</th>
                      </tr>

                      <!-- Loop Questions -->
                      <ng-container *ngFor="let q of header.questions">
                        <ng-container *ngFor="let r of q.risk_rows; let isFirst = first">
                          <tr style="background: #fff; color: #333;">
                            
                            <!-- First Row Spanned Columns -->
                            <td *ngIf="isFirst" [attr.rowspan]="q.risk_rows.length" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; vertical-align: middle; background: #fbfcfd; font-weight: 500;">
                              {{ set.set_id }}
                            </td>
                            <td *ngIf="isFirst" [attr.rowspan]="q.risk_rows.length" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; vertical-align: middle; background: #fbfcfd; font-weight: 500;">
                              {{ q.id }}
                            </td>
                            <td *ngIf="isFirst" [attr.rowspan]="q.risk_rows.length" style="padding: 10px; border: 1px solid #dee2e6; vertical-align: middle; line-height: 1.4;">
                              {{ q.question }}
                            </td>
                            <td *ngIf="isFirst && includeBroaderArea" [attr.rowspan]="q.risk_rows.length" style="padding: 8px; border: 1px solid #dee2e6; vertical-align: middle; text-align: center; background: #fbfcfd;">
                              {{ q.audit_area_name }}
                            </td>
                            <td *ngIf="isFirst" [attr.rowspan]="q.risk_rows.length" style="padding: 8px; border: 1px solid #dee2e6; vertical-align: middle; text-align: center; background: #fbfcfd; font-size: 11px;">
                              {{ q.inputType }}
                            </td>
                            <td *ngIf="isFirst" [attr.rowspan]="q.risk_rows.length" style="padding: 8px; border: 1px solid #dee2e6; vertical-align: middle; text-align: center; background: #fbfcfd;">
                              {{ q.risk_category_name }}
                            </td>

                            <!-- Parameter Columns -->
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">
                              {{ r.rt }}
                            </td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;" [ngClass]="getRiskCellClass(r.brLabel)">
                              {{ r.brLabel }}
                            </td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;" [ngClass]="getRiskCellClass(r.crLabel)">
                              {{ r.crLabel }}
                            </td>

                            <!-- Score Columns -->
                            <td *ngIf="includeRiskScore" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; background: #fafafb;">
                              {{ r.brScore }}
                            </td>
                            <td *ngIf="includeRiskScore" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; background: #fafafb;">
                              {{ r.crScore }}
                            </td>
                            <td *ngIf="includeRiskScore" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; background: #fafafb;">
                              {{ r.totalScore }}
                            </td>
                            <td *ngIf="includeRiskScore" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; background: #fafafb;">
                              {{ q.risk_weight }}
                            </td>
                            <td *ngIf="includeRiskScore" style="padding: 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; background: #f4f5f7;">
                              {{ r.totalWeightScore }}
                            </td>

                          </tr>
                        </ng-container>
                      </ng-container>

                      <!-- Spacing row between headers -->
                      <tr>
                        <td [attr.colspan]="getColspan()" style="padding: 5px; border: none; background: #fdfdfd;">&nbsp;</td>
                      </tr>

                    </ng-container>
                  </ng-container>
                </ng-container>
              </ng-container>

            </tbody>
          </table>
        </div>

        <ng-template #noDataTemplate>
          <div class="p-5 text-center bg-gray-50 border-round-lg border-1 border-gray-200">
            <i class="pi pi-info-circle text-4xl text-500 mb-3 block"></i>
            <span class="text-lg font-bold text-gray-700 block">No questions found!</span>
            <p class="text-sm text-500 mt-2">Try adjusting your filters or choosing a different branch/department.</p>
          </div>
        </ng-template>

      </div>

    </div>

    <!-- Toast Notifications -->
    <p-toast></p-toast>
  `,
  styles: [`
    .target-card {
      transition: all 0.2s ease-in-out;
    }
    .target-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .preview-table-container th {
      font-weight: 600;
    }
    .text-red-risk {
      color: #e24c4c;
      font-weight: bold;
    }
    .text-orange-risk {
      color: #f59e0b;
      font-weight: bold;
    }
    .text-green-risk {
      color: #10b981;
      font-weight: bold;
    }
    .text-gray-risk {
      color: #6b7280;
    }

    /* ======== DARK MODE OVERRIDES ======== */
    :host-context(.app-dark) .card {
      background: #1e293b !important;
      border-color: #334155 !important;
      color: #e2e8f0 !important;
    }
    :host-context(.app-dark) h2,
    :host-context(.app-dark) h3,
    :host-context(.app-dark) h4,
    :host-context(.app-dark) h5 {
      color: #e2e8f0 !important;
    }
    :host-context(.app-dark) .target-card {
      background: #1e293b !important;
      border-color: #334155 !important;
      color: #e2e8f0 !important;
    }
    :host-context(.app-dark) .preview-table-container {
      background: #1e293b !important;
      border-color: #334155 !important;
    }
    :host-context(.app-dark) .preview-table-container table {
      border-color: #475569 !important;
    }
    :host-context(.app-dark) .preview-table-container tr[style*='background: #fff'],
    :host-context(.app-dark) .preview-table-container tr[style*='background:#fff'] {
      background: #1e293b !important;
    }
    :host-context(.app-dark) .preview-table-container tr[style*='#f8f9fa'],
    :host-context(.app-dark) .preview-table-container tr[style*='#f4f6f9'],
    :host-context(.app-dark) .preview-table-container tr[style*='#e9ecef'] {
      background: #0f172a !important;
    }
    :host-context(.app-dark) .preview-table-container td,
    :host-context(.app-dark) .preview-table-container th {
      border-color: #334155 !important;
      color: #e2e8f0 !important;
    }
    :host-context(.app-dark) .preview-table-container td[style*='#fbfcfd'],
    :host-context(.app-dark) .preview-table-container td[style*='#fafafb'],
    :host-context(.app-dark) .preview-table-container td[style*='#fdfdfd'],
    :host-context(.app-dark) .preview-table-container td[style*='#f4f5f7'] {
      background: #1e293b !important;
    }
    :host-context(.app-dark) .preview-table-container td[style*='#f1f2f4'],
    :host-context(.app-dark) .preview-table-container th[style*='#f1f2f4'],
    :host-context(.app-dark) .preview-table-container th[style*='#e2e3e5'] {
      background: #0f172a !important;
    }
  `]
})
export class DownloadQuestionnaireComponent implements OnInit {
  private mastersService = inject(AuditQuestionMasterService);
  private exportService = inject(ExportService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  // States
  selectedType = signal<string>(''); // 'branch' or 'department'
  departments = signal<any[]>([]);
  riskCategories = signal<any[]>([]);
  
  selectedDepartmentId: number | null = null;
  selectedRiskCatIds: number[] = [];
  selectedRiskLevels: string[] = []; // '1'=High, '2'=Medium, '3'=Low
  includeBroaderArea = true;
  includeRiskScore = true;

  loading = signal(false);
  previewGenerated = signal(false);
  data = signal<any[]>([]);

  ngOnInit() {
    this.loadLookups();
  }

  loadLookups() {
    this.mastersService.getDownloadLookups().subscribe({
      next: (res: any) => {
        // filter sections to get departments (section_type_id != 1)
        // Note: the lookups returned are sections
        if (res.sections) {
          const depts = res.sections.filter((s: any) => s.id !== 1);
          this.departments.set([
            { id: -999, name: 'ALL DEPARTMENTS' },
            ...depts
          ]);
        }
        if (res.riskCategories) {
          // Limit to max 10 categories
          this.riskCategories.set(res.riskCategories.slice(0, 10));
        }
      },
      error: (err) => {
        console.error('Failed to load lookups', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load configuration lookups.'
        });
      }
    });
  }

  selectType(type: string) {
    this.selectedType.set(type);
    this.selectedDepartmentId = null;
    this.previewGenerated.set(false);
    this.data.set([]);
  }

  isTargetSelected(): boolean {
    if (this.selectedType() === 'branch') {
      return true;
    }
    if (this.selectedType() === 'department' && this.selectedDepartmentId) {
      return true;
    }
    return false;
  }

  getColspan(): number {
    let base = 9; // Set, Q ID, Question, Input Method, Risk Type, Answer, Business Risk, Control Risk (total is 9 columns with rowspan layout)
    if (this.includeBroaderArea) {
      base += 1;
    }
    if (this.includeRiskScore) {
      base += 5;
    }
    return base;
  }

  exportFileName(): string {
    let name = '';
    if (this.selectedType() === 'branch') {
      name = 'BRANCH QUESTIONS';
    } else {
      if (this.selectedDepartmentId === -999) {
        name = 'ALL DEPARTMENTS QUESTIONS';
      } else {
        const dept = this.departments().find(d => d.id === this.selectedDepartmentId);
        name = dept ? `${dept.name.toUpperCase()} QUESTIONS` : 'DEPARTMENT QUESTIONS';
      }
    }
    return name;
  }

  getRiskCellClass(label: string): string {
    switch (label) {
      case 'HIGH RISK': return 'text-red-risk';
      case 'MEDIUM RISK': return 'text-orange-risk';
      case 'LOW RISK': return 'text-green-risk';
      default: return 'text-gray-risk';
    }
  }

  grandTotalQuestions(): number {
    let sum = 0;
    this.data().forEach(menu => {
      sum += menu.total_questions || 0;
    });
    return sum;
  }

  generatePreview() {
    const sectionId = this.selectedType() === 'branch' ? 1 : this.selectedDepartmentId;
    if (!sectionId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a department first.'
      });
      return;
    }

    this.loading.set(true);

    const params: any = {
      section_id: sectionId
    };

    if (this.selectedRiskCatIds.length > 0) {
      params.risk_category_ids = this.selectedRiskCatIds.join(',');
    }

    if (this.selectedRiskLevels.length > 0) {
      params.risk_levels = this.selectedRiskLevels.join(',');
    }

    this.mastersService.getDownloadData(params).subscribe({
      next: (res: any) => {
        this.data.set(res || []);
        this.previewGenerated.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load questionnaire data', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load questionnaire preview data.'
        });
        this.loading.set(false);
      }
    });
  }

  exportToExcel() {
    const tableEl = document.getElementById('tbl_exporttable_to_xls');
    if (!tableEl) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Preview table element not found.'
      });
      return;
    }

    const fileName = this.exportFileName().replace(/\s+/g, '_');
    this.exportService.exportTableToExcel(tableEl, fileName);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Excel file exported successfully.'
    });
  }

  exportToImportTemplate() {
    const csvHeaders = [
      'Question ID',
      'Menu Name',
      'Category Name',
      'Set Name',
      'Set Type',
      'Header Name',
      'Question',
      'Question Type',
      'Input Method',
      'Annexure Name',
      'Subset Names',
      'Applicable To',
      'Broader Area',
      'Business Risk Category',
      'Control Risk Category',
      'Key Aspect',
      'Residual Risk',
      'Show Instances',
      'Auditor Evidence Upload',
      'Compliance Evidence Upload',
      'Risk Type',
      'Mapping Business Risk',
      'Mapping Control Risk'
    ];

    const csvRowsList: string[][] = [csvHeaders];
    
    this.data().forEach(menu => {
      menu.categories.forEach((cat: any) => {
        cat.sets.forEach((set: any) => {
          set.headers.forEach((header: any) => {
            header.questions.forEach((q: any) => {
              
              const rawParams = q.raw_parameters || [];
              const riskType = rawParams.map((p: any) => p.rt || '').join(';');
              
              const getRiskLabel = (val: any) => {
                switch (String(val)) {
                  case '1': return 'HIGH RISK';
                  case '2': return 'MEDIUM RISK';
                  case '3': return 'LOW RISK';
                  case '4': return 'NO RISK';
                  default: return 'NO RISK';
                }
              };
              
              const mappingBusinessRisk = rawParams.map((p: any) => getRiskLabel(p.br)).join(';');
              const mappingControlRisk = rawParams.map((p: any) => getRiskLabel(p.cr)).join(';');
              
              csvRowsList.push([
                String(q.id || ''),
                menu.menu_name || '',
                cat.category_name || '',
                set.set_name || '',
                set.set_name.toLowerCase().includes('subset') ? 'Sub Set' : 'Main Set',
                header.header_name || '',
                q.question || '',
                q.question_type || '',
                q.inputType || '',
                q.annexure_name || '',
                q.subset_name || '',
                q.applicable_to || '',
                q.audit_area_name || '',
                q.risk_category_name || '',
                q.control_risk_category || '',
                q.key_aspect || '',
                q.residual_risk || '',
                q.show_instances || '0',
                q.auditor_evidence || 'No',
                q.compliance_evidence || 'No',
                riskType,
                mappingBusinessRisk,
                mappingControlRisk
              ]);
              
            });
          });
        });
      });
    });

    const escapeCSV = (val: string) => {
      const cleanVal = val === null || val === undefined ? '' : String(val);
      if (cleanVal.includes(',') || cleanVal.includes('"') || cleanVal.includes('\n') || cleanVal.includes('\r')) {
        return `"${cleanVal.replace(/"/g, '""')}"`;
      }
      return cleanVal;
    };

    const csvContent = csvRowsList.map(row => row.map(escapeCSV).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const fileName = `${this.exportFileName().replace(/\s+/g, '_')}_import_template.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Template CSV exported successfully.'
    });
  }

  goBack() {
    this.router.navigate(['/admin/question-set-master']);
  }
}
