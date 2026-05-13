import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { AuditSectionService, MenuMasterService } from '../services/masters.service';
import { MenuMasterFormComponent } from './menu-master-main.component';


@Component({
  selector: 'app-menu-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Menu Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="menuMasters()"
        [loading]="loading()"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadMenuMasters()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class MenuMasterComponent implements OnInit {
  private menuService = inject(MenuMasterService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  menuMasters = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
    { field: 'section_name', header: 'Section Name', width: '300px' },
    { field: 'menu_name', header: 'Menu Name', width: '300px' },
    { field: 'is_active', header: 'Status', type: 'status', width: '120px', align: 'center' },
    { field: '_status', header: '', type: 'action', actionIcon: 'pi pi-sync', actionName: 'toggle-status', width: '50px', align: 'center', tooltip: 'Toggle Status' },
  ];

  ngOnInit() {
    this.loadMenuMasters();
  }

  loadMenuMasters() {
    this.loading.set(true);
    this.menuService.getMenuMasters().subscribe({
      next: (res) => {
        this.menuMasters.set(this.getMenuMasterRows (res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load menu masters'
        });
      }
    });
  }

  private getMenuMasterRows(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.rows)) return res.rows;
    return [];
  }

  async openForm(menuMaster?: any) {
    const res = await this.drawer.open(MenuMasterFormComponent, {
      header: menuMaster ? 'Edit Menu Master' : 'Create New Menu Master',
      data: menuMaster,
      width: '420px'
    });

    if (res.saved) {
      this.loadMenuMasters();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Menu master ${menuMaster ? 'updated' : 'created'} successfully`
      });
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

  private toggleStatus(menuMaster: any) {
    this.menuService.toggleStatus(menuMaster.id).subscribe({
      next: () => {
        this.loadMenuMasters();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Menu master ${menuMaster.is_active === 1 ? 'deactivated' : 'activated'} successfully`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to update menu master status'
        });
      }
    });
  }
}
