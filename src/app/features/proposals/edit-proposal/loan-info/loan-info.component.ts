import { Component, input, output, signal, effect, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { 
  TextFieldComponent, 
  SelectFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  CheckboxFieldComponent
} from '../../../../shared/components/form';
import { LoanTypeService } from '../../../admin/services/masters.service';
import { CurrencyService } from '../../../../core/services/currency.service';

const INSTALLMENT_TYPE_OPTIONS = [
  { label: 'Monthly (EMI)', value: 'monthly' },
  { label: 'Quarterly',     value: 'quarterly' },
  { label: 'Half-Yearly',   value: 'half_yearly' },
  { label: 'Yearly',        value: 'yearly' },
  { label: 'Bullet',        value: 'bullet' }
];

const INDUSTRY_MARKING_OPTIONS = [
  { label: 'Growing of Rubber Trees', value: 'Rubber' },
  { label: 'Growing of Fruit Crops, Orchards', value: 'Fruit' },
  { label: 'Growing of Edible Nuts including Coconuts', value: 'Nuts' },
  { label: 'Growing of Spice Crops', value: 'Spice' },
  { label: 'Growing of Other Plantation Crops', value: 'OtherPlantation' },
  { label: 'Farm Machinery and Implements', value: 'Machinery' },
  { label: 'Farm Transport Vehicles', value: 'TransportVehicles' },
  { label: 'Soil/Land/Farm Development', value: 'Development' },
  { label: 'Farm Irrigation', value: 'Irrigation' },
  { label: 'Harvesting & activities related to harvesting', value: 'Harvesting' },
  { label: 'Other Direct Finance to Agriculture', value: 'DirectAgri' },
  { label: 'Storage & Market yards', value: 'StorageYear' },
  { label: 'Indirect Finance to Agriculture', value: 'IndirectAgri' },
  { label: 'Dairying', value: 'Dairying' },
  { label: 'Rearing of Goats etc.', value: 'Goats' },
  { label: 'Rearing of Poultry etc.', value: 'Poultry' },
  { label: 'Rearing of silk worms', value: 'SilkWorms' },
  { label: 'Raising of Pigs/Rabbits/Bees etc', value: 'PigsRabbits' },
  { label: 'Cotton Ginning, Cleaning and Baling', value: 'Cotton' },
  { label: 'Biotechnology including Tissue Culture', value: 'Biotech' },
  { label: 'Agricultural Custom Service Units', value: 'CustomService' },
  { label: 'Forestry, Logging and Related Activities', value: 'Forestry' },
  { label: 'Aquaculture, Fishing, Hatcheries etc', value: 'Fishing' }
];

const PRIORITY_SECTOR_OPTIONS = [
  { label: 'Not Applicable', value: 'NA' },
  { label: '(0) Non Priority', value: 'NonPriority' },
  { label: '(1) Agriculture', value: 'Agriculture' },
  { label: '(2) MSME', value: 'MSME' },
  { label: '(3) Export Credit', value: 'ExportCredit' },
  { label: '(4) Education', value: 'Education' },
  { label: '(5) Housing', value: 'Housing' },
  { label: '(6) Social Infrastructure', value: 'SocialInfra' },
  { label: '(7) Renewable Energy', value: 'RenewableEnergy' },
  { label: '(8) Other', value: 'Other' }
];

const WEAKER_SECTOR_OPTIONS = [
  { label: 'Not Applicable', value: 'NA' },
  { label: '(0) Non Weaker', value: 'NonWeaker' },
  { label: '(1) Small & Marginal Farmer', value: 'SmallFarmer' },
  { label: '(2) Artisans, village and cottage industries (limit ≤ ₹1 lakh)', value: 'Artisans' },
  { label: '(3.1) Scheduled Castes', value: 'SC' },
  { label: '(3.2) Scheduled Tribes', value: 'ST' },
  { label: '(4) Self Help Groups', value: 'SHG' },
  { label: '(5) Distressed farmers', value: 'DistressedFarmer' },
  { label: '(6) Distressed persons (limit ≤ ₹1 lakh)', value: 'DistressedPerson' },
  { label: '(7) Women', value: 'Women' },
  { label: '(8) Persons with disabilities', value: 'PWD' },
  { label: '(9) PMJDY Overdrafts (upto ₹5,000)', value: 'PMJDY' },
  { label: '(10.1) Minority - Christian', value: 'MinorityChristian' },
  { label: '(10.2) Minority - Muslim', value: 'MinorityMuslim' },
  { label: '(10.3) Minority - Buddhist', value: 'MinorityBuddhist' },
  { label: '(10.4) Minority - Sikh', value: 'MinoritySikh' },
  { label: '(10.5) Minority - Zoroastrian', value: 'MinorityZoroastrian' },
  { label: '(10.6) Minority - Jain', value: 'MinorityJain' },
  { label: '(10.7) Minority - Other', value: 'MinorityOther' }
];

const REAL_ESTATE_MARKING_OPTIONS = [
  { label: 'Not Applicable', value: 'NA' },
  { label: '(CRE) Commercial Real Estate', value: 'CRE' },
  { label: '(CRE OTHER) Commercial Real Estate OTHER', value: 'CRE_OTHER' },
  { label: '(RE) Real Estate', value: 'RE' },
  { label: '(MSME) Micro Small Medium Enterprises', value: 'MSME' },
  { label: '(AGRI.) Agriculture & Agri. Allied Activities', value: 'AGRI' }
];



@Component({
  selector: 'app-loan-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextFieldComponent,
    SelectFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent
  ],
  templateUrl: './loan-info.component.html',
  styleUrls: ['./loan-info.component.scss']
})
export class LoanInfoComponent implements OnInit {
  private loanTypeService = inject(LoanTypeService);
  private currencyService = inject(CurrencyService);

  data = input<any>();
  loading = input<boolean>(false);
  changed = output<any>();
  save = output<any>();

  isDirty = signal(false);

  // ── Form fields ──────────────────────────────────────────
  loanType = signal<string | null>(null);
  reasonOfLoan = signal('');
  requestedAmount = signal<number | null>(null);
  requestedAmountWords = signal('');
  installmentType = signal<string | null>(null);
  durationMonths = signal<number | null>(null);
  interestRate = signal<number | null>(null);
  monthlyInstallment = signal<number | null>(null);

  // Advanced fields
  hasMoratorium = signal(false);
  moratoriumPeriod = signal<number | null>(null);

  hasInsurance = signal(false);
  insuranceAmount = signal<number | null>(null);

  isParticipationLoan = signal(false);
  participationDetails = signal<any[]>([]);

  // Calculations

  totalRequestedAmount = computed(() => {
    const loan = this.requestedAmount() || 0;
    const insurance = this.hasInsurance() ? (this.insuranceAmount() || 0) : 0;
    return loan + insurance;
  });

  // Options
  loanTypeOptions = signal<any[]>([]);
  installmentTypeOptions = INSTALLMENT_TYPE_OPTIONS;


  constructor() {
    // ── Effect: Auto-calculate Amount in Words ──────────────
    effect(() => {
      const amt = this.requestedAmount();
      if (amt !== null && amt !== undefined) {
        const words = this.currencyService.amountToWords(amt);
        if (words) {
          this.requestedAmountWords.set(words);
        }
      }
    }, { allowSignalWrites: true });

    // ── Effect: Auto-calculate EMI ──────────────────────────
    effect(() => {
      const p = this.requestedAmount();
      const r_annual = this.interestRate();
      const n = this.durationMonths();

      if (p && r_annual && n) {
        const r = (r_annual / 12) / 100;
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        this.monthlyInstallment.set(Math.ceil(emi / 5) * 5);
      } else {
        this.monthlyInstallment.set(null);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const d = this.data();
      if (d) this.patchForm(d);
    });
  }


  ngOnInit() {
    this.fetchLoanTypes();
  }

  private fetchLoanTypes() {
    this.loanTypeService.findAll().subscribe({
      next: (res) => {
        const options = res.data.map(t => ({
          label: t.type_name,
          value: t.type_code
        }));
        this.loanTypeOptions.set(options);
      },
      error: (err) => console.error('[LoanInfo] Failed to fetch loan types', err)
    });
  }

  private patchForm(d: any) {
    this.loanType.set(d.loan_type ?? null);
    this.reasonOfLoan.set(d.reason_of_loan ?? '');
    this.requestedAmount.set(d.requested_amount ?? null);
    this.requestedAmountWords.set(d.requested_amount_words ?? '');
    this.installmentType.set(d.installment_type ?? null);
    this.durationMonths.set(d.duration_months ?? null);
    this.interestRate.set(d.interest_rate ?? null);
    this.monthlyInstallment.set(d.monthly_installment ?? null);

    this.hasMoratorium.set(d.has_moratorium ?? false);
    this.moratoriumPeriod.set(d.moratorium_period ?? null);
    this.hasInsurance.set(d.has_insurance ?? false);
    this.insuranceAmount.set(d.insurance_amount ?? 0);
    this.isParticipationLoan.set(d.is_participation_loan ?? false);
    this.participationDetails.set(d.participation_details ?? []);
    
    this.isDirty.set(false);

  }

  addParticipationRow() {
    const current = this.participationDetails();
    this.participationDetails.set([
      ...current,
      { bank_name: '', role: '', loan_type: '', sanctioned_amount: 0, outstanding_amount: 0, share_percent: 0 }
    ]);
    this.onFieldChange();
  }

  removeParticipationRow(index: number) {
    const current = this.participationDetails();
    current.splice(index, 1);
    this.participationDetails.set([...current]);
    this.onFieldChange();
  }

  onFieldChange() {
    this.isDirty.set(true);
    this.changed.emit(this.getPayload());
  }

  getPayload() {
    return {
      loan_type: this.loanType(),
      reason_of_loan: this.reasonOfLoan(),
      requested_amount: this.requestedAmount(),
      requested_amount_words: this.requestedAmountWords(),
      installment_type: this.installmentType(),
      duration_months: this.durationMonths(),
      interest_rate: this.interestRate(),
      monthly_installment: this.monthlyInstallment(),

      has_moratorium: this.hasMoratorium(),
      moratorium_period: this.moratoriumPeriod(),
      has_insurance: this.hasInsurance(),
      insurance_amount: this.insuranceAmount(),
      total_requested_amount: this.totalRequestedAmount(),
      is_participation_loan: this.isParticipationLoan(),
      participation_details: this.participationDetails()
    };
  }

  onSave() {
    this.save.emit(this.getPayload());
  }
}
