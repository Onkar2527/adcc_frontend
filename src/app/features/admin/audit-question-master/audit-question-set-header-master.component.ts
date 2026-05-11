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

import { AuditQuestionSetFormComponent } from './audit-question-set-form.component';
import { AuditQuestionSetHeaderFormComponent } from './audit-question-set-header-form.component';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-question-set-header-master',
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
          icon="pi pi-arrow-left"
          class="p-button-text mr-2"
          (click)="goBack()">
        </button>

        <h5 class="m-0 text-xl font-semibold">
          Question Header Master - {{ setName() }}
        </h5>

      </div>

      <app-table
        [columns]="columns"
        [data]="headers()"
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
export class AuditQuestionSetHeaderMasterComponent implements OnInit {
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

    setName = signal('');

    headers = signal<any[]>([]);

    loading = signal(false);

    globalFilterFields = [
        'name',
        'set_name',
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
            field: 'name',
            header: 'Header Name',
            width: '400px',
        },

        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '120px',
            align: 'center',
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
        this.setId = Number(
            this.route.snapshot.paramMap.get(
                'setId',
            ),
        );

        this.loadSet();

        this.load();
    }

    loadSet() {
        this.service
            .findOneSet(this.setId)
            .subscribe({
                next: (res: any) => {
                    this.setName.set(
                        res?.name ?? '',
                    );
                },
            });
    }

    load() {
        this.loading.set(true);

        this.service
            .findHeadersBySet(this.setId)
            .subscribe({
                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res?.rows)
                                ? res.rows
                                : [];

                    this.headers.set(rows);

                    this.loading.set(false);
                },

                error: () => {
                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            'Unable to load question headers',
                    });
                },
            });
    }

    async openForm(row?: any) {
        const res = await this.drawer.open(
            AuditQuestionSetHeaderFormComponent,
            {
                header: row
                    ? 'Update Question Header'
                    : 'Create New Question Header',

                data: {
                    ...row,
                    question_set_id:
                        this.setId,
                },

                width: 'min(650px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Question header ${row ? 'updated' : 'created'
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

        if (event.name === 'questions') {
            this.openQuestions(
                event.row,
            );
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(
                event.row,
            );
            return;
        }

        if (event.name === 'delete') {
            this.deleteHeader(
                event.row,
            );
            return;
        }
    }

    goBack() {
        this.router.navigate([
            '/admin/question-set-master',
        ]);
    }

    private openQuestions(row: any) {
        this.router.navigate([
            '/admin/question-master',
            this.setId,
            row.id,
        ]);
    }

    private toggleStatus(row: any) {
        this.service
            .toggleHeaderStatus(
                row.id,
            )
            .subscribe({
                next: () => {
                    this.load();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: `Question header ${Number(row.is_active) === 1
                            ? 'deactivated'
                            : 'activated'
                            } successfully`,
                    });
                },
            });
    }

    private deleteHeader(row: any) {
        this.confirmationService.confirm({
            message:
                'Are you sure you want to delete this question header?',

            header: 'Confirm Delete',

            icon: 'pi pi-exclamation-triangle',

            acceptLabel: 'Yes',

            rejectLabel: 'No',

            accept: () => {
                this.confirmationService.close();

                this.service
                    .removeHeader(row.id)
                    .subscribe({
                        next: () => {
                            this.load();

                            this.messageService.add({
                                severity: 'success',
                                summary: 'Deleted',
                                detail:
                                    'Question header deleted successfully',
                            });
                        },
                    });
            },
        });
    }
}