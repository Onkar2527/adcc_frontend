import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import { FormsModule } from '@angular/forms';

import { MessageService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ButtonModule } from 'primeng/button';

import { CheckboxModule } from 'primeng/checkbox';

import { InputNumberModule } from 'primeng/inputnumber';

import { RiskMatrixService, RiskCategoryMasterService } from '../../services/masters.service';

@Component({
    selector:
        'app-risk-matrix-config',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        CheckboxModule,
        InputNumberModule,
    ],

    providers: [MessageService],

    template: `
    <div class="card">

      <!-- HEADER -->

      <div
        class="flex align-items-center justify-content-between mb-4"
      >

        <div
          class="flex align-items-center gap-3"
        >

          <button
            pButton
            type="button"
            icon="pi pi-arrow-left"
            class="p-button-text p-button-sm"
            (click)="goBack()"
          ></button>

          <div>

            <h5
              class="m-0 text-xl font-semibold"
            >
              Risk Matrix Configuration
            </h5>

            <div
              class="text-sm text-gray-500 mt-1"
            >
              {{
                yearLabel()
              }}
            </div>

          </div>

        </div>

      </div>

      <!-- MATRIX -->

      <div
        class="border-1 border-gray-300 border-round-lg overflow-hidden"
      >

        <table class="w-full">

          <thead>

            <tr
              class="bg-gray-100"
            >

              <th
                class="text-left p-3"
              >
                Risk Parameter
              </th>

              <th
                class="text-center p-3"
              >
                Business Risk
              </th>

              <th
                class="text-center p-3"
              >
                Business Risk Score
              </th>

              <th
                class="text-center p-3"
              >
                Control Risk
              </th>

              <th
                class="text-center p-3"
              >
                Control Risk Score
              </th>

              <th
                class="text-center p-3"
              >
                Residual Risk
              </th>

            </tr>

          </thead>

          <tbody>

            <tr
              *ngFor="
                let row of rows();
                let i = index
              "
              class="border-top-1 border-gray-200"
            >

              <td class="p-3">

                <div
                  class="font-semibold"
                >
                  {{
                    row.risk_parameter_name
                  }}
                </div>

              </td>

              <!-- BUSINESS RISK -->

              <td
                class="text-center p-3"
              >

                <p-checkbox
                  [(ngModel)]="
                    row.business_risk_app
                  "
                  [binary]="true"
                ></p-checkbox>

              </td>

              <!-- BUSINESS SCORE -->

              <td class="p-3">

                <p-inputNumber
                  [(ngModel)]="
                    row.business_risk_score
                  "
                  [min]="0"
                  class="w-full"
                ></p-inputNumber>

              </td>

              <!-- CONTROL RISK -->

              <td
                class="text-center p-3"
              >

                <p-checkbox
                  [(ngModel)]="
                    row.control_risk_app
                  "
                  [binary]="true"
                ></p-checkbox>

              </td>

              <!-- CONTROL SCORE -->

              <td class="p-3">

                <p-inputNumber
                  [(ngModel)]="
                    row.control_risk_score
                  "
                  [min]="0"
                  class="w-full"
                ></p-inputNumber>

              </td>

              <!-- RESIDUAL RISK -->

              <td
                class="text-center p-3"
              >

                <p-checkbox
                  [(ngModel)]="
                    row.residual_risk_app
                  "
                  [binary]="true"
                ></p-checkbox>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <!-- ACTIONS -->

      <div class="mt-4">

        <button
          pButton
          type="button"
          label="Update Risk Matrix"
          icon="pi pi-save"

          [loading]="saving()"

          (click)="save()"
        ></button>

      </div>

    </div>

    <!-- MATRIX RESULT PREVIEW -->

<div class="mt-5">

  <div
    class="text-lg font-semibold mb-3"
  >
    Risk Matrix Preview
  </div>

  <div
    class="border-1 border-gray-300 border-round-lg overflow-hidden"
  >

    <table class="w-full">

      <thead>

        <tr class="bg-gray-100">

          <th class="p-3">
            Risk Parameter
          </th>

          <th class="p-3 text-center">
            Business Risk Score
          </th>

          <th class="p-3 text-center">
            Control Risk Score
          </th>

          <th class="p-3 text-center">
            Total Score
          </th>

        </tr>

      </thead>

      <tbody>

        <tr
          *ngFor="
            let row of rows()
          "
          class="border-top-1 border-gray-200"
        >

          <!-- PARAMETER -->

          <td class="p-3">

            <div
              class="font-semibold"
            >
              {{
                row.risk_parameter_name
              }}
            </div>

          </td>

          <!-- BUSINESS SCORE -->

          <td
            class="p-3 text-center"
          >

            {{
              row.business_risk_score
            }}

          </td>

          <!-- CONTROL TABLE -->

          <td class="p-3">

            <table
              class="w-full border-collapse"
            >

              <tbody>

                <tr
                  *ngFor="
                    let ctrl of getControlRows(row)
                  "
                  class="border-1 border-gray-200"
                >

                  <td class="p-2">
                    {{
                      ctrl.label
                    }}
                  </td>

                  <td
                    class="p-2 text-center"
                  >
                    {{
                      ctrl.score
                    }}
                  </td>

                </tr>

              </tbody>

            </table>

          </td>

          <!-- TOTAL TABLE -->

          <td class="p-3">

            <table
              class="w-full border-collapse"
            >

              <tbody>

                <tr
                  *ngFor="
                    let ctrl of getControlRows(row)
                  "
                  class="border-1 border-gray-200"
                >

                  <td
                    class="p-2 text-center"
                  >
                    {{
                      ctrl.total
                    }}
                  </td>

                </tr>

              </tbody>

            </table>

          </td>

        </tr>

      </tbody>

    </table>

  </div>

</div>

    <p-toast></p-toast>
  `,
})
export class RiskMatrixConfigComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(RiskMatrixService);

    private riskCategoryService =
        inject(RiskCategoryMasterService);

    private messageService =
        inject(MessageService);

    yearId = 0;

    saving = signal(false);

    rows = signal<any[]>([]);

    yearLabel = signal('');

    ngOnInit() {

        this.yearId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        this.loadYear();

        this.loadMatrix();
    }

    loadYear() {

        this.riskCategoryService.getYears()
            .subscribe({

                next: (res: any) => {

                    const years =
                        Array.isArray(res)
                            ? res
                            : [];

                    const year =
                        years.find(
                            (x: any) =>
                                Number(x.id)
                                === this.yearId,
                        );

                    this.yearLabel.set(
                        year?.year ?? '-',
                    );
                },
            });
    }

    loadMatrix() {

        this.service
            .findRiskMatrixByYear(
                this.yearId,
            )
            .subscribe({

                next: (res) => {

                    this.rows.set(
                        Array.isArray(res)
                            ? res.map(
                                (row: any) => ({
                                    ...row,

                                    business_risk_app:
                                        Number(
                                            row.business_risk_app,
                                        ) === 1,

                                    control_risk_app:
                                        Number(
                                            row.control_risk_app,
                                        ) === 1,

                                    residual_risk_app:
                                        Number(
                                            row.residual_risk_app,
                                        ) === 1,
                                }),
                            )
                            : [],
                    );
                },
            });
    }

    getMatrixValue(
        businessIndex: number,

        controlIndex: number,
    ) {

        const rows = this.rows();

        const business =
            rows[businessIndex];

        const control =
            rows[controlIndex];

        if (!business || !control) {
            return 0;
        }

        return (
            Number(
                business.business_risk_score,
            )

            +

            Number(
                control.control_risk_score,
            )
        );
    }

    getControlRows(row: any) {

        const rows = this.rows();

        return rows
            .filter(
                (x: any) =>
                    Number(
                        x.control_risk_score,
                    ) > 0,
            )
            .map((x: any) => ({

                label:
                    x.risk_parameter_name
                        ?.replace(
                            ' RISK',
                            '',
                        ),

                score:
                    Number(
                        x.control_risk_score,
                    ),

                total:
                    Number(
                        row.business_risk_score,
                    )

                    +

                    Number(
                        x.control_risk_score,
                    ),
            }));
    }

    save() {

        this.saving.set(true);

        const payload = {

            rows: this.rows().map(
                (row: any) => ({

                    risk_parameter:
                        Number(
                            row.risk_parameter,
                        ),

                    business_risk_app:
                        row.business_risk_app
                            ? 1
                            : 0,

                    business_risk_score:
                        Number(
                            row.business_risk_score,
                        ),

                    control_risk_app:
                        row.control_risk_app
                            ? 1
                            : 0,

                    control_risk_score:
                        Number(
                            row.control_risk_score,
                        ),

                    residual_risk_app:
                        row.residual_risk_app
                            ? 1
                            : 0,
                }),
            ),
        };

        this.service
            .saveRiskMatrix(
                this.yearId,
                payload,
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.messageService.add({
                        severity: 'success',

                        summary: 'Success',

                        detail:
                            'Risk matrix updated successfully',
                    });

                    this.loadMatrix();
                },

                error: () => {

                    this.saving.set(false);
                },
            });
    }

    goBack() {

        this.router.navigate([
            '/admin/risk-matrix',
        ]);
    }
}