import { Component, signal, inject, input, output, WritableSignal, linkedSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextareaFieldComponent, 
  NumberFieldComponent, 
  TextFieldComponent 
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-milk-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    TableModule,
    PanelModule,
    TextareaFieldComponent,
    NumberFieldComponent,
    TextFieldComponent
  ],
  templateUrl: './milk-form.component.html'
})
export class MilkFormItemComponent {
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
  remark = linkedSignal(() => this.record()?.remark || '');

  // Row Data Signals (Linked to Record Input)
  rows = linkedSignal<any[]>(() => [...(this.record()?.rows || [])]);

  addMilkRow() {
    this.rows.update(prev => [...prev, { duration_label: '', morning_litre: 0, morning_rate: 0, morning_amount: 0, evening_litre: 0, evening_rate: 0, evening_amount: 0 }]);
  }

  removeMilkRow(index: number) {
    this.rows.update(prev => prev.filter((_, i) => i !== index));
  }

  // Trigger
  tableCalcTrigger = signal(0);

  // Averages
  avgMorningLitre = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.morning_litre) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.morning_litre) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  avgMorningRate = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.morning_rate) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.morning_rate) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  avgMorningAmount = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.morning_amount) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.morning_amount) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  avgEveningLitre = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.evening_litre) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.evening_litre) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  avgEveningRate = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.evening_rate) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.evening_rate) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  avgEveningAmount = computed(() => {
    this.tableCalcTrigger();
    const valid = this.rows().filter(r => Number(r.evening_amount) > 0);
    if (!valid.length) return 0;
    const total = valid.reduce((s, r) => s + (Number(r.evening_amount) || 0), 0);
    return Math.round((total / valid.length) * 100) / 100;
  });

  /** Adapter to treat plain object properties as WritableSignals for custom components */
  getRowSignal(row: any, field: string): WritableSignal<any> {
    const s = (() => row[field]) as any;
    s.set = (val: any) => {
      row[field] = val;
      this.calculateAmount(row);
      this.tableCalcTrigger.update(n => n + 1);
    };
    s.update = (fn: (v: any) => any) => {
      row[field] = fn(row[field]);
      this.calculateAmount(row);
      this.tableCalcTrigger.update(n => n + 1);
    };
    s.asReadonly = () => () => row[field];
    return s as WritableSignal<any>;
  }

  calculateAmount(row: any) {
    row.morning_amount = (row.morning_litre || 0) * (row.morning_rate || 0);
    row.evening_amount = (row.evening_litre || 0) * (row.evening_rate || 0);
  }

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      remark: this.remark(),
      rows: this.rows()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), 'milk', payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Milk production info saved' });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
