import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent, TabItem, TabContentDirective } from '../../../shared/components/tabs';
import { DocumentManagerComponent } from './document-manager.component';
import { ProposalsService } from '../proposals.service';
import { ListboxModule } from 'primeng/listbox';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proposal-documents',
  standalone: true,
  imports: [
    CommonModule, 
    TabsComponent,
    TabContentDirective,
    DocumentManagerComponent, 
    ListboxModule,
    DividerModule,
    FormsModule
  ],
  template: `
    <div class="proposal-documents-container h-full flex flex-column">
      <app-tabs [tabs]="docTabs" [(activeKey)]="activeTabKey">
        <!-- Borrower Tab -->
        <ng-template tabContent="borrower">
          <div class="p-3 bg-white h-full overflow-auto">
            <app-document-manager 
              [proposalId]="proposalId" 
              [entityType]="'B'">
            </app-document-manager>
          </div>
        </ng-template>

        <!-- Guarantor Tab -->
        <ng-template tabContent="guarantor">
          <div class="flex h-full min-h-[500px]">
            <!-- Sidebar for Guarantor Selection -->
            <div class="w-3 border-right-1 border-100 p-3 bg-white">
              <h4 class="text-xs font-bold text-500 uppercase mb-3 px-2 tracking-wider">Select Guarantor</h4>
              <p-listbox 
                [options]="guarantors()" 
                [(ngModel)]="selectedGuarantor" 
                optionLabel="name"
                [style]="{'border':'none', 'width':'100%'}"
                styleClass="doc-listbox">
              </p-listbox>
              @if (guarantors().length === 0) {
                <div class="text-center p-4 text-500 italic text-sm">No guarantors added.</div>
              }
            </div>
            
            <!-- Document Manager for Selected Guarantor -->
            <div class="w-9 bg-surface-50 overflow-auto">
              @if (selectedGuarantor) {
                <div class="p-3 bg-white border-bottom-1 border-100 sticky top-0 z-1">
                  <span class="font-bold text-lg text-900">{{ selectedGuarantor.name }}</span>
                </div>
                <app-document-manager 
                  [proposalId]="proposalId" 
                  [entityType]="'G'" 
                  [participantId]="selectedGuarantor.id">
                </app-document-manager>
              } @else {
                <div class="h-full flex flex-column align-items-center justify-content-center p-5 text-400">
                  <i class="pi pi-arrow-left text-4xl mb-3"></i>
                  <span>Please select a guarantor from the list</span>
                </div>
              }
            </div>
          </div>
        </ng-template>

        <!-- Co-borrower Tab -->
        <ng-template tabContent="coborrower">
          <div class="flex h-full min-h-[500px]">
            <!-- Sidebar for Co-borrower Selection -->
            <div class="w-3 border-right-1 border-100 p-3 bg-white">
              <h4 class="text-xs font-bold text-500 uppercase mb-3 px-2 tracking-wider">Select Co-borrower</h4>
              <p-listbox 
                [options]="coborrowers()" 
                [(ngModel)]="selectedCoborrower" 
                optionLabel="name"
                [style]="{'border':'none', 'width':'100%'}"
                styleClass="doc-listbox">
              </p-listbox>
              @if (coborrowers().length === 0) {
                <div class="text-center p-4 text-500 italic text-sm">No co-borrowers added.</div>
              }
            </div>
            
            <!-- Document Manager for Selected Co-borrower -->
            <div class="w-9 bg-surface-50 overflow-auto">
              @if (selectedCoborrower) {
                <div class="p-3 bg-white border-bottom-1 border-100 sticky top-0 z-1">
                  <span class="font-bold text-lg text-900">{{ selectedCoborrower.name }}</span>
                </div>
                <app-document-manager 
                  [proposalId]="proposalId" 
                  [entityType]="'C'" 
                  [participantId]="selectedCoborrower.id">
                </app-document-manager>
              } @else {
                <div class="h-full flex flex-column align-items-center justify-content-center p-5 text-400">
                  <i class="pi pi-arrow-left text-4xl mb-3"></i>
                  <span>Please select a co-borrower from the list</span>
                </div>
              }
            </div>
          </div>
        </ng-template>
      </app-tabs>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-tabview .p-tabview-panels {
        padding: 0;
        flex-grow: 1;
        overflow-y: auto;
      }
      .doc-listbox .p-listbox-list {
        padding: 0;
      }
      .doc-listbox .p-listbox-item {
        border-radius: 8px;
        margin-bottom: 4px;
        padding: 12px;
      }
      .doc-listbox .p-listbox-item.p-highlight {
        background: var(--primary-alpha-10);
        color: var(--primary-color);
      }
    }
  `]
})
export class ProposalDocumentsComponent implements OnInit {
  @Input({ required: true }) proposalId!: string;

  private proposalsService = inject(ProposalsService);

  activeTabKey = 'borrower';
  
  docTabs: TabItem[] = [
    { key: 'borrower', label: 'Borrower', icon: 'pi pi-user' },
    { key: 'guarantor', label: 'Guarantors', icon: 'pi pi-shield' },
    { key: 'coborrower', label: 'Co-borrowers', icon: 'pi pi-users' }
  ];

  guarantors = signal<any[]>([]);
  coborrowers = signal<any[]>([]);
  
  selectedGuarantor: any;
  selectedCoborrower: any;

  ngOnInit() {
    this.loadParticipants();
  }

  loadParticipants() {
    this.proposalsService.getParticipants(this.proposalId).subscribe(res => {
      this.guarantors.set(res.data.filter(p => p.entity_type === 'G'));
      this.coborrowers.set(res.data.filter(p => p.entity_type === 'C'));
      
      if (this.guarantors().length > 0) this.selectedGuarantor = this.guarantors()[0];
      if (this.coborrowers().length > 0) this.selectedCoborrower = this.coborrowers()[0];
    });
  }
}
