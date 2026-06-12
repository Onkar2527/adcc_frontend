import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TableColumn, TableComponent } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { PolicyDocumentsService } from '../services/masters.service';
import { PolicyDocumentFormComponent } from './policy-document-form.component';

@Component({
    selector: 'app-policy-documents',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
    ],
    providers: [ConfirmationService, MessageService],
    template: `
  <div class="card">
    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        Policy Documents Master
      </h5>
    </div>

    <app-table
      [columns]="columns"
      [data]="documents()"
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
export class PolicyDocumentsComponent implements OnInit {
    private service = inject(PolicyDocumentsService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    documents = signal<any[]>([]);
    loading = signal(false);

    globalFilterFields = [
        'document_code',
        'document_title',
        'department',
        'description',
        'version_no',
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
            tooltip: 'Edit Policy',
        },
        {
            field: '_download',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-download',
            actionName: 'download',
            width: '50px',
            align: 'center',
            tooltip: 'View/Download File',
        },
        {
            field: 'document_code',
            header: 'Code',
            width: '130px',
            sortable: true,
        },
        {
            field: 'document_title',
            header: 'Title',
            width: '200px',
            sortable: true,
        },
        {
            field: 'version_no',
            header: 'Version',
            width: '90px',
        },
        {
            field: 'department',
            header: 'Department',
            width: '135px',
            sortable: true,
        },
        {
            field: 'description',
            header: 'Description',
            width: '200px',
        },
        {
            field: 'issue_date',
            header: 'Issue Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'effective_date',
            header: 'Effective Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'expiry_date',
            header: 'Expiry Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'uploaded_by_name',
            header: 'Uploaded By',
            width: '130px',
        },
        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '100px',
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
        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '50px',
            align: 'center',
            tooltip: 'Delete Policy',
            cssClass: 'text-danger',
        },
    ];

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.findAll()
            .subscribe({
                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : [];
                    this.documents.set(rows);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Unable to load policy documents',
                    });
                },
            });
    }

    async openForm(row?: any) {
        let formData = {};
        if (row?.id) {
            formData = { ...row };
        }

        const res = await this.drawer.open(
            PolicyDocumentFormComponent,
            {
                header: row ? 'Update Policy Document' : 'Create Policy Document',
                data: formData,
                width: 'min(700px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Policy document ${row ? 'updated' : 'created'} successfully`,
            });
        }
    }

    onAction(event: { name: string; row: any }) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'download') {
            if (event.row.uploaded_file_path) {
                const url = this.service.getViewUrl(event.row.id);
                window.open(url, '_blank');
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Not Available',
                    detail: 'No file uploaded for this policy document',
                });
            }
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.confirmDelete(event.row);
            return;
        }
    }

    toggleStatus(row: any) {
        this.service
            .toggleStatus(row.id)
            .subscribe({
                next: () => {
                    this.load();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Status updated successfully',
                    });
                },
            });
    }

    confirmDelete(row: any) {
        this.confirmationService
            .confirm({
                message: 'Are you sure you want to delete this policy document?',
                header: 'Delete Confirmation',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.confirmationService.close();
                    this.service
                        .remove(row.id)
                        .subscribe({
                            next: () => {
                                this.load();
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: 'Policy document deleted successfully',
                                });
                            },
                        });
                },
            });
    }
}
