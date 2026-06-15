import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

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
    ButtonModule
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
      <!-- Main Table -->
      <div
        class="border-1 border-gray-300 border-round overflow-hidden"
      >

      <table class="w-full border-collapse">

        <!-- Header -->
        <thead>

          <tr class="bg-gray-100">

            <th
              class="border-1 border-gray-300 p-3 text-left"
              width="5%"
            >
              Sr. No.
            </th>

            <th
              class="border-1 border-gray-300 p-3 text-left"
              width="40%"
            >
              Assessment Details
            </th>

            <th
              class="border-1 border-gray-300 p-3 text-left"
              width="25%"
            >
              Audit Status
            </th>

            <th
              class="border-1 border-gray-300 p-3 text-left"
              width="30%"
            >
              Compliance Status
            </th>

          </tr>

        </thead>

        <!-- Body -->
        <tbody>

          <!-- Main Row -->
          <tr>

            <!-- Sr -->
            <td
              class="border-1 border-gray-300 p-3 align-top"
            >
              1
            </td>

            <!-- Assessment -->
            <td
              class="border-1 border-gray-300 p-3 align-top"
            >

              <div
                class="text-blue-600 font-bold text-xl"
              >

                {{
                  assessment()?.audit_unit_display
                }}

              </div>

              <div class="mt-3">

                {{
                  formatDate(
                    assessment()?.assesment_period_from
                  )
                }}

                -

                {{
                  formatDate(
                    assessment()?.assesment_period_to
                  )
                }}

                <span class="text-gray-500">

                  (
                  Frequency -
                  {{
                    assessment()?.frequency || '-'
                  }}
                  Months
                  )

                </span>

              </div>

              <div
                class="mt-3 text-red-500 font-semibold"
              >

                Compliance Due Date:
                {{
                  formatDate(
                    assessment()?.compliance_due_date
                  )
                }}

              </div>

            </td>

            <!-- Audit Status -->
            <td
              class="border-1 border-gray-300 p-3 align-top"
            >

              <div class="font-semibold">

                {{
                  assessment()?.audit_status_display
                }}

              </div>

              @if (
                isExpired(
                  assessment()?.audit_due_date
                )
              ) {

              <div class="mt-3 text-red-500">

                Audit Expired

              </div>

              }

            </td>

            <!-- Compliance Status -->
            <td
              class="border-1 border-gray-300 p-3 align-top"
            >

              <div class="font-semibold">

                {{
                  assessment()
                    ?.compliance_status_display
                }}

              </div>

              @if (
                isExpired(
                  assessment()
                    ?.compliance_due_date
                )
              ) {

              <div class="mt-3 text-red-500">

                Compliance Expired

              </div>

              }

              <div
                class="mt-3 text-red-500 font-semibold"
              >

                Status:
                {{
                  assessment()?.is_limit_blocked === 1
                    ? 'COMPLIANCE BLOCKED'
                    : 'ACTIVE'
                }}

              </div>

            </td>

          </tr>

          <!-- Detail Rows -->
          <tr *ngFor="let item of detailRows()">

            <td
              class="border-1 border-gray-300 p-3"
            >
            </td>

            <td
              class="border-1 border-gray-300 p-3 font-medium"
            >

              {{ item.label }}

            </td>

            <td
              colspan="2"
              class="border-1 border-gray-300 p-3"
            >

              {{ item.value }}

            </td>

          </tr>

        </tbody>

      </table>

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

    const payload: any = {};

    // AUDIT
    if (type === 'audit') {

      if (!this.auditDueDate()) {
        return;
      }

      payload.audit_due_date =
        this.auditDueDate();

      payload.is_limit_blocked = 0;
    }

    // COMPLIANCE
    if (type === 'compliance') {

      if (!this.complianceDueDate()) {
        return;
      }

      payload.compliance_due_date =
        this.complianceDueDate();

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