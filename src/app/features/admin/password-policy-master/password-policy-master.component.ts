import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NumberFieldComponent, FormActionsComponent, TextFieldComponent } from '../../../shared/components/form';
import { PasswordPolicy, PasswordPolicyService } from '../services/masters.service';

@Component({
  selector: 'app-password-policy-master',
  standalone: true,
  imports: [CommonModule, ToastModule, NumberFieldComponent, FormActionsComponent, TextFieldComponent],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="flex align-items-center justify-content-between mb-4">
        <h5 class="m-0 text-xl font-semibold">Password Policy</h5>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6 lg:col-4">
          <app-number-field label="Minimum Length" [field]="minLength" [min]="4" [required]="true" class="mb-3"></app-number-field>
        </div>
        <div class="col-12 md:col-6 lg:col-4">
          <app-number-field label="Numbers Required" [field]="numCnt" [min]="0" [required]="true" class="mb-3"></app-number-field>
        </div>
        <div class="col-12 md:col-6 lg:col-4">
          <app-number-field label="Uppercase Required" [field]="uppercaseCnt" [min]="0" [required]="true" class="mb-3"></app-number-field>
        </div>
        <div class="col-12 md:col-6 lg:col-4">
          <app-number-field label="Lowercase Required" [field]="lowercaseCnt" [min]="0" [required]="true" class="mb-3"></app-number-field>
        </div>
        <div class="col-12 md:col-6 lg:col-4">
          <app-number-field label="Symbols Required" [field]="symbolCnt" [min]="0" [required]="true" class="mb-3"></app-number-field>
        </div>
      </div>

      <app-form-actions
        [loading]="loading()"
        [showCancel]="false"
        [saveDisabled]="!isValid()"
        saveLabel="Update Policy"
        (save)="save()"
      ></app-form-actions>
    </div>
    <p-toast></p-toast>
  `
})
export class PasswordPolicyMasterComponent implements OnInit {
  private policyService = inject(PasswordPolicyService);
  private messageService = inject(MessageService);

  minLength = signal<number | null>(8);
  numCnt = signal<number | null>(1);
  uppercaseCnt = signal<number | null>(1);
  lowercaseCnt = signal<number | null>(1);
  symbolCnt = signal<number | null>(1);
  loading = signal(false);

  totalRequired = computed(() => {
    return (this.numCnt() ?? 0)
      + (this.uppercaseCnt() ?? 0)
      + (this.lowercaseCnt() ?? 0)
      + (this.symbolCnt() ?? 0);
  });

  isValid = computed(() => {
    const minLength = this.minLength() ?? 0;

    return minLength >= 4
      && this.nonNegative(this.numCnt())
      && this.nonNegative(this.uppercaseCnt())
      && this.nonNegative(this.lowercaseCnt())
      && this.nonNegative(this.symbolCnt())
      && this.totalRequired() <= minLength;
  });

  ngOnInit() {
    this.loadPolicy();
  }

  loadPolicy() {
    this.loading.set(true);
    this.policyService.getPolicy().subscribe({
      next: (policy) => {
        if (policy) {
          this.minLength.set(Number(policy.min_length));
          this.numCnt.set(Number(policy.num_cnt));
          this.uppercaseCnt.set(Number(policy.uppercase_cnt));
          this.lowercaseCnt.set(Number(policy.lowercase_cnt));
          this.symbolCnt.set(Number(policy.symbol_cnt));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load password policy' });
      }
    });
  }

  save() {
    if (!this.isValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Configuration',
        detail: 'Required character counts cannot exceed minimum length.'
      });
      return;
    }

    const payload: PasswordPolicy = {
      min_length: this.minLength() ?? 8,
      num_cnt: this.numCnt() ?? 0,
      uppercase_cnt: this.uppercaseCnt() ?? 0,
      lowercase_cnt: this.lowercaseCnt() ?? 0,
      symbol_cnt: this.symbolCnt() ?? 0
    };

    this.loading.set(true);
    this.policyService.updatePolicy(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password policy updated successfully' });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update password policy' });
      }
    });
  }

  private nonNegative(value: number | null): boolean {
    return value !== null && value >= 0;
  }
}

