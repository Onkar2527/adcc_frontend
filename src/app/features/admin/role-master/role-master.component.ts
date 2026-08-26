import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent } from '../../../shared/components/table/table.component';
import { TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { RoleService } from '../services/masters.service';
import { RoleFormComponent } from './role-form.component';

@Component({
  selector: 'app-role-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Role Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="roles()"
        [loading]="loading()"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadRoles()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class RoleMasterComponent implements OnInit {
  private roleService = inject(RoleService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  roles = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center' },
    { field: 'role_name', header: 'Role Name', width: '200px' },
    { field: 'description', header: 'Description', width: '350px' },
    { field: 'is_active', header: 'Status', type: 'boolean', width: '100px', align: 'center' },
  ];

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading.set(true);
    this.roleService.findAll().subscribe({
      next: (res) => {
        this.roles.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to load roles'
        });
      }
    });
  }

  async openForm(role?: any) {
    const res = await this.drawer.open(RoleFormComponent, {
      header: role ? 'Edit Role' : 'Create New Role',
      data: role,
      width: '400px'
    });

    if (res) {
      this.loadRoles();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: `Role ${role ? 'updated' : 'created'} successfully` 
      });
    }
  }

  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
    }
  }
}
