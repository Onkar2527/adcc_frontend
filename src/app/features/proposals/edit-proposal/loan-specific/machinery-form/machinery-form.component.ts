import { Component, inject, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormDrawerRef } from '../../../../../core/services/drawer/form-drawer.ref';
import { ProposalsService } from '../../../proposals.service';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent, 
  TextareaFieldComponent,
  FormActionsComponent 
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-machinery-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    TextareaFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './machinery-form.component.html',
  styleUrl: './machinery-form.component.scss'
})
export class MachineryFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  // Signals for form binding
  quotationDate = signal<Date | null>(null);
  vendorName = signal('');
  machineryDetails = signal('');
  machineryPrice = signal(0);
  gstAmount = signal(0);
  
  // Computed for Total Amount
  totalAmount = computed(() => this.machineryPrice() + this.gstAmount());

  // Old Machinery Specific
  valuationAmount = signal(0);
  valuationDate = signal<Date | null>(null);
  valuerName = signal('');
  ageOfMachinery = signal('');
  futureLifeOfMachinery = signal('');

  saving = signal(false);
  isOld = signal(false);
  editingId: string | null = null;
  proposalId: string = '';

  ngOnInit() {
    const data = this.ref.data;
    if (data) {
      this.proposalId = data.proposalId;
      this.isOld.set(data.isOld || false);
      
      if (data.record) {
        const item = data.record;
        this.editingId = item.id;
        this.quotationDate.set(item.quotation_date ? new Date(item.quotation_date) : null);
        this.vendorName.set(item.vendor_name || '');
        this.machineryDetails.set(item.machinery_details || '');
        this.machineryPrice.set(Number(item.machinery_price) || 0);
        this.gstAmount.set(Number(item.gst_amount) || 0);
        
        this.valuationAmount.set(Number(item.valuation_amount) || 0);
        this.valuationDate.set(item.valuation_date ? new Date(item.valuation_date) : null);
        this.valuerName.set(item.valuer_name || '');
        this.ageOfMachinery.set(item.age_of_machinery || '');
        this.futureLifeOfMachinery.set(item.future_life_of_machinery || '');
      }
    }
  }

  onSave() {
    this.saving.set(true);
    const payload = {
      id: this.editingId,
      quotation_date: this.quotationDate(),
      vendor_name: this.vendorName(),
      machinery_details: this.machineryDetails(),
      machinery_price: this.machineryPrice(),
      gst_amount: this.gstAmount(),
      total_amount: this.totalAmount(),
      valuation_amount: this.valuationAmount(),
      valuation_date: this.valuationDate(),
      valuer_name: this.valuerName(),
      age_of_machinery: this.ageOfMachinery(),
      future_life_of_machinery: this.futureLifeOfMachinery()
    };

    this.proposalsService.upsertMachineryItem(this.proposalId, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Machinery record saved' });
        this.ref.close(res.data);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  onCancel() {
    this.ref.close();
  }
}
