import { Component, signal, inject, input, output, computed, linkedSignal, OnInit } from '@angular/core';
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
  SelectFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent,
  FormActionsComponent
} from '../../../../../shared/components/form';
import { FormDrawerRef } from '../../../../../core/services/drawer/form-drawer.ref';

@Component({
  selector: 'app-credit-loan-form',
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
    SelectFieldComponent,
    TextareaFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-loan-form.component.html',
  styleUrls: ['./credit-loan-form.component.scss']
})
export class CreditLoanFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  // Derive initial values from the drawer ref data
  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  // Master Data
  branches = signal<any[]>([]);
  loanTypes = signal<any[]>([]);

  // Field Signals
  branchId = linkedSignal(() => this.record()?.branch_id || null);
  accountNo = linkedSignal(() => this.record()?.account_no || '');
  loanTypeId = linkedSignal(() => this.record()?.loan_type_id || null);
  sanctionedAmount = linkedSignal(() => Number(this.record()?.sanctioned_amount) || 0);
  amountPaid = linkedSignal(() => Number(this.record()?.amount_paid) || 0);
  installmentAmount = linkedSignal(() => Number(this.record()?.installment_amount) || 0);
  loanOutstanding = linkedSignal(() => Number(this.record()?.loan_outstanding) || 0);
  loanOverdueAmount = linkedSignal(() => Number(this.record()?.loan_overdue_amount) || 0);
  dueMaturityDate = linkedSignal<Date | null>(() => this.record()?.due_maturity_date ? new Date(this.record().due_maturity_date) : null);
  isTimelyRepayment = linkedSignal(() => this.record()?.is_timely_repayment ?? true);
  disbursementDate = linkedSignal<Date | null>(() => this.record()?.disbursement_date ? new Date(this.record().disbursement_date) : null);
  mortgageDetails = linkedSignal(() => this.record()?.mortgage_details || '');
  willRepayLoan = linkedSignal(() => this.record()?.will_repay_loan ?? true);
  excessCollateralDetails = linkedSignal(() => this.record()?.excess_collateral_details || '');
  reportedToCibil = linkedSignal(() => this.record()?.reported_to_cibil ?? true);

  repaymentOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  ngOnInit() {
    this.loadMasterData();
  }

  private loadMasterData() {
    this.proposalsService.getBranches().subscribe({
      next: (res) => this.branches.set(res.data.map((b: any) => ({ label: b.branch_name, value: b.id })))
    });
    this.proposalsService.getLoanTypes().subscribe({
      next: (res) => this.loanTypes.set(res.data.map((t: any) => ({ label: t.type_name, value: t.id })))
    });
  }

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      branch_id: this.branchId(),
      account_no: this.accountNo(),
      loan_type_id: this.loanTypeId(),
      sanctioned_amount: this.sanctionedAmount(),
      amount_paid: this.amountPaid(),
      installment_amount: this.installmentAmount(),
      loan_outstanding: this.loanOutstanding(),
      loan_overdue_amount: this.loanOverdueAmount(),
      due_maturity_date: this.dueMaturityDate(),
      is_timely_repayment: this.isTimelyRepayment(),
      disbursement_date: this.disbursementDate(),
      mortgage_details: this.mortgageDetails(),
      will_repay_loan: this.willRepayLoan(),
      excess_collateral_details: this.excessCollateralDetails(),
      reported_to_cibil: this.reportedToCibil()
    };

    this.proposalsService.updateCreditLoanThisBank(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Loan info saved successfully' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save loan info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
