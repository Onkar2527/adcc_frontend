import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent, TabItem, TabContentDirective } from '../../../../shared/components/tabs';
import { PersonalInfoComponent } from '../personal-info/personal-info.component';
import { FinancialInfoComponent } from '../financial-info/financial-info.component';
import { IncomeInfoComponent } from '../income-info/income-info.component';
import { CreditInfoComponent } from '../credit-info/credit-info.component';
import { PropertyInfoComponent } from '../property-info/property-info.component';
import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';
import { FormActionsComponent } from '../../../../shared/components/form';
import { ProposalsService } from '../../proposals.service';

@Component({
  selector: 'app-associate-editor',
  standalone: true,
  imports: [
    CommonModule,
    TabsComponent,
    PersonalInfoComponent,
    FinancialInfoComponent,
    IncomeInfoComponent,
    CreditInfoComponent,
    PropertyInfoComponent,
    FormActionsComponent
  ],
  templateUrl: './associate-editor.component.html',
  styleUrls: ['./associate-editor.component.scss']
})
export class AssociateEditorComponent implements OnInit {
  private ref = inject(FormDrawerRef);

  participant = signal<any>(null);
  proposalId = signal<string>('');
  saving = signal(false);
  private proposalsService = inject(ProposalsService);

  tabStatuses = signal<Record<string, boolean>>({});
  activeTab = signal('personal');
  triggerSave = signal(0);

  tabs = computed<TabItem[]>(() => [
    { key: 'personal', label: 'Personal', icon: 'pi pi-user', isFilled: this.tabStatuses()['personal'] },
    { key: 'income', label: 'Income', icon: 'pi pi-money-bill', isFilled: this.tabStatuses()['income'] },
    { key: 'financial', label: 'Financial', icon: 'pi pi-wallet', isFilled: this.tabStatuses()['financial'] },
    { key: 'credit', label: 'Credit', icon: 'pi pi-history', isFilled: this.tabStatuses()['credit'] },
    { key: 'property', label: 'Property', icon: 'pi pi-home', isFilled: this.tabStatuses()['property'] }
  ]);

  ngOnInit() {
    const data = this.ref.data;
    if (data) {
      this.participant.set(data.participant);
      this.proposalId.set(data.proposalId);
      this.initializeStatuses();
    }
  }

  private initializeStatuses() {
    const pid = this.proposalId();
    const p = this.participant();
    if (!pid || !p) return;

    this.proposalsService.getProposalTabs(pid, p.entity_type, p.id).subscribe(res => {
      const statuses: Record<string, boolean> = {};
      res.data.forEach(tab => {
        statuses[tab.key] = !!tab.is_filled;
      });
      this.tabStatuses.set(statuses);
    });
  }

  onTabChange(tabKey: string) {
    this.activeTab.set(tabKey);
  }

  onSave() {
    // Increment signal to trigger save in child component
    this.triggerSave.update(v => v + 1);
  }

  onChildSave(event: any) {
    const pid = this.proposalId();
    if (!pid) return;

    this.saving.set(true);
    
    // We determine which service to call based on the active tab
    const tab = this.activeTab();
    
    if (tab === 'personal') {
      this.proposalsService.updatePersonalInfo(pid, event.payload, event.entityType, event.participantId).subscribe({
        next: () => {
          this.saving.set(false);
          this.tabStatuses.update(prev => ({ ...prev, 'personal': true }));
        },
        error: () => this.saving.set(false)
      });
    } else if (tab === 'financial') {
      this.proposalsService.updateFinancialInfo(pid, event.payload, event.entityType, event.participantId).subscribe({
        next: () => {
          this.saving.set(false);
          this.tabStatuses.update(prev => ({ ...prev, 'financial': true }));
        },
        error: () => this.saving.set(false)
      });
    } else if (tab === 'credit') {
      this.proposalsService.upsertCreditInfo(pid, event.payload, event.entityType, event.participantId).subscribe({
        next: () => {
          this.saving.set(false);
          this.tabStatuses.update(prev => ({ ...prev, 'credit': true }));
        },
        error: () => this.saving.set(false)
      });
    } else if (tab === 'income' || tab === 'property') {
       // These are handled by their own components but emit changed
       this.tabStatuses.update(prev => ({ ...prev, [tab]: true }));
       this.saving.set(false);
    } else {
        this.saving.set(false);
    }
  }

  markTabFilled(tab: string) {
    this.tabStatuses.update(prev => ({ ...prev, [tab]: true }));
  }

  saveButtonLabel = computed(() => {
    const key = this.activeTab();
    const tab = this.tabs().find(t => t.key === key);
    return `Save ${tab?.label || 'Info'}`;
  });

  onClose() {
    this.ref.close({ saved: true }); // We assume child components save data directly
  }
}
