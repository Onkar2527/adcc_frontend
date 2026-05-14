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

import { ButtonModule } from 'primeng/button';

import { CardModule } from 'primeng/card';

import { ToastModule } from 'primeng/toast';

import { ConfirmDialogModule } from 'primeng/confirmdialog';

import {
    TableComponent,
    TableColumn,
} from '../../../shared/components/table/table.component';

import {
    AuditAnnexureMasterService,
} from '../services/masters.service';
import { FormDrawerService } from '../../../core/services/drawer';
import { AuditAnnexureColumnFormComponent } from './audit-annexure-columns-form.component';
import { MessageModule } from 'primeng/message';

@Component({
    selector:
        'app-audit-annexure-columns',

    standalone: true,

    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        ToastModule,
        ConfirmDialogModule,
        TableComponent, MessageModule
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
        <div class="flex align-items-center gap-3">

          <button
            pButton
            type="button"
            icon="pi pi-arrow-left"
            class="p-button-text"
            (click)="goBack()"
          ></button>

          <div>
            <h5 class="m-0 text-xl font-semibold">
              Annexure Columns
            </h5>

            <small class="text-500">
              Manage dynamic annexure columns
            </small>
          </div>

        </div>
      </div>

      <!-- ANNEXURE DETAILS -->

      <p-card class="mb-4">

        <div class="grid">

          <div class="col-12 md:col-4">
            <div class="text-sm text-500 mb-1">
              Annexure Name
            </div>

            <div class="font-semibold">
              {{
                annexure()?.name || '-'
              }}
            </div>
          </div>

          <div class="col-12 md:col-4">
            <div class="text-sm text-500 mb-1">
              Risk Category
            </div>

            <div class="font-semibold">
              {{
                annexure()?.risk_category_name || '-'
              }}
            </div>
          </div>

          <div class="col-12 md:col-4">
            <div class="text-sm text-500 mb-1">
              Risk Definition
            </div>

            <div class="font-semibold uppercase">
              {{
                annexure()?.risk_definition_name || '-'
              }}
            </div>
          </div>

        </div>

      </p-card>

      <!-- TABLE -->

      <p-message
    *ngIf="annexure()?.is_locked"
    severity="warn"
    class="mb-4"
    text="This annexure is mapped to questions. Columns cannot be modified."
    ></p-message>

      <app-table
        [columns]="columns"
        [data]="rows()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"

        (onAdd)="
        !annexure()?.is_locked
            ? openForm()
            : null
        "
        (onActionClick)="onAction($event)"
        (onRefresh)="loadColumns()"
      ></app-table>

    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
})
export class AuditAnnexureColumnsComponent
    implements OnInit {
    private drawer = inject(FormDrawerService);

    private confirmationService = inject(
        ConfirmationService,
    );
    private route = inject(
        ActivatedRoute,
    );

    private router = inject(Router);

    private annexureService = inject(
        AuditAnnexureMasterService,
    );

    private messageService = inject(
        MessageService,
    );

    annexureId = 0;

    annexure = signal<any>(null);

    rows = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'name',
        'column_type_name',
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
            field: 'name',
            header: 'Column Name',
            width: '320px',
        },

        {
            field: 'column_type_name',
            header: 'Column Type',
            width: '180px',
            cssClass: 'uppercase',
        },

        {
            field: 'options_preview',
            header: 'Options Preview',
            width: '500px',
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
        this.annexureId = Number(
            this.route.snapshot.paramMap.get('id'),
        );

        this.loadAnnexure();

        this.loadColumns();
    }

    loadAnnexure() {
        this.annexureService
            .findOne(this.annexureId)
            .subscribe({
                next: (res: any) => {
                    const row =
                        res?.data ??
                        res?.row ??
                        res;

                    this.annexure.set(row);
                },
            });
    }

    loadColumns() {
        this.loading.set(true);

        this.annexureService
            .getColumns(this.annexureId)
            .subscribe({
                next: (res: any) => {

                    const rows = Array.isArray(res)
                        ? res
                        : [];

                    const formatted = rows.map(
                        (item: any) => {

                            let preview = '-';

                            if (
                                Number(item.column_type_id) === 3 &&
                                item.options?.length
                            ) {
                                const labels =
                                    item.options.map(
                                        (x: any) =>
                                            x.option_label,
                                    );

                                preview =
                                    labels
                                        .slice(0, 2)
                                        .join(', ');

                                if (
                                    labels.length > 2
                                ) {
                                    preview += ` +${labels.length - 2
                                        } more`;
                                }
                            }

                            return {
                                ...item,
                                options_preview:
                                    preview,
                            };
                        },
                    );

                    this.rows.set(formatted);

                    this.loading.set(false);
                },

                error: () => {
                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            'Unable to load annexure columns',
                    });
                },
            });
    }

    goBack() {
        this.router.navigate([
            '/admin/audit-annexure-master',
        ]);
    }

    async openForm(row?: any) {

        const res =
            await this.drawer.open(
                AuditAnnexureColumnFormComponent,
                {
                    header: row
                        ? 'Edit Column'
                        : 'Create New Column',

                    width: 'min(900px, 100vw)',

                    data: {
                        annexureId:
                            this.annexureId,

                        row,
                    },
                },
            );

        if (res?.saved) {

            this.loadColumns();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Column ${row
                    ? 'updated'
                    : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: {
        name: string;
        row: any;

    }) {
        if (this.annexure()?.is_locked) {

            this.messageService.add({
                severity: 'warn',
                summary: 'Locked',
                detail:
                    'This annexure is mapped to questions',
            });

            return;
        }
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.delete(event.row);
            return;
        }
    }

    private delete(row: any) {

        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this annexure?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {

                this.annexureService
                    .deleteColumn(row.id)
                    .subscribe({
                        next: () => {

                            this.loadColumns();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail:
                                    'Annexure deleted successfully',
                            });
                        },

                        error: () => {

                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail:
                                    'Unable to delete annexure',
                            });
                        },
                    });
            },
        });
    }


}