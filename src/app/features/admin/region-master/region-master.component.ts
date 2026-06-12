import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { Region, RegionMasterService } from '../services/masters.service';
import { RegionFormComponent } from './region-form.component';

@Component({
  selector: 'app-region-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Region Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="regions()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadRegions()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class RegionMasterComponent implements OnInit {
  private regionService = inject(RegionMasterService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  regions = signal<any[]>([]);
  loading = signal(false);
  globalFilterFields = ['region_name', 'mapped_units_text'];

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
    { field: 'region_name', header: 'Region Name', width: '250px' },
    { field: 'mapped_units_text', header: 'Mapped Audit Units', width: '500px' },
    { field: 'is_active', header: 'Status', type: 'status', width: '110px', align: 'center' },
    { field: '_status', header: '', type: 'action', actionIcon: 'pi pi-sync', actionName: 'toggle-status', width: '50px', align: 'center', tooltip: 'Toggle Status' },
    { field: '_delete', header: '', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', width: '50px', align: 'center', tooltip: 'Delete', cssClass: 'text-danger' }
  ];

  ngOnInit() {
    this.loadRegions();
  }

  loadRegions() {
    this.loading.set(true);
    this.regionService.findAll().subscribe({
      next: (regions) => {
        this.regions.set(regions.map((r) => ({
          ...r,
          mapped_units_text: r.units.map(u => `${u.name} (${u.audit_unit_code})`).join(', ') || '-'
        })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to load regions' });
      }
    });
  }

  async openForm(region?: Region) {
    const res = await this.drawer.open(RegionFormComponent, {
      header: region ? 'Edit Region' : 'Create New Region',
      data: region,
      width: 'min(600px, 150vw)'
    });

    if (res.saved) {
      this.loadRegions();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Region ${region ? 'updated' : 'created'} successfully`
      });
    }
  }

  onAction(event: { name: string; row: Region }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
      return;
    }

    if (event.name === 'toggle-status') {
      this.toggleStatus(event.row);
      return;
    }

    if (event.name === 'delete') {
      this.deleteRegion(event.row);
      return;
    }
  }

  private toggleStatus(region: Region) {
    this.regionService.toggleStatus(region.id).subscribe({
      next: () => {
        this.loadRegions();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Region status updated successfully`
        });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Unable to update region status' });
      }
    });
  }

  private deleteRegion(region: Region) {
    if (confirm(`Are you sure you want to delete region "${region.region_name}"?`)) {
      this.regionService.remove(region.id).subscribe({
        next: () => {
          this.loadRegions();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Region deleted successfully`
          });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Unable to delete region' });
        }
      });
    }
  }
}
