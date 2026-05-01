import { Component, OnInit, signal, inject, input, output, viewChild, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../proposals.service';
import { TableComponent, TableColumn, TableAction } from '../../../../shared/components/table/table.component';
import { FormActionsComponent } from '../../../../shared/components/form/form-actions/form-actions.component';
import { JobFormComponent } from './job-form/job-form.component';
import { BusinessFormItemComponent } from './business-form/business-form.component';
import { AgriFormItemComponent } from './agri-form/agri-form.component';
import { RentFormItemComponent } from './rent-form/rent-form.component';
import { MilkFormItemComponent } from './milk-form/milk-form.component';
import { OtherFormItemComponent } from './other-form/other-form.component';

@Component({
  selector: 'app-income-info',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule, 
    ButtonModule, 
    TableModule, 
    DrawerModule,
    DividerModule,
    TableComponent,
    JobFormComponent,
    BusinessFormItemComponent,
    AgriFormItemComponent,
    RentFormItemComponent,
    MilkFormItemComponent,
    OtherFormItemComponent
  ],
  templateUrl: './income-info.component.html',
  styleUrls: ['./income-info.component.scss']
})
export class IncomeInfoComponent implements OnInit {
  proposalId = input.required<string>();
  data = input<any>(null); // Aggregated incomes from parent
  changed = output<void>();

  /** External trigger from parent sticky footer */
  externalSaveTrigger = input<number>(0);
  private lastHandledTrigger = -1;

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  // Signal to store income data, initialized with empty values
  // We use this as a source for tables, and kept in sync with data() input
  incomes = signal<any>({
    jobs: [],
    businesses: [],
    professions: [],
    agriculture: [],
    rents: [],
    milk: [],
    others: []
  });
  
  loading = signal(false);

  constructor() {
    // Handle external save trigger from parent
    effect(() => {
      const trigger = this.externalSaveTrigger();
      
      // On first run, capture the current trigger value to prevent auto-save on tab switch
      if (this.lastHandledTrigger === -1) {
        this.lastHandledTrigger = trigger;
        return;
      }

      if (trigger > 0 && trigger !== this.lastHandledTrigger) {
        this.lastHandledTrigger = trigger;
        this.onSave();
      }
    });

    // Sync local incomes signal whenever the parent data() signal changes
    effect(() => {
      const data = this.data();
      if (data) {
        this.incomes.set(data);
      }
    });
  }

  onSave() {
    // For income info, the main save button marks the tab as verified/filled
    this.proposalsService.markTabAsFilled(this.proposalId(), 'income', this.entityType(), this.participantId() ?? undefined).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Income information verified' });
        this.changed.emit();
      }
    });
  }

  // Drawer state
  showForm = signal(false);
  currentCategory = signal<string>('');
  selectedRecord = signal<any>(null);

  activeForm = viewChild<any>('activeForm');

  saveButtonLabel = computed(() => {
    const cat = this.currentCategory();
    switch (cat) {
      case 'job': return 'Save Job Info';
      case 'business': return 'Save Business Info';
      case 'profession': return 'Save Profession Info';
      case 'agriculture': return 'Save Agriculture Info';
      case 'rent': return 'Save Rent Info';
      case 'milk': return 'Save Milk Info';
      case 'other': return 'Save Other Income';
      default: return 'Save Income Info';
    }
  });

  // Table Columns
  jobCols: TableColumn[] = [
    { field: 'organization_name', header: 'Organization' },
    { field: 'designation', header: 'Designation' },
    { field: 'net_salary', header: 'Net Salary', type: 'currency' },
    { field: 'job_type', header: 'Type' }
  ];

  bizCols: TableColumn[] = [
    { field: 'firm_name', header: 'Firm Name' },
    { field: 'category', header: 'Category' },
    { field: 'turnover_amount', header: 'Turnover', type: 'currency' },
    { field: 'net_profit_loss', header: 'Profit/Loss', type: 'currency' }
  ];

  agriCols: TableColumn[] = [
    { field: 'land_owner_name', header: 'Owner' },
    { field: 'total_agri_income', header: 'Total Income', type: 'currency' },
    { field: 'village', header: 'Village' }
  ];

  rentCols: TableColumn[] = [
    { field: 'rented_to_name', header: 'Rented To' },
    { field: 'monthly_rent_amount', header: 'Monthly Rent', type: 'currency' },
    { field: 'lease_expiry_date', header: 'Expiry', type: 'date' }
  ];

  milkCols: TableColumn[] = [
    { field: 'remark', header: 'Remark' },
    { field: 'created_at', header: 'Date', type: 'date' }
  ];

  otherCols: TableColumn[] = [
    { field: 'source_name', header: 'Source' },
    { field: 'annual_income', header: 'Annual Income', type: 'currency' },
    { field: 'source_type', header: 'Type' }
  ];

  ngOnInit() {
    if (this.data()) {
      this.incomes.set(this.data());
    } else {
      this.fetchIncomes();
    }
  }

  fetchIncomes() {
    this.loading.set(true);
    this.proposalsService.getIncomes(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.incomes.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addIncome(category: string) {
    this.currentCategory.set(category);
    this.selectedRecord.set(null);
    this.showForm.set(true);
  }

  editIncome(record: any, category: string) {
    this.currentCategory.set(category);
    this.selectedRecord.set(record);
    this.showForm.set(true);
  }

  deleteIncome(record: any, category: string) {
    this.proposalsService.deleteIncome(record.id, category).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Record removed successfully' });
        this.fetchIncomes();
        this.changed.emit();
      }
    });
  }

  getTableActions(category: string): TableAction[] {
    return [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: (row) => this.editIncome(row, category)
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        styleClass: 'p-button-danger',
        command: (row) => this.deleteIncome(row, category)
      }
    ];
  }

  onFormSave() {
    // 1. Close the drawer immediately
    this.showForm.set(false);
    
    // 2. Clear the active record to avoid stale data on next open
    this.selectedRecord.set(null);

    // 3. Defer the heavy data refreshing to allow the Drawer cleanup logic (backdrop/animation) to complete.
    // This prevents the "stuck overlay" issue in PrimeNG 18+.
    setTimeout(() => {
      this.fetchIncomes();
      this.changed.emit();
    }, 150);
  }

  triggerSave() {
    const form = this.activeForm();
    if (form) {
      if (typeof form.save === 'function') {
        form.save();
      }
    }
  }
}
