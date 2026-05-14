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
    <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="flex flex-column gap-4">

      <!-- Form Fields -->
      <div class="grid">

        <!-- Set Name -->
        <div class="col-12 md:col-6">
          <app-text-field
            label="Set Name"
            [field]="name"
            placeholder="Enter set name"
            [required]="true"
          ></app-text-field>
        </div>

        <!-- Set Type -->
        <div class="col-12 md:col-6">
          <app-select-field
            label="Set Type"
            [field]="setTypeId"
            [options]="setTypes"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            scrollHeight="90px"
          ></app-select-field>
        </div>

      </div>

      <!-- Active -->
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