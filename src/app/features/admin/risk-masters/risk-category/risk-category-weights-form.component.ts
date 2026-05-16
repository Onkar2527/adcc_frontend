import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    DynamicDialogConfig,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';
import { MessageService } from 'primeng/api';

import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';

import { NumberFieldComponent } from '../../../../shared/components/form/number-field/number-field.component';

import { CheckboxFieldComponent } from '../../../../shared/components/form/checkbox-field/checkbox-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import {
    CreateRiskCategoryWeightDto,
    RiskCategoryMasterService,
} from '../../services/masters.service';

@Component({
    selector:
        'app-risk-category-weight-form',

    standalone: true,

    imports: [
        CommonModule,
        SelectFieldComponent,
        NumberFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div class="max-h-[90vh] overflow-y-auto p-4">

      <div
        class="border-1 border-gray-300 border-round-lg bg-white shadow-1 p-4"
      >

        <div
          class="flex flex-column gap-3"
        >

          <app-select-field
            label="Financial Year"

            [field]="yearId"

            [options]="years()"

            optionLabel="label"

            optionValue="value"

            [required]="true"
          ></app-select-field>

          <app-number-field
            label="Risk Weight"

            [field]="riskWeight"

            [required]="true"

            [min]="0"
          ></app-number-field>

          <app-number-field
            label="Risk Appetite %"

            [field]="
              riskAppetitePercent
            "

            [required]="true"

            [min]="0"

            [minFractionDigits]="2"

            [maxFractionDigits]="2"
          ></app-number-field>

          <app-checkbox-field
            label="Is Active"

            [field]="isActive"
          ></app-checkbox-field>

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
export class RiskCategoryWeightFormComponent {

    private service = inject(
        RiskCategoryMasterService,
    );

    private ref = inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    saving = signal(false);

    years = signal<any[]>([]);

    yearId = signal<number | null>(
        null,
    );

    riskWeight = signal<
        number | null
    >(null);

    riskAppetitePercent =
        signal<number | null>(null);

    isActive = signal(true);

    row: any = null;

    riskCategoryId = 0;

    constructor() {

        this.row =
            this.ref.data?.row;

        this.riskCategoryId =
            this.ref.data
                ?.riskCategoryId;

        this.loadYears();

        if (this.row) {

            this.riskWeight.set(
                Number(
                    this.row.risk_weight,
                ),
            );

            this.riskAppetitePercent.set(
                Number(
                    this.row
                        .risk_appetite_percent,
                ),
            );

            this.isActive.set(
                Number(this.row.is_active)
                === 1,
            );
        }
    }

    loadYears() {

        this.service.getYears()
            .subscribe({

                next: (res: any) => {

                    const rows =
                        Array.isArray(res)
                            ? res
                            : [];

                    this.years.set(
                        rows.map((item: any) => ({
                            label: item.year,
                            value: Number(item.id),
                        })),
                    );

                    // PATCH AFTER OPTIONS LOAD

                    if (this.row) {

                        this.yearId.set(
                            Number(
                                this.row.year_id,
                            ),
                        );
                    }
                },
            });
    }

    save() {

        if (
            !this.yearId()
            || this.riskWeight() ===
            null
            || this
                .riskAppetitePercent()
            === null
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
            CreateRiskCategoryWeightDto =
        {

            risk_category_id:
                Number(
                    this.riskCategoryId,
                ),

            year_id: Number(
                this.yearId(),
            ),

            risk_weight: Number(
                this.riskWeight(),
            ),

            risk_appetite_percent:
                Number(
                    this
                        .riskAppetitePercent(),
                ),

            is_active:
                this.isActive()
                    ? 1
                    : 0,
        };

        const obs = this.row
            ? this.service.updateWeight(
                this.row.id,
                payload,
            )
            : this.service.createWeight(
                payload,
            );

        obs.subscribe({

            next: () => {

                this.saving.set(false);

                this.ref.close({
                    saved: true,
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
