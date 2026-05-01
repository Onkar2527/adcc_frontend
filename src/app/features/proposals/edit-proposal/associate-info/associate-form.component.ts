import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';
import { ProposalsService } from '../../proposals.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { PanelModule } from 'primeng/panel';
import { 
  TextFieldComponent, 
  FormActionsComponent 
} from '../../../../shared/components/form';

@Component({
  selector: 'app-associate-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PanelModule,
    TextFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="associate-form-container surface-ground h-full flex flex-column overflow-hidden">
      
      <!-- Form Body -->
      <div class="flex-grow-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
        <div class="max-w-30rem mx-auto">
          
          <p-panel styleClass="border-round-2xl shadow-3 border-none overflow-hidden">
            <ng-template pTemplate="header">
              <div class="flex align-items-center gap-3 w-full">
                <div class="bg-primary-alpha-10 w-3rem h-3rem border-round-xl flex align-items-center justify-content-center">
                  <i class="pi pi-user-plus text-primary text-xl"></i>
                </div>
                <div>
                  <h3 class="m-0 text-900 font-bold line-height-1">{{ headerText }}</h3>
                  <small class="text-500">Quick Registration</small>
                </div>
              </div>
            </ng-template>

            <div class="p-4">
              <div class="flex flex-column gap-4">
                
                <div class="form-field">
                  <label class="block font-medium mb-2 text-700">Full Name <span class="text-red-500">*</span></label>
                  <app-text-field
                    [field]="name"
                    [required]="true"
                    [hideLabel]="true"
                    placeholder="Enter full name">
                  </app-text-field>
                </div>

                <div class="form-field">
                  <label class="block font-medium mb-2 text-700">Phone Number <span class="text-red-500">*</span></label>
                  <app-text-field
                    [field]="phone"
                    [required]="true"
                    [hideLabel]="true"
                    placeholder="Enter mobile number">
                  </app-text-field>
                </div>

                <div class="bg-blue-50 p-3 border-round-xl border-1 border-blue-100 mt-2">
                  <div class="flex gap-3">
                    <i class="pi pi-info-circle text-blue-500 text-xl mt-1"></i>
                    <div>
                      <p class="m-0 text-blue-900 font-medium">Profile Setup</p>
                      <p class="m-0 text-blue-700 text-sm mt-1">After registration, you can fill detailed personal, income, and property info.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </p-panel>

        </div>
      </div>

      <!-- Action Footer -->
      <app-form-actions 
        [sticky]="true"
        [saveLabel]="'Register ' + typeLabel"
        saveIcon="pi pi-check-circle"
        [loading]="saving()" 
        (save)="onSave()" 
        (cancel)="onCancel()">
      </app-form-actions>

    </div>
  `,
  styles: [`
    .associate-form-container {
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep {
      .p-panel {
        .p-panel-header {
          padding: 1.5rem;
          background: white;
          border-bottom: 1px solid var(--surface-100);
        }
        .p-panel-content {
          padding: 0;
        }
      }

      .custom-scrollbar {
        &::-webkit-scrollbar {
            width: 6px;
        }
        &::-webkit-scrollbar-track {
            background: transparent;
        }
        &::-webkit-scrollbar-thumb {
            background: var(--surface-200);
            border-radius: 10px;
        }
      }
    }
  `]
})
export class AssociateFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);
  private notification = inject(NotificationService);

  // Form Signals
  name = signal('');
  phone = signal('');
  saving = signal(false);

  // Meta
  proposalId: string = '';
  entityType: string = 'G';

  ngOnInit() {
    const data = this.ref.data;
    if (data) {
      this.proposalId = data.proposalId;
      this.entityType = data.entityType || 'G';
    }
  }

  get typeLabel() {
    return this.entityType === 'G' ? 'Guarantor' : 'Co-borrower';
  }

  get headerText() {
    return `New ${this.typeLabel}`;
  }

  onSave() {
    if (!this.name() || !this.phone()) {
      this.notification.error('Name and Phone are required');
      return;
    }

    this.saving.set(true);
    const payload = {
      proposal_id: this.proposalId,
      entity_type: this.entityType,
      name: this.name(),
      phone: this.phone()
    };

    this.proposalsService.createParticipant(payload).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.notification.success(`${this.typeLabel} registered successfully`);
        this.ref.close({ saved: true, data: res.data });
      },
      error: () => this.saving.set(false)
    });
  }

  onCancel() {
    this.ref.close();
  }
}
