import { Component, signal, inject, Input, OnInit, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProposalsService } from '../proposals.service';
import { TableComponent, TableColumn } from '../../../shared/components/table/table.component';
import { FormActionsComponent } from '../../../shared/components/form/form-actions/form-actions.component';

@Component({
  selector: 'app-tab-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule, TableComponent, FormActionsComponent, ProgressSpinnerModule],
  template: `
    <div class="mapping-container">
      <!-- Scrollable Content -->
      <div class="content-area p-3">
        
        <!-- Loading Overlay -->
        @if (isLoading()) {
          <div class="loading-overlay">
            <p-progressSpinner styleClass="w-2.5rem h-2.5rem" strokeWidth="4"></p-progressSpinner>
          </div>
        }

        <!-- Shared Table Component -->
        <app-table 
          [data]="tabMasterList()" 
          [columns]="columns"
          [loading]="isLoading()"
          [showToolbar]="false"
          [showAddButton]="false"
          [showRefreshButton]="false"
          [paginator]="false"
          [showSerialNumber]="false"
          [scrollHeight]="'auto'"
          [tableStyle]="{ 'min-width': '100%' }"
          [bodyTemplate]="mappingBody"
          [headerTemplate]="mappingHeader"
        >
          <!-- Custom Header Template -->
          <ng-template #mappingHeader let-col="col">
            @if (col.field === 'enabled') {
              <div class="w-full flex justify-content-center">
                <div class="flex align-items-center gap-2">
                  <p-checkbox 
                    [ngModel]="isAllSelected()" 
                    (ngModelChange)="toggleAll($event)"
                    [binary]="true"
                  ></p-checkbox>
                  @if (col.header) {
                    <label class="ml-2 cursor-pointer font-bold">{{ col.header }}</label>
                  }
                </div>
              </div>
            } @else {
              {{ col.header }}
            }
          </ng-template>

          <!-- Custom Body Template -->
          <ng-template #mappingBody let-rowData let-columns="columns">
            <td class="text-center py-2 cursor-pointer" (click)="toggleTab(rowData.key)">
              <div class="flex justify-content-center">
                <i [class]="rowData.icon + ' text-xl'" 
                    [class.text-primary]="selectedTabKeys().includes(rowData.key)"
                    [class.text-gray-400]="!selectedTabKeys().includes(rowData.key)"></i>
              </div>
            </td>
            <td class="font-medium text-gray-700 py-2 cursor-pointer" (click)="toggleTab(rowData.key)">
              {{ rowData.label }}
            </td>
            <td class="text-center py-2">
              <div class="flex justify-content-center">
                @if (rowData.is_filled) {
                  <i class="pi pi-circle-fill status-dot-saved" title="Filled"></i>
                } @else {
                  <i class="pi pi-circle-fill status-dot-pending" title="Not Filled"></i>
                }
              </div>
            </td>
            <td class="text-center py-2">
              <div class="flex justify-content-center text-center">
                <p-checkbox 
                  [name]="'tab-' + rowData.key"
                  [value]="rowData.key" 
                  [ngModel]="selectedTabKeys()" 
                  (ngModelChange)="selectedTabKeys.set($event)"
                  [binary]="false"
                  (click)="$event.stopPropagation()"
                ></p-checkbox>
              </div>
            </td>
          </ng-template>
        </app-table>
      </div>

      <!-- Sticky Footer -->
      <div class="sticky-footer p-3 border-top-1 border-gray-200">
        <app-form-actions 
          saveLabel="Save Configuration"
          [loading]="isSaving()"
          [saveDisabled]="isLoading()"
          (save)="save()"
          (cancel)="onCancel.emit()">
        </app-form-actions>
      </div>
    </div>
  `,
  styles: [`
    .mapping-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .content-area {
      flex: 1;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
      z-index: 2;
    }

    .sticky-footer {
      position: sticky;
      bottom: 0;
      background: var(--surface-0, #ffffff);
      z-index: 10;
      box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.03);
    }

    :host ::ng-deep {
      .p-drawer-content {
        padding: 0 !important;
        display: flex;
        flex-direction: column;
      }

      /* Force perfect centering in table cells */
      .p-datatable-tbody > tr > td.text-center {
        text-align: center !important;
        vertical-align: middle !important;
      }
      
      .p-checkbox {
        vertical-align: middle;
      }

      .status-dot-saved {
        color: #10b981 !important;
        font-size: 0.75rem;
      }

      .status-dot-pending {
        color: #f59e0b !important;
        font-size: 0.75rem;
      }
    }
  `]
})
export class TabMappingComponent implements OnInit {
  private proposalsService = inject(ProposalsService);

  @Input({ required: true }) proposalId!: string;
  @Output() onSaved = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  isLoading = signal(true);
  isSaving = signal(false);
  tabMasterList = signal<any[]>([]);
  selectedTabKeys = signal<string[]>([]);

  // Computed for Select All toggle
  isAllSelected = computed(() => {
    const master = this.tabMasterList();
    const selected = this.selectedTabKeys();
    return master.length > 0 && master.every(t => selected.includes(t.key));
  });

  columns: TableColumn[] = [
    { field: 'icon', header: 'Icon', width: 'auto', align: 'center', sortable: false },
    { field: 'label', header: 'Tab Name', width: 'auto', sortable: false },
    { field: 'is_filled', header: 'Filled', width: 'auto', align: 'center', sortable: false },
    { field: 'enabled', header: '', width: 'auto', align: 'center', sortable: false }
  ];

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    if (!this.proposalId) return;

    this.isLoading.set(true);
    
    this.proposalsService.getTabMaster().subscribe({
      next: (masterRes) => {
        this.tabMasterList.set(masterRes.data);
        
        this.proposalsService.getProposalTabs(this.proposalId).subscribe({
          next: (mappingRes) => {
            const mappings = mappingRes.data;
            const currentKeys = mappings.map((t: any) => t.key);
            this.selectedTabKeys.set(currentKeys);

            // Merge is_filled status into master list
            const updatedMaster = this.tabMasterList().map(tab => {
              const mapping = mappings.find((m: any) => m.key === tab.key);
              return {
                ...tab,
                is_filled: mapping ? mapping.is_filled : false
              };
            });
            this.tabMasterList.set(updatedMaster);
            
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('[TabMapping] Current mapping fetch failed', err);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('[TabMapping] Master tab fetch failed', err);
        this.isLoading.set(false);
      }
    });
  }

  toggleTab(key: string) {
    const keys = [...this.selectedTabKeys()];
    const index = keys.indexOf(key);
    if (index > -1) {
      keys.splice(index, 1);
    } else {
      keys.push(key);
    }
    this.selectedTabKeys.set(keys);
  }

  toggleAll(checked: boolean) {
    if (checked) {
      const allKeys = this.tabMasterList().map(t => t.key);
      this.selectedTabKeys.set(allKeys);
    } else {
      this.selectedTabKeys.set([]);
    }
  }

  save() {
    const keys = this.selectedTabKeys();
    if (!this.proposalId) return;

    this.isSaving.set(true);
    this.proposalsService.updateProposalTabsMapping(this.proposalId, keys).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.onSaved.emit();
      },
      error: (err) => {
        console.error('[TabMapping] Save failed', err);
        this.isSaving.set(false);
      }
    });
  }
}
