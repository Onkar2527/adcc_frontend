import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { TableColumn } from '../../../shared/components/table/table.component';
import { TableComponent } from '../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import { AuditQuestionMasterService } from '../services/masters.service';

import { ButtonModule } from 'primeng/button';
import { AuditQuestionFormComponent } from './audit-question-form.component';

@Component({
    selector: 'app-question-master',
    standalone: true,
    imports: [
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule, ButtonModule
    ],
    template: `
    <div class="card">

      <div class="flex align-items-center mb-4">

        <button
          pButton
          type="button"
          class="p-button-text p-button-sm mr-2"
          (click)="goBack()">

          <i class="pi pi-arrow-left mr-2"></i>

          Back

        </button>

        <h5 class="m-0 text-xl font-semibold">
          Question Master - {{ headerName() }}
        </h5>

      </div>

      <app-table
        [columns]="columns"
        [data]="questions()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="load()"
      ></app-table>

    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
})
export class AuditQuestionMasterComponent implements OnInit {
    private route = inject(
        ActivatedRoute,
    );

    private router = inject(Router);

    private drawer = inject(
        FormDrawerService,
    );

    private service = inject(
        AuditQuestionMasterService,
    );

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    setId = 0;

    headerId = 0;

    headerName = signal('');

    questions = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'question',
        'question_type_name',
        'option_name',
        'risk_category_name',
    ];

    columns: TableColumn[] = [
        {
            field: '_edit',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-pencil',
            actionName: 'edit',
            width: '60px',
            align: 'center',
            tooltip: 'Edit',
        },

        {
            field: 'question',
            header: 'Question',
            width: '500px',
        },

        {
            field: 'question_type_name',
            header: 'Type',
            width: '160px',
        },

        {
            field: 'option_name',
            header: 'Input Method',
            width: '220px',
        },

        {
            field: 'risk_category_name',
            header: 'Risk',
            width: '160px',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
        },

        {
            field: '_risk',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-shield',
            actionName: 'risk-mapping',
            width: '60px',
            align: 'center',
            tooltip: 'Risk Mapping',
        },

        {
            field: '_status',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-sync',
            actionName: 'toggle-status',
            width: '60px',
            align: 'center',
            tooltip: 'Toggle Status',
        },

        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '60px',
            align: 'center',
            tooltip: 'Delete',
            cssClass: 'text-danger',
        },
    ];

    ngOnInit() {
        this.setId = Number(
            this.route.snapshot.paramMap.get(
                'setId',
            ),
        );

        this.headerId = Number(
            this.route.snapshot.paramMap.get(
                'headerId',
            ),
        );

        this.loadHeader();

        this.load();
    }

    loadHeader() {
        this.service
            .findOneHeader(this.headerId)
            .subscribe({
                next: (res: any) => {
                    this.headerName.set(
                        res?.name ?? '',
                    );
                },
            });
    }

    load() {
        this.loading.set(true);

        this.service
            .findQuestionsByHeader(
                this.headerId,
            )
            .subscribe({
                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res?.rows)
                                ? res.rows
                                : [];

                    this.questions.set(rows);

                    this.loading.set(false);
                },

                error: () => {
                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            'Unable to load questions',
                    });
                },
            });
    }

    async openForm(row?: any) {
        const res = await this.drawer.open(
            AuditQuestionFormComponent,
            {
                header: row
                    ? 'Update Question'
                    : 'Create New Question',

                data: {
                    ...row,
                    set_id: this.setId,
                    header_id: this.headerId,
                },

                width: 'min(850px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Question ${row ? 'updated' : 'created'
                    } successfully`,
            });
        }
    }

    onAction(event: {
        name: string;
        row: any;
    }) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (
            event.name === 'risk-mapping'
        ) {
            this.openRiskMapping(
                event.row,
            );
            return;
        }

        if (
            event.name === 'toggle-status'
        ) {
            this.toggleStatus(
                event.row,
            );
            return;
        }

        if (event.name === 'delete') {
            this.deleteQuestion(
                event.row,
            );
            return;
        }
    }

    goBack() {
        this.router.navigate([
            '/admin/question-header-master',
            this.setId,
        ]);
    }

    private openRiskMapping(
        row: any,
    ) {
        this.messageService.add({
            severity: 'info',
            summary: 'Coming Soon',
            detail:
                'Risk Mapping module will be implemented next',
        });
    }

    private toggleStatus(row: any) {
        this.service
            .toggleQuestionStatus(
                row.id,
            )
            .subscribe({
                next: () => {
                    this.load();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Question ${Number(row.is_active) === 1
                                ? 'deactivated'
                                : 'activated'
                            } successfully`,
                    });
                },
            });
    }

    private deleteQuestion(
        row: any,
    ) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this question?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.confirmationService.close();

                this.service
                    .removeQuestion(row.id)
                    .subscribe({
                        next: () => {
                            this.load();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Deleted',
                                detail:
                                    'Question deleted successfully',
                            });
                        },
                    });
            },
        });
    }
}