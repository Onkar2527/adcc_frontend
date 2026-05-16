import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { AuditSectionService, BorderAreaMasterService, MenuMasterService } from '../services/masters.service';
import { BorderAreaMasterFormComponent } from './border-area-master-main.component';
import { MenuMasterFormComponent } from '../menu-master/menu-master-main.component';


@Component({
  selector: 'app-broader-area-master',
  standalone: true,
  imports: [CommonModule, TableComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Broader  Area Master</h5>
      </div>

      <app-table
        [columns]="columns"
        [data]="borderAreas()"
        [loading]="loading()"
        [actionDisplayMode]="'buttons'"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="loadBorderAreas()"
      ></app-table>
    </div>
    <p-toast></p-toast>
  `
})
export class BorderAreaMasterComponent   implements OnInit {
  private borderAreaService = inject(BorderAreaMasterService);
  private drawer = inject(FormDrawerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  borderAreas = signal<any[]>([]);
  loading = signal(false);

  columns: TableColumn[] = [
    { field: '_edit', header: '', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '50px', align: 'center', tooltip: 'Edit' },
    { field: '_delete', header: '', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', width: '50px', align: 'center', tooltip: 'Delete' },
    { field: 'name', header: 'Name', width: '300px' },
    { field: 'appetite_percent', header: 'Appetite Percent', width: '300px' },
    { field: 'occurance_percent', header: 'Occurrence Percent', width: '300px' },
    { field: 'magnitude', header: 'Magnitude', width: '300px' },
    { field: 'frequency', header: 'Frequency', width: '300px' },
    { field: 'average_qualitative_count', header: 'Average Qualitative Count', width: '300px' },
    { field: 'average_quantitative_count', header: 'Average Quantitative Count', width: '300px' },
  ];

  ngOnInit() {
    this.loadBorderAreas();
  }

  loadBorderAreas() {
    this.loading.set(true);
    this.borderAreaService.getBorderAreas().subscribe({
      next: (res) => {
        this.borderAreas.set(this.getBorderAreaRows (res));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load border areas'
        });
      }
    });
  }

  private getBorderAreaRows(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.rows)) return res.rows;
    return [];
  }

  async openForm(borderArea?: any) {
    const res = await this.drawer.open(BorderAreaMasterFormComponent, {
      header: borderArea ? 'Edit Border Area' : 'Create New Border Area',
      data: borderArea,
      width: '620px'
    });

    if (res.saved) {
      this.loadBorderAreas();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Border area ${borderArea ? 'updated' : 'created'} successfully`
      });
    }
  }

 delete(row: any) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this border area?',
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes',
            rejectLabel: 'No',

            accept: () => {
                this.borderAreaService.deleteBorderArea(row.id).subscribe(() => {
                    this.loadBorderAreas();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Deleted',
                        detail: 'Border area deleted successfully'
                    });
                });
            }
        });
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

  }

 
}
