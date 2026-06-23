import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import {
  FormActionsComponent,
  MultiSelectFieldComponent,
} from '../../../shared/components/form';
import { AuditTypeService } from '../services/masters.service';

@Component({
  selector: 'app-audit-type-questionnaire-mapping',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    MultiSelectFieldComponent,
    FormActionsComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="max-h-[90vh] p-4 overflow-y-auto">
      <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">
        <div class="surface-100 border-1 border-gray-200 border-round-lg p-3 mb-4">
          <div class="text-sm text-600">Audit Type</div>
          <div class="font-semibold text-900 mt-1">
            {{ auditTypeName }}
          </div>
        </div>

        <app-multi-select-field
          label="Questionnaire Setups"
          [field]="selectedIds"
          [options]="questionSetups()"
          optionLabel="label"
          optionValue="id"
          display="chip"
          [filter]="true"
          filterBy="label"
          [virtualScroll]="false"
          scrollHeight="320px"
          [disabled]="loading()"
        ></app-multi-select-field>

        <small class="block text-600 mt-2">
          Select question setups available for this audit type.
        </small>

        <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">
          <app-form-actions
            [loading]="saving()"
            (save)="save()"
            (cancel)="cancel()"
          ></app-form-actions>
        </div>
      </div>
    </div>
  `,
})
export class AuditTypeQuestionnaireMappingComponent {
  private ref = inject(FormDrawerRef);
  private auditTypeService = inject(AuditTypeService);
  private messageService = inject(MessageService);

  auditTypeId = Number(this.ref.data?.id || 0);
  auditTypeName = this.ref.data?.name || 'Audit Type';
  questionSetups = signal<any[]>([]);
  selectedIds = signal<number[]>([]);
  loading = signal(false);
  saving = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.auditTypeService.getQuestionSetups(this.auditTypeId).subscribe({
      next: (response) => {
        const data = response?.data || response || {};
        this.questionSetups.set(
          this.rowsFrom(data.question_setups).map((row) => ({
            ...row,
            id: Number(row.id),
          })),
        );
        this.selectedIds.set(
          this.rowsFrom(data.selected_ids).map(Number),
        );
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error?.error?.message || 'Unable to load questionnaire mappings.',
        });
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.auditTypeService
      .saveQuestionSetups(this.auditTypeId, this.selectedIds())
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.ref.close({ saved: true, data: response });
        },
        error: (error) => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail:
              error?.error?.message ||
              'Unable to save questionnaire mappings.',
          });
        },
      });
  }

  cancel(): void {
    this.ref.close();
  }

  private rowsFrom(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  }
}
