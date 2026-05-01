import { Component, input, output, signal, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProposalsService } from '../../proposals.service';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { MessageService } from 'primeng/api';
import { MachineryFormComponent } from './machinery-form/machinery-form.component';
import { 
  CheckboxFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  SelectFieldComponent
} from '../../../../shared/components/form';

@Component({
  selector: 'app-loan-specific',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    TableModule,
    SelectButtonModule,
    CheckboxFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './loan-specific.component.html',
  styleUrl: './loan-specific.component.scss'
})
export class LoanSpecificComponent implements OnInit {
  proposalId = input.required<string>();
  globalData = input<any>(null); // higher_purchase_loan_data
  items = input<any[]>([]);     // proposal_machinery_info[]
  
  globalChanged = output<any>();
  refresh = output<void>();

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);
  private drawer = inject(FormDrawerService);

  // Signals for Global Form (higher_purchase_loan_data)
  machineryCondition = signal('new');
  hasGstInput = signal(false);
  gstInputPercentage = signal(0);
  isHypothecated = signal(false);
  mortgageDetails = signal('');

  // Computed GST Input Amount based on all items
  gstInputAmount = computed(() => {
    const totalMachineryPrice = this.items().reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const pct = this.gstInputPercentage();
    return (totalMachineryPrice * pct) / 100;
  });

  conditionOptions = [
    { label: 'New', value: 'new' },
    { label: 'Used', value: 'old' }
  ];

  private isPatching = false;

  ngOnInit() {
    // Initial patch handled by effect
  }

  constructor() {
    effect(() => {
      const data = this.globalData();
      if (data) {
        this.isPatching = true;
        this.patchGlobal(data);
        setTimeout(() => this.isPatching = false, 0);
      }
    });
  }

  patchGlobal(data: any) {
    if (!data) return;
    this.machineryCondition.set(data.machinery_condition || 'new');
    this.hasGstInput.set(data.has_gst_input || false);
    this.gstInputPercentage.set(Number(data.gst_input_percentage) || 0);
    this.isHypothecated.set(data.is_hypothecated || false);
    this.mortgageDetails.set(data.mortgage_details || '');
  }

  onFieldChange() {
    if (this.isPatching) return;
    this.globalChanged.emit(this.getGlobalPayload());
  }

  getGlobalPayload() {
    return {
      machinery_condition: this.machineryCondition(),
      has_gst_input: this.hasGstInput(),
      gst_input_percentage: this.gstInputPercentage(),
      gst_input_amount: this.gstInputAmount(),
      is_hypothecated: this.isHypothecated(),
      mortgage_details: this.mortgageDetails()
    };
  }

  async addNew() {
    const res = await this.drawer.open(MachineryFormComponent, {
      header: 'Add Machinery Detail',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        isOld: this.machineryCondition() === 'old'
      }
    });

    if (res.saved) {
      this.refresh.emit();
    }
  }

  async editItem(item: any) {
    const res = await this.drawer.open(MachineryFormComponent, {
      header: 'Edit Machinery Detail',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        isOld: this.machineryCondition() === 'old',
        record: item
      }
    });

    if (res.saved) {
      this.refresh.emit();
    }
  }

  deleteItem(item: any) {
    if (confirm('Are you sure you want to delete this machinery record?')) {
      this.proposalsService.deleteMachineryItem(item.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Asset record removed' });
          this.refresh.emit();
        }
      });
    }
  }
}
