import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { Router, RouterModule } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { TableColumn } from '../../../shared/components/table/table.component';
import { TableComponent } from '../../../shared/components/table/table.component';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import { AuditQuestionMasterService } from '../services/masters.service';

import { AuditQuestionSetFormComponent } from './audit-question-set-form.component';

@Component({
    selector: 'app-question-set-master',
    standalone: true,
    imports: [
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
    ],
    template: `
  <div class="card">

    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        Question Set Master
      </h5>
    </div>

    <app-table
      [columns]="columns"
      [data]="sets()"
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
export class AuditQuestionSetMasterComponent implements OnInit {
    private service = inject(
        AuditQuestionMasterService,
    );

    private drawer = inject(
        FormDrawerService,
    );

    private router = inject(Router);

    private messageService =
        inject(MessageService);

    private confirmationService =
        inject(ConfirmationService);

    sets = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'name',
        'set_type_name',
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
            field: 'set_type_name',
            header: 'Set Type',
            width: '180px',
        },

        {
            field: 'name',
            header: 'Set Name',
            width: '320px',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
        },

        {
            field: '_headers',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-list',
            actionName: 'headers',
            width: '60px',
            align: 'center',
            tooltip: 'Manage Headers',
        },

        {
            field: '_questions',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-book',
            actionName: 'questions',
            width: '60px',
            align: 'center',
            tooltip: 'Manage Questions',
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
        this.load();
    }

    load() {
        this.loading.set(true);

        this.service.findAllSets().subscribe({
            next: (res: any) => {
                const rows = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.rows)
                            ? res.rows
                            : [];

                this.sets.set(rows);

                this.loading.set(false);
            },

            error: () => {
                this.loading.set(false);

                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        'Unable to load question sets',
                });
            },
        });
    }

    async openForm(row?: any) {
        const res = await this.drawer.open(
            AuditQuestionSetFormComponent,
            {
                header: row
                    ? 'Update Question Set'
                    : 'Create New Question Set',

                data: row,

                width: 'min(650px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Question set ${row ? 'updated' : 'created'
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

        if (event.name === 'headers') {
            this.openHeaders(event.row);
            return;
        }

        if (event.name === 'questions') {
            this.openQuestions(event.row);
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.deleteSet(event.row);
            return;
        }
    }

    private openHeaders(row: any) {
        this.router.navigate([
            '/admin/question-header-master',
            row.id,
        ]);
    }

    private openQuestions(row: any) {
        this.router.navigate(
            [
                '/admin/question-master',
                row.id,
            ],
            {
                queryParams: {
                    from: 'set',
                },
            },
        );
    }

    private toggleStatus(row: any) {
        this.service
            .toggleSetStatus(row.id)
            .subscribe({
                next: () => {
                    this.load();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Question set ${Number(row.is_active) === 1
                            ? 'deactivated'
                            : 'activated'
                            } successfully`,
                    });
                },
            });
    }

    private deleteSet(row: any) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this question set?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.confirmationService.close();

                this.service
                    .removeSet(row.id)
                    .subscribe({
                        next: () => {
                            this.load();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Deleted',
                                detail:
                                    'Question set deleted successfully',
                            });
                        },
                    });
            },
        });
    }
}