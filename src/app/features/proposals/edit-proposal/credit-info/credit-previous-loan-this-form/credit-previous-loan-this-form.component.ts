import { Component, signal, inject, input, output, computed, linkedSignal, OnInit, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent, 
  SelectFieldComponent,
  TextareaFieldComponent,
  FormActionsComponent
} from '../../../../../shared/components/form';
import { FormDrawerRef } from '../../../../../core/services/drawer/form-drawer.ref';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-credit-previous-loan-this-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PanelModule,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './credit-previous-loan-this-form.component.html',
  styles: [`
    .history-form-container { overflow-x: hidden; }
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
export class CreditPreviousLoanThisFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  private data = this.ref.data || {};
  proposalId = this.data.proposalId;
  creditInfoId = signal<number | null>(this.data.creditInfoId || null);
  record = signal<any>(this.data.record || null);

  loading = signal(false);

  // Master Data Resources
  branches = resource({
    loader: async () => {
      const res = await firstValueFrom(this.proposalsService.getBranches());
      return res.data.map(b => ({ label: b.branch_name, value: b.id }));
    }
  });

  loanTypes = resource({
    loader: async () => {
      const res = await firstValueFrom(this.proposalsService.getLoanTypes());
      return res.data.map(t => ({ label: t.type_name, value: t.id }));
    }
  });

  // Field Signals
  branchId = linkedSignal(() => this.record()?.branch_id || null);
  reasonOfLoan = linkedSignal(() => this.record()?.reason_of_loan || '');
  loanTypeId = linkedSignal(() => this.record()?.loan_type_id || null);
  sanctionedAmount = linkedSignal(() => Number(this.record()?.sanctioned_amount) || 0);
  sanctionedDate = linkedSignal<Date | null>(() => this.record()?.sanctioned_date ? new Date(this.record().sanctioned_date) : null);
  accountCloseDate = linkedSignal<Date | null>(() => this.record()?.account_close_date ? new Date(this.record().account_close_date) : null);

  ngOnInit() {}

  save() {
    this.loading.set(true);
    const payload = {
      id: this.record()?.id,
      credit_info_id: this.creditInfoId(),
      branch_id: this.branchId(),
      reason_of_loan: this.reasonOfLoan(),
      loan_type_id: this.loanTypeId(),
      sanctioned_amount: this.sanctionedAmount(),
      sanctioned_date: this.sanctionedDate(),
      account_close_date: this.accountCloseDate()
    };

    this.proposalsService.updatePreviousLoanThisBank(this.proposalId, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Historical loan info saved successfully' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save historical loan info' });
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}
