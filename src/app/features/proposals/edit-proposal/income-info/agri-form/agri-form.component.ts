import { Component, signal, inject, input, output, computed, WritableSignal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  CheckboxFieldComponent
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-agri-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    DividerModule,
    TableModule,
    PanelModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    TextFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './agri-form.component.html'
})
export class AgriFormItemComponent {
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
  landOwnerName = linkedSignal(() => this.record()?.land_owner_name || '');
  currentCrops = linkedSignal(() => this.record()?.current_crops || '');
  groupNo = linkedSignal(() => this.record()?.group_no || '');
  address = linkedSignal(() => this.record()?.address || '');
  village = linkedSignal(() => this.record()?.village || '');
  annualIncome = linkedSignal<number>(() => Number(this.record()?.annual_income) || 0);

  // Area Details (Hector / Aar)
  hortiH = linkedSignal<number>(() => Number(this.record()?.horticulture_hector) || 0);
  hortiA = linkedSignal<number>(() => Number(this.record()?.horticulture_aar) || 0);
  arableH = linkedSignal<number>(() => Number(this.record()?.arable_hector) || 0);
  arableA = linkedSignal<number>(() => Number(this.record()?.arable_aar) || 0);
  sugarcaneH = linkedSignal<number>(() => Number(this.record()?.sugarcane_hector) || 0);
  sugarcaneA = linkedSignal<number>(() => Number(this.record()?.sugarcane_aar) || 0);
  // Computeds for Total Area
  totalH = computed(() => (this.hortiH() || 0) + (this.arableH() || 0));
  totalA = computed(() => (this.hortiA() || 0) + (this.arableA() || 0));

  // Other Crop Area is auto-calculated: Total - Sugarcane
  otherH = computed(() => Math.max(0, this.totalH() - (this.sugarcaneH() || 0)));
  otherA = computed(() => Math.max(0, this.totalA() - (this.sugarcaneA() || 0)));

  // Income Details
  averageSugarcaneArea = computed(() => {
    this.tableCalcTrigger();
    const bills = this.sugarcaneBills().filter(b => Number(b.sugarcane_area) > 0);
    if (!bills || bills.length === 0) return 0;
    const total = bills.reduce((sum, bill) => sum + Number(bill.sugarcane_area), 0);
    return Math.round((total / bills.length) * 100) / 100;
  });

  averageSugarcaneTonnage = computed(() => {
    this.tableCalcTrigger();
    const bills = this.sugarcaneBills().filter(b => Number(b.tonnage) > 0);
    if (!bills || bills.length === 0) return 0;
    const total = bills.reduce((sum, bill) => sum + Number(bill.tonnage), 0);
    return Math.round((total / bills.length) * 100) / 100;
  });

  averageSugarcaneBill = computed(() => {
    this.tableCalcTrigger();
    const bills = this.sugarcaneBills().filter(b => Number(b.bill_amount) > 0);
    if (!bills || bills.length === 0) return 0;
    const total = bills.reduce((sum, bill) => sum + Number(bill.bill_amount), 0);
    return Math.round((total / bills.length) * 100) / 100;
  });

  incomeSugarcane = computed(() => this.averageSugarcaneBill());
  incomeOther = computed(() => this.annualIncome() || 0);
  totalAgriIncome = computed(() => this.incomeSugarcane() + this.incomeOther());

  // Child Tables
  tableCalcTrigger = signal(0);
  sugarcaneBills = linkedSignal<any[]>(() => [...(this.record()?.sugarcane_bills || [])]);
  nextSeason = linkedSignal<any[]>(() => [...(this.record()?.next_season || [])]);

  /** Adapter to treat plain object properties as WritableSignals for custom components */
  getRowSignal(row: any, field: string): WritableSignal<any> {
    const s = (() => row[field]) as any;
    s.set = (val: any) => {
      if (row[field] !== val) {
        row[field] = val;
        this.tableCalcTrigger.update(n => n + 1);
      }
    };
    s.update = (fn: (v: any) => any) => {
      row[field] = fn(row[field]);
      this.tableCalcTrigger.update(n => n + 1);
    };
    s.asReadonly = () => () => row[field];
    return s as WritableSignal<any>;
  }

  addBill() {
    this.sugarcaneBills.update(prev => [...prev, { factory_name: '', dry_season: '', sugarcane_area: 0, tonnage: 0, bill_amount: 0 }]);
  }

  removeBill(index: number) {
    this.sugarcaneBills.update(prev => prev.filter((_, i) => i !== index));
  }

  addNextSeason() {
    this.nextSeason.update(prev => [...prev, { factory_name: '', dry_season: '', sugarcane_area: '' }]);
  }

  removeNextSeason(index: number) {
    this.nextSeason.update(prev => prev.filter((_, i) => i !== index));
  }

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      land_owner_name: this.landOwnerName(),
      current_crops: this.currentCrops(),
      group_no: this.groupNo(),
      address: this.address(),
      village: this.village(),
      annual_income: this.annualIncome(),

      horticulture_hector: this.hortiH(),
      horticulture_aar: this.hortiA(),
      arable_hector: this.arableH(),
      arable_aar: this.arableA(),
      sugarcane_hector: this.sugarcaneH(),
      sugarcane_aar: this.sugarcaneA(),
      other_crop_hector: this.otherH(),
      other_crop_aar: this.otherA(),
      total_agri_hector: this.totalH(),
      total_agri_aar: this.totalA(),

      income_sugarcane: this.incomeSugarcane(),
      income_other: this.incomeOther(),
      total_agri_income: this.totalAgriIncome(),

      sugarcane_bills: this.sugarcaneBills(),
      next_season: this.nextSeason()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), 'agriculture', payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Agriculture income saved successfully' });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
