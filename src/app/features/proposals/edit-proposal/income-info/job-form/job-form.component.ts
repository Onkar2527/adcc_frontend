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
  SelectFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-job-form',
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
    CheckboxFieldComponent
  ],
  templateUrl: './job-form.component.html',
  styleUrls: ['./job-form.component.scss']
})
export class JobFormComponent {
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
  employerName = linkedSignal(() => this.record()?.organization_name || '');
  employerType = linkedSignal(() => this.record()?.job_type || '');
  organizationContact = linkedSignal(() => this.record()?.organization_contact || '');
  branch = linkedSignal(() => this.record()?.branch || '');
  branchAddress = linkedSignal(() => this.record()?.branch_address || '');
  branchContact = linkedSignal(() => this.record()?.branch_contact || '');
  department = linkedSignal(() => this.record()?.department || '');
  designation = linkedSignal(() => this.record()?.designation || '');
  tokenNumber = linkedSignal(() => this.record()?.token_number || '');
  natureOfJob = linkedSignal(() => this.record()?.nature_of_job || '');
  jobDetails = linkedSignal(() => this.record()?.job_details || '');
  
  joiningDate = linkedSignal<Date | null>(() => this.record()?.service_date ? new Date(this.record().service_date) : null);
  confirmationDate = linkedSignal<Date | null>(() => this.record()?.permanent_date ? new Date(this.record().permanent_date) : null);
  retirementDate = linkedSignal<Date | null>(() => this.record()?.retirement_date ? new Date(this.record().retirement_date) : null);
  lastSalaryMonth = linkedSignal<Date | null>(() => this.record()?.last_salary_month ? new Date(this.record().last_salary_month) : null);
  yearsEmployed = linkedSignal<number | null>(() => this.record()?.years_employed || null);
  hasSalaryProof = linkedSignal<boolean>(() => this.record()?.has_salary_proof ?? false);
  salaryGrade = linkedSignal(() => this.record()?.salary_grade || '');

  // Transfer & Pension
  transferPossibility = linkedSignal<boolean>(() => this.record()?.transfer_possibility ?? false);
  transferPlace = linkedSignal(() => this.record()?.transfer_replacement_place || '');
  hasPensionScheme = linkedSignal<boolean>(() => this.record()?.has_pension_scheme ?? false);
  totalProvidentFund = linkedSignal<number>(() => Number(this.record()?.total_provident_fund) || 0);
  willDeductInstallment = linkedSignal<boolean>(() => this.record()?.will_deduct_installment ?? false);

  // Borrowing & Credit Society
  isBorrowed = linkedSignal<boolean>(() => this.record()?.is_borrowed ?? false);
  borrowedAmountToPay = linkedSignal<number>(() => Number(this.record()?.borrowed_amount_to_pay) || 0);
  hasCreditSociety = linkedSignal<boolean>(() => this.record()?.has_credit_society ?? false);
  isCreditSocietyMember = linkedSignal<boolean>(() => this.record()?.is_credit_society_member ?? false);
  creditSocietyInvestmentDetails = linkedSignal(() => this.record()?.credit_society_investment_details || '');
  creditSocietyLoanDetails = linkedSignal(() => this.record()?.credit_society_loan_details || '');

  // Salary Payout
  salaryPayoutMode = linkedSignal(() => this.record()?.salary_payout_mode || '');
  salaryBankName = linkedSignal(() => this.record()?.salary_bank_name || '');
  salaryBranchName = linkedSignal(() => this.record()?.salary_branch_name || '');
  salaryIfscCode = linkedSignal(() => this.record()?.salary_ifsc_code || '');

  // Organization Address
  orgAddress = linkedSignal(() => this.record()?.org_address || '');

  // Salary Components
  basicSalary = linkedSignal<number>(() => Number(this.record()?.basic_salary) || 0);
  gradePay = linkedSignal<number>(() => Number(this.record()?.grade_pay) || 0);
  dearnessAllowance = linkedSignal<number>(() => Number(this.record()?.da_amount) || 0);
  hra = linkedSignal<number>(() => Number(this.record()?.hra_amount) || 0);
  otherEarnings = linkedSignal<number>(() => Number(this.record()?.other_allowance) || 0);
  otherIncomeAmount = linkedSignal<number>(() => Number(this.record()?.other_income_amount) || 0);
  otherIncomeInfo = linkedSignal(() => this.record()?.other_income_info || '');

  // Deductions
  pfDeduction = linkedSignal<number>(() => Number(this.record()?.provident_fund) || 0);
  insuranceAmount = linkedSignal<number>(() => Number(this.record()?.insurance_amount) || 0);
  itDeduction = linkedSignal<number>(() => Number(this.record()?.professional_tax) || 0);
  loanDeduction = linkedSignal<number>(() => Number(this.record()?.loan_installment) || 0);
  savingsReduction = linkedSignal<number>(() => Number(this.record()?.savings_reduction) || 0);
  societyDeduction = linkedSignal<number>(() => Number(this.record()?.society_deduction) || 0);
  otherDeductions = linkedSignal<number>(() => Number(this.record()?.other_deduction_amount) || 0);
  otherDeductionInfo = linkedSignal(() => this.record()?.other_deduction_info || '');

  // Computed Totals
  totalGross = computed(() => {
    return this.basicSalary() + this.gradePay() + this.dearnessAllowance() + 
           this.hra() + this.otherEarnings() + this.otherIncomeAmount();
  });

  totalDeductions = computed(() => {
    return this.pfDeduction() + this.insuranceAmount() + this.itDeduction() + 
           this.loanDeduction() + this.savingsReduction() + this.societyDeduction() + 
           this.otherDeductions();
  });

  netSalary = computed(() => this.totalGross() - this.totalDeductions());

  // Options
  employerTypeOptions = [
    { label: 'Private', value: 'Private' },
    { label: 'Government', value: 'Government' },
    { label: 'Semi-government', value: 'Semi-government' }
  ];

  natureOptions = [
    { label: 'Permanent', value: 'Permanent' },
    { label: 'Temporary', value: 'Temporary' }
  ];

  salaryPayoutOptions = [
    { label: 'Bank', value: 'Bank' },
    { label: 'Cash', value: 'Cash' }
  ];

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      organization_name: this.employerName(),
      organization_contact: this.organizationContact(),
      branch: this.branch(),
      branch_address: this.branchAddress(),
      branch_contact: this.branchContact(),
      department: this.department(),
      designation: this.designation(),
      token_number: this.tokenNumber(),
      job_details: this.jobDetails(),
      job_type: this.employerType(),
      nature_of_job: this.natureOfJob(),
      service_date: this.joiningDate(),
      permanent_date: this.confirmationDate(),
      retirement_date: this.retirementDate(),
      last_salary_month: this.lastSalaryMonth(),
      years_employed: this.yearsEmployed(),
      has_salary_proof: this.hasSalaryProof(),
      salary_grade: this.salaryGrade(),

      basic_salary: this.basicSalary(),
      grade_pay: this.gradePay(),
      da_amount: this.dearnessAllowance(),
      hra_amount: this.hra(),
      other_allowance: this.otherEarnings(),
      other_income_amount: this.otherIncomeAmount(),
      other_income_info: this.otherIncomeInfo(),
      total_gross_salary: this.totalGross(),

      provident_fund: this.pfDeduction(),
      insurance_amount: this.insuranceAmount(),
      professional_tax: this.itDeduction(),
      loan_installment: this.loanDeduction(),
      savings_reduction: this.savingsReduction(),
      society_deduction: this.societyDeduction(),
      other_deduction_amount: this.otherDeductions(),
      other_deduction_info: this.otherDeductionInfo(),
      total_deduction: this.totalDeductions(),
      net_salary: this.netSalary(),

      transfer_possibility: this.transferPossibility(),
      transfer_replacement_place: this.transferPlace(),
      has_pension_scheme: this.hasPensionScheme(),
      total_provident_fund: this.totalProvidentFund(),
      will_deduct_installment: this.willDeductInstallment(),
      is_borrowed: this.isBorrowed(),
      borrowed_amount_to_pay: this.borrowedAmountToPay(),
      has_credit_society: this.hasCreditSociety(),
      is_credit_society_member: this.isCreditSocietyMember(),
      credit_society_investment_details: this.creditSocietyInvestmentDetails(),
      credit_society_loan_details: this.creditSocietyLoanDetails(),
      salary_payout_mode: this.salaryPayoutMode(),
      salary_bank_name: this.salaryBankName(),
      salary_branch_name: this.salaryBranchName(),
      salary_ifsc_code: this.salaryIfscCode(),
      org_address: this.orgAddress()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), 'job', payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Job income saved successfully' });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
