import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';

import { MessageService } from 'primeng/api';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { CheckboxFieldComponent } from '../../../../shared/components/form/checkbox-field/checkbox-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import {
    CreateRiskCategoryDto,
    RiskCategoryMasterService,
} from '../../../admin/services/masters.service';

@Component({
    selector: 'app-risk-category-form',

    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div class="max-h-[90vh] p-4 overflow-y-auto">

      <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

        <div class="flex flex-column gap-3">

          <div>

            <app-text-field
              label="Risk Category"
              [field]="riskCategory"
              placeholder="Enter risk category"
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
export class RiskCategoryFormComponent {

    private service = inject(
        RiskCategoryMasterService,
    );

    private ref = inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    saving = signal(false);

    riskCategory = signal('');

    isActive = signal(true);

    constructor() {

        const data = this.ref.data;

        if (data) {

            this.riskCategory.set(
                data.risk_category ?? '',
            );

            this.isActive.set(
                Number(data.is_active) === 1,
            );
        }
    }

    save() {

        const risk_category =
            this.riskCategory().trim();

        if (!risk_category) {

            this.messageService.add({
                severity: 'warn',

                summary: 'Validation',

                detail:
                    'Risk category is required',
            });

            return;
        }

        this.saving.set(true);

        const payload:
            CreateRiskCategoryDto = {

            risk_category,

            is_active:
                this.isActive()
                    ? 1
                    : 0,
        };

        const obs = this.ref.data
            ? this.service.update(
                this.ref.data.id,
                payload,
            )
            : this.service.create(
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