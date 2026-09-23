import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormDrawerRef } from '../../../core/services/drawer';
import { AuditSchemeMasterService } from '../services/masters.service';

@Component({
    selector: 'app-scheme-question-mapping',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CheckboxModule,
        InputTextModule,
        ButtonModule,
        ToastModule,
    ],
    template: `
       <div class="max-h-[90vh] p-4 overflow-y-auto">
  
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <!-- Scheme Info -->
    <div class="mb-4 text-sm text-600 flex gap-4">
      <div>
        Scheme:
        <span class="font-bold text-900">
          {{ schemeName() }} ({{ schemeCode() }})
        </span>
      </div>
      <div>
        Category:
        <span class="font-semibold text-primary">
          {{ categoryName() }}
        </span>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative">
        <i
          class="pi pi-search absolute"
          style="
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1;
          "
        ></i>
        <input
          pInputText
          type="text"
          [(ngModel)]="search"
          placeholder="Search Question Sets"
          class="w-full pl-5"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="border-1 border-gray-200 border-round-lg overflow-hidden">
      <p-table
        [value]="filteredQuestionSets()"
        responsiveLayout="scroll"
        [scrollable]="true"
        scrollHeight="420px"
      >
        <!-- Header -->
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 80px">
              Select
            </th>
            <th>
              Question Set
            </th>
          </tr>
        </ng-template>

        <!-- Body -->
        <ng-template pTemplate="body" let-row>
          <tr>
            <td>
              <p-checkbox
                [binary]="true"
                [ngModel]="isSelected(row.value)"
                (onChange)="toggleSelection(row.value)"
              ></p-checkbox>
            </td>
            <td>
              {{ row.label }}
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Footer -->
    <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">
      <button
        pButton
        type="button"
        label="Cancel"
        class="p-button-text"
        (click)="close()"
      ></button>

      <button
        pButton
        type="button"
        label="Save Mapping"
        [loading]="saving()"
        (click)="save()"
      ></button>
    </div>

  </div>

</div>

<p-toast></p-toast>
    `,
})
export class AuditSchemeQuestionMappingComponent implements OnInit {
    private service = inject(AuditSchemeMasterService);
    private messageService = inject(MessageService);
    private ref = inject(FormDrawerRef);

    schemeId = 0;
    schemeName = signal('');
    schemeCode = signal('');
    categoryName = signal('');
    questionSets = signal<any[]>([]);
    selectedIds = signal<number[]>([]);
    saving = signal(false);
    search = '';

    ngOnInit() {
        const data = this.ref.data;
        this.schemeId = Number(data.id);
        this.schemeName.set(data.name ?? '');
        this.schemeCode.set(data.scheme_code ?? '');
        this.categoryName.set(data.category_name ?? '');
        this.load();
    }

    load() {
        this.service.getQuestionMapping(this.schemeId).subscribe({
            next: (res: any) => {
                this.questionSets.set(res?.questionSets ?? []);
                const selected = (res?.scheme?.question_set_ids ?? '')
                    .split(',')
                    .map((x: string) => Number(x))
                    .filter(Boolean);
                this.selectedIds.set(selected);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to load question mapping',
                });
            },
        });
    }

    filteredQuestionSets() {
        const term = this.search.trim().toLowerCase();
        if (!term) {
            return this.questionSets();
        }
        return this.questionSets().filter((x) =>
            x.label.toLowerCase().includes(term),
        );
    }

    isSelected(id: number) {
        return this.selectedIds().includes(id);
    }

    toggleSelection(id: number) {
        const current = [...this.selectedIds()];
        const exists = current.includes(id);
        const updated = exists
            ? current.filter((x) => x !== id)
            : [...current, id];
        this.selectedIds.set(updated);
    }

    save() {
        this.saving.set(true);
        const csv = this.selectedIds().join(',');

        this.service.updateQuestionMapping(this.schemeId, csv).subscribe({
            next: () => {
                this.saving.set(false);
                this.ref.close({ saved: true });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to save mapping',
                });
            },
        });
    }

    close() {
        this.ref.close();
    }
}
