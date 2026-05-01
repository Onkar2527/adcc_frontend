import { Component, signal, inject, linkedSignal, OnInit, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
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
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-credit-account-this-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule,
    DividerModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-account-this-form.component.html',
  styles: [`
    .account-form-container { overflow-x: hidden; }
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
export class CreditAccountThisFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  // Master Data Resources
  branches = resource({
    loader: async () => {
      const res = await firstValueFrom(this.proposalsService.getBranches());
      return res.data.map(b => ({ label: b.branch_name, value: b.id }));
    }
  });

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
  branchId = linkedSignal(() => this.record()?.branch_id || null);
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
      branch_id: this.branchId(),
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

    this.proposalsService.updateAccountThisBank(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Account info saved successfully' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save account info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
