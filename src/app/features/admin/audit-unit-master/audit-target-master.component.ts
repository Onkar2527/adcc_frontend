import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { AuditUnitService } from '../services/masters.service';
import { AuditUnitFormComponent } from './audit-unit-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditUnitTargetFormComponent } from './audit-unit-target-form.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-audit-target-master',
    standalone: true,
    imports: [CommonModule, TableComponent, ToastModule, ConfirmDialogModule, ButtonModule],
    providers: [MessageService, ConfirmationService],
    template: `
  <div class="card border-round-xl shadow-1">

  <!-- Header -->
  <div class="flex align-items-start justify-content-between mb-4">

    <!-- Left Section -->
    <div class="flex align-items-center">

      <button
        pButton
        icon="pi pi-arrow-left"
        class="p-button-text p-button-rounded mr-2"
        (click)="goBack()">
      </button>

      <div>

        <h5 class="m-0 text-xl font-semibold">
          Target Master
        </h5>

        <div class="text-sm text-500 mt-1">

          <span *ngIf="unitName()">
            Unit:
            <strong>{{ unitName() }}</strong>
          </span>

        </div>

      </div>

    </div>

  </div>

  <!-- Table -->
  <div class="border-1 border-gray-200 border-round-lg overflow-hidden">

    <app-table
      [columns]="columns"
      [data]="targets()"
      [loading]="loading()"
      [globalFilterFields]="globalFilterFields"
      [actionDisplayMode]="'buttons'"
      (onAdd)="openForm()"
      (onActionClick)="onAction($event)"
      (onRefresh)="load()"
    ></app-table>

  </div>

</div>

<p-toast></p-toast>

<p-confirmDialog></p-confirmDialog>
`
})
export class AuditTargetMasterComponent implements OnInit {
    private auditUnitService = inject(AuditUnitService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private route = inject(ActivatedRoute);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);

    targets = signal<any[]>([]);
    loading = signal(false);

    unitName = signal('');

    globalFilterFields = [
        'year_name',
        'deposit_target',
        'advances_target',
        'npa_target',
    ];

    auditUnitId!: number;

    columns: TableColumn[] = [
        { field: 'year_id', header: 'Year' },
        { field: 'deposit_target', header: 'Deposit' },
        { field: 'advances_target', header: 'Advances' },
        { field: 'npa_target', header: 'NPA' },

        { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', tooltip: 'Edit', actionName: 'edit' },
        { field: '_delete', header: '', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', tooltip: 'Delete', cssClass: 'text-danger' },

        { field: '_march', header: '', type: 'action', actionName: 'march', actionIcon: 'pi pi-chart-line', tooltip: 'Add March Position' }
    ];

    ngOnInit() {
        this.auditUnitId = Number(this.route.snapshot.paramMap.get('auditUnitId'))
        this.load();
        this.loadUnitName();
    }

    private loadUnitName() {
        this.auditUnitService.findOne(this.auditUnitId).subscribe({
            next: (res: any) => {
                const unit = res?.data || res;
                this.unitName.set(unit?.name || '');
            }
        });
    }

    load() {
        this.loading.set(true);
        this.auditUnitService.getByAuditByUnit(this.auditUnitId).subscribe({
            next: (res: any) => {
                this.targets.set(Array.isArray(res) ? res : res?.data || res?.rows || []);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load audit targets' });
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

    async openForm(row?: any) {
        const res = await this.drawer.open(AuditUnitTargetFormComponent, {
            header: row ? 'Edit Audit Unit Target' : 'Create New Audit Unit Target',
            data: {
                ...row,
                audit_unit_id: this.auditUnitId
            },
            width: 'min(760px, 100vw)'
        });

        if (res?.saved) {
            this.load();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Audit unit target ${row ? 'updated' : 'created'} successfully`
            });
        }
    }

    goBack() {
        this.router.navigate(['/admin/audit-unit-master']);
    }

    delete(row: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this target?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',

            accept: () => {
                this.auditUnitService.removeTarget(row.id).subscribe(() => {
                    this.load();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: 'Target deleted successfully'
                    });
                });
            }
        });
    }

    openMarch(row: any) {
        // Route
        console.log('Go to March Position', row);

    }

    onAction(event: any) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'toggle-status') {
            this.openMarch(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.delete(event.row);
            return;
        }

    }

    private toggleStatus(unit: any) {
        this.auditUnitService.toggleStatus(unit.id).subscribe({
            next: () => {
                this.load();
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
}
