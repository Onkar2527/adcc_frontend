import { Component, signal, inject, linkedSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent, 
  SelectFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent,
  FormActionsComponent
} from '../../../../../shared/components/form';
import { FormDrawerRef } from '../../../../../core/services/drawer/form-drawer.ref';

@Component({
  selector: 'app-credit-new-insurance-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-new-insurance-form.component.html',
  styles: [`
    .insurance-form-container { overflow-x: hidden; }
    .panel-content { display: flex; flex-direction: column; gap: 20px; padding-top: 12px; }
    :host ::ng-deep {
      .p-panel {
        border-radius: 1rem;
        .p-panel-header { padding: 0.85rem 1.25rem; background: transparent; border-bottom: 1px solid var(--surface-100); }
        .p-panel-content { padding: 1.25rem; }
      }
    }
  `]
})
export class CreditNewInsuranceFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  premiumModes = [
    { label: 'Yearly', value: 'yearly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Monthly', value: 'monthly' }
  ];

  // Field Signals
  insuranceDate = linkedSignal<Date | null>(() => this.record()?.insurance_date ? new Date(this.record().insurance_date) : null);
  maturityDate = linkedSignal<Date | null>(() => this.record()?.maturity_date ? new Date(this.record().maturity_date) : null);
  companyName = linkedSignal(() => this.record()?.company_name || '');
  policyNumber = linkedSignal(() => this.record()?.policy_number || '');
  policyAmount = linkedSignal(() => Number(this.record()?.policy_amount) || 0);
  premiumAmount = linkedSignal(() => Number(this.record()?.premium_amount) || 0);
  premiumAmountYearly = linkedSignal(() => Number(this.record()?.premium_amount_yearly) || 0);
  premiumMode = linkedSignal(() => this.record()?.premium_mode || 'yearly');
  amountPaidTillDate = linkedSignal(() => Number(this.record()?.amount_paid_till_date) || 0);
  
  isLoanSoughtForPremium = linkedSignal(() => this.record()?.is_loan_sought_for_premium ?? false);
  willAssignPolicy = linkedSignal(() => this.record()?.will_assign_policy ?? false);
  nonAssignmentReason = linkedSignal(() => this.record()?.non_assignment_reason || '');

  ngOnInit() {}

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      insurance_date: this.insuranceDate(),
      maturity_date: this.maturityDate(),
      company_name: this.companyName(),
      policy_number: this.policyNumber(),
      policy_amount: this.policyAmount(),
      premium_amount: this.premiumAmount(),
      premium_amount_yearly: this.premiumAmountYearly(),
      premium_mode: this.premiumMode(),
      amount_paid_till_date: this.amountPaidTillDate(),
      is_loan_sought_for_premium: this.isLoanSoughtForPremium(),
      will_assign_policy: this.willAssignPolicy(),
      non_assignment_reason: this.nonAssignmentReason()
    };

    this.proposalsService.updateNewInsurance(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'New insurance policy record saved' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save policy info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
