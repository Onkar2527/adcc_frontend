import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { CheckboxFieldComponent, TextareaFieldComponent } from '../../../../shared/components/form';
import { TableComponent, TableColumn, TableAction } from '../../../../shared/components/table/table.component';
import { ProposalsService } from '../../proposals.service';
import { CreditLoanFormComponent } from './credit-loan-form/credit-loan-form.component';
import { CreditOtherLoanFormComponent } from './credit-other-loan-form/credit-other-loan-form.component';
import { CreditGuaranteeFormComponent } from './credit-guarantee-form/credit-guarantee-form.component';
import { CreditOtherGuaranteeFormComponent } from './credit-other-guarantee-form/credit-other-guarantee-form.component';
import { CreditPreviousLoanThisFormComponent } from './credit-previous-loan-this-form/credit-previous-loan-this-form.component';
import { CreditPreviousLoanOtherFormComponent } from './credit-previous-loan-other-form/credit-previous-loan-other-form.component';
import { CreditAccountThisFormComponent } from './credit-account-this-form/credit-account-this-form.component';
import { CreditAccountOtherFormComponent } from './credit-account-other-form/credit-account-other-form.component';
import { CreditLifeInsuranceFormComponent } from './credit-life-insurance-form/credit-life-insurance-form.component';
import { CreditNewInsuranceFormComponent } from './credit-new-insurance-form/credit-new-insurance-form.component';
import { CreditRocDebtFormComponent } from './credit-roc-debt-form/credit-roc-debt-form.component';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { MessageService } from 'primeng/api';
import { effect } from '@angular/core';

@Component({
  selector: 'app-credit-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    TableModule,
    CheckboxFieldComponent,
    TextareaFieldComponent,
    TableComponent
  ],
  templateUrl: './credit-info.component.html',
  styleUrls: ['./credit-info.component.scss']
})
export class CreditInfoComponent implements OnInit {
  proposalId = input.required<string>();
  data = input<any>(null);
  changed = output<any>();
  save = output<any>();

  /** External trigger from parent sticky footer */
  externalSaveTrigger = input<number>(0);

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);
  private drawer = inject(FormDrawerService);

  // Core Checkbox fields
  hasLoanInThisBank = signal(false);
  
  // Detailed Loans Table State
  thisBankLoans = signal<any[]>([]);
  otherBanksLoans = signal<any[]>([]);
  guaranteesThisBank = signal<any[]>([]);
  otherBanksGuarantees = signal<any[]>([]);
  previousLoansThisBank = signal<any[]>([]);
  previousOtherLoans = signal<any[]>([]);
  accountsThisBank = signal<any[]>([]);
  accountsOtherBanks = signal<any[]>([]);
  lifeInsurances = signal<any[]>([]);
  newInsurances = signal<any[]>([]);
  rocDebts = signal<any[]>([]);
  
  loadingLoans = signal(false);
  loadingOtherLoans = signal(false);
  loadingGuarantees = signal(false);
  loadingOtherGuarantees = signal(false);
  loadingPreviousLoans = signal(false);
  loadingPreviousOtherLoans = signal(false);
  loadingAccounts = signal(false);
  loadingAccountsOther = signal(false);
  loadingLifeInsurances = signal(false);
  loadingNewInsurances = signal(false);
  loadingRocDebts = signal(false);

  loanCols: TableColumn[] = [
    { field: 'branch_name', header: 'Branch', sortable: true },
    { field: 'account_no', header: 'Account No' },
    { field: 'loan_type_name', header: 'Loan Type', sortable: true },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'loan_outstanding', header: 'Outstanding', type: 'currency', align: 'right' },
    { field: 'due_maturity_date', header: 'Due Date', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  otherLoanCols: TableColumn[] = [
    { field: 'bank_institute_name', header: 'Bank/Institute', sortable: true },
    { field: 'branch_name', header: 'Branch' },
    { field: 'loan_type', header: 'Loan Type' },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'loan_outstanding', header: 'Outstanding', type: 'currency', align: 'right' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  guaranteeCols: TableColumn[] = [
    { field: 'borrower_name', header: 'Borrower Name', sortable: true },
    { field: 'branch_name', header: 'Branch' },
    { field: 'account_no', header: 'Account No' },
    { field: 'loan_type_name', header: 'Loan Type' },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'loan_outstanding', header: 'Outstanding', type: 'currency', align: 'right' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  otherGuaranteeCols: TableColumn[] = [
    { field: 'borrower_name', header: 'Borrower', sortable: true },
    { field: 'bank_institute_name', header: 'Bank/Institute' },
    { field: 'branch_name', header: 'Branch' },
    { field: 'loan_type', header: 'Loan Type' },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'loan_outstanding', header: 'Outstanding', type: 'currency', align: 'right' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  previousLoanCols: TableColumn[] = [
    { field: 'branch_name', header: 'Branch', sortable: true },
    { field: 'loan_type_name', header: 'Loan Type' },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'sanctioned_date', header: 'Sanctioned Date', type: 'date', align: 'center' },
    { field: 'account_close_date', header: 'Close Date', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  previousOtherLoanCols: TableColumn[] = [
    { field: 'bank_name', header: 'Bank Name', sortable: true },
    { field: 'branch_name', header: 'Branch' },
    { field: 'loan_type', header: 'Loan Type' },
    { field: 'sanctioned_amount', header: 'Sanctioned', type: 'currency', align: 'right' },
    { field: 'account_close_date', header: 'Close Date', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  accountCols: TableColumn[] = [
    { field: 'branch_name', header: 'Branch', sortable: true },
    { field: 'account_type', header: 'Type' },
    { field: 'account_no', header: 'Account No' },
    { field: 'amount', header: 'Balance', type: 'currency', align: 'right' },
    { field: 'opening_date', header: 'Opened', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  insuranceCols: TableColumn[] = [
    { field: 'company_name', header: 'Company', sortable: true },
    { field: 'policy_number', header: 'Policy No' },
    { field: 'policy_amount', header: 'Sum Assured', type: 'currency', align: 'right' },
    { field: 'premium_amount_yearly', header: 'Yearly Premium', type: 'currency', align: 'right' },
    { field: 'maturity_date', header: 'Maturity', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  newInsuranceCols: TableColumn[] = [
    { field: 'company_name', header: 'Company', sortable: true },
    { field: 'policy_amount', header: 'Proposed Amount', type: 'currency', align: 'right' },
    { field: 'premium_amount_yearly', header: 'Yearly Premium', type: 'currency', align: 'right' },
    { field: 'is_loan_sought_for_premium', header: 'Premium Loan?', type: 'boolean', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  rocCols: TableColumn[] = [
    { field: 'srn', header: 'SRN', sortable: true },
    { field: 'charge_id', header: 'Charge ID' },
    { field: 'creation_date', header: 'Creation Date', type: 'date', align: 'center' },
    { field: 'charge_amount', header: 'Amount', type: 'currency', align: 'right' },
    { field: 'charge_holder', header: 'Charge Holder' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  accountOtherCols: TableColumn[] = [
    { field: 'bank_name', header: 'Bank Name', sortable: true },
    { field: 'branch_name', header: 'Branch' },
    { field: 'account_type', header: 'Type' },
    { field: 'amount', header: 'Balance', type: 'currency', align: 'right' },
    { field: 'opening_date', header: 'Opened', type: 'date', align: 'center' },
    { field: 'edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', width: '3rem', align: 'center' },
    { field: 'delete', header: 'Delete', type: 'action', actionIcon: 'pi pi-trash', width: '3rem', align: 'center', cssClass: 'text-red-500' }
  ];

  hasLoanInOtherBanks = signal(false);
  hasGuaranteeInThisBank = signal(false);
  hasGuaranteeInOtherBanks = signal(false);
  hasPreviousLoanInThisBank = signal(false);
  hasPreviousLoanInOtherBanks = signal(false);
  hasAccountInThisBank = signal(false);
  hasAccountInOtherBanks = signal(false);
  hasLifeInsurance = signal(false);
  willDoNewInsurance = signal(false);
  hasRocDebtRecord = signal(false);
  hasNoDuesCertificate = signal(false);
  hasOtherCollateral = signal(false);
  hasLoanStatement = signal(false);
  hasOtherMortgageShare = signal(false);

  // Remarks Signals
  loansThisBankRemarks = signal('');
  loansOtherBanksRemarks = signal('');
  guaranteesThisBankRemarks = signal('');
  guaranteesOtherBanksRemarks = signal('');
  previousLoansThisBankRemarks = signal('');
  previousLoansOtherBanksRemarks = signal('');
  accountsThisBankRemarks = signal('');
  accountsOtherBanksRemarks = signal('');
  lifeInsuranceRemarks = signal('');
  newInsuranceRemarks = signal('');
  rocDebtsRemarks = signal('');

  // Details Signals
  noDuesCertificateDetails = signal('');
  otherCollateralDetails = signal('');
  otherMortgageShareDetails = signal('');

  creditInfoId = signal<number | null>(null);

  private lastHandledTrigger = -1;

  constructor() {
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

    // Automatic data fetching when sections are enabled
    effect(() => { if (this.hasLoanInThisBank() && this.proposalId()) this.fetchLoans(); });
    effect(() => { if (this.hasLoanInOtherBanks() && this.proposalId()) this.fetchOtherLoans(); });
    effect(() => { if (this.hasGuaranteeInThisBank() && this.proposalId()) this.fetchGuarantees(); });
    effect(() => { if (this.hasGuaranteeInOtherBanks() && this.proposalId()) this.fetchOtherGuarantees(); });
    effect(() => { if (this.hasPreviousLoanInThisBank() && this.proposalId()) this.fetchPreviousLoans(); });
    effect(() => { if (this.hasPreviousLoanInOtherBanks() && this.proposalId()) this.fetchPreviousOtherLoans(); });
    effect(() => { if (this.hasAccountInThisBank() && this.proposalId()) this.fetchAccounts(); });
    effect(() => { if (this.hasAccountInOtherBanks() && this.proposalId()) this.fetchAccountsOther(); });
    effect(() => { if (this.hasLifeInsurance() && this.proposalId()) this.fetchLifeInsurances(); });
    effect(() => { if (this.willDoNewInsurance() && this.proposalId()) this.fetchNewInsurances(); });
    effect(() => { if (this.hasRocDebtRecord() && this.proposalId()) this.fetchRocDebts(); });
  }

  ngOnInit() {
    if (this.data()) {
      this.patchForm(this.data());
    } else if (this.proposalId()) {
      this.fetchCreditInfo();
    }
  }

  fetchCreditInfo() {
    this.proposalsService.getCreditInfo(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        if (res.data) this.patchForm(res.data);
      }
    });
  }

  patchForm(data: any) {
    if (!data) return;
    this.hasLoanInThisBank.set(!!data.has_loan_in_this_bank);
    this.hasLoanInOtherBanks.set(!!data.has_loan_in_other_banks);
    this.hasGuaranteeInThisBank.set(!!data.has_guarantee_in_this_bank);
    this.hasGuaranteeInOtherBanks.set(!!data.has_guarantee_in_other_banks);
    this.hasPreviousLoanInThisBank.set(!!data.has_previous_loan_in_this_bank);
    this.hasPreviousLoanInOtherBanks.set(!!data.has_previous_loan_in_other_banks);
    this.hasAccountInThisBank.set(!!data.has_account_in_this_bank);
    this.hasAccountInOtherBanks.set(!!data.has_account_in_other_banks);
    this.hasLifeInsurance.set(!!data.has_life_insurance);
    this.willDoNewInsurance.set(!!data.will_do_new_insurance);
    this.hasRocDebtRecord.set(!!data.has_roc_debt_record);
    this.hasNoDuesCertificate.set(!!data.has_no_dues_certificate);
    this.hasOtherCollateral.set(!!data.has_other_collateral);
    this.hasLoanStatement.set(!!data.has_loan_statement);
    this.hasOtherMortgageShare.set(!!data.has_other_mortgage_share);
    this.creditInfoId.set(data.id || null);

    // Patch Remarks
    this.loansThisBankRemarks.set(data.loans_this_bank_remarks || '');
    this.loansOtherBanksRemarks.set(data.loans_other_banks_remarks || '');
    this.guaranteesThisBankRemarks.set(data.guarantees_this_bank_remarks || '');
    this.guaranteesOtherBanksRemarks.set(data.guarantees_other_banks_remarks || '');
    this.previousLoansThisBankRemarks.set(data.previous_loans_this_bank_remarks || '');
    this.previousLoansOtherBanksRemarks.set(data.previous_loans_other_banks_remarks || '');
    this.accountsThisBankRemarks.set(data.accounts_this_bank_remarks || '');
    this.accountsOtherBanksRemarks.set(data.accounts_other_banks_remarks || '');
    this.lifeInsuranceRemarks.set(data.life_insurance_remarks || '');
    this.newInsuranceRemarks.set(data.new_insurance_remarks || '');
    this.rocDebtsRemarks.set(data.roc_debts_remarks || '');

    // Patch Details
    this.noDuesCertificateDetails.set(data.no_dues_certificate_details || '');
    this.otherCollateralDetails.set(data.other_collateral_details || '');
    this.otherMortgageShareDetails.set(data.other_mortgage_share_details || '');
  }

  onFieldChange() {
    // Standard event emitter linking to backend synchronizer
    this.changed.emit(this.getPayload());
  }

  getPayload() {
    return {
      has_loan_in_this_bank: this.hasLoanInThisBank(),
      has_loan_in_other_banks: this.hasLoanInOtherBanks(),
      has_guarantee_in_this_bank: this.hasGuaranteeInThisBank(),
      has_guarantee_in_other_banks: this.hasGuaranteeInOtherBanks(),
      has_previous_loan_in_this_bank: this.hasPreviousLoanInThisBank(),
      has_previous_loan_in_other_banks: this.hasPreviousLoanInOtherBanks(),
      has_account_in_this_bank: this.hasAccountInThisBank(),
      has_account_in_other_banks: this.hasAccountInOtherBanks(),
      has_life_insurance: this.hasLifeInsurance(),
      will_do_new_insurance: this.willDoNewInsurance(),
      has_roc_debt_record: this.hasRocDebtRecord(),
      has_no_dues_certificate: this.hasNoDuesCertificate(),
      has_other_collateral: this.hasOtherCollateral(),
      has_loan_statement: this.hasLoanStatement(),
      has_other_mortgage_share: this.hasOtherMortgageShare(),
      
      // Remarks
      loans_this_bank_remarks: this.loansThisBankRemarks(),
      loans_other_banks_remarks: this.loansOtherBanksRemarks(),
      guarantees_this_bank_remarks: this.guaranteesThisBankRemarks(),
      guarantees_other_banks_remarks: this.guaranteesOtherBanksRemarks(),
      previous_loans_this_bank_remarks: this.previousLoansThisBankRemarks(),
      previous_loans_other_banks_remarks: this.previousLoansOtherBanksRemarks(),
      accounts_this_bank_remarks: this.accountsThisBankRemarks(),
      accounts_other_banks_remarks: this.accountsOtherBanksRemarks(),
      life_insurance_remarks: this.lifeInsuranceRemarks(),
      new_insurance_remarks: this.newInsuranceRemarks(),
      roc_debts_remarks: this.rocDebtsRemarks(),

      // Details
      no_dues_certificate_details: this.noDuesCertificateDetails(),
      other_collateral_details: this.otherCollateralDetails(),
      other_mortgage_share_details: this.otherMortgageShareDetails()
    };
  }
  onSave() {
    this.save.emit({
      payload: this.getPayload(),
      entityType: this.entityType(),
      participantId: this.participantId()
    });
  }

  // --- Table Actions ---
  fetchLoans() {
    this.loadingLoans.set(true);
    this.proposalsService.getCreditLoansThisBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.thisBankLoans.set(res.data);
        this.loadingLoans.set(false);
      },
      error: (err) => {
        this.loadingLoans.set(false);
        console.error('Failed to fetch loans', err);
      }
    });
  }

  async addLoan() {
    const res = await this.drawer.open(CreditLoanFormComponent, {
      header: 'Add Loan Info',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });

    if (res.saved) {
      this.onLoanSaved();
    }
  }

  async editLoan(loan: any) {
    const res = await this.drawer.open(CreditLoanFormComponent, {
      header: 'Edit Loan Info',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: loan
      }
    });

    if (res.saved) {
      this.onLoanSaved();
    }
  }

  deleteLoan(loan: any) {
    if (confirm('Are you sure you want to delete this loan record?')) {
      this.proposalsService.deleteCreditLoanThisBank(loan.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Loan record deleted' });
          this.fetchLoans();
        }
      });
    }
  }

  onLoanSaved() {
    this.fetchLoans();
    this.changed.emit(this.getPayload());
  }

  fetchOtherLoans() {
    this.loadingOtherLoans.set(true);
    this.proposalsService.getCreditLoansOtherBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.otherBanksLoans.set(res.data);
        this.loadingOtherLoans.set(false);
      },
      error: () => this.loadingOtherLoans.set(false)
    });
  }

  async addOtherLoan() {
    const res = await this.drawer.open(CreditOtherLoanFormComponent, {
      header: 'Add Other Bank Loan',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onOtherLoanSaved();
  }

  async editOtherLoan(loan: any) {
    const res = await this.drawer.open(CreditOtherLoanFormComponent, {
      header: 'Edit Other Bank Loan',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: loan
      }
    });
    if (res.saved) this.onOtherLoanSaved();
  }

  deleteOtherLoan(loan: any) {
    if (confirm('Are you sure you want to delete this external loan record?')) {
      this.proposalsService.deleteCreditLoanOtherBank(loan.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Loan record deleted' });
          this.fetchOtherLoans();
        }
      });
    }
  }

  onOtherLoanSaved() {
    this.fetchOtherLoans();
    this.changed.emit(this.getPayload());
  }

  fetchGuarantees() {
    this.loadingGuarantees.set(true);
    this.proposalsService.getCreditGuaranteesThisBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.guaranteesThisBank.set(res.data);
        this.loadingGuarantees.set(false);
      },
      error: () => this.loadingGuarantees.set(false)
    });
  }

  async addGuarantee() {
    const res = await this.drawer.open(CreditGuaranteeFormComponent, {
      header: 'Add Guarantee Info',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onGuaranteeSaved();
  }

  async editGuarantee(guarantee: any) {
    const res = await this.drawer.open(CreditGuaranteeFormComponent, {
      header: 'Edit Guarantee Info',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: guarantee
      }
    });
    if (res.saved) this.onGuaranteeSaved();
  }

  deleteGuarantee(guarantee: any) {
    if (confirm('Are you sure you want to delete this guarantee record?')) {
      this.proposalsService.deleteCreditGuaranteeThisBank(guarantee.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Guarantee record deleted' });
          this.fetchGuarantees();
        }
      });
    }
  }

  onGuaranteeSaved() {
    this.fetchGuarantees();
    this.changed.emit(this.getPayload());
  }

  fetchOtherGuarantees() {
    this.loadingOtherGuarantees.set(true);
    this.proposalsService.getCreditGuaranteesOtherBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.otherBanksGuarantees.set(res.data);
        this.loadingOtherGuarantees.set(false);
      },
      error: () => this.loadingOtherGuarantees.set(false)
    });
  }

  async addOtherGuarantee() {
    const res = await this.drawer.open(CreditOtherGuaranteeFormComponent, {
      header: 'Add Other Bank Guarantee',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onOtherGuaranteeSaved();
  }

  async editOtherGuarantee(guarantee: any) {
    const res = await this.drawer.open(CreditOtherGuaranteeFormComponent, {
      header: 'Edit Other Bank Guarantee',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: guarantee
      }
    });
    if (res.saved) this.onOtherGuaranteeSaved();
  }

  deleteOtherGuarantee(guarantee: any) {
    if (confirm('Are you sure you want to delete this external guarantee record?')) {
      this.proposalsService.deleteCreditGuaranteeOtherBank(guarantee.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Guarantee record deleted' });
          this.fetchOtherGuarantees();
        }
      });
    }
  }

  onOtherGuaranteeSaved() {
    this.fetchOtherGuarantees();
    this.changed.emit(this.getPayload());
  }

  fetchPreviousLoans() {
    this.loadingPreviousLoans.set(true);
    this.proposalsService.getPreviousLoansThisBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.previousLoansThisBank.set(res.data);
        this.loadingPreviousLoans.set(false);
      },
      error: () => this.loadingPreviousLoans.set(false)
    });
  }

  async addPreviousLoan() {
    const res = await this.drawer.open(CreditPreviousLoanThisFormComponent, {
      header: 'Add Previous Loan History',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onPreviousLoanSaved();
  }

  async editPreviousLoan(loan: any) {
    const res = await this.drawer.open(CreditPreviousLoanThisFormComponent, {
      header: 'Edit Previous Loan History',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: loan
      }
    });
    if (res.saved) this.onPreviousLoanSaved();
  }

  deletePreviousLoan(loan: any) {
    if (confirm('Are you sure you want to delete this historical loan record?')) {
      this.proposalsService.deletePreviousLoanThisBank(loan.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Historical record deleted' });
          this.fetchPreviousLoans();
        }
      });
    }
  }

  onPreviousLoanSaved() {
    this.fetchPreviousLoans();
    this.changed.emit(this.getPayload());
  }

  fetchPreviousOtherLoans() {
    this.loadingPreviousOtherLoans.set(true);
    this.proposalsService.getPreviousLoansOtherBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.previousOtherLoans.set(res.data);
        this.loadingPreviousOtherLoans.set(false);
      },
      error: () => this.loadingPreviousOtherLoans.set(false)
    });
  }

  async addPreviousOtherLoan() {
    const res = await this.drawer.open(CreditPreviousLoanOtherFormComponent, {
      header: 'Add Other Bank Previous Loan',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onPreviousOtherLoanSaved();
  }

  async editPreviousOtherLoan(loan: any) {
    const res = await this.drawer.open(CreditPreviousLoanOtherFormComponent, {
      header: 'Edit Other Bank Previous Loan',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: loan
      }
    });
    if (res.saved) this.onPreviousOtherLoanSaved();
  }

  deletePreviousOtherLoan(loan: any) {
    if (confirm('Are you sure you want to delete this historical loan record?')) {
      this.proposalsService.deletePreviousLoanOtherBank(loan.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Historical record deleted' });
          this.fetchPreviousOtherLoans();
        }
      });
    }
  }

  onPreviousOtherLoanSaved() {
    this.fetchPreviousOtherLoans();
    this.changed.emit(this.getPayload());
  }

  fetchAccounts() {
    this.loadingAccounts.set(true);
    this.proposalsService.getAccountsThisBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.accountsThisBank.set(res.data);
        this.loadingAccounts.set(false);
      },
      error: () => this.loadingAccounts.set(false)
    });
  }

  async addAccount() {
    const res = await this.drawer.open(CreditAccountThisFormComponent, {
      header: 'Add Account Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onAccountSaved();
  }

  async editAccount(account: any) {
    const res = await this.drawer.open(CreditAccountThisFormComponent, {
      header: 'Edit Account Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: account
      }
    });
    if (res.saved) this.onAccountSaved();
  }

  deleteAccount(account: any) {
    if (confirm('Are you sure you want to delete this account record?')) {
      this.proposalsService.deleteAccountThisBank(account.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Account record deleted' });
          this.fetchAccounts();
        }
      });
    }
  }

  onAccountSaved() {
    this.fetchAccounts();
    this.changed.emit(this.getPayload());
  }

  fetchAccountsOther() {
    this.loadingAccountsOther.set(true);
    this.proposalsService.getAccountsOtherBank(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.accountsOtherBanks.set(res.data);
        this.loadingAccountsOther.set(false);
      },
      error: () => this.loadingAccountsOther.set(false)
    });
  }

  async addAccountOther() {
    const res = await this.drawer.open(CreditAccountOtherFormComponent, {
      header: 'Add Other Bank Account Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onAccountOtherSaved();
  }

  async editAccountOther(account: any) {
    const res = await this.drawer.open(CreditAccountOtherFormComponent, {
      header: 'Edit Other Bank Account Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: account
      }
    });
    if (res.saved) this.onAccountOtherSaved();
  }

  deleteAccountOther(account: any) {
    if (confirm('Are you sure you want to delete this external account record?')) {
      this.proposalsService.deleteAccountOtherBank(account.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'External account record deleted' });
          this.fetchAccountsOther();
        }
      });
    }
  }

  onAccountOtherSaved() {
    this.fetchAccountsOther();
    this.changed.emit(this.getPayload());
  }

  fetchLifeInsurances() {
    this.loadingLifeInsurances.set(true);
    this.proposalsService.getLifeInsurances(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.lifeInsurances.set(res.data);
        this.loadingLifeInsurances.set(false);
      },
      error: () => this.loadingLifeInsurances.set(false)
    });
  }

  async addLifeInsurance() {
    const res = await this.drawer.open(CreditLifeInsuranceFormComponent, {
      header: 'Add Life Insurance Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onInsuranceSaved();
  }

  async editLifeInsurance(record: any) {
    const res = await this.drawer.open(CreditLifeInsuranceFormComponent, {
      header: 'Edit Life Insurance Record',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: record
      }
    });
    if (res.saved) this.onInsuranceSaved();
  }

  deleteLifeInsurance(record: any) {
    if (confirm('Are you sure you want to delete this insurance record?')) {
      this.proposalsService.deleteLifeInsurance(record.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Insurance record deleted' });
          this.fetchLifeInsurances();
        }
      });
    }
  }

  onInsuranceSaved() {
    this.fetchLifeInsurances();
    this.changed.emit(this.getPayload());
  }

  fetchNewInsurances() {
    this.loadingNewInsurances.set(true);
    this.proposalsService.getNewInsurances(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.newInsurances.set(res.data);
        this.loadingNewInsurances.set(false);
      },
      error: () => this.loadingNewInsurances.set(false)
    });
  }

  async addNewInsurance() {
    const res = await this.drawer.open(CreditNewInsuranceFormComponent, {
      header: 'Add New Proposed Policy',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onNewInsuranceSaved();
  }

  async editNewInsurance(record: any) {
    const res = await this.drawer.open(CreditNewInsuranceFormComponent, {
      header: 'Edit Proposed Policy',
      width: '60rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: record
      }
    });
    if (res.saved) this.onNewInsuranceSaved();
  }

  deleteNewInsurance(record: any) {
    if (confirm('Are you sure you want to delete this proposed insurance record?')) {
      this.proposalsService.deleteNewInsurance(record.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Proposed insurance record deleted' });
          this.fetchNewInsurances();
        }
      });
    }
  }

  onNewInsuranceSaved() {
    this.fetchNewInsurances();
    this.changed.emit(this.getPayload());
  }

  fetchRocDebts() {
    this.loadingRocDebts.set(true);
    this.proposalsService.getRocDebts(this.proposalId(), this.entityType(), this.participantId()).subscribe({
      next: (res) => {
        this.rocDebts.set(res.data);
        this.loadingRocDebts.set(false);
      },
      error: () => this.loadingRocDebts.set(false)
    });
  }

  async addRocDebt() {
    const res = await this.drawer.open(CreditRocDebtFormComponent, {
      header: 'Add ROC Charge Record',
      width: '50rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId()
      }
    });
    if (res.saved) this.onRocDebtSaved();
  }

  async editRocDebt(record: any) {
    const res = await this.drawer.open(CreditRocDebtFormComponent, {
      header: 'Edit ROC Charge Record',
      width: '50rem',
      data: {
        proposalId: this.proposalId(),
        creditInfoId: this.creditInfoId(),
        record: record
      }
    });
    if (res.saved) this.onRocDebtSaved();
  }

  deleteRocDebt(record: any) {
    if (confirm('Are you sure you want to delete this ROC charge record?')) {
      this.proposalsService.deleteRocDebt(record.id).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Charge record deleted' });
          this.fetchRocDebts();
        }
      });
    }
  }

  onRocDebtSaved() {
    this.fetchRocDebts();
    this.changed.emit(this.getPayload());
  }

  handleAction(event: { name: string, row: any }, tableType: 'this' | 'other' | 'guarantee' | 'otherGuarantee' | 'previous' | 'previousOther' | 'account' | 'accountOther' | 'insurance' | 'newInsurance' | 'rocDebt') {
    if (tableType === 'this') {
      if (event.name === 'edit') this.editLoan(event.row);
      else if (event.name === 'delete') this.deleteLoan(event.row);
    } else if (tableType === 'other') {
      if (event.name === 'edit') this.editOtherLoan(event.row);
      else if (event.name === 'delete') this.deleteOtherLoan(event.row);
    } else if (tableType === 'guarantee') {
      if (event.name === 'edit') this.editGuarantee(event.row);
      else if (event.name === 'delete') this.deleteGuarantee(event.row);
    } else if (tableType === 'otherGuarantee') {
      if (event.name === 'edit') this.editOtherGuarantee(event.row);
      else if (event.name === 'delete') this.deleteOtherGuarantee(event.row);
    } else if (tableType === 'previous') {
      if (event.name === 'edit') this.editPreviousLoan(event.row);
      else if (event.name === 'delete') this.deletePreviousLoan(event.row);
    } else if (tableType === 'previousOther') {
      if (event.name === 'edit') this.editPreviousOtherLoan(event.row);
      else if (event.name === 'delete') this.deletePreviousOtherLoan(event.row);
    } else if (tableType === 'account') {
      if (event.name === 'edit') this.editAccount(event.row);
      else if (event.name === 'delete') this.deleteAccount(event.row);
    } else if (tableType === 'accountOther') {
      if (event.name === 'edit') this.editAccountOther(event.row);
      else if (event.name === 'delete') this.deleteAccountOther(event.row);
    } else if (tableType === 'insurance') {
      if (event.name === 'edit') this.editLifeInsurance(event.row);
      else if (event.name === 'delete') this.deleteLifeInsurance(event.row);
    } else if (tableType === 'newInsurance') {
      if (event.name === 'edit') this.editNewInsurance(event.row);
      else if (event.name === 'delete') this.deleteNewInsurance(event.row);
    } else {
      if (event.name === 'edit') this.editRocDebt(event.row);
      else if (event.name === 'delete') this.deleteRocDebt(event.row);
    }
  }
}
