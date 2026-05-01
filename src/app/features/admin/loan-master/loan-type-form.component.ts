import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { 
  TextFieldComponent, 
  NumberFieldComponent,
  CheckboxFieldComponent, 
  TextareaFieldComponent, 
  FormActionsComponent 
} from '../../../shared/components/form';
import { LoanTypeService } from '../services/masters.service';

@Component({
  selector: 'app-loan-type-form',
  standalone: true,
  imports: [
    CommonModule, 
    TextFieldComponent, 
    NumberFieldComponent,
    CheckboxFieldComponent, 
    TextareaFieldComponent, 
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4">
      <div class="flex-grow-1 overflow-y-auto">
        <app-text-field
          label="Type Code"
          [field]="typeCode"
          placeholder="e.g. PL0001"
          class="mb-3"
        ></app-text-field>

        <app-text-field
          label="Loan Type Name"
          [field]="typeName"
          placeholder="e.g. Personal Loan"
          class="mb-3"
        ></app-text-field>

        <div class="grid">
          <div class="col-6">
            <app-number-field
              label="Interest Rate (%)"
              [field]="interestRate"
              placeholder="0.00"
              class="mb-3"
            ></app-number-field>
          </div>
          <div class="col-6">
            <app-number-field
              label="Max Tenure (Months)"
              [field]="maxTenureMonths"
              placeholder="0"
              class="mb-3"
            ></app-number-field>
          </div>
        </div>

        <app-textarea-field
          label="Description"
          [field]="description"
          placeholder="Enter product description"
          [rows]="3"
          class="mb-3"
        ></app-textarea-field>

        <app-checkbox-field
          label="Is Active"
          [field]="isActive"
        ></app-checkbox-field>
      </div>

      <app-form-actions
        class="mt-auto pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        (onSave)="save()"
        (onCancel)="cancel()"
      ></app-form-actions>
    </div>
  `
})
export class LoanTypeFormComponent {
  private ref = inject(FormDrawerRef);
  private loanTypeService = inject(LoanTypeService);

  typeCode = signal('');
  typeName = signal('');
  interestRate = signal<number | null>(null);
  maxTenureMonths = signal<number | null>(null);
  description = signal('');
  isActive = signal(true);
  
  saving = signal(false);
  isEdit = false;

  constructor() {
    const data = this.ref.data;
    if (data) {
      this.isEdit = true;
      this.typeCode.set(data.type_code);
      this.typeName.set(data.type_name);
      this.interestRate.set(data.interest_rate);
      this.maxTenureMonths.set(data.max_tenure_months);
      this.description.set(data.description || '');
      this.isActive.set(data.is_active);
    }
  }

  save() {
    if (!this.typeCode() || !this.typeName()) return;

    this.saving.set(true);
    const payload = {
      type_code: this.typeCode(),
      type_name: this.typeName(),
      interest_rate: this.interestRate(),
      max_tenure_months: this.maxTenureMonths(),
      description: this.description(),
      is_active: this.isActive()
    };

    const obs = this.isEdit 
      ? this.loanTypeService.update(this.ref.data.id, payload)
      : this.loanTypeService.create(payload);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close(res);
      },
      error: () => this.saving.set(false)
    });
  }

  cancel() {
    this.ref.close();
  }
}
