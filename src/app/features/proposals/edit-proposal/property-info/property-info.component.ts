import { Component, input, output, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TableComponent, TableAction, TableColumn } from '../../../../shared/components/table/table.component';
import { 
  TextFieldComponent, 
  SelectFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  DateFieldComponent,
  CheckboxFieldComponent
} from '../../../../shared/components/form';
import { ProposalsService } from '../../proposals.service';
import { MessageService } from 'primeng/api';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { PropertyEditorComponent } from './property-editor.component';



const AREA_UNITS = [
  { label: 'Square foot', value: 'Square foot' },
  { label: 'Square mtr',  value: 'Square mtr' },
  { label: 'Guntha',      value: 'Guntha' },
  { label: 'Hector',      value: 'Hector' },
  { label: 'Acres',       value: 'Acres' }
];

const MOVABLE_TYPES = [
  'Vehicle', 'Industrial Machinery', 'Agriculture Machinery', 'Furniture & Fixtures', 
  'Construction Equipment', 'Office Equipments', 'Stock & Debtors', 'Home Appliances', 
  'Work Orders', 'Bank Deposit', 'Insurance Policy', 'NSC/KVP', 'Invoice/Bills', 
  'Hamipatra', 'Default Guarantee', 'Live Stock', 'Crop', 'Gold Ornaments', 
  'Shares & Bonds', 'Ware House Receipt', 'Others'
].map(t => ({ label: t, value: t }));

const IMMOVABLE_TYPES = [
  'Agriculture Land', 'Open Plot', 'House Property', 'Residential Flat', 
  'Land & Building', 'Factory Land & Building', 'Shop / Office', 'Other'
].map(t => ({ label: t, value: t }));

@Component({
  selector: 'app-property-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    CardModule,
    DividerModule,
    TableComponent,
    TextareaFieldComponent
  ],
  templateUrl: './property-info.component.html',
  styleUrls: ['./property-info.component.scss']
})
export class PropertyInfoComponent {
  data = input<any[]>([]);
  proposalId = input.required<string>();
  loading = signal(false);
  changed = output<void>();

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);
  externalSaveTrigger = input<number>(0);

  private _isInternalChange = false;

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);
  private drawer = inject(FormDrawerService);

  viewState = signal<'list' | 'form'>('list');
  selectedPropertyId = signal<string | null>(null);

  // Track the previous nature to clear property type only on user-initiated changes
  private _prevNature: string = 'Immovable';

  properties = signal<any[]>([]); // Internal properties to handle fetching

  private lastHandledTrigger = -1;

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
  }

  onSave() {
    // Mark the property tab as verified/filled in the backend
    this.proposalsService.markTabAsFilled(this.proposalId(), 'property', this.entityType(), this.participantId() ?? undefined).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property information verified' });
        this.changed.emit();
      }
    });
  }

  ngOnInit() {
    // If we have a proposalId, we can always fetch the latest properties
    // This ensures we have the most up-to-date list regardless of parent data
    if (this.proposalId()) {
      this.fetchProperties();
    }
  }

  fetchProperties() {
    this.loading.set(true);
    this.proposalsService.getProperties(this.proposalId(), this.entityType(), this.participantId() ?? undefined).subscribe({
      next: (res) => {
        this.properties.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  remark = signal('');

  tableActions = computed<TableAction[]>(() => [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: (row) => this.onEdit(row),
      styleClass: 'p-button-info'
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      styleClass: 'p-button-danger',
      command: (row) => this.onDelete(row)
    }
  ]);

  // Table Columns
  mainTableCols: TableColumn[] = [
    { field: 'property_type', header: 'Type of property' },
    { field: 'nature_of_property', header: 'Nature' },
    { field: 'owner_name', header: 'Owner Name' },
    { field: 'total_area', header: 'Total Area' },
    { field: 'market_value', header: 'Market Value' },
    { field: 'valuation_date', header: 'Valuation Date', type: 'date' }
  ];

  async onAddNew() {
    const pId = this.proposalId();
    if (!pId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing ID', detail: 'Proposal ID is not available. Please refresh the page.' });
      return;
    }

    const result = await this.drawer.open(PropertyEditorComponent, {
      header: 'Add New Property',
      icon: 'pi pi-plus',
      width: '700px',
      data: {
        proposalId: pId,
        entityType: this.entityType(),
        participantId: this.participantId()
      }
    });

    if (result.saved) {
      this.refreshData();
    }
  }

  async onEdit(property: any) {
    const pId = this.proposalId();
    if (!pId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing ID', detail: 'Proposal ID is not available. Please refresh the page.' });
      return;
    }

    const result = await this.drawer.open(PropertyEditorComponent, {
      header: 'Edit Property',
      icon: 'pi pi-pencil',
      width: '700px',
      data: {
        proposalId: pId,
        entityType: this.entityType(),
        participantId: this.participantId(),
        property: property
      }
    });

    if (result.saved) {
      this.refreshData();
    }
  }

  refreshData() {
    this.fetchProperties();
    this.changed.emit();
  }

  onDelete(property: any) {
    if (confirm('Are you sure you want to delete this property record?')) {
      this.proposalsService.deleteProperty(property.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property deleted' });
          this.refreshData();
        }
      });
    }
  }
}
