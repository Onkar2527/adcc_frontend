import { Component, signal, inject, input, output, computed, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent,
  CheckboxFieldComponent,
  TextareaFieldComponent 
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-rent-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    DividerModule,
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './rent-form.component.html'
})
export class RentFormItemComponent {
  proposalId = input.required<string>();
  record = input<any>(null);
  onSave = output<any>();

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  loading = signal(false);

  // Field Signals (Linked to Record Input)
  rentedToName = linkedSignal(() => this.record()?.rented_to_name || '');
  propertyNo = linkedSignal(() => this.record()?.property_no || '');
  hasAgreement = linkedSignal(() => this.record()?.has_agreement || false);
  agreementTerm = linkedSignal(() => this.record()?.agreement_term || '');
  leaseExpiryDate = linkedSignal<Date | null>(() => this.record()?.lease_expiry_date ? new Date(this.record().lease_expiry_date) : null);
  monthlyRentAmount = linkedSignal<number>(() => Number(this.record()?.monthly_rent_amount) || 0);
  gstAmount = linkedSignal<number>(() => Number(this.record()?.gst_amount) || 0);
  tdsAmount = linkedSignal<number>(() => Number(this.record()?.tds_amount) || 0);
  isRentDiscountingScheme = linkedSignal(() => this.record()?.is_rent_discounting_scheme || false);
  remark = linkedSignal(() => this.record()?.remark || '');

  // Computed
  netRentReceived = computed(() => {
    return (this.monthlyRentAmount() + this.gstAmount()) - this.tdsAmount();
  });

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      rented_to_name: this.rentedToName(),
      property_no: this.propertyNo(),
      has_agreement: this.hasAgreement(),
      agreement_term: this.hasAgreement() ? this.agreementTerm() : '',
      lease_expiry_date: this.hasAgreement() ? this.leaseExpiryDate() : null,
      monthly_rent_amount: this.monthlyRentAmount(),
      gst_amount: this.gstAmount(),
      tds_amount: this.tdsAmount(),
      net_rent_received: this.netRentReceived(),
      is_rent_discounting_scheme: this.isRentDiscountingScheme(),
      remark: this.remark()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), 'rent', payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Rental income saved successfully' });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
