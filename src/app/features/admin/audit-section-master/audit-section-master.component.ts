import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { AuditSectionService } from '../services/masters.service';
import { AuditSectionFormComponent } from './audit-section-form.component';
import { MasterBulkUploadComponent } from '../shared/master-bulk-upload/master-bulk-upload.component';
import { MasterBulkUploadService } from '../services/master-bulk-upload.service';

@Component({
  selector: 'app-audit-section-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule, ButtonModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Audit Section Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="auditSections()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadAuditSections()"
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
  `
})
export class AuditSectionMasterComponent implements OnInit {
  private auditSectionService = inject(AuditSectionService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);
  private bulkUploadService = inject(MasterBulkUploadService);

  auditSections = signal<any[]>([]);
  loading = signal(false);
  globalFilterFields = ['name'];

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
    { field: 'name', header: 'Section Name', width: '300px' },
    { field: 'is_active', header: 'Status', type: 'status', width: '120px', align: 'center' },
    { field: '_status', header: '', type: 'action', actionIcon: 'pi pi-sync', actionName: 'toggle-status', width: '50px', align: 'center', tooltip: 'Toggle Status' },
  ];

  ngOnInit() {
    this.loadAuditSections();
  }

  loadAuditSections() {
    this.loading.set(true);
    this.auditSectionService.findAll().subscribe({
      next: (res) => {
        this.auditSections.set(this.getAuditSectionRows(res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load audit sections'
        });
      }
    });
  }

  private getAuditSectionRows(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.rows)) return res.rows;
    return [];
  }

  async openForm(auditSection?: any) {
    const res = await this.drawer.open(AuditSectionFormComponent, {
      header: auditSection ? 'Edit Audit Section' : 'Create New Audit Section',
      data: auditSection,
      width: '420px'
    });

    if (res.saved) {
      this.loadAuditSections();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Audit section ${auditSection ? 'updated' : 'created'} successfully`
      });
    }
  }

  async openBulkUpload() {
    const res = await this.drawer.open(MasterBulkUploadComponent, {
      header: 'Audit Section Bulk Upload',
      data: {
        config: this.bulkUploadService.getConfig('sections'),
      },
      width: 'min(980px, 100vw)',
    });

    if (res?.saved) {
      this.loadAuditSections();
    }
  }

  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
      return;
    }

    if (event.name === 'toggle-status') {
      this.toggleStatus(event.row);
    }
  }

  private toggleStatus(auditSection: any) {
    this.auditSectionService.toggleStatus(auditSection.id).subscribe({
      next: () => {
        this.loadAuditSections();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Audit section ${auditSection.is_active === 1 ? 'deactivated' : 'activated'} successfully`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to update audit section status'
        });
      }
    });
  }
}
