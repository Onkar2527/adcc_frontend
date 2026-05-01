import { Component, input, output, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { 
  TextFieldComponent, 
  SelectFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  DateFieldComponent,
  CheckboxFieldComponent
} from '../../../../shared/components/form';
import { ProposalsService } from '../../proposals.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-financial-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    TextFieldComponent,
    SelectFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent
  ],
  templateUrl: './financial-info.component.html',
  styleUrls: ['./financial-info.component.scss']
})
export class FinancialInfoComponent implements OnInit {
  proposalId = input.required<string>();
  data = input<any>(null);
  loading = signal(false);
  changed = output<any>();
  save = output<any>();

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  /** External trigger from parent sticky footer */
  externalSaveTrigger = input<number>(0);

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  // Section 1: Bank Details
  bankName = signal('');
  accountNumber = signal('');

  // Section 2: Income Tax
  isItrFiled = signal(false);
  itrFinancialYear = signal<string | null>(null);
  itrIncomeAmount = signal<number | null>(null);
  itrTaxAmount = signal<number | null>(null);

  // Section 3: Property Tax
  paysPropertyTax = signal(false);
  wealthAmount = signal<number | null>(null);
  propertyTaxAmount = signal<number | null>(null);
  lastAssessmentYear = signal<string | null>(null);

  // Section 4: Investments
  hasInvestments = signal(false);
  investmentDetails = signal('');

  // Section 5: CIBIL
  hasCibil = signal(false);
  cibilType = signal('');
  cibilDate = signal<Date | null>(null);
  cibilCmr = signal('');
  cibilDetails = signal('');

  // Options
  financialYearOptions: any[] = [];
  assessmentYearOptions: any[] = [];

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
  }

  ngOnInit() {
    this.generateYearOptions();
    if (this.data()) {
      this.patchForm(this.data());
    } else {
      this.fetchFinancialInfo();
    }
  }

  private fetchFinancialInfo() {
    this.loading.set(true);
    this.proposalsService.getFinancialInfo(this.proposalId(), this.entityType(), this.participantId() ?? undefined).subscribe({
      next: (res) => {
        this.patchForm(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const financialYears = [];
    const assessmentYears = [];

    // Last 10 financial years
    for (let i = 0; i < 10; i++) {
      const startYear = currentYear - i;
      const endYear = (startYear + 1).toString().slice(-2);
      const label = `${startYear}-${endYear}`;
      financialYears.push({ label, value: label });
      
      // Assessment years are just single years usually
      assessmentYears.push({ label: startYear.toString(), value: startYear.toString() });
    }

    this.financialYearOptions = financialYears;
    this.assessmentYearOptions = assessmentYears;
  }

  patchForm(data: any) {
    if (!data) return;
    this.bankName.set(data.bank_name || '');
    this.accountNumber.set(data.account_number || '');
    this.isItrFiled.set(data.is_itr_filed || false);
    this.itrFinancialYear.set(data.itr_financial_year || null);
    this.itrIncomeAmount.set(data.itr_income_amount ? Number(data.itr_income_amount) : null);
    this.itrTaxAmount.set(data.itr_tax_amount ? Number(data.itr_tax_amount) : null);
    this.paysPropertyTax.set(data.pays_property_tax || false);
    this.wealthAmount.set(data.wealth_amount ? Number(data.wealth_amount) : null);
    this.propertyTaxAmount.set(data.property_tax_amount ? Number(data.property_tax_amount) : null);
    this.lastAssessmentYear.set(data.last_assessment_year || null);
    this.hasInvestments.set(data.has_investments || false);
    this.investmentDetails.set(data.investment_details || '');
    this.hasCibil.set(data.has_cibil || false);
    this.cibilType.set(data.cibil_type || '');
    this.cibilDate.set(data.cibil_date ? new Date(data.cibil_date) : null);
    this.cibilCmr.set(data.cibil_cmr || '');
    this.cibilDetails.set(data.cibil_details || '');
  }

  onFieldChange() {
    this.changed.emit(this.getPayload());
  }

  getPayload() {
    return {
      bank_name: this.bankName(),
      account_number: this.accountNumber(),
      
      is_itr_filed: this.isItrFiled(),
      itr_financial_year: this.isItrFiled() ? this.itrFinancialYear() : null,
      itr_income_amount: this.isItrFiled() ? this.itrIncomeAmount() : null,
      itr_tax_amount: this.isItrFiled() ? this.itrTaxAmount() : null,
      
      pays_property_tax: this.paysPropertyTax(),
      wealth_amount: this.paysPropertyTax() ? this.wealthAmount() : null,
      property_tax_amount: this.paysPropertyTax() ? this.propertyTaxAmount() : null,
      last_assessment_year: this.paysPropertyTax() ? this.lastAssessmentYear() : null,
      
      has_investments: this.hasInvestments(),
      investment_details: this.hasInvestments() ? this.investmentDetails() : '',
      
      has_cibil: this.hasCibil(),
      cibil_type: this.hasCibil() ? this.cibilType() : '',
      cibil_date: this.hasCibil() ? this.cibilDate() : null,
      cibil_cmr: this.hasCibil() ? this.cibilCmr() : '',
      cibil_details: this.hasCibil() ? this.cibilDetails() : ''
    };
  }

  onSave() {
    const payload = this.getPayload();
    this.loading.set(true);
    this.proposalsService.updateFinancialInfo(this.proposalId(), payload, this.entityType(), this.participantId() ?? undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Financial info saved' });
        this.save.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
