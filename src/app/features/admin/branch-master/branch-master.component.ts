import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent } from '../../../shared/components/table/table.component';
import { TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { BranchService } from '../services/masters.service';
import { BranchFormComponent } from './branch-form.component';

@Component({
  selector: 'app-branch-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Branch Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="branches()"
        [loading]="loading()"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadBranches()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class BranchMasterComponent implements OnInit {
  private branchService = inject(BranchService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  branches = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center' },
    { field: 'branch_code', header: 'Branch Code', width: '150px' },
    { field: 'branch_name', header: 'Branch Name', width: '250px' },
    { field: 'address', header: 'Address', width: '300px' },
    { field: 'contact_number', header: 'Contact', width: '150px' },
    { field: 'is_active', header: 'Status', type: 'boolean', width: '100px', align: 'center' },
  ];

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.loading.set(true);
    this.branchService.findAll().subscribe({
      next: (res) => {
        this.branches.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async openForm(branch?: any) {
    const res = await this.drawer.open(BranchFormComponent, {
      header: branch ? 'Edit Branch' : 'Create New Branch',
      data: branch,
      width: '450px'
    });

    if (res) {
      this.loadBranches();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: `Branch ${branch ? 'updated' : 'created'} successfully` 
      });
    }
  }

  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
    }
  }
}
