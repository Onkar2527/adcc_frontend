import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { RiskMatrixService, RiskCategoryMasterService } from '../../services/masters.service';

@Component({
    selector: 'app-risk-matrix',

    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
    ],

    template: `
    <div class="card">

      <div
        class="flex align-items-center justify-content-between mb-4"
      >

        <h5 class="m-0 text-xl font-semibold">
          Risk Matrix
        </h5>

      </div>

      <app-table
        [columns]="columns"

        [data]="years()"

        [loading]="loading()"

        [globalFilterFields]="
          globalFilterFields
        "

        [actionDisplayMode]="'buttons'"

        [showAddButton]="false"

        (onActionClick)="
          onAction($any($event))
        "

        (onRefresh)="loadYears()"
      ></app-table>

    </div>
  `,
})
export class RiskMatrixComponent
    implements OnInit {

    private service =
        inject(RiskMatrixService);

    private riskCategoryService =
        inject(RiskCategoryMasterService);

    private router = inject(Router);

    loading = signal(false);

    years = signal<any[]>([]);

    globalFilterFields = [
        'year',
    ];

    columns: TableColumn[] = [

        {
            field: 'year',
            header: 'Financial Year',
            width: '300px',
        },

        {
            field: '_matrix',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-external-link',
            actionName: 'matrix',
            width: '80px',
            align: 'center',
            tooltip: 'Risk Matrix',
        },
    ];

    ngOnInit() {
        this.loadYears();
    }

    loadYears() {

        this.loading.set(true);

        this.riskCategoryService.getYears()
            .subscribe({

                next: (res: any) => {

                    this.years.set(
                        Array.isArray(res)
                            ? res
                            : [],
                    );

                    this.loading.set(false);
                },

                error: () => {

                    this.loading.set(false);
                },
            });
    }

    onAction(event: any) {

        if (event.name === 'matrix') {

            this.router.navigate([
                '/admin/risk-matrix',
                event.row.id,
            ]);
        }
    }
}