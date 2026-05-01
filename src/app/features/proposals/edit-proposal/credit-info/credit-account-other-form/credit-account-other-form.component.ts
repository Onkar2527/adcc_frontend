import { Component, signal, inject, linkedSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
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
  selector: 'app-credit-account-other-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule,
    DividerModule,
    SelectButtonModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-account-other-form.component.html',
  styles: [`
    .account-form-container { overflow-x: hidden; }
    .panel-content { display: flex; flex-direction: column; gap: 20px; padding-top: 12px; }
    :host ::ng-deep {
      .p-panel {
        border-radius: 1rem;
        .p-panel-header { padding: 0.85rem 1.25rem; background: transparent; border-bottom: 1px solid var(--surface-100); }
        .p-panel-content { padding: 1.25rem; }
      }
      .p-selectbutton {
        .p-button {
          background: var(--surface-50); color: var(--text-color-secondary); border: 1px solid var(--surface-200);
          &.p-highlight { background: var(--primary-50); color: var(--primary-700); border-color: var(--primary-200); }
        }
      }
    }
  `]
})
export class CreditAccountOtherFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  bankCategoryOptions = [
    { label: 'Co-Operative Bank/Society', value: 'coop' },
    { label: 'Nationalised Bank/Other', value: 'nationalised' }
  ];

  accountTypes = [
    { label: 'Savings Bank Account', value: 'savings' },
    { label: 'Current Deposit Account', value: 'current' },
    { label: 'Term Deposit Account', value: 'term' },
    { label: 'Recurring Deposit Account', value: 'recurring' },
    { label: 'Monthly Deposit Account', value: 'monthly' },
    { label: 'Daily Deposit Account', value: 'daily' },
    { label: 'Other Deposit Account', value: 'other' }
  ];

  // Field Signals
  bankCategory = linkedSignal(() => this.record()?.bank_category || 'coop');
  isSocietyMember = linkedSignal(() => this.record()?.is_society_member ?? false);
  bankName = linkedSignal(() => this.record()?.bank_name || '');
  branchName = linkedSignal(() => this.record()?.branch_name || '');
  accountType = linkedSignal(() => this.record()?.account_type || null);
  accountNo = linkedSignal(() => this.record()?.account_no || '');
  openingDate = linkedSignal<Date | null>(() => this.record()?.opening_date ? new Date(this.record().opening_date) : null);
  amount = linkedSignal(() => Number(this.record()?.amount) || 0);
  
  isMortgaged = linkedSignal(() => this.record()?.is_mortgaged_for_this_loan ?? false);
  isPrimeSecurity = linkedSignal(() => this.record()?.is_prime_security ?? false);
  isCollateralSecurity = linkedSignal(() => this.record()?.is_collateral_security ?? false);
  expirationDate = linkedSignal<Date | null>(() => this.record()?.expiration_date ? new Date(this.record().expiration_date) : null);
  isLoanOnDeposit = linkedSignal(() => this.record()?.is_loan_taken_on_this_bank_deposit ?? false);
  loanDetails = linkedSignal(() => this.record()?.loan_details || '');

  ngOnInit() {}

  onMortgageChange(val: boolean) {
    if (!val) {
      this.isPrimeSecurity.set(false);
      this.isCollateralSecurity.set(false);
    }
  }

  onPrimeChange(val: boolean) {
    if (val) this.isCollateralSecurity.set(false);
  }

  onCollateralChange(val: boolean) {
    if (val) this.isPrimeSecurity.set(false);
  }

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      bank_category: this.bankCategory(),
      is_society_member: this.isSocietyMember(),
      bank_name: this.bankName(),
      branch_name: this.branchName(),
      account_type: this.accountType(),
      account_no: this.accountNo(),
      opening_date: this.openingDate(),
      amount: this.amount(),
      is_mortgaged_for_this_loan: this.isMortgaged(),
      is_prime_security: this.isPrimeSecurity(),
      is_collateral_security: this.isCollateralSecurity(),
      expiration_date: this.expirationDate(),
      is_loan_taken_on_this_bank_deposit: this.isLoanOnDeposit(),
      loan_details: this.loanDetails()
    };

    // Validation: If mortgaged, must pick Prime or Collateral
    if (this.isMortgaged() && !this.isPrimeSecurity() && !this.isCollateralSecurity()) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Security Required', 
        detail: 'Please select Prime or Collateral security for the mortgaged property.' 
      });
      this.loading.set(false);
      return;
    }

    this.proposalsService.updateAccountOtherBank(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'External account saved' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save account' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
