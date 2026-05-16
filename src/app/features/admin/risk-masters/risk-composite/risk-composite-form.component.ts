import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';

import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import {
    CreateRiskCompositeDto,
    RiskCompositeMasterService,
} from '../../services/masters.service';

@Component({
    selector:
        'app-risk-composite-form',

    standalone: true,

    imports: [
        CommonModule,
        SelectFieldComponent,
        TextFieldComponent,
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

          <app-select-field
            label="Business Risk"

            [field]="businessRisk"

            [options]="riskOptions"

            optionLabel="label"

            optionValue="value"

            [required]="true"
          ></app-select-field>

          <app-select-field
            label="Control Risk"

            [field]="controlRisk"

            [options]="riskOptions"

            optionLabel="label"

            optionValue="value"

            [required]="true"
          ></app-select-field>

          <app-text-field
            label="Composite Risk"

            [field]="name"

            placeholder="Enter composite risk"

            [required]="true"
          ></app-text-field>

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
export class RiskCompositeFormComponent {

    private service =
        inject(RiskCompositeMasterService);

    private ref =
        inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    saving = signal(false);

    businessRisk =
        signal<number | null>(null);

    controlRisk =
        signal<number | null>(null);

    name = signal('');

    riskOptions = [

        {
            label: 'HIGH',
            value: 1,
        },

        {
            label: 'MEDIUM',
            value: 2,
        },

        {
            label: 'LOW',
            value: 3,
        },
    ];

    constructor() {

        const data = this.ref.data;

        if (data) {

            this.businessRisk.set(
                Number(
                    data.business_risk,
                ),
            );

            this.controlRisk.set(
                Number(
                    data.control_risk,
                ),
            );

            this.name.set(
                data.name ?? '',
            );
        }
    }

    save() {

        const business_risk =
            this.businessRisk();

        const control_risk =
            this.controlRisk();

        const name =
            this.name().trim();

        if (

            business_risk === null

            || control_risk === null

            || !name
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

        const payload:
            CreateRiskCompositeDto =
        {

            business_risk:
                Number(
                    business_risk,
                ),

            control_risk:
                Number(
                    control_risk,
                ),

            name,
        };

        const obs = this.ref.data
            ? this.service.updateRiskComposite(
                this.ref.data.id,
                payload,
            )
            : this.service.createRiskComposite(
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