import { Component, input, signal, inject, OnInit, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PanelModule } from 'primeng/panel';
import { ProposalsService } from '../../proposals.service';
import { TextFieldComponent } from '../../../../shared/components/form';
import { AssociateEditorComponent } from './associate-editor.component';
import { AssociateFormComponent } from './associate-form.component';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { TableComponent, TableColumn, TableAction } from '../../../../shared/components/table/table.component';
import { PageComponent } from '../../../../shared/components/page/page.component';

@Component({
  selector: 'app-associate-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    PanelModule,
    TableComponent,
    PageComponent
  ],
  templateUrl: './associate-list.component.html',
  styleUrls: ['./associate-list.component.scss']
})
export class AssociateListComponent implements OnInit {
  proposalId = input.required<string>();
  entityType = input<string>('G');

  private proposalsService = inject(ProposalsService);
  private notificationService = inject(NotificationService);
  private drawer = inject(FormDrawerService);

  associates = signal<any[]>([]);
  loading = signal(false);

  // Table Configuration
  mainTableCols: TableColumn[] = [
    { field: '_edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '60px', align: 'center', tooltip: 'Edit Profile' },
    { field: '_delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', actionName: 'delete', width: '60px', align: 'center', tooltip: 'Delete Record', cssClass: 'text-danger' },
    { field: 'name', header: 'Name', type: 'text', sortable: true },
    { field: 'phone', header: 'Phone', type: 'text', sortable: true },
    { field: 'profession', header: 'Profession', type: 'text', sortable: true },
    { field: 'member_no', header: 'Member No', type: 'text', sortable: true },
    { field: 'created_at', header: 'Added On', type: 'date', pipeFormat: 'dd-MM-yyyy', sortable: true }
  ];


  tableActions = computed<TableAction[]>(() => [
    {
      label: 'Edit Profile',
      icon: 'pi pi-pencil',
      command: (row) => this.onEdit(row),
      styleClass: 'p-button-info'
    },
    {
      label: 'Delete Record',
      icon: 'pi pi-trash',
      command: (row) => this.onDelete(row),
      styleClass: 'p-button-danger'
    }
  ]);

  onRefresh = output<void>();

  ngOnInit() {
    this.loadAssociates();
  }

  get typeLabel() {
    return this.entityType() === 'G' ? 'Guarantor' : 'Co-borrower';
  }

  loadAssociates() {
    this.loading.set(true);
    this.proposalsService.getParticipants(this.proposalId()).subscribe({
      next: (res: any) => {
        this.associates.set(res.data.filter((p: any) => p.entity_type === this.entityType()));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async onAdd() {
    const res = await this.drawer.open(AssociateFormComponent, {
      header: `Add New ${this.typeLabel}`,
      width: '40rem',
      data: {
        proposalId: this.proposalId(),
        entityType: this.entityType()
      }
    });

    if (res.saved) {
      this.loadAssociates();
      this.onRefresh.emit();
    }
  }

  async onEdit(participant: any) {
    const res = await this.drawer.open(AssociateEditorComponent, {
      header: `Edit ${this.typeLabel} - ${participant.name}`,
      width: '70rem',
      data: {
        proposalId: this.proposalId(),
        participant: participant
      }
    });

    if (res.saved) {
      this.loadAssociates();
    }
  }

  onDelete(associate: any) {
    if (confirm(`Are you sure you want to delete this ${this.typeLabel}?`)) {
      this.proposalsService.deleteParticipant(associate.id).subscribe({
        next: () => {
          this.notificationService.success(`${this.typeLabel} deleted successfully`);
          this.loadAssociates();
          this.onRefresh.emit();
        }
      });
    }
  }

  handleTableAction(event: { name: string; row: any }) {
    if (event.name === 'edit') {
      this.onEdit(event.row);
    } else if (event.name === 'delete') {
      this.onDelete(event.row);
    }
  }
}
