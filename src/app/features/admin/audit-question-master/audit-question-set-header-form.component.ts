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
    CreateQuestionHeaderDto,
    AuditQuestionMasterService,
} from '../services/masters.service';

@Component({
    selector: 'app-question-set-header-form',
    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent
    ],

    template: `
    <div class="flex flex-column gap-3">

      <app-text-field
        label="Header Name"
        [field]="name"
        placeholder="Enter header name"
        [required]="true"
      ></app-text-field>

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
export class AuditQuestionSetHeaderFormComponent {
    private ref = inject(FormDrawerRef);

    private service = inject(
        AuditQuestionMasterService,
    );

    private messageService =
        inject(MessageService);

    name = signal('');

    isActive = signal(true);

    saving = signal(false);

    questionSetId = 0;

    constructor() {
        const data = this.ref.data;

        this.questionSetId = Number(
            data?.question_set_id,
        );

        if (data) {
            this.name.set(
                data.name ?? '',
            );

            this.isActive.set(
                Number(data.is_active) !== 0,
            );
        }
    }

    save() {
        const payload: CreateQuestionHeaderDto =
        {
            question_set_id:
                this.questionSetId,

            name: this.name()
                .trim(),

            is_active: this.isActive()
                ? 1
                : 0,
        };

        if (!payload.name) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please enter header name',
            });

            return;
        }

        this.saving.set(true);

        const obs = this.ref.data?.id
            ? this.service.updateHeader(
                this.ref.data.id,
                payload,
            )
            : this.service.createHeader(
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