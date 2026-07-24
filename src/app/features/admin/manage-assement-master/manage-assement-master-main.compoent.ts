import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import {
    TableComponent,
    TableColumn
} from '../../../shared/components/table/table.component';

import {
    DateFieldComponent,
    SelectFieldComponent,
    TextFieldComponent
} from '../../../shared/components/form';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import {
    AuditUnitService,
    BranchService,
    ManageAssessmentMasterService
} from '../services/masters.service';
import { DateRangeFieldComponent } from '../../../shared/components/form/date-range-field/date-range-field.component';
import { AssessmentDetailsFormComponent } from './assement-details.component';

@Component({
    selector: 'app-manage-assessment-master',
    standalone: true,
    imports: [
        CommonModule,
        TableComponent,
        ToastModule,
        ButtonModule,
        SelectFieldComponent,
        TextFieldComponent,
        DateFieldComponent
    ],
    providers: [MessageService],
    template: `
   <div class="card w-full">

  <!-- Heading -->
  <div class="flex align-items-center justify-content-between mb-4">
    <h5 class="m-0 text-xl font-semibold">
      Manage Assessment Master
    </h5>
  </div>

  <!-- Filters -->
  <div class="grid w-full">

    <!-- Audit Unit Dropdown -->
    <div class="col-12 md:col-4">
      <app-select-field
        label="Audit Unit"
        [field]="audit_unit_id"
        [options]="sectionTypeOptions()"
        optionLabel="label"
        optionValue="value"
        [required]="true"
      ></app-select-field>
    </div>

    <!-- Assessment From -->
    <div class="col-12 md:col-4">
      <app-date-field
        label="Assessment Period From"
        [field]="assesment_period_from"
      ></app-date-field>
    </div>

    <!-- Assessment To -->
    <div class="col-12 md:col-4">
      <app-date-field
        label="Assessment Period To"
        [field]="assesment_period_to"
      ></app-date-field>
    </div>

    <!-- Search Button -->
    <div class="col-12 mt-2">
      <button
        pButton
        type="button"
        label="Search"
        icon="pi pi-search"
        (click)="loadManageAssessments()"
      ></button>
    </div>

  </div>

  <!-- Table -->
  @if (manageAssessments().length > 0) {

    <div class="mt-4 w-full overflow-auto">

      <app-table
        [columns]="columns"
        [data]="manageAssessments()"
        [loading]="loading()"
        [showToolbar]="false"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
      >
      </app-table>

    </div>

  } @else if (searched() && !loading()) {
    <div class="mt-4 p-4 text-center border-round border-1 border-gray-200 surface-100 text-600 font-medium">
      <i class="pi pi-info-circle mr-2"></i>Assessment not started yet
    </div>
  }

</div>

<p-toast></p-toast>
  `
})
export class ManageAssessmentMasterComponent implements OnInit {

    private manageAssessmentService =
        inject(ManageAssessmentMasterService);

    private auditUnitService =
        inject(AuditUnitService);

    private drawer =
        inject(FormDrawerService);

    private messageService =
        inject(MessageService);

    manageAssessments = signal<any[]>([]);

    loading = signal(false);

    searched = signal(false);

    sectionTypeOptions = signal<any[]>([]);

    audit_unit_id = signal<number | null>(null);
    assesment_period_from = signal<Date | null>(null);

    assesment_period_to = signal<Date | null>(null);

    columns: TableColumn[] = [
        {
            field: 'audit_unit_display',
            header: 'Audit Unit Name',
            width: '250px'
        },
        {
            field: 'audit_status_display',
            header: 'Audit Status',
            width: '250px'
        },
        {
            field: '_edit',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-pencil',
            actionName: 'edit',
            width: '60px',
            align: 'center',
            tooltip: 'Edit'
        }
    ];
    auditStatusMap: Record<number, string> = {
        1: 'AUDIT (PENDING / ACTIVE)',
        2: 'REVIEW (PENDING / ACTIVE)',
        3: 'RE AUDIT (PENDING / ACTIVE)',

        4: 'COMPLIANCE (PENDING / ACTIVE)',
        5: 'REVIEW (PENDING / ACTIVE)',
        6: 'RE COMPLIANCE (PENDING / ACTIVE)',

        7: 'ASSESMENT COMPLETED',
        8: 'REVIEWER TO AUDIT (All OBSERVATIONS)',
        9: 'REVIEWER TO COMPLIANCE (All OBSERVATIONS)',

        10: 'ADMIN INCREASE ACCEPT / REJECT LIMIT IN AUDIT',
        11: 'ADMIN INCREASE ACCEPT / REJECT LIMIT IN COMPLIANCE',

        12: 'ADMIN INCREASE DUE DATE IN AUDIT',
        13: 'ADMIN INCREASE DUE DATE IN COMPLIANCE',

        14: 'REVIEWER TO AUDIT (ENTIRE ASSESMENT BACK TO AUDIT)'
    };

    ngOnInit() {
        this.loadBranches();
    }

    loadBranches() {



        this.auditUnitService.findAll().subscribe({

            next: (res: any) => {

                const rows = Array.isArray(res)
                    ? res
                    : res?.data || [];

                this.sectionTypeOptions.set(
                    rows
                    .filter((item: any) => String(item.section_type_id) === '1')
                    .map((item: any) => ({
                        label: item.audit_unit_code
                            ? `(${item.audit_unit_code}) ${item.name}`
                            : item.name,
                        value: Number(item.id)
                    }))
                );


            },
            error: () => {

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load branches'
                });
            }
        });
    }
    formatDate(date: Date | null): string {
        if (!date) {
            return '';
        }
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    loadManageAssessments() {

        if (
            !this.audit_unit_id() ||
            !this.assesment_period_from() ||
            !this.assesment_period_to()
        ) {

            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please fill all fields'
            });

            return;
        }

        this.loading.set(true);

        this.manageAssessmentService
            .getManageAssessmentMaster(
                this.formatDate(this.assesment_period_from()),
                this.formatDate(this.assesment_period_to()),
                this.audit_unit_id()!
            )
            .subscribe({

                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : res?.rows || [];

                    const formattedRows = rows.map((item: any) => ({
                        ...item,
                        audit_unit_display: item.audit_unit_code
                            ? `(${item.name}) ${item.audit_unit_code}`
                            : item.name,
                        audit_status_display: this.auditStatusMap[item.audit_status_id] || 'Unknown'
                    }));

                    this.manageAssessments.set(formattedRows);
                    this.searched.set(true);


                    this.loading.set(false);
                },

                error: () => {

                    this.loading.set(false);
                    this.searched.set(true);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Unable to load data'
                    });
                }
            });
    }

    private getRows(res: any): any[] {

        if (Array.isArray(res)) {
            return res;
        }

        if (Array.isArray(res?.data)) {
            return res.data;
        }

        if (Array.isArray(res?.rows)) {
            return res.rows;
        }

        return [];
    }

    onAction(event: { name: string; row: any }) {

        if (event.name === 'edit') {
            this.openForm(event.row);
        }
    }

    async openForm(row?: any) {

       await this.drawer.open(
    AssessmentDetailsFormComponent,
    {
      header: 'Assessment Details',
      width: '90vw',
      data: row
    }
  );
    }
}