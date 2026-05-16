import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { CheckboxFieldComponent } from '../../../../shared/components/form/checkbox-field/checkbox-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import {
    CreateRiskControlKeyAspectDto,
    RiskControlMasterService,
} from '../../services/masters.service';

@Component({
    selector:
        'app-risk-control-key-aspect-form',

    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div
      class="max-h-[90vh] p-4 overflow-y-auto"
    >

      <div
        class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4"
      >

        <div
          class="flex flex-column gap-3"
        >

          <div>

            <app-text-field
              label="Key Aspect"

              [field]="name"

              placeholder="Enter key aspect"

              [required]="true"
            ></app-text-field>

          </div>

          <div class="pt-2">

            <app-checkbox-field
              label="Is Active"

              [field]="isActive"
            ></app-checkbox-field>

          </div>

        </div>

        <div
          class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200"
        >

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
export class RiskControlKeyAspectFormComponent {

    private service =
        inject(RiskControlMasterService);

    private ref =
        inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    saving = signal(false);

    name = signal('');

    isActive = signal(true);

    riskControlId = 0;

    row: any = null;

    constructor() {

        this.row =
            this.ref.data?.row;

        this.riskControlId =
            Number(
                this.ref.data
                    ?.riskControlId,
            );

        if (this.row) {

            this.name.set(
                this.row.name ?? '',
            );

            this.isActive.set(
                Number(this.row.is_active)
                === 1,
            );
        }
    }

    save() {

        const name =
            this.name().trim();

        if (!name) {

            this.messageService.add({
                severity: 'warn',

                summary: 'Validation',

                detail:
                    'Key aspect is required',
            });

            return;
        }

        this.saving.set(true);

        const payload:
            CreateRiskControlKeyAspectDto =
        {

            risk_control_id:
                Number(
                    this.riskControlId,
                ),

            name,

            is_active:
                this.isActive()
                    ? 1
                    : 0,
        };

        const obs = this.row
            ? this.service.updateKeyAspect(
                this.row.id,
                payload,
            )
            : this.service.createKeyAspect(
                payload,
            );

        obs.subscribe({

            next: (res) => {

                this.saving.set(false);

                this.ref.close({
                    saved: true,
                    data: res,
                });
            },

            error: (err) => {

                this.saving.set(false);

                this.messageService.add({

                    severity: 'error',

                    summary: 'Error',

                    detail:
                        err?.error?.message
                        || 'Something went wrong',
                });
            }
        });
    }

    cancel() {
        this.ref.close();
    }
}