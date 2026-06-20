import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { PeriodwiseQuestionsMasterService } from '../services/masters.service';
import { MenuMasterFormComponent } from './../menu-master/menu-master-main.component';
import { PeriodwiseQuestionsMasterFormComponent } from './periodwise-questions-master-main';
import { user_types } from '../services/required-data';
import { PeriodwiseQuestionsMasterViewComponent } from './periodwise-question-manage-view';

@Component({
  selector: 'app-periodwise-questions-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  styles: [`
    :host ::ng-deep td {
      white-space: pre-line;
    }

    :host ::ng-deep td:first-child {
      font-size: 16px;
      font-weight: 600;
      color: #2563eb;
    }
  `],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Question Setup</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="periodwiseQuestionsMasters()"
        [loading]="loading()"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadPeriodwiseQuestionsMasters()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class PeriodwiseQuestionsMasterComponent implements OnInit {
  private periodwiseQuestionsService = inject(PeriodwiseQuestionsMasterService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  periodwiseQuestionsMasters = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [

    {
      field: 'audit_unit_name',
      header: 'Audit Unit Name',
      width: '250px'
    },

    {
      field: 'period_details',
      header: 'Period Wise Details',
      width: '350px'
    },

    {
      field: 'user_type_name',
      header: 'User Type',
      width: '150px',
      align: 'center'
    },

    {
      field: '_edit',
      header: 'Action',
      type: 'action',
      actionIcon: 'pi pi-pencil',
      actionName: 'edit',
      width: '100px',
      align: 'center',
      tooltip: 'Edit'
    },
    { field: '_delete', header: '', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', width: '50px', align: 'center', tooltip: 'Delete' },
    { field: '_view', header: '', type: 'action', actionIcon: 'pi pi-eye', actionName: 'view', width: '50px', align: 'center', tooltip: 'View' }

  ];

  ngOnInit() {
    this.loadPeriodwiseQuestionsMasters();

  }

  loadPeriodwiseQuestionsMasters() {
    this.loading.set(true);
    this.periodwiseQuestionsService.getAll().subscribe({
      next: (res) => {
        this.periodwiseQuestionsMasters.set(this.getPeriodwiseQuestionsMasterRows(res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load periodwise questions masters'
        });
      }
    });
  }

  private getPeriodwiseQuestionsMasterRows(res: any): any[] {

    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res?.rows)
        ? res.rows
        : Array.isArray(res?.data)
          ? res.data
          : [];

    return rows.map((item: any, index: number) => ({

      ...item,

      sr_no: index + 1,

      audit_unit_name: item.audit_unit_name || '-',

      period_details:
        `Period: ${item.start_month_year} - ${item.end_month_year}
(F.Y. ${item.year || '-'})`,

      user_type_name:
        user_types.find(
          (ut) => ut.value == item.user_type_id
        )?.label || '-'

    }));

  }

  async openForm(periodwiseQuestionsMaster?: any) {
    const res = await this.drawer.open(PeriodwiseQuestionsMasterFormComponent, {
      header: periodwiseQuestionsMaster ? 'Edit Question Setup' : 'Create New Question Setup',
      data: periodwiseQuestionsMaster,
      width: '620px'
    });

    if (res.saved) {
      this.loadPeriodwiseQuestionsMasters();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Question Setup master ${periodwiseQuestionsMaster ? 'updated' : 'created'} successfully`
      });
    }
  }
  delete(row: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this question setup master?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',

      accept: () => {
        this.periodwiseQuestionsService.delete(row.id).subscribe(() => {
          this.loadPeriodwiseQuestionsMasters();
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Question setup master deleted successfully'
          });
        });
      }
    });
  }
  async openView(periodwiseQuestionsMaster?: any) {
    const res = await this.drawer.open(PeriodwiseQuestionsMasterViewComponent, {
      header: periodwiseQuestionsMaster ? 'Edit Question Setup Master' : 'Create New Question Setup Master',
      data: periodwiseQuestionsMaster,
      width: '1020px'
    });

    if (res.saved) {
      this.loadPeriodwiseQuestionsMasters();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Question Setup master ${periodwiseQuestionsMaster ? 'updated' : 'created'} successfully`
      });
    }
  }
  onAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.openForm(event.row);
      return;
    }
    if (event.name === 'delete') {
      this.delete(event.row);
      return;
    }
    if (event.name === 'view') {
      this.openView(event.row);
      return;
    }


  }

}
