import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { AuditUnitService } from '../services/masters.service';
import { AuditUnitFormComponent } from './audit-unit-form.component';
import { Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MasterBulkUploadComponent } from '../shared/master-bulk-upload/master-bulk-upload.component';
import { MasterBulkUploadService } from '../services/master-bulk-upload.service';

@Component({
    selector: 'app-audit-unit-master',
    standalone: true,
    imports: [CommonModule, TableComponent, ToastModule, ConfirmDialogModule, ButtonModule],
    providers: [MessageService, ConfirmationService],
    template: `
  <div class="card">

    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        Unit Master
      </h5>
    </div>

    <app-table
      [columns]="columns"
      [data]="auditUnits()"
      [loading]="loading()"
      [globalFilterFields]="globalFilterFields"
      [actionDisplayMode]="'buttons'"
      (onAdd)="openForm()"
      (onActionClick)="onAction($event)"
      (onRefresh)="loadAuditUnits()"
    >
      <button
        toolbar-actions
        pButton
        type="button"
        icon="pi pi-upload"
        label="Bulk Upload"
        class="p-button-outlined"
        (click)="openBulkUpload()"
      ></button>
    </app-table>

  </div>

  <p-toast></p-toast>
  <p-confirmDialog></p-confirmDialog>
`
})
export class AuditUnitMasterComponent implements OnInit {
    private auditUnitService = inject(AuditUnitService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService)
    private bulkUploadService = inject(MasterBulkUploadService);

    auditUnits = signal<any[]>([]);
    loading = signal(false);

    globalFilterFields = [
        'audit_unit_code',
        'name',
        'section_name',
        'branch_head_name',
        'branch_subhead_name',
        'frequency_name',
    ];

    columns: TableColumn[] = [
        { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
        { field: '_target', header: '', type: 'action', actionName: 'target', actionIcon: 'pi pi-chart-bar', tooltip: 'Manage Targets' },
        { field: 'audit_unit_code', header: 'Unit Code', width: '150px' },
        { field: 'name', header: 'Unit Name', width: '250px' },
        { field: 'section_name', header: 'Section', width: '220px' },
        { field: 'branch_head_name', header: 'Head', width: '220px' },
        { field: 'branch_subhead_name', header: 'Sub Head', width: '220px' },
        { field: 'last_audit_date', header: 'Last Audit Date', width: '160px' },
        { field: 'frequency', header: 'Frequency', width: '140px' },
        { field: 'is_active', header: 'Status', type: 'status', width: '120px', align: 'center' },
        { field: '_status', header: '', type: 'action', actionIcon: 'pi pi-sync', actionName: 'toggle-status', width: '50px', align: 'center', tooltip: 'Toggle Status' },
        { field: '_delete', header: '', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', width: '50px', align: 'center', tooltip: 'Delete', cssClass: 'text-danger' }

    ]
    ngOnInit() {
        this.loadAuditUnits();
    }

    loadAuditUnits() {
        this.loading.set(true);
        this.auditUnitService.findAll().subscribe({
            next: (result) => {
                this.auditUnits.set(this.parseRows(result));
                console.log("Data:", result);

                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load audit units' });
            }
        });
    }

    private parseRows(res: any): any[] {
        const rows = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.rows)
                    ? res.rows
                    : [];

        return rows.map((r: any) => ({
            ...r,
            last_audit_date: r.last_audit_date
                ? new Date(r.last_audit_date).toLocaleDateString('en-GB')
                : ''
        }));
    }

    async openForm(unit?: any) {
        const res = await this.drawer.open(AuditUnitFormComponent, {
            header: unit ? 'Edit Audit Unit' : 'Create New Audit Unit',
            data: unit,
            width: 'min(760px, 100vw)'
        });

        if (res?.saved) {
            this.loadAuditUnits();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: `Audit unit ${unit ? 'updated' : 'created'} successfully` });
        }
    }

    async openBulkUpload() {
        const res = await this.drawer.open(MasterBulkUploadComponent, {
            header: 'Audit Unit Bulk Upload',
            data: {
                config: this.bulkUploadService.getConfig('auditUnits'),
            },
            width: 'min(1100px, 100vw)',
        });

        if (res?.saved) {
            this.loadAuditUnits();
        }
    }

    onAction(event: { name: string; row: any }) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.deleteUnit(event.row);
            return;
        }

        if (event.name === 'target') {
            console.log('Target clicked:', event.row);

            // navigate to target master
            this.router.navigate(['/admin/audit-unit-target-master', event.row.id]);
            return;
        }
    }

    private toggleStatus(unit: any) {
        this.auditUnitService.toggleStatus(unit.id).subscribe({
            next: () => {
                this.loadAuditUnits();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Audit unit ${Number(unit.is_active) === 1 ? 'deactivated' : 'activated'} successfully`
                });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to update status' });
            }
        });
    }

    private deleteUnit(unit: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this audit unit?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',

            accept: () => {
                this.auditUnitService.remove(unit.id).subscribe({
                    next: () => {
                        this.loadAuditUnits();
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Audit unit deleted successfully'
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Unable to delete audit unit'
                        });
                    }
                });
            }
        });
    }
}
