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
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

import {
    AuditQuestionMasterService,
    CreateQuestionDto,
} from '../services/masters.service';

@Component({
    selector: 'app-question-form',
    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent
    ],

    template: `
    <div class="flex flex-column gap-3">

      <div>
        <label class="block mb-2 font-medium">
          Question
        </label>

        <textarea
          pInputTextarea
          rows="5"
          class="w-full"
          [value]="question()"
          (input)="question.set(
            $any($event.target).value
          )">
        </textarea>
      </div>

      <div class="grid">

        <div class="col-12 md:col-6">

          <app-select-field
            label="Question Type"
            [field]="questionTypeId"
            [options]="questionTypes()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
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

        <div class="col-12 md:col-6">

          <app-select-field
            label="Risk Category"
            [field]="riskCategoryId"
            [options]="riskParameters()"
            optionLabel="label"
            optionValue="value"
            [required]="true"
          ></app-select-field>

        </div>

      </div>

      <app-checkbox-field
        label="Is Active"
        [field]="isActive"
      ></app-checkbox-field>

    </div>

    <app-form-actions
      class="mt-4"
      [loading]="saving()"
      (save)="save()"
      (cancel)="cancel()"
    ></app-form-actions>
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

    questionTypes = signal<any[]>([]);

    inputMethods = signal<any[]>([]);

    applicableTo = signal<any[]>([]);

    riskParameters = signal<any[]>([]);

    constructor() {
        const data = this.ref.data;

        this.setId = Number(
            data?.set_id,
        );

        this.headerId = Number(
            data?.header_id,
        );

        this.loadLookups();

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

            this.applicableId.set(
                Number(
                    data.applicable_id,
                ) || null,
            );

            this.riskCategoryId.set(
                Number(
                    data.risk_category_id,
                ) || null,
            );

            this.isActive.set(
                Number(data.is_active) !== 0,
            );
        }
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

                    this.riskParameters.set(
                        res?.riskParameters ?? [],
                    );
                },
            });
    }

    save() {
        const payload: CreateQuestionDto =
        {
            set_id: this.setId,

            header_id: this.headerId,

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

            risk_category_id: Number(
                this.riskCategoryId(),
            ),

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