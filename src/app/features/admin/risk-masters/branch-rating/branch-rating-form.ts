import {
    Component,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { forkJoin } from 'rxjs';

import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';

import { TextFieldComponent } from '../../../../shared/components/form/text-field/text-field.component';

import { SelectFieldComponent } from '../../../../shared/components/form/select-field/select-field.component';

import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';

import {
    CreateBranchRatingDto,
    BranchRatingService, AuditUnitService,
    UnitsService
} from '../../services/masters.service';

@Component({
    selector:
        'app-branch-rating-form',

    standalone: true,

    imports: [
        CommonModule,
        TextFieldComponent,
        SelectFieldComponent,
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
          class="grid"
        >

          <div class="col-12 md:col-6">

            <app-select-field
              label="Audit Unit"

              [field]="auditUnitId"

              [options]="auditUnits()"

              optionLabel="name"

              optionValue="id"

              [required]="true"
            ></app-select-field>

          </div>

          <div class="col-12 md:col-6">

            <app-select-field
              label="Audit Type"

              [field]="auditTypeId"

              [options]="auditTypes"

              optionLabel="label"

              optionValue="value"

              [required]="true"

              [virtualScroll]="false"
            ></app-select-field>

          </div>

        </div>

        <!-- HIGH -->

        <div class="mt-4">

          <div
            class="font-semibold text-red-500 mb-3"
          >
            HIGH RISK
          </div>

          <div class="grid">

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range From"

                [field]="highRangeFrom"

                [required]="true"
              ></app-text-field>

            </div>

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range To"

                [field]="highRangeTo"

                [required]="true"
              ></app-text-field>

            </div>

          </div>

        </div>

        <!-- MEDIUM -->

        <div class="mt-4">

          <div
            class="font-semibold text-orange-500 mb-3"
          >
            MEDIUM RISK
          </div>

          <div class="grid">

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range From"

                [field]="mediumRangeFrom"

                [required]="true"
              ></app-text-field>

            </div>

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range To"

                [field]="mediumRangeTo"

                [required]="true"
              ></app-text-field>

            </div>

          </div>

        </div>

        <!-- LOW -->

        <div class="mt-4">

          <div
            class="font-semibold text-green-500 mb-3"
          >
            LOW RISK
          </div>

          <div class="grid">

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range From"

                [field]="lowRangeFrom"

                [required]="true"
              ></app-text-field>

            </div>

            <div class="col-12 md:col-6">

              <app-text-field
                label="Range To"

                [field]="lowRangeTo"

                [required]="true"
              ></app-text-field>

            </div>

          </div>

        </div>

        <!-- ACTIONS -->

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
export class BranchRatingFormComponent {

    private service =
        inject(BranchRatingService);

    private ref =
        inject(FormDrawerRef);

    private messageService =
        inject(MessageService);

    private unitService =
        inject(AuditUnitService)

    saving = signal(false);

    auditUnits = signal<any[]>([]);

    auditUnitId =
        signal<number | null>(null);

    auditTypeId =
        signal<number | null>(null);

    highRangeFrom = signal('');

    highRangeTo = signal('');

    mediumRangeFrom = signal('');

    mediumRangeTo = signal('');

    lowRangeFrom = signal('');

    lowRangeTo = signal('');

    yearId = 0;

    row: any = null;

    auditTypes = [

        {
            label: 'RBI Audit',
            value: 1,
        },

        {
            label:
                'Concurrent Audit',
            value: 2,
        },
    ];

    constructor() {

        this.row =
            this.ref.data?.row;

        this.yearId =
            Number(
                this.ref.data?.yearId,
            );

        this.loadAuditUnits();

        if (this.row) {

            this.loadEdit();
        }
    }

    loadAuditUnits() {

        this.unitService
            .findAll()
            .subscribe({

                next: (res: any) => {

                    this.auditUnits.set(

                        Array.isArray(res)

                            ? res.map((x: any) => ({

                                ...x,

                                id: Number(x.id),
                            }))

                            : [],
                    );
                },
            });
    }

    loadEdit() {

        this.service
            .findOneBranchRating(
                this.row.id,
            )
            .subscribe({

                next: (res) => {

                    this.auditUnitId.set(
                        Number(
                            res.audit_unit_id,
                        ),
                    );

                    this.auditTypeId.set(
                        Number(
                            res.audit_type_id,
                        ),
                    );

                    this.highRangeFrom.set(
                        res.high_range_from ?? '',
                    );

                    this.highRangeTo.set(
                        res.high_range_to ?? '',
                    );

                    this.mediumRangeFrom.set(
                        res.medium_range_from ?? '',
                    );

                    this.mediumRangeTo.set(
                        res.medium_range_to ?? '',
                    );

                    this.lowRangeFrom.set(
                        res.low_range_from ?? '',
                    );

                    this.lowRangeTo.set(
                        res.low_range_to ?? '',
                    );
                },
            });
    }

    validate() {

        if (
            !this.auditUnitId()

            || !this.auditTypeId()

            || !this.highRangeFrom()
            || !this.highRangeTo()

            || !this.mediumRangeFrom()
            || !this.mediumRangeTo()

            || !this.lowRangeFrom()
            || !this.lowRangeTo()
        ) {

            this.messageService.add({
                severity: 'warn',

                summary: 'Validation',

                detail:
                    'Please fill all required fields',
            });

            return false;
        }

        return true;
    }

    save() {

        if (!this.validate()) {
            return;
        }

        this.saving.set(true);

        const payload:
            CreateBranchRatingDto =
        {

            year_id:
                Number(
                    this.yearId,
                ),

            audit_unit_id:
                Number(
                    this.auditUnitId(),
                ),

            audit_type_id:
                Number(
                    this.auditTypeId(),
                ),

            high_range_from:
                this.highRangeFrom(),

            high_range_to:
                this.highRangeTo(),

            medium_range_from:
                this.mediumRangeFrom(),

            medium_range_to:
                this.mediumRangeTo(),

            low_range_from:
                this.lowRangeFrom(),

            low_range_to:
                this.lowRangeTo(),
        };

        const obs = this.row
            ? this.service.updateBranchRating(
                this.row.id,
                payload,
            )
            : this.service.createBranchRating(
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