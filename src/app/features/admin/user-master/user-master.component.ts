import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent } from '../../../shared/components/table/table.component';
import { TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { MasterUserService } from '../services/masters.service';
import { UserFormComponent } from './user-form.component';

@Component({
  selector: 'app-user-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">User Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="users()"
        [loading]="loading()"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadUsers()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class UserMasterComponent implements OnInit {
  private userService = inject(MasterUserService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  users = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center' },
    { field: 'full_name', header: 'Full Name', width: '200px' },
    { field: 'username', header: 'Username', width: '150px' },
    { field: 'role_name', header: 'Role', width: '150px' },
    { field: 'branch_name', header: 'Branch', width: '150px' },
    { field: 'email', header: 'Email', width: '200px' },
    { field: 'mobile_number', header: 'Mobile', width: '130px' },
    { field: 'is_active', header: 'Status', type: 'boolean', width: '100px', align: 'center' },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.findAll().subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Unable to load users'
        });
      }
    });
  }

  async openForm(user?: any) {
    const res = await this.drawer.open(UserFormComponent, {
      header: user ? 'Edit User' : 'Create New User',
      data: user,
      width: '500px'
    });

    if (res) {
      this.loadUsers();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: `User ${user ? 'updated' : 'created'} successfully` 
      });
    }
  }

  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
    }
  }
}
