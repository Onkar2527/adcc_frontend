import { Component, signal, inject, input, output, linkedSignal } from '@angular/core';
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
  TextareaFieldComponent 
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-other-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    DividerModule,
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './other-form.component.html'
})
export class OtherFormItemComponent {
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
  sourceName = linkedSignal(() => this.record()?.source_name || '');
  sourceType = linkedSignal(() => this.record()?.source_type || '');
  yearsActive = linkedSignal<number | null>(() => this.record()?.years_active || null);
  annualIncome = linkedSignal<number>(() => Number(this.record()?.annual_income) || 0);
  contactNo = linkedSignal(() => this.record()?.contact_no || '');
  address = linkedSignal(() => this.record()?.address || '');
  details = linkedSignal(() => this.record()?.details || '');

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      source_name: this.sourceName(),
      source_type: this.sourceType(),
      years_active: this.yearsActive(),
      annual_income: this.annualIncome(),
      contact_no: this.contactNo(),
      address: this.address(),
      details: this.details()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), 'other', payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Other income saved successfully' });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
