import { Component, signal, inject, linkedSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent, 
  FormActionsComponent
} from '../../../../../shared/components/form';
import { FormDrawerRef } from '../../../../../core/services/drawer/form-drawer.ref';

@Component({
  selector: 'app-credit-roc-debt-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-roc-debt-form.component.html',
  styles: [`
    .roc-form-container { overflow-x: hidden; }
    .panel-content { display: flex; flex-direction: column; gap: 20px; padding-top: 12px; }
    :host ::ng-deep {
      .p-panel {
        border-radius: 1rem;
        .p-panel-header { padding: 0.85rem 1.25rem; background: transparent; border-bottom: 1px solid var(--surface-100); }
        .p-panel-content { padding: 1.25rem; }
      }
    }
  `]
})
export class CreditRocDebtFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  // Field Signals
  srn = linkedSignal(() => this.record()?.srn || '');
  chargeId = linkedSignal(() => this.record()?.charge_id || '');
  creationDate = linkedSignal<Date | null>(() => this.record()?.creation_date ? new Date(this.record().creation_date) : null);
  chargeAmount = linkedSignal(() => Number(this.record()?.charge_amount) || 0);
  chargeHolder = linkedSignal(() => this.record()?.charge_holder || '');

  ngOnInit() {}

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      srn: this.srn(),
      charge_id: this.chargeId(),
      creation_date: this.creationDate(),
      charge_amount: this.chargeAmount(),
      charge_holder: this.chargeHolder()
    };

    this.proposalsService.updateRocDebt(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'ROC debt record saved' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save ROC debt info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
