import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

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


  close() {
    this.ref.close();
  }
}