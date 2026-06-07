import {
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
    CheckboxFieldComponent,
    FormActionsComponent,
    NumberFieldComponent,
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

import {
    AuditQuestionMasterService,
    CreateQuestionDto,
} from '../services/masters.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-question-form',
    standalone: true,

    imports: [
        CommonModule,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
        NumberFieldComponent, CheckboxModule, FormsModule
    ],

    template: `
   <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="flex flex-column gap-3">

      <!-- Header -->
      <div class="grid">
        <div class="col-12">
          <app-select-field
            label="Header"
            [field]="selectedHeaderId"
            [options]="headers()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            [virtualScroll]="false"
          ></app-select-field>
        </div>
      </div>

      <!-- Question -->
      <div>
        <label class="block mb-2 font-medium">
          Question
        </label>

        <textarea
          pInputTextarea
          rows="5"
          class="w-full"
          [value]="question()"
          (input)="question.set($any($event.target).value)">
        </textarea>
      </div>

      <!-- Question Type + Input Method -->
      <div class="grid">

        <div class="col-12 md:col-6">
          <app-select-field
            label="Question Type"
            [field]="questionTypeId"
            [options]="questionTypes()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            [virtualScroll]="false"
          ></app-select-field>
        </div>

        <div class="col-12 md:col-6">
          <app-select-field
            label="Input Method"
            [field]="optionId"
            [options]="inputMethods()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>
        </div>

      </div>

      <div
        class="grid"
        *ngIf="optionId() === 4"
        >

        <div class="col-12">

            <app-select-field
            label="Annexure"
            [field]="selectedAnnexureId"
            [options]="annexures()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            ></app-select-field>

        </div>

        </div>

    <div
  *ngIf="optionId() === 5"
  class="mt-3"
>

  <label class="block mb-3 font-medium">
    Subsets
  </label>

  <div class="grid">

    <div
      class="col-12 md:col-6"
      *ngFor="
        let subset of subsets()
      "
    >

      <div class="flex align-items-center gap-2">

    <p-checkbox
        [binary]="false"
        [value]="subset.value"
        [ngModel]="selectedSubsetIds()"
        (ngModelChange)="
        selectedSubsetIds.set($event)
        "
        [inputId]="'subset_' + subset.value"
    ></p-checkbox>

    <label
        [for]="'subset_' + subset.value"
        class="cursor-pointer"
    >
        {{ subset.label }}
    </label>

</div>

    </div>

  </div>

</div>

      <!-- Applicable To -->
      <div class="grid">

        <div class="col-12 md:col-6">
          <app-select-field
            label="Applicable To"
            [field]="applicableId"
            [options]="applicableTo()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>
        </div>

      </div>

      <!-- Business + Control Risk -->
      <div class="grid">

        <div class="col-12 md:col-6">
          <app-select-field
            label="Business Risk Category"
            [field]="businessRiskCategoryId"
            [options]="businessRiskCategories()"
            optionLabel="label"
            optionValue="value"
          ></app-select-field>
        </div>

        <div class="col-12 md:col-6">
          <app-select-field
            label="Control Risk Category"
            [field]="controlRiskCategoryId"
            [options]="controlRiskCategories()"
            optionLabel="label"
            optionValue="value"
            [virtualScroll]="false"
          ></app-select-field>
        </div>

      </div>

      <!-- Key Aspect + Residual Risk -->
      <div class="grid">

        <div class="col-12 md:col-6">
          <app-select-field
            label="Key Aspect"
            [field]="keyAspectId"
            [options]="keyAspects()"
            optionLabel="label"
            optionValue="value"
          ></app-select-field>
        </div>

        <div class="col-12 md:col-6">
          <app-select-field
            label="Residual Risk"
            [field]="residualRiskId"
            [options]="residualRisks()"
            optionLabel="label"
            optionValue="value"
            [virtualScroll]="false"
          ></app-select-field>
        </div>

      </div>

      <!-- Audit Area + Show Instances -->
      <div class="grid">

        <div class="col-12 md:col-6">
          <app-select-field
            label="Broader Area of Audit"
            [field]="auditAreaId"
            [options]="auditAreas()"
            optionLabel="label"
            optionValue="value"
          ></app-select-field>
        </div>

        <div class="col-12 md:col-6">
          <app-number-field
            label="Show Instances"
            [field]="showInstances"
          ></app-number-field>
        </div>

      </div>

      <!-- Upload Options -->
      <div class="grid">

        <div class="col-12 md:col-6 flex align-items-center pt-3">
          <app-checkbox-field
            label="Auditor Evidence Upload"
            [field]="auditEvidenceUpload"
          ></app-checkbox-field>
        </div>

        <div class="col-12 md:col-6 flex align-items-center pt-3">
          <app-checkbox-field
            label="Compliance Evidence Upload"
            [field]="complianceEvidenceUpload"
          ></app-checkbox-field>
        </div>

      </div>

      <!-- Is Active -->
      <div class="grid">
        <div class="col-12 md:col-6 flex align-items-center pt-2">
          <app-checkbox-field
            label="Is Active"
            [field]="isActive"
          ></app-checkbox-field>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">
      <app-form-actions
        [loading]="saving()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>
    </div>

  </div>

</div>
  `,
})
export class AuditQuestionFormComponent {
    private ref = inject(FormDrawerRef);

    private service = inject(
        AuditQuestionMasterService,
    );

    private messageService =
        inject(MessageService);

    setId = 0;

    headerId = 0;

    question = signal('');

    headers = signal<any[]>([]);

    selectedHeaderId =
        signal<number | null>(null);

    questionTypeId =
        signal<number | null>(null);

    optionId =
        signal<number | null>(null);

    applicableId =
        signal<number | null>(null);

    riskCategoryId =
        signal<number | null>(null);

    isActive = signal(true);

    saving = signal(false);

    businessRiskCategoryId =
        signal<number | null>(null);

    businessRiskCategories =
        signal<any[]>([]);

    controlRiskCategoryId =
        signal<number | null>(null);

    controlRiskCategories =
        signal<any[]>([]);

    keyAspectId =
        signal<number | null>(null);

    keyAspects =
        signal<any[]>([]);

    keyAspectMappings: any = {};

    residualRiskId =
        signal<number | null>(null);

    auditAreaId =
        signal<number | null>(null);

    auditAreas =
        signal<any[]>([]);

    showInstances =
        signal<number | null>(0);

    auditEvidenceUpload =
        signal(false);

    complianceEvidenceUpload =
        signal(false);

    residualRisks =
        signal<any[]>([]);

    questionTypes = signal<any[]>([]);

    inputMethods = signal<any[]>([]);

    applicableTo = signal<any[]>([]);

    riskParameters = signal<any[]>([]);

    annexures = signal<any[]>([]);

    subsets = signal<any[]>([]);

    selectedAnnexureId =
        signal<number | null>(null);

    selectedSubsetIds =
        signal<number[]>([]);

    constructor() {
        const data = this.ref.data;

        this.setId = Number(
            data?.set_id,
        );

        this.headerId =
            data?.header_id != null
                ? Number(data.header_id)
                : 0;

        this.selectedHeaderId.set(
            this.headerId || null,
        );

        this.loadLookups();
        this.loadHeaders();

        console.log(this.ref.data);

        effect(() => {

            const value =
                this.controlRiskCategoryId();

            if (
                value === null ||
                value === undefined
            ) {
                this.keyAspects.set([]);

                return;
            }

            const options =
                this.keyAspectMappings[
                String(value)
                ] ?? [];

            this.keyAspects.set(
                options,
            );

            console.log(
                'Dynamic Key Aspects:',
                options,
            );
        });

        if (data) {
            this.question.set(
                data.question ?? '',
            );

            this.questionTypeId.set(
                Number(
                    data.question_type_id,
                ) || null,
            );

            this.optionId.set(
                Number(data.option_id) ||
                null,
            );

            this.selectedAnnexureId.set(
                data.annexure_id != null
                    ? Number(data.annexure_id)
                    : null,
            );

            this.selectedSubsetIds.set(
                data.subset_multi_id
                    ? String(
                        data.subset_multi_id,
                    )
                        .split(',')
                        .map((x: string) =>
                            Number(x.trim()),
                        )
                        .filter(Boolean)
                    : [],
            );

            this.applicableId.set(
                data.applicable_id != null
                    ? Number(data.applicable_id)
                    : null,
            );

            this.riskCategoryId.set(
                data.risk_category_id != null
                    ? Number(data.risk_category_id)
                    : null,
            );

            this.isActive.set(
                Number(data.is_active) !== 0,
            );

            this.businessRiskCategoryId.set(
                data.risk_category_id != null
                    ? Number(
                        data.risk_category_id,
                    )
                    : null,
            );

            this.controlRiskCategoryId.set(
                data.control_risk_id != null
                    ? Number(
                        data.control_risk_id,
                    )
                    : null,
            );

            this.residualRiskId.set(
                data.residual_risk_id != null
                    ? Number(
                        data.residual_risk_id,
                    )
                    : null,
            );


            this.auditAreaId.set(
                data.area_of_audit_id != null
                    ? Number(
                        data.area_of_audit_id,
                    )
                    : null,
            );

            this.showInstances.set(
                data.show_instances != null
                    ? Number(
                        data.show_instances,
                    )
                    : 0,
            );

            this.auditEvidenceUpload.set(
                Number(
                    data.audit_ev_upload,
                ) === 1,
            );

            this.complianceEvidenceUpload.set(
                Number(
                    data.compliance_ev_upload,
                ) === 1,
            );
        }
    }

    loadHeaders() {

        if (!this.setId) {
            return;
        }

        this.service
            .findHeadersBySet(
                this.setId,
            )
            .subscribe({
                next: (res: any) => {

                    const rows =
                        Array.isArray(res)
                            ? res
                            : res?.data ?? [];

                    this.headers.set(
                        rows.map(
                            (x: any) => ({
                                label: x.name,
                                value: Number(
                                    x.id,
                                ),
                            }),
                        ),
                    );
                },
            });
    }

    loadLookups() {
        this.service
            .getQuestionLookups()
            .subscribe({
                next: (res: any) => {
                    this.questionTypes.set(
                        res?.questionTypes ?? [],
                    );

                    this.inputMethods.set(
                        res?.questionInputMethods ??
                        [],
                    );

                    this.applicableTo.set(
                        res?.applicableTo ?? [],
                    );

                    this.annexures.set(
                        res?.annexures ?? [],
                    );

                    this.subsets.set(
                        res?.subsets ?? [],
                    );

                    this.riskParameters.set(
                        res?.riskParameters ?? [],
                    );

                    this.businessRiskCategories.set(
                        res?.businessRiskCategories ?? [],
                    );

                    this.controlRiskCategories.set(
                        res?.controlRiskCategories ?? [],
                    );

                    this.keyAspectMappings =
                        res?.keyAspectMappings ?? {};

                    const controlRiskId =
                        this.controlRiskCategoryId();

                    if (controlRiskId) {

                        const options =
                            this.keyAspectMappings[
                            String(controlRiskId)
                            ] ?? [];

                        this.keyAspects.set(
                            options,
                        );
                        const data = this.ref.data;

                        if (data?.key_aspect_id != null) {

                            this.keyAspectId.set(
                                Number(
                                    data.key_aspect_id,
                                ),
                            );
                        }
                    }

                    this.residualRisks.set(
                        res?.residualRisks ?? [],
                    );

                    this.auditAreas.set(
                        res?.auditAreas ?? [],
                    );
                },
            });
    }

    save() {
        const payload: CreateQuestionDto = {

            set_id: this.setId,

            header_id: Number(
                this.selectedHeaderId(),
            ),

            annexure_id:
                Number(this.selectedAnnexureId(),),

            subset_multi_id:
                this.selectedSubsetIds()
                    .join(','),

            question: this.question()
                .trim(),

            question_type_id: Number(
                this.questionTypeId(),
            ),

            option_id: Number(
                this.optionId(),
            ),

            applicable_id: Number(
                this.applicableId(),
            ),

            // Business Risk Category
            risk_category_id: Number(
                this.businessRiskCategoryId(),
            ),

            area_of_audit_id: Number(
                this.auditAreaId(),
            ),

            control_risk_id: Number(
                this.controlRiskCategoryId(),
            ),

            key_aspect_id: Number(
                this.keyAspectId(),
            ),

            residual_risk_id: Number(
                this.residualRiskId(),
            ),

            show_instances: Number(
                this.showInstances() ?? 0,
            ),

            audit_ev_upload:
                this.auditEvidenceUpload()
                    ? 1
                    : 0,

            compliance_ev_upload:
                this.complianceEvidenceUpload()
                    ? 1
                    : 0,

            is_active: this.isActive()
                ? 1
                : 0,
        };

        if (!payload.question) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please enter question',
            });

            return;
        }

        this.saving.set(true);

        const obs = this.ref.data?.id
            ? this.service.updateQuestion(
                this.ref.data.id,
                payload,
            )
            : this.service.createQuestion(
                payload,
            );

        obs.subscribe({
            next: () => {
                this.saving.set(false);

                this.ref.close({
                    saved: true,
                });
            },

            error: () => {
                this.saving.set(false);
            },
        });
    }

    cancel() {
        this.ref.close();
    }
}