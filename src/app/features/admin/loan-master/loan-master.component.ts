import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { LoanTypeService } from '../services/masters.service';
import { LoanTypeFormComponent } from './loan-type-form.component';

@Component({
  selector: 'app-loan-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Loan Type Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="loanTypes()"
        [loading]="loading()"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadLoanTypes()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class LoanMasterComponent implements OnInit {
  private loanTypeService = inject(LoanTypeService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);

  loanTypes = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center' },
    { field: 'type_code', header: 'Type Code', width: '120px' },
    { field: 'type_name', header: 'Loan Type Name', width: '250px' },
    { field: 'interest_rate', header: 'Interest Rate (%)', width: '150px', align: 'right' },
    { field: 'max_tenure_months', header: 'Max Tenure (Mos)', width: '150px', align: 'center' },
    { field: 'is_active', header: 'Status', type: 'boolean', width: '100px', align: 'center' },
  ];

  ngOnInit() {
    this.loadLoanTypes();
  }

  loadLoanTypes() {
    this.loading.set(true);
    this.loanTypeService.findAll().subscribe({
      next: (res) => {
        this.loanTypes.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async openForm(loanType?: any) {
    const res = await this.drawer.open(LoanTypeFormComponent, {
      header: loanType ? 'Edit Loan Type' : 'Create New Loan Type',
      data: loanType,
      width: '450px'
    });

    if (res) {
      this.loadLoanTypes();
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: `Loan type ${loanType ? 'updated' : 'created'} successfully` 
      });
    }
  }

  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
    }
  }
}
