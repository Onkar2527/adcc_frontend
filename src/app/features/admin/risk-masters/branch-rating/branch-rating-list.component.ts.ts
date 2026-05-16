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

import {
    ConfirmationService,
    MessageService,
} from 'primeng/api';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';

import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

import { BranchRatingService, RiskCategoryMasterService } from '../../services/masters.service';

import { BranchRatingFormComponent } from './branch-rating-form';
import { ButtonModule } from 'primeng/button';

@Component({
    selector:
        'app-branch-rating-list',

    standalone: true,

    imports: [
        CommonModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule, ButtonModule
    ],

    providers: [
        MessageService,
        ConfirmationService,
    ],

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
              Branch Rating Master
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

      <!-- TABLE -->

      <app-table
        [columns]="columns"

        [data]="rows()"

        [loading]="loading()"

        [globalFilterFields]="
          globalFilterFields
        "

        [actionDisplayMode]="'buttons'"

        (onAdd)="openForm()"

        (onActionClick)="
          onAction($any($event))
        "

        (onRefresh)="load()"
      ></app-table>

    </div>

    <p-toast></p-toast>

    <p-confirmDialog></p-confirmDialog>
  `,
})
export class BranchRatingListComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(BranchRatingService);

    private drawer =
        inject(FormDrawerService);

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    private riskcategoryService =
        inject(RiskCategoryMasterService)

    yearId = 0;

    loading = signal(false);

    rows = signal<any[]>([]);

    yearLabel = signal('');

    globalFilterFields = [
        'audit_unit_name',
        'audit_type_name',
    ];

    columns: TableColumn[] = [

        {
            field: '_edit',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-pencil',
            actionName: 'edit',
            width: '50px',
            align: 'center',
            tooltip: 'Edit',
        },

        {
            field: 'audit_unit_name',
            header: 'Audit Unit',
            width: '300px',
        },

        {
            field: 'year',
            header: 'Financial Year',
            width: '200px',
        },

        {
            field: 'audit_type_name',
            header: 'Audit Type',
            width: '220px',
        },

        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '50px',
            align: 'center',
            tooltip: 'Delete',
            cssClass: 'text-danger',
        },
    ];

    ngOnInit() {

        this.yearId = Number(
            this.route.snapshot.paramMap.get(
                'id',
            ),
        );

        this.loadYear();

        this.load();
    }

    loadYear() {

        this.riskcategoryService.getYears()
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

    load() {

        this.loading.set(true);

        this.service
            .findBranchRatingsByYear(
                this.yearId,
            )
            .subscribe({

                next: (res) => {

                    this.rows.set(
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

    async openForm(row?: any) {

        const res = await this.drawer.open(
            BranchRatingFormComponent,
            {
                header: row
                    ? 'Edit Branch Rating'
                    : 'Add Branch Rating',

                data: {

                    row,

                    yearId:
                        this.yearId,
                },

                width: 'min(900px, 100vw)',
            },
        );

        if (res?.saved) {

            this.load();

            this.messageService.add({
                severity: 'success',

                summary: 'Success',

                detail: `Branch rating ${row
                    ? 'updated'
                    : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: any) {

        if (event.name === 'edit') {

            this.openForm(event.row);

            return;
        }

        if (event.name === 'delete') {

            this.remove(event.row);

            return;
        }
    }

    remove(row: any) {

        this.confirmationService.confirm({

            message:
                'Are you sure you want to delete this branch rating?',

            header: 'Delete Confirmation',

            icon: 'pi pi-exclamation-triangle',

            accept: () => {

                this.service
                    .removeBranchRating(
                        row.id,
                    )
                    .subscribe({

                        next: () => {

                            this.messageService.add({
                                severity: 'success',

                                summary: 'Success',

                                detail:
                                    'Branch rating deleted successfully',
                            });

                            this.load();
                        },
                    });
            },
        });
    }

    goBack() {

        this.router.navigate([
            '/admin/branch-rating',
        ]);
    }
}