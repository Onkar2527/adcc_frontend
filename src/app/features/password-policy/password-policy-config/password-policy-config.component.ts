import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { PasswordPolicyService, PasswordPolicy } from '../services/password-policy.service';

@Component({
  selector: 'app-password-policy-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './password-policy-config.component.html',
  styleUrl: './password-policy-config.component.scss'
})
export class PasswordPolicyConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private policyService = inject(PasswordPolicyService);
  private messageService = inject(MessageService);

  form: FormGroup = this.fb.group({
    min_length: [8, [Validators.required, Validators.min(4)]],
    num_cnt: [1, [Validators.required, Validators.min(0)]],
    uppercase_cnt: [1, [Validators.required, Validators.min(0)]],
    lowercase_cnt: [1, [Validators.required, Validators.min(0)]],
    symbol_cnt: [1, [Validators.required, Validators.min(0)]],
  });

  loading = false;

  ngOnInit() {
    this.loadPolicy();
  }

  loadPolicy() {
    this.loading = true;
    this.policyService.getPolicy().subscribe({
      next: (policy) => {
        if (policy) {
          this.form.patchValue({
            min_length: Number(policy.min_length),
            num_cnt: Number(policy.num_cnt),
            uppercase_cnt: Number(policy.uppercase_cnt),
            lowercase_cnt: Number(policy.lowercase_cnt),
            symbol_cnt: Number(policy.symbol_cnt),
          });
        }
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load password policy' });
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const totalRequired = 
        this.form.value.num_cnt + 
        this.form.value.uppercase_cnt + 
        this.form.value.lowercase_cnt + 
        this.form.value.symbol_cnt;

      if (totalRequired > this.form.value.min_length) {
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Invalid Configuration', 
          detail: 'Sum of required character counts cannot exceed minimum length.' 
        });
        return;
      }

      this.loading = true;
      this.policyService.updatePolicy(this.form.value).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Password Policy updated and users flagged for reset' });
          this.loading = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update password policy' });
          this.loading = false;
        }
      });
    }
  }
}
