import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import {
    TableColumn,
    TableComponent,
} from '../../../shared/components/table/table.component';
import { AuditTypeService } from '../services/masters.service';
import { AuditTypeMasterFormComponent } from './audit-type-master-form.component';
import { AuditTypeQuestionnaireMappingComponent } from './audit-type-questionnaire-mapping.component';

@Component({
    selector: 'app-audit-type-master',
    standalone: true,
    imports: [CommonModule, TableComponent, ToastModule],
    providers: [MessageService],
    template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Audit Type Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="auditTypes()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadAuditTypes()"
      ></app-table>
    </div>

    <p-toast></p-toast>
  `,
})
export class AuditTypeMasterComponent implements OnInit {
    private auditTypeService = inject(AuditTypeService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);

    auditTypes = signal<any[]>([]);
    loading = signal(false);
    globalFilterFields = ['code', 'name', 'description'];

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
            field: '_questionnaires',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-list-check',
            actionName: 'questionnaires',
            width: '50px',
            align: 'center',
            tooltip: 'Questionnaire Mapping',
        },
        { field: 'code', header: 'Code', width: '180px' },
        { field: 'name', header: 'Audit Type', width: '240px' },
        {
            field: 'question_setup_count',
            header: 'Question Setups',
            width: '130px',
            align: 'center',
        },
        { field: 'description', header: 'Description', width: '360px' },
        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '110px',
            align: 'center',
        },
        {
            field: '_status',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-sync',
            actionName: 'toggle-status',
            width: '50px',
            align: 'center',
            tooltip: 'Toggle Status',
        },
    ];

    ngOnInit(): void {
        this.loadAuditTypes();
    }

    loadAuditTypes(): void {
        this.loading.set(true);
        this.auditTypeService.findAll().subscribe({
            next: (response) => {
                this.auditTypes.set(this.rowsFrom(response));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load audit types.',
                });
            },
        });
    }

    async openForm(auditType?: any): Promise<void> {
        const result = await this.drawer.open(AuditTypeMasterFormComponent, {
            header: auditType ? 'Edit Audit Type' : 'Create New Audit Type',
            data: auditType,
            width: '520px',
        });

        if (result?.saved) {
            this.loadAuditTypes();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Audit type ${auditType ? 'updated' : 'created'} successfully.`,
            });
        }
    }

    onAction(event: { name: string; row: any }): void {
        if (event.name === 'edit') {
            void this.openForm(event.row);
            return;
        }

        if (event.name === 'questionnaires') {
            void this.openQuestionnaireMapping(event.row);
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
        }
    }

    private async openQuestionnaireMapping(auditType: any): Promise<void> {
        const result = await this.drawer.open(
            AuditTypeQuestionnaireMappingComponent,
            {
                header: 'Questionnaire Mapping',
                data: auditType,
                width: '680px',
            },
        );

        if (result?.saved) {
            this.loadAuditTypes();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Questionnaire mappings saved successfully.',
            });
        }
    }

    private toggleStatus(auditType: any): void {
        this.auditTypeService.toggleStatus(auditType.id).subscribe({
            next: () => {
                this.loadAuditTypes();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Audit type ${Number(auditType.is_active) === 1 ? 'deactivated' : 'activated'
                        } successfully.`,
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        error?.error?.message || 'Unable to update audit type status.',
                });
            },
        });
    }

    private rowsFrom(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.rows)) return response.rows;
        return [];
    }
}
