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
    CreateQuestionSetDto,
    AuditQuestionMasterService,
} from '../services/masters.service';

@Component({
    selector: 'app-question-set-form',
    standalone: true,

    imports: [
        CommonModule,

        TextFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div class="flex flex-column gap-3">

      <app-text-field
        label="Set Name"
        [field]="name"
        placeholder="Enter set name"
        [required]="true"
      ></app-text-field>

      <app-select-field
        label="Set Type"
        [field]="setTypeId"
        [options]="setTypes"
        optionLabel="label"
        optionValue="value"
        [required]="true"
        scrollHeight="90px"
      ></app-select-field>

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
export class AuditQuestionSetFormComponent {
    private ref = inject(FormDrawerRef);

    private service = inject(
        AuditQuestionMasterService,
    );

    private messageService =
        inject(MessageService);

    name = signal('');

    setTypeId = signal<number | null>(
        null,
    );

    isActive = signal(true);

    saving = signal(false);

    setTypes = [
        {
            label: 'Main Set',
            value: 1,
        },

        {
            label: 'Sub Set',
            value: 2,
        },
    ];

    constructor() {
        const data = this.ref.data;

        if (data) {
            this.name.set(data.name ?? '');

            this.setTypeId.set(
                Number(data.set_type_id) || null,
            );

            this.isActive.set(
                Number(data.is_active) !== 0,
            );
        }
    }

    save() {
        const payload: CreateQuestionSetDto =
        {
            name: this.name().trim(),

            set_type_id: Number(
                this.setTypeId(),
            ),

            is_active: this.isActive()
                ? 1
                : 0,
        };

        if (
            !payload.name ||
            !payload.set_type_id
        ) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please fill required fields',
            });

            return;
        }

        this.saving.set(true);

        const obs = this.ref.data?.id
            ? this.service.updateSet(
                this.ref.data.id,
                payload,
            )
            : this.service.createSet(
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