import { Component, input, output, signal, effect, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { 
  TextFieldComponent, 
  SelectFieldComponent 
} from '../../../../shared/components/form';
import { LoanTypeService } from '../../../admin/services/masters.service';

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
  selector: 'app-bank-scheme',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    ButtonModule,
    TextFieldComponent,
    SelectFieldComponent
  ],
  templateUrl: './bank-scheme.component.html',
  styleUrls: ['./bank-scheme.component.scss']
})
export class BankSchemeComponent implements OnInit {
  private loanTypeService = inject(LoanTypeService);

  data = input<any>();
  loading = input<boolean>(false);
  changed = output<any>();
  save = output<any>();

  isDirty = signal(false);

  // ── MIS Fields ──────────────────────────────────────────
  bankLoanSchemeType = signal<string | null>(null);
  industryMarking = signal<string | null>(null);
  prioritySectorMarking = signal<string | null>(null);
  weakerSector = signal<string | null>(null);
  realEstateMarking = signal<string | null>(null);
  priorityCode = signal('');
  weakerCode = signal('');
  realEstateCode = signal('');

  // Options
  loanTypeOptions = signal<any[]>([]);
  industryOptions = INDUSTRY_MARKING_OPTIONS;
  prioritySectorOptions = PRIORITY_SECTOR_OPTIONS;
  weakerSectorOptions = WEAKER_SECTOR_OPTIONS;
  realEstateMarkingOptions = REAL_ESTATE_MARKING_OPTIONS;

  constructor() {
    effect(() => {
      const d = this.data();
      if (d) this.patchForm(d);
    });
  }

  ngOnInit() {
    this.loanTypeService.findAll().subscribe({
      next: (res: any) => {
        const options = res.data.map((lt: any) => ({
          label: lt.type_name,
          value: lt.type_name
        }));
        this.loanTypeOptions.set(options);
      }
    });
  }

  private patchForm(d: any) {
    // We prefer d.loan_type if it exists, otherwise d.bank_loan_scheme_type
    this.bankLoanSchemeType.set(d.bank_loan_scheme_type || d.loan_type || null);
    this.industryMarking.set(d.industry_marking ?? null);
    this.prioritySectorMarking.set(d.priority_sector_marking ?? null);
    this.weakerSector.set(d.weaker_sector ?? null);
    this.realEstateMarking.set(d.real_estate_marking ?? null);
    this.priorityCode.set(d.priority_code ?? '');
    this.weakerCode.set(d.weaker_code ?? '');
    this.realEstateCode.set(d.real_estate_code ?? '');

    this.isDirty.set(false);
  }

  onFieldChange() {
    this.isDirty.set(true);

    // Auto-calculate codes based on selections
    this.updateAutoCodes();

    this.changed.emit(this.getPayload());
  }

  private updateAutoCodes() {
    // Priority Sector Code
    if (this.prioritySectorMarking()) {
      const selected = this.prioritySectorOptions.find(o => o.value === this.prioritySectorMarking());
      if (selected && selected.label.includes('(')) {
        const code = selected.label.match(/\((.*?)\)/)?.[1];
        if (code) this.priorityCode.set(code);
      }
    }

    // Weaker Sector Code
    if (this.weakerSector()) {
      const selected = this.weakerSectorOptions.find(o => o.value === this.weakerSector());
      if (selected && selected.label.includes('(')) {
        const code = selected.label.match(/\((.*?)\)/)?.[1];
        if (code) this.weakerCode.set(code);
      }
    }

    // Real Estate Marking Code
    if (this.realEstateMarking()) {
      const selected = this.realEstateMarkingOptions.find(o => o.value === this.realEstateMarking());
      if (selected && selected.label.includes('(')) {
        const code = selected.label.match(/\((.*?)\)/)?.[1];
        if (code) this.realEstateCode.set(code);
      }
    }
  }

  getPayload() {
    return {
      bank_loan_scheme_type: this.bankLoanSchemeType(),
      loan_type: this.bankLoanSchemeType(), // Sync both
      industry_marking: this.industryMarking(),
      priority_sector_marking: this.prioritySectorMarking(),
      weaker_sector: this.weakerSector(),
      real_estate_marking: this.realEstateMarking(),
      priority_code: this.priorityCode(),
      weaker_code: this.weakerCode(),
      real_estate_code: this.realEstateCode()
    };
  }

  onSave() {
    this.save.emit(this.getPayload());
  }
}
