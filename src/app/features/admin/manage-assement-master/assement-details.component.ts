import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
  DateFieldComponent,
  SelectFieldComponent
} from '../../../shared/components/form';

import { ButtonModule } from 'primeng/button';

import {
  ManageAssessmentMasterService
} from '../services/masters.service';

@Component({
  selector: 'app-assessment-details-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectFieldComponent,
    DateFieldComponent,
    ButtonModule,
    TagModule
  ],
  providers: [DatePipe],

  template: `
  <div class="p-4">

    <!-- Header -->
    <div class="mb-4">

      <h2 class="m-0 text-2xl font-semibold">
        View Assessment Details
      </h2>

    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-4 border-b border-gray-300 pb-2">
      <button pButton type="button" 
              [label]="'Details'" 
              [severity]="activeTab() === 'details' ? 'primary' : 'secondary'"
              [text]="activeTab() !== 'details'"
              (click)="activeTab.set('details')"></button>
      <button pButton type="button" 
              [label]="'Question Assignments'" 
              [severity]="activeTab() === 'assignments' ? 'primary' : 'secondary'"
              [text]="activeTab() !== 'assignments'"
              (click)="activeTab.set('assignments'); loadAssignmentsData()"></button>
    </div>

    @if (activeTab() === 'details') {
      <!-- Modern Dashboard Layout -->
      <div class="flex flex-column gap-4">

        <!-- Row 1: Overview Cards -->
        <div class="grid w-full m-0 p-0">
          
          <!-- Card 1: Branch Details -->
          <div class="col-12 md:col-6 lg:col-4 p-2">
            <div class="p-3 border-round surface-card border-1 border-gray-200 shadow-1 h-full flex flex-column justify-content-between">
              <div>
                <div class="flex align-items-center justify-content-between mb-3">
                  <span class="text-gray-500 font-semibold text-sm uppercase tracking-wider">Assessment Unit</span>
                  <i class="pi pi-home text-blue-500 text-xl"></i>
                </div>
                <div class="text-2xl font-bold text-blue-700 mb-2">
                  {{ assessment()?.audit_unit_display }}
                </div>
                <div class="text-sm text-600 mb-2">
                  <i class="pi pi-calendar mr-1"></i>
                  {{ formatDate(assessment()?.assesment_period_from) }} to {{ formatDate(assessment()?.assesment_period_to) }}
                </div>
              </div>
              <div class="inline-flex align-items-center bg-blue-50 text-blue-700 border-round p-2 text-xs font-semibold w-max">
                <i class="pi pi-sync mr-1"></i>
                Frequency: {{ assessment()?.frequency || '-' }} Months
              </div>
            </div>
          </div>

          <!-- Card 2: Status Panel -->
          <div class="col-12 md:col-6 lg:col-4 p-2">
            <div class="p-3 border-round surface-card border-1 border-gray-200 shadow-1 h-full flex flex-column justify-content-between">
              <div>
                <div class="flex align-items-center justify-content-between mb-3">
                  <span class="text-gray-500 font-semibold text-sm uppercase tracking-wider">Current Status</span>
                  <i class="pi pi-chart-bar text-green-500 text-xl"></i>
                </div>
                <div class="flex flex-column gap-3">
                  <div class="flex align-items-center justify-content-between">
                    <span class="font-medium text-700">Audit Status:</span>
                    <p-tag [value]="assessment()?.audit_status_display" 
                           [severity]="getSeverity(assessment()?.audit_status_id)"></p-tag>
                  </div>
                  <div class="flex align-items-center justify-content-between">
                    <span class="font-medium text-700">Compliance Status:</span>
                    <p-tag [value]="assessment()?.compliance_status_display" 
                           [severity]="getComplianceSeverity(assessment()?.audit_status_id)"></p-tag>
                  </div>
                  <div class="flex align-items-center justify-content-between">
                    <span class="font-medium text-700">Limits Status:</span>
                    <p-tag [value]="assessment()?.is_limit_blocked === 1 ? 'COMPLIANCE BLOCKED' : 'ACTIVE'" 
                           [severity]="assessment()?.is_limit_blocked === 1 ? 'danger' : 'success'"></p-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Key Deadlines -->
          <div class="col-12 md:col-6 lg:col-4 p-2">
            <div class="p-3 border-round surface-card border-1 border-gray-200 shadow-1 h-full flex flex-column justify-content-between">
              <div>
                <div class="flex align-items-center justify-content-between mb-3">
                  <span class="text-gray-500 font-semibold text-sm uppercase tracking-wider">Deadlines & Alerts</span>
                  <i class="pi pi-bell text-yellow-500 text-xl"></i>
                </div>
                
                <div class="flex flex-column gap-3">
                  <div class="flex align-items-center justify-content-between">
                    <span class="font-medium text-700">Audit Due:</span>
                    <span [class.text-red-500]="isExpired(assessment()?.audit_due_date)" class="font-semibold text-800">
                      {{ formatDate(assessment()?.audit_due_date) }}
                      @if (isExpired(assessment()?.audit_due_date)) {
                        <span class="text-xs text-red-500 block">Expired</span>
                      }
                    </span>
                  </div>
                  <div class="flex align-items-center justify-content-between">
                    <span class="font-medium text-700">Compliance Due:</span>
                    <span [class.text-red-500]="isExpired(assessment()?.compliance_due_date)" class="font-semibold text-800">
                      {{ formatDate(assessment()?.compliance_due_date) }}
                      @if (isExpired(assessment()?.compliance_due_date)) {
                        <span class="text-xs text-red-500 block">Expired</span>
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Row 2: Dates Details and Stakeholders Grid -->
        <div class="grid w-full m-0 p-0">
          
          <!-- Dates Grid -->
          <div class="col-12 md:col-6 p-2">
            <div class="p-4 border-round surface-card border-1 border-gray-200 shadow-1 h-full">
              <h3 class="m-0 mb-3 text-lg font-bold text-800 border-bottom-1 border-gray-100 pb-2">
                <i class="pi pi-calendar mr-2 text-primary"></i>Assessment Timeline
              </h3>
              <div class="grid">
                <div class="col-6 mb-3">
                  <span class="text-500 text-sm block mb-1">Audit Start Date</span>
                  <span class="font-medium text-900">{{ formatDate(assessment()?.audit_start_date) }}</span>
                </div>
                <div class="col-6 mb-3">
                  <span class="text-500 text-sm block mb-1">Audit End Date</span>
                  <span class="font-medium text-900">{{ formatDate(assessment()?.audit_end_date) }}</span>
                </div>
                <div class="col-6">
                  <span class="text-500 text-sm block mb-1">Compliance Start Date</span>
                  <span class="font-medium text-900">{{ formatDate(assessment()?.compliance_start_date) }}</span>
                </div>
                <div class="col-6">
                  <span class="text-500 text-sm block mb-1">Compliance End Date</span>
                  <span class="font-medium text-900">{{ formatDate(assessment()?.compliance_end_date) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Stakeholders Grid -->
          <div class="col-12 md:col-6 p-2">
            <div class="p-4 border-round surface-card border-1 border-gray-200 shadow-1 h-full">
              <h3 class="m-0 mb-3 text-lg font-bold text-800 border-bottom-1 border-gray-100 pb-2">
                <i class="pi pi-users mr-2 text-primary"></i>Stakeholders & Team
              </h3>
              <div class="flex flex-column gap-3">
                <div class="flex align-items-center gap-3">
                  <div class="w-2rem h-2rem border-round bg-blue-50 flex align-items-center justify-content-center">
                    <i class="pi pi-user text-blue-700"></i>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-xs text-500">Auditor</span>
                    <span class="font-semibold text-800">
                      {{ getEmployeeDisplay(assessment()?.auditor_name, assessment()?.auditor_code) }}
                    </span>
                  </div>
                </div>

                <div class="flex align-items-center gap-3">
                  <div class="w-2rem h-2rem border-round bg-blue-50 flex align-items-center justify-content-center">
                    <i class="pi pi-user text-blue-700"></i>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-xs text-500">Branch Head</span>
                    <span class="font-semibold text-800">
                      {{ getEmployeeDisplay(assessment()?.branch_head_name, assessment()?.branch_head_code) }}
                    </span>
                  </div>
                </div>

                <div class="flex align-items-center gap-3">
                  <div class="w-2rem h-2rem border-round bg-blue-50 flex align-items-center justify-content-center">
                    <i class="pi pi-user text-blue-700"></i>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-xs text-500">Branch Sub-Head</span>
                    <span class="font-semibold text-800">
                      {{ getEmployeeDisplay(assessment()?.branch_subhead_name, assessment()?.branch_subhead_code) }}
                    </span>
                  </div>
                </div>

                <div class="flex align-items-center gap-3">
                  <div class="w-2rem h-2rem border-round bg-blue-50 flex align-items-center justify-content-center">
                    <i class="pi pi-users text-blue-700"></i>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-xs text-500">Other Compliance Employees</span>
                    <span class="font-semibold text-800">{{ assessment()?.other_compliance_employees || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    <!-- LIMIT BLOCK -->

    @if (
      assessment()?.is_limit_blocked === 1
    ) {

    <div
      class="mt-4 border-1 border-red-300 bg-red-50 p-4 border-round"
    >

      <h4 class="text-red-600">

        Compliance - Reviewer blocked due to exceed limit

      </h4>

      <app-select-field
        label="Increase Limit"
        [field]="selectedLimit"
        [options]="limitOptions()"
        optionLabel="label"
        optionValue="value"
        (Change)="onLimitChange()"
      >
      </app-select-field>

      <div class="mt-3 font-semibold">

        Updated Reject Limit :

        {{
          assessment()
            ?.compliance_review_reject_limit
        }}

      </div>

      <button
        pButton
        type="button"
        label="Update Limit"
        class="mt-3"
        (click)="updateAssessment('limit')"
      >
      </button>

    </div>

    }

    <!-- AUDIT EXPIRED -->

    @if (
      isExpired(
        assessment()?.audit_due_date
      )
    ) {

    <div
      class="mt-4 border-1 border-red-300 bg-red-50 p-4 border-round"
    >

      <h4 class="text-red-600">

        Audit Expired

      </h4>

      <app-date-field
        label="Increase Audit Due Date"
        [field]="auditDueDate"
      >
      </app-date-field>

      <button
        pButton
        type="button"
        label="Update Audit Due Date"
        class="mt-3"
        (click)="updateAssessment('audit')"
      >
      </button>

    </div>

    }

    <!-- COMPLIANCE EXPIRED -->

    @if (
      isExpired(
        assessment()?.compliance_due_date
      )
    ) {

    <div
      class="mt-4 border-1 border-red-300 bg-red-50 p-4 border-round"
    >

      <h4 class="text-red-600">

        Compliance Expired

      </h4>

      <app-date-field
        label="Increase Compliance Due Date"
        [field]="complianceDueDate"
      >
      </app-date-field>

      <button
        pButton
        type="button"
        label="Update Compliance Due Date"
        class="mt-3"
        (click)="updateAssessment('compliance')"
      >
      </button>

    </div>

    }

    }

    @if (activeTab() === 'assignments') {
      <div class="p-2">
        <h3 class="text-xl font-bold mb-3">Assign Questions to Auditors</h3>
        
        <div *ngIf="loadingAssignments()" class="flex align-items-center justify-content-center p-5">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <span class="ml-2 font-medium">Loading questions and auditors...</span>
        </div>

        <div *ngIf="!loadingAssignments()">
          <div *ngIf="categories().length === 0" class="text-gray-500 p-3 text-center border-1 border-gray-300 border-round">
            No questions found for this assessment.
          </div>

          <div *ngIf="categories().length > 0">
            <div style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
              <div *ngFor="let cat of categories()" class="mb-4 border-1 border-gray-300 border-round p-3 surface-card">
                <h4 class="text-lg font-bold text-primary mb-3 pb-2 border-bottom-1 border-gray-200">
                  {{ cat.name }}
                </h4>

                <div class="flex flex-column gap-3">
                  <div *ngFor="let q of cat.questions" class="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between p-2 border-round hover:bg-gray-50 gap-3">
                    <div class="flex-grow-1">
                      <span class="font-bold text-gray-500 mr-2">Q:</span>
                      <span class="font-medium text-800">{{ q.question }}</span>
                    </div>

                    <div class="flex align-items-center gap-2">
                      <label class="text-gray-600 font-semibold text-sm">Assignee:</label>
                      <select class="p-inputtext p-component p-2 border-round border-1 border-gray-300"
                              style="min-width: 250px;"
                              [(ngModel)]="q.assigned_emp_id">
                        <option [value]="null">-- Unassigned --</option>
                        <option *ngFor="let emp of eligibleAuditors()" [value]="emp.id">
                          {{ emp.name }} (EMP. {{ emp.emp_code }})
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-content-end gap-2 mt-4">
              <button pButton type="button" 
                      label="Save Assignments" 
                      icon="pi pi-save"
                      [loading]="savingAssignments()"
                      (click)="saveAssignments()"></button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Footer -->

    <div class="flex justify-content-end mt-4">

      <button
        type="button"
        class="p-button p-component"
        (click)="close()"
      >
        Close
      </button>

    </div>

  </div>
  `
})
export class AssessmentDetailsFormComponent {

  private ref = inject(FormDrawerRef);

  private datePipe = inject(DatePipe);

  private assessmentService =
    inject(ManageAssessmentMasterService);

  private messageService = inject(MessageService);

  activeTab = signal<'details' | 'assignments'>('details');
  loadingAssignments = signal(false);
  savingAssignments = signal(false);
  eligibleAuditors = signal<any[]>([]);
  categories = signal<any[]>([]);

  assessment = signal<any | null>(null);

  detailRows = signal<any[]>([]);

  selectedLimit = signal<number | null>(null);
 originalLimit = signal<number>(0);
  limitOptions = signal<any[]>([
    {
      label: 'Increase Limit By 5',
      value: 5
    },
    {
      label: 'Increase Limit By 10',
      value: 10
    }
  ]);

  auditDueDate = signal<Date | null>(
    this.getLastDateOfCurrentMonth()
  );

  complianceDueDate = signal<Date | null>(
    this.getLastDateOfCurrentMonth()
  );

  constructor() {
  
    const row = this.ref.data;

    if (!row) {
      return;
    }

    this.assessment.set({

      ...row,

      audit_unit_display:
        this.getAuditUnitDisplay(row),

      audit_status_display:
        this.getAuditStatus(
          row.audit_status_id
        ),

      compliance_status_display:
        this.getComplianceStatus(
          row.audit_status_id
        )
    });
    this.originalLimit.set(
  Number(
    row.compliance_review_reject_limit || 0
  )
);

    this.loadDetailRows(row);
  }

 
  // LAST DATE
 

  getLastDateOfCurrentMonth(): Date {

    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
  }

 
  // DETAIL ROWS
 

  loadDetailRows(row: any) {

    this.detailRows.set([

      {
        label: 'Audit Start Date',
        value: this.formatDate(
          row.audit_start_date
        )
      },

      {
        label: 'Audit End Date',
        value: this.formatDate(
          row.audit_end_date
        )
      },

      {
        label: 'Compliance Start Date',
        value: this.formatDate(
          row.compliance_start_date
        )
      },

      {
        label: 'Compliance End Date',
        value: this.formatDate(
          row.compliance_end_date
        )
      },

      {
        label: 'Audit Due Date',
        value: this.formatDate(
          row.audit_due_date
        )
      },

      {
        label: 'Compliance Due Date',
        value: this.formatDate(
          row.compliance_due_date
        )
      },

      {
        label: 'Auditor',
        value: this.getEmployeeDisplay(
          row.auditor_name,
          row.auditor_code
        )
      },

      {
        label: 'Branch Head',
        value: this.getEmployeeDisplay(
          row.branch_head_name,
          row.branch_head_code
        )
      },

      {
        label: 'Branch Sub-Head',
        value: this.getEmployeeDisplay(
          row.branch_subhead_name,
          row.branch_subhead_code
        )
      },

      {
        label: 'Other Compliance Employees',
        value:
          row.other_compliance_employees || '-'
      }

    ]);
  }

 
  // LIMIT CHANGE
 

 onLimitChange() {

  // selected dropdown value
  const selectedValue =
    Number(
      this.selectedLimit()
    );


  // update ui
  this.assessment.update(
    (old: any) => ({

      ...old,

      compliance_review_reject_limit:
        selectedValue,

      is_limit_blocked: 1
    })
  );
}

 
  // UPDATE
 

  updateAssessment(
    type: 'audit' | 'compliance' | 'limit'
  ) {

    const formatDateForPayload = (date: Date | null): string | null => {
      if (!date) return null;
      return this.datePipe.transform(date, 'yyyy-MM-dd');
    };

    const payload: any = {};

    // AUDIT
    if (type === 'audit') {

      if (!this.auditDueDate()) {
        return;
      }

      payload.audit_due_date =
        formatDateForPayload(this.auditDueDate());

      payload.is_limit_blocked = 0;
    }

    // COMPLIANCE
    if (type === 'compliance') {

      if (!this.complianceDueDate()) {
        return;
      }

      payload.compliance_due_date =
        formatDateForPayload(this.complianceDueDate());

      payload.is_limit_blocked = 0;
    }

    // LIMIT
    if (type === 'limit') {

      payload.compliance_review_reject_limit =
        this.assessment()
          ?.compliance_review_reject_limit;

      payload.is_limit_blocked = 0;
    }

    this.assessmentService
      .updateManageAssessmentMaster(
        this.assessment()?.id,
        payload
      )
      .subscribe({

        next: (res: any) => {

          console.log(res);

          this.assessment.update(
            (old: any) => ({
              ...old,
              ...payload
            })
          );
            if (
            payload.compliance_review_reject_limit
          ) {

            this.originalLimit.set(
              payload.compliance_review_reject_limit
            );
          }
        },


        error: (err) => {

          console.log(err);
        }
      });
  }

 
  // EXPIRED
 

  isExpired(date: any): boolean {

    if (!date) {
      return false;
    }

    const currentDate = new Date();

    const checkDate = new Date(date);

    currentDate.setHours(0, 0, 0, 0);

    checkDate.setHours(0, 0, 0, 0);

    return checkDate < currentDate;
  }

 
  // FORMAT DATE
 

  formatDate(date: any): string {

    if (!date) {
      return '-';
    }

    return this.datePipe.transform(
      date,
      'yyyy-MM-dd'
    ) || '-';
  }

 
  // EMPLOYEE
 

  getEmployeeDisplay(
    name: string,
    code: string
  ): string {

    if (!name) {
      return '-';
    }

    return `${name} ( EMP. ${code || '-'} )`;
  }

 
  // UNIT DISPLAY
 

  getAuditUnitDisplay(row: any): string {

    return row.audit_unit_code
      ? `${row.name} - ( ${row.audit_unit_code} )`
      : row.name;
  }

  

  getAuditStatus(id: number): string {

    const map: Record<number, string> = {

      1: 'AUDIT (PENDING / ACTIVE)',
      2: 'REVIEW (PENDING / ACTIVE)',
      3: 'RE AUDIT (PENDING / ACTIVE)',

      4: 'COMPLIANCE (PENDING / ACTIVE)',
      5: 'REVIEW (PENDING / ACTIVE)',
      6: 'RE COMPLIANCE (PENDING / ACTIVE)',

      7: 'ASSESMENT COMPLETED'
    };

    return map[id] || '-';
  }



  getComplianceStatus(id: number): string {

    const map: Record<number, string> = {

      4: 'COMPLIANCE (PENDING / ACTIVE)',
      5: 'REVIEW (PENDING / ACTIVE)',
      6: 'RE COMPLIANCE (PENDING / ACTIVE)'
    };

    return map[id] || '-';
  }

  getSeverity(id: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      1: 'warn',
      2: 'info',
      3: 'warn',
      4: 'info',
      5: 'info',
      6: 'warn',
      7: 'success',
    };
    return map[id] || 'secondary';
  }

  getComplianceSeverity(id: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      4: 'warn',
      5: 'info',
      6: 'warn',
    };
    return map[id] || 'secondary';
  }


  loadAssignmentsData() {
    const id = this.assessment()?.id;
    if (!id) return;

    this.loadingAssignments.set(true);

    this.assessmentService.getEligibleAuditors(id).subscribe({
      next: (auditors) => {
        this.eligibleAuditors.set(auditors || []);

        this.assessmentService.getAssessmentQuestions(id).subscribe({
          next: (questions) => {
            this.assessmentService.getQuestionAssignments(id).subscribe({
              next: (assignments) => {
                const assignmentMap = new Map<number, number>();
                for (const a of assignments || []) {
                  assignmentMap.set(Number(a.question_id), Number(a.audit_emp_id));
                }

                const catMap = new Map<number, any>();
                for (const q of questions || []) {
                  const catId = Number(q.category_id);
                  if (!catMap.has(catId)) {
                    catMap.set(catId, {
                      id: catId,
                      name: q.category_name,
                      questions: []
                    });
                  }
                  catMap.get(catId).questions.push({
                    question_id: Number(q.question_id),
                    question: q.question,
                    assigned_emp_id: assignmentMap.get(Number(q.question_id)) || null
                  });
                }

                this.categories.set(Array.from(catMap.values()));
                this.loadingAssignments.set(false);
              },
              error: () => this.loadingAssignments.set(false)
            });
          },
          error: () => this.loadingAssignments.set(false)
        });
      },
      error: () => this.loadingAssignments.set(false)
    });
  }

  saveAssignments() {
    const id = this.assessment()?.id;
    if (!id) return;

    this.savingAssignments.set(true);

    const assignmentsList: any[] = [];
    for (const cat of this.categories()) {
      for (const q of cat.questions) {
        if (q.assigned_emp_id !== null && q.assigned_emp_id !== 'null' && q.assigned_emp_id !== '' && q.assigned_emp_id !== undefined) {
          assignmentsList.push({
            question_id: q.question_id,
            audit_emp_id: Number(q.assigned_emp_id)
          });
        }
      }
    }

    this.assessmentService.assignQuestions(id, assignmentsList).subscribe({
      next: (res) => {
        this.savingAssignments.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Question assignments updated successfully'
        });
      },
      error: (err) => {
        this.savingAssignments.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update question assignments'
        });
      }
    });
  }

  close() {
    this.ref.close();
  }
}