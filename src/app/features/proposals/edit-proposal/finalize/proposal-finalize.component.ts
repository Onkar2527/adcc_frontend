import { Component, input, output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TabItem } from '../../../../shared/components/tabs';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';

@Component({
  selector: 'app-proposal-finalize',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TextareaModule,
    TableComponent
  ],
  template: `
    <div class="finalize-container p-4">
        <h2 class="text-xl font-bold mb-4 flex align-items-center gap-2 text-900">
          <i class="pi pi-verified text-primary"></i>
          Proposal Submission Summary
        </h2>
        
       
           <app-table 
            [data]="summaryData()" 
            [columns]="cols" 
            [showToolbar]="false"
            [showSerialNumber]="true"
            [paginator]="false"
            [tableStyle]="{ 'min-width': '100%' }"
            scrollHeight="auto"
            [bodyTemplate]="finalizeBody">
          </app-table>

          <!-- 3-Column Body Template -->
          <ng-template #finalizeBody let-item let-columns="columns">
              <td class="text-center font-bold text-500" style="width: 50px;">
                {{ summaryData().indexOf(item) + 1 }}
              </td>
              <td>
                <div class="flex align-items-center gap-3">
                  <i [class]="item.icon + ' text-xl text-600'"></i>
                  <span class="font-bold text-800">{{ item.label }}</span>
                </div>
              </td>
              <td class="text-center">
                 <div class="flex align-items-center justify-content-center gap-2">
                    @if (item.isFilled) {
                      <i class="pi pi-check-circle text-green-500"></i>
                      <span class="text-green-600 font-semibold text-sm">Completed</span>
                    } @else {
                      <i class="pi pi-clock text-orange-500"></i>
                      <span class="text-orange-600 font-semibold text-sm">Pending</span>
                    }
                  </div>
              </td>
          </ng-template>
        

        <div class="remark-section mt-5 bg-surface-50 p-4 border-round-xl border-1 surface-border">
          <div class="flex align-items-center gap-2 mb-2">
             <i class="pi pi-comment text-600"></i>
             <label class="font-bold text-700">Submission Remarks</label>
          </div>
          <textarea 
            pInputTextarea 
            [ngModel]="remarks()"
            (ngModelChange)="onRemarksChange($event)"
            rows="6" 
            class="w-full border-round-lg p-3 surface-50" 
            placeholder="Add any final notes..."></textarea>
        </div>
    </div>
  `,
  styles: [`
    .finalize-container {
      max-width: 900px;
      margin: 0 auto;
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-thead > tr > th {
        background: var(--surface-50);
        color: var(--text-color-secondary);
        font-weight: 700;
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
      }
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 0.75rem 1rem;
      }
      .p-datatable .p-datatable-tbody > tr:hover {
        background: var(--surface-50);
      }
    }
  `]
})
export class ProposalFinalizeComponent {
  /** All tabs data from parent EditProposalComponent */
  tabs = input.required<TabItem[]>();

  /** Remarks from parent */
  remarks = input<string>('');
  remarksChange = output<string>();

  cols: TableColumn[] = [
    { field: 'label', header: 'Section / Tab', align: 'left' },
    { field: 'isFilled', header: 'Status', align: 'center', width: '150px' }
  ];

  summaryData = computed(() => {
    // Filter out the 'finalize' tab itself
    return this.tabs().filter(t => t.key !== 'finalize');
  });

  onRemarksChange(value: string) {
    this.remarksChange.emit(value);
  }
}
