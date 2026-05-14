import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import {
    TableColumn,
    TableComponent,
} from '../../../shared/components/table/table.component';

import {
    CheckboxFieldComponent,
    FormActionsComponent,
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
    AuditQuestionMasterService,
    CreateQuestionRiskMappingDto,
} from '../services/masters.service';
import { ButtonModule } from 'primeng/button';


@Component({
    selector: 'app-question-risk-mapping',
    standalone: true,

    imports: [
        CommonModule,

        ToastModule,
        ConfirmDialogModule,

        TableComponent,

        TextFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
        ButtonModule
    ],


    template: `
   <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="flex flex-column gap-4">

      <!-- Question Info -->
      <div class="surface-100 border-round-lg p-3 border-1 border-gray-200">

        <div class="mb-3">
          <span class="font-semibold text-700">
            Question:
          </span>

          <div class="mt-1 line-height-3">
            {{ question() }}
          </div>
        </div>

        <div>
          <span class="font-semibold text-700">
            Answer Type:
          </span>

          <span class="ml-2">
            {{ answerType() }}
          </span>
        </div>

      </div>

      <!-- Mapping Form -->
      <div class="border-1 border-gray-200 border-round-lg p-3">

        <div class="grid">

          <!-- Risk Type -->
          <div class="col-12 md:col-4">
            <app-text-field
              label="Risk Type"
              [field]="riskType"
              placeholder="Enter risk type"
              [required]="true"
            ></app-text-field>
          </div>

          <!-- Business Risk -->
          <div class="col-12 md:col-4">
            <app-select-field
              label="Business Risk"
              [field]="businessRisk"
              [options]="riskOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
            ></app-select-field>
          </div>

          <!-- Control Risk -->
          <div class="col-12 md:col-4">
            <app-select-field
              label="Control Risk"
              [field]="controlRisk"
              [options]="riskOptions"
              optionLabel="label"
              optionValue="value"
              [required]="true"
            ></app-select-field>
          </div>

        </div>

        <!-- Add Button -->
        <div class="flex justify-content-end mt-3">

          <button
            pButton
            type="button"
            label="Add Mapping"
            icon="pi pi-plus"
            class="p-button-sm"
            (click)="addMapping()">
          </button>

        </div>

      </div>

      <!-- Table Section -->
      <div class="border-1 border-gray-200 border-round-lg overflow-hidden">

        <app-table
          [columns]="columns"
          [data]="mappings()"
          [loading]="loading()"
          [actionDisplayMode]="'buttons'"
          (onActionClick)="onAction($event)"
        ></app-table>

      </div>

    </div>

  </div>

</div>

<p-toast></p-toast>

<p-confirmDialog></p-confirmDialog>
  `,
})
export class AuditQuestionRiskMappingComponent {
    private ref = inject(FormDrawerRef);

    private service = inject(
        AuditQuestionMasterService,
    );

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    questionId = 0;

    question = signal('');

    answerType = signal('');

    mappings = signal<any[]>([]);

    loading = signal(false);

    saving = signal(false);

    riskType = signal('');

    businessRisk =
        signal<string | null>(null);

    controlRisk =
        signal<string | null>(null);

    riskOptions = [
        {
            label: 'HIGH RISK',
            value: 'HIGH RISK',
        },

        {
            label: 'MEDIUM RISK',
            value: 'MEDIUM RISK',
        },

        {
            label: 'LOW RISK',
            value: 'LOW RISK',
        },

        {
            label: 'NO RISK',
            value: 'NO RISK',
        },
    ];

    columns: TableColumn[] = [
        {
            field: 'risk_type',
            header: 'Risk Type',
            width: '240px',
        },

        {
            field: 'business_risk',
            header: 'Business Risk',
            width: '180px',
        },

        {
            field: 'control_risk',
            header: 'Control Risk',
            width: '180px',
        },

        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '60px',
            align: 'center',
            tooltip: 'Delete',
            cssClass: 'text-danger',
        },
    ];

    constructor() {
        const data = this.ref.data;

        this.questionId = Number(
            data?.id,
        );

        this.question.set(
            data?.question ?? '',
        );

        this.answerType.set(
            data?.option_name ?? '-',
        );

        this.load();
    }

    load() {
        this.loading.set(true);

        this.service
            .findRiskMappings(
                this.questionId,
            )
            .subscribe({
                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res?.rows)
                                ? res.rows
                                : [];

                    this.mappings.set(rows);

                    this.loading.set(false);
                },

                error: () => {
                    this.loading.set(false);
                },
            });
    }

    addMapping() {
        const payload: CreateQuestionRiskMappingDto =
        {
            question_id:
                this.questionId,

            risk_type: this.riskType()
                .trim(),

            business_risk:
                this.businessRisk() || '',

            control_risk:
                this.controlRisk() || '',
        };

        if (!payload.risk_type) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please enter risk type',
            });

            return;
        }

        if (
            !payload.business_risk
        ) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please select business risk',
            });

            return;
        }

        if (
            !payload.control_risk
        ) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please select control risk',
            });

            return;
        }

        this.service
            .createRiskMapping(
                payload,
            )
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail:
                            'Risk mapping added successfully',
                    });

                    this.riskType.set('');

                    this.businessRisk.set(
                        null,
                    );

                    this.controlRisk.set(
                        null,
                    );

                    this.load();
                },
            });
    }

    onAction(event: {
        name: string;
        row: any;
    }) {
        if (event.name === 'delete') {
            this.deleteMapping(
                event.row,
            );
        }
    }

    private deleteMapping(
        row: any,
    ) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this risk mapping?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.confirmationService.close();

                this.service
                    .removeRiskMapping(
                        row.id,
                    )
                    .subscribe({
                        next: () => {
                            this.load();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Deleted',
                                detail:
                                    'Risk mapping deleted successfully',
                            });
                        },
                    });
            },
        });
    }
}