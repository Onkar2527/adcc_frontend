import { Component, signal, inject, input, output, computed, linkedSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
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
  selector: 'app-credit-other-loan-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    DividerModule,
    PanelModule,
    SelectButtonModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-other-loan-form.component.html',
  styles: [`
    .loan-form-container { overflow-x: hidden; }
    .panel-content { display: flex; flex-direction: column; gap: 20px; padding-top: 12px; }
    .form-footer { margin: 0 -1.5rem -1.5rem -1.5rem; border-radius: 0 0 1rem 1rem; }
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
export class CreditOtherLoanFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  // Field Signals
  bankCategory = linkedSignal(() => this.record()?.bank_category || 'coop');
  isSocietyMember = linkedSignal(() => this.record()?.is_society_member ?? false);
  bankInstituteName = linkedSignal(() => this.record()?.bank_institute_name || '');
  branchName = linkedSignal(() => this.record()?.branch_name || '');
  accountNo = linkedSignal(() => this.record()?.account_no || '');
  loanType = linkedSignal(() => this.record()?.loan_type || '');

  sanctionedAmount = linkedSignal(() => Number(this.record()?.sanctioned_amount) || 0);
  amountPaid = linkedSignal(() => Number(this.record()?.amount_paid) || 0);
  installmentAmount = linkedSignal(() => Number(this.record()?.installment_amount) || 0);
  loanOutstanding = linkedSignal(() => Number(this.record()?.loan_outstanding) || 0);
  loanOverdueAmount = linkedSignal(() => Number(this.record()?.loan_overdue_amount) || 0);
  dueMaturityDate = linkedSignal<Date | null>(() => this.record()?.due_maturity_date ? new Date(this.record().due_maturity_date) : null);
  isTimelyRepayment = linkedSignal(() => this.record()?.is_timely_repayment ?? true);
  mortgageDetails = linkedSignal(() => this.record()?.mortgage_details || '');
  willRepayLoan = linkedSignal(() => this.record()?.will_repay_loan ?? true);
  reportedToCibil = linkedSignal(() => this.record()?.reported_to_cibil ?? true);

  bankCategoryOptions = [
    { label: 'Co-Operative Bank/Society', value: 'coop' },
    { label: 'Nationalised Bank/Other', value: 'nationalised' }
  ];

  repaymentOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  ngOnInit() {}

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      bank_category: this.bankCategory(),
      is_society_member: this.isSocietyMember(),
      bank_institute_name: this.bankInstituteName(),
      branch_name: this.branchName(),
      account_no: this.accountNo(),
      loan_type: this.loanType(),
      sanctioned_amount: this.sanctionedAmount(),
      amount_paid: this.amountPaid(),
      installment_amount: this.installmentAmount(),
      loan_outstanding: this.loanOutstanding(),
      loan_overdue_amount: this.loanOverdueAmount(),
      due_maturity_date: this.dueMaturityDate(),
      is_timely_repayment: this.isTimelyRepayment(),
      mortgage_details: this.mortgageDetails(),
      will_repay_loan: this.willRepayLoan(),
      reported_to_cibil: this.reportedToCibil()
    };

    this.proposalsService.updateCreditLoanOtherBank(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'External loan info saved successfully' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save external loan info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
