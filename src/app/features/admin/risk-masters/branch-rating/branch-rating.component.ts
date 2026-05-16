import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { BranchRatingService, RiskCategoryMasterService } from '../../services/masters.service';

@Component({
  selector: 'app-branch-rating',

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
          Branch Rating Master
        </h5>

      </div>

      <app-table
        [columns]="columns"

        [data]="years()"

        [loading]="loading()"

        [globalFilterFields]="
          globalFilterFields
        "

        [showAddButton]="false"

        [actionDisplayMode]="'buttons'"

        (onActionClick)="
          onAction($any($event))
        "

        (onRefresh)="load()"
      ></app-table>

    </div>
  `,
})
export class BranchRatingComponent
  implements OnInit {

  private service =
    inject(BranchRatingService);

  private router = inject(Router);

  private riskcategoryService =
    inject(RiskCategoryMasterService)

  loading = signal(false);

  years = signal<any[]>([]);

  globalFilterFields = [
    'year',
  ];

  columns: TableColumn[] = [

    {
      field: 'year',
      header: 'Financial Year',
      width: '250px',
    },

    {
      field: '_manage',
      header: '',
      type: 'action',
      actionIcon:
        'pi pi-external-link',
      actionName: 'manage',
      width: '70px',
      align: 'center',
      tooltip:
        'Manage Branch Ratings',
    },
  ];

  ngOnInit() {
    this.load();
  }

  load() {

    this.loading.set(true);

    this.riskcategoryService.getYears()
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

    if (event.name === 'manage') {

      this.router.navigate([
        '/admin/branch-rating',
        event.row.id,
      ]);
    }
  }
}