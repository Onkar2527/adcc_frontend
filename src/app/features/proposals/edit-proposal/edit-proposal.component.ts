import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { FormDrawerRef } from '../../../core/services/drawer';
import { 
  TabsComponent, 
  TabContentDirective, 
  TabItem 
} from '../../../shared/components/tabs';

import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabMappingComponent } from '../tab-mapping/tab-mapping.component';

import {
  TextFieldComponent,
  NumberFieldComponent,
} from '../../../shared/components/form';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { LoanInfoComponent } from './loan-info/loan-info.component';
import { PropertyInfoComponent } from './property-info/property-info.component';
import { FinancialInfoComponent } from './financial-info/financial-info.component';
import { IncomeInfoComponent } from './income-info/income-info.component';
import { CreditInfoComponent } from './credit-info/credit-info.component';
import { BankSchemeComponent } from './bank-scheme/bank-scheme.component';
import { LoanSpecificComponent } from './loan-specific/loan-specific.component';
import { AssociateListComponent } from './associate-info/associate-list.component';
import { ProposalFinalizeComponent } from './finalize/proposal-finalize.component';
import { ProposalsService } from '../proposals.service';

@Component({
  selector: 'app-edit-proposal',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    PanelModule,
    TabsComponent,
    TabContentDirective,
    PersonalInfoComponent,
    LoanInfoComponent,
    PropertyInfoComponent,
    FinancialInfoComponent,
    IncomeInfoComponent,
    CreditInfoComponent,
    BankSchemeComponent,
    LoanSpecificComponent,
    AssociateListComponent,
    ProposalFinalizeComponent,
    DrawerModule,
    TooltipModule,
    ToastModule,
    TabMappingComponent
  ],
  providers: [MessageService],
  templateUrl: './edit-proposal.component.html',
  styleUrls: ['./edit-proposal.component.scss'],
})
export class EditProposalComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);

  /** Main Proposal Data (from table list) */
  proposalData = signal<any>(null);

  /** Detailed Sub-Table Data Signals */
  personalInfoData = signal<any>(null);
  loanInfoData     = signal<any>(null);
  propertyData     = signal<any[]>([]);
  financialInfoData = signal<any>(null);
  incomeInfoData   = signal<any>(null);
  creditInfoData   = signal<any>(null);
  bankSchemeData   = signal<any>(null);
  machineryInfoData = signal<any[]>([]);
  higherPurchaseData = signal<any>(null);

  /** Saving state */
  saving = signal(false);

  /** Counts for badges */
  guarantorCount = signal(0);
  coborrowerCount = signal(0);

  /** Tab statuses: saved | pending | none */
  tabStatuses = signal<Record<string, 'saved' | 'pending' | 'none'>>({});

  /** Dynamic Tab List (fetched from backend) */
  dynamicTabs = signal<any[]>([]);

  /** Active Tab */
  activeTab = signal('personal');

  /** Computed Proposal ID with robust fallback for different naming conventions */
  proposalId = computed(() => {
    const data = this.proposalData();
    if (!data) return undefined;
    const rawId = data.id || data.proposal_id || data.ProposalID || data.ID;
    return rawId?.toString();
  });

  /** Tab Manager UI State */
  showTabManager = signal(false);

  private messageService = inject(MessageService);

  private personalInfoPayload: any = {};
  private loanInfoPayload: any     = {};
  private financialInfoPayload: any = {};
  private creditInfoPayload: any = {};
  private bankSchemePayload: any = {};
  private machineryInfoPayload: any = {};
  private higherPurchasePayload: any = {};

  constructor() {
    const incomingData = this.ref.data;
    if (incomingData) {
      this.proposalData.set(incomingData);
    }

    // Effect for On-Demand (Lazy) Data Fetching
    effect(() => {
      const activeTab = this.activeTab();
      const proposalId = this.proposalData()?.id;
      if (!activeTab || !proposalId) return;

      this.fetchTabData(activeTab, proposalId);
    });
  }

  ngOnInit() {
    this.initialFetch();
  }

  private initialFetch() {
    const id = this.proposalData()?.id;
    if (!id) return;

    // Fetch Dynamic Tabs
    this.proposalsService.getProposalTabs(id).subscribe({
      next: (res) => {
        this.dynamicTabs.set(res.data);
        
        // Initialize statuses for all dynamic tabs
        const newStatuses: Record<string, 'saved' | 'pending' | 'none'> = {};
        res.data.forEach(tab => {
          newStatuses[tab.key] = tab.is_filled ? 'saved' : 'none';
        });
        this.tabStatuses.set(newStatuses);
        
        if (res.data.length > 0 && !this.activeTab()) {
          this.activeTab.set(res.data[0].key);
        }
      },
      error: (err) => console.error('[EditProposal] Tabs fetch failed', err)
    });

    // Fetch Participants to get counts
    this.proposalsService.getParticipants(id).subscribe({
      next: (res: any) => {
        const guarantors = res.data.filter((p: any) => p.entity_type === 'G').length;
        const coborrowers = res.data.filter((p: any) => p.entity_type === 'C').length;
        this.guarantorCount.set(guarantors);
        this.coborrowerCount.set(coborrowers);
      }
    });
  }

  private fetchTabData(tabKey: string, id: string) {
    if (tabKey === 'personal' && !this.personalInfoData()) {
      this.proposalsService.getPersonalInfo(id).subscribe({
        next: (res) => {
          this.personalInfoData.set(res.data);
          this.personalInfoPayload = this.mapToPersonalInfoPayload(res.data);
        },
        error: (err) => console.error('[EditProposal] Personal info fetch failed', err)
      });
    } else if (tabKey === 'loan' && !this.loanInfoData()) {
      this.proposalsService.getLoanInfo(id).subscribe({
        next: (res) => {
          this.loanInfoData.set(res.data);
          this.loanInfoPayload = this.mapToLoanInfoPayload(res.data);
        },
        error: (err) => console.error('[EditProposal] Loan info fetch failed', err)
      });
    } else if (tabKey === 'property') {
      // Properties are always fetched to ensure latest list
      this.proposalsService.getProperties(id).subscribe({
        next: (res) => {
           this.propertyData.set(res.data);
           // If list has data, ensure is_filled is sync'd locally
           if (res.data.length > 0) {
              this.syncTabStatus('property', true);
           }
        },
        error: (err) => console.error('[EditProposal] Properties fetch failed', err)
      });
    } else if (tabKey === 'financial' && !this.financialInfoData()) {
      this.proposalsService.getFinancialInfo(id).subscribe({
        next: (res) => {
          this.financialInfoData.set(res.data);
          this.financialInfoPayload = this.mapToFinancialInfoPayload(res.data);
        },
        error: (err) => console.error('[EditProposal] Financial info fetch failed', err)
      });
    } else if (tabKey === 'income') {
      this.proposalsService.getIncomes(id).subscribe({
        next: (res) => {
          this.incomeInfoData.set(res.data);
          // Check if any income exists to sync filled status
          const hasIncome = Object.values(res.data).some((arr: any) => arr && arr.length > 0);
          if (hasIncome) this.syncTabStatus('income', true);
        },
        error: (err) => console.error('[EditProposal] Incomes fetch failed', err)
      });
    } else if (tabKey === 'credit' && !this.creditInfoData()) {
      this.proposalsService.getCreditInfo(id).subscribe({
        next: (res) => {
          this.creditInfoData.set(res.data);
          this.creditInfoPayload = res.data;
        },
        error: (err) => console.error('[EditProposal] Credit info fetch failed', err)
      });
    } else if (tabKey === 'bank_scheme' && !this.bankSchemeData()) {
      this.proposalsService.getBankScheme(id).subscribe({
        next: (res) => {
          this.bankSchemeData.set(res.data);
          this.bankSchemePayload = res.data;
        },
        error: (err) => console.error('[EditProposal] Bank scheme fetch failed', err)
      });
    } else if (tabKey === 'loan_specific' && !this.higherPurchaseData()) {
      // Fetch both: Global Settings AND Item List
      this.proposalsService.getHigherPurchaseData(id).subscribe({
        next: (res) => {
          this.higherPurchaseData.set(res.data);
          this.higherPurchasePayload = res.data;
          if (res.data) this.syncTabStatus('loan_specific', true);
        }
      });
      this.proposalsService.getMachineryInfo(id).subscribe({
        next: (res) => {
          this.machineryInfoData.set(res.data);
        },
        error: (err) => console.error('[EditProposal] Machinery info fetch failed', err)
      });
    }
  }

  private syncTabStatus(tabKey: string, isFilled: boolean) {
    this.tabStatuses.update(s => ({ ...s, [tabKey]: isFilled ? 'saved' : 'none' }));
    this.dynamicTabs.update(tabs => tabs.map(t => 
      t.key === tabKey ? { ...t, is_filled: isFilled } : t
    ));
  }

  markTabPending(tabKey: string) {
    const current = this.tabStatuses()[tabKey];
    if (current !== 'pending') {
      this.tabStatuses.update(s => ({ ...s, [tabKey]: 'pending' }));
    }
  }

  saveButtonLabel = computed(() => {
    const key = this.activeTab();
    const tab = this.tabs().find(t => t.key === key);
    return `Save ${tab?.label || 'Info'}`;
  });

  tabs = computed(() => {
    const statuses = this.tabStatuses();
    const gCount = this.guarantorCount();
    const cCount = this.coborrowerCount();

    const mappedTabs = this.dynamicTabs().map(t => {
      let label = t.label;
      if (t.key === 'guarantor' && gCount > 0) label = `${t.label} (${gCount})`;
      if (t.key === 'coborrower' && cCount > 0) label = `${t.label} (${cCount})`;

      return {
        key: t.key,
        label: label,
        icon: t.icon,
        status: statuses[t.key] || 'none',
        isFilled: t.is_filled
      };
    }) as TabItem[];

    // Dynamically append the Finalize tab
    mappedTabs.push({
      key: 'finalize',
      label: 'Final Summary',
      icon: 'pi pi-check-square',
      status: statuses['finalize'] || 'none',
      isFilled: false
    });

    return mappedTabs;
  });

  // ── Personal Info Event Handlers ──
  onPersonalInfoChange(payload: any) { 
    this.personalInfoPayload = payload;
    this.markTabPending('personal'); 
  }
  onPersonalInfoSave(payload: any) {
    this.personalInfoPayload = payload;
    this.saveTab('personal');
  }

  // ── Loan Info Event Handlers ──
  onLoanInfoChange(payload: any) { 
    this.loanInfoPayload = payload;
    this.markTabPending('loan'); 
  }
  onLoanInfoSave(payload: any) {
    this.loanInfoPayload = payload;
    this.saveTab('loan');
  }

  // ── Financial Info Event Handlers ──
  onFinancialInfoChange(payload: any) {
    this.financialInfoPayload = payload;
    this.markTabPending('financial');
  }

  // ── Credit Info Event Handlers ──
  onCreditInfoChange(payload: any) {
    this.creditInfoPayload = payload;
    this.markTabPending('credit');
  }

  // ── Bank Scheme Event Handlers ──
  onBankSchemeChange(payload: any) {
    this.bankSchemePayload = payload;
    this.markTabPending('bank_scheme');
  }
  onBankSchemeSave(payload: any) {
    this.bankSchemePayload = payload;
    this.saveTab('bank_scheme');
  }

  // ── Machinery Info Event Handlers ──
  onMachineryInfoChange(payload: any) {
    this.machineryInfoPayload = payload;
    this.markTabPending('loan_specific');
  }
  onMachineryInfoSave(payload: any) {
    // Items save themselves via upsertMachineryItem in the component
    this.saveTab('loan_specific');
  }

  onHigherPurchaseChange(payload: any) {
    this.higherPurchasePayload = payload;
    this.markTabPending('loan_specific');
  }

  onMachineryRefresh() {
    const proposalId = this.proposalData()?.id;
    if (proposalId) {
      this.proposalsService.getMachineryInfo(proposalId).subscribe({
        next: (res: any) => {
          this.machineryInfoData.set(res.data);
          if (res.data.length > 0) {
            this.markTabSaved('loan_specific');
          }
        }
      });
    }
  }


  saveTab(tabKey: string) {
    const proposalId = this.proposalData()?.id;
    if (!proposalId) return;

    this.saving.set(true);

    if (tabKey === 'personal') {
      this.proposalsService.updatePersonalInfo(proposalId, this.personalInfoPayload).subscribe({
        next: (res: any) => {
          this.personalInfoData.set(res.data);
          this.finishSave(tabKey);
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'loan') {
      this.proposalsService.updateLoanInfo(proposalId, this.loanInfoPayload).subscribe({
        next: (res: any) => {
          this.loanInfoData.set(res.data);
          this.finishSave(tabKey);
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'property') {
      this.proposalsService.markTabAsFilled(proposalId, tabKey).subscribe({
        next: () => this.finishSave(tabKey),
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'financial') {
      this.proposalsService.updateFinancialInfo(proposalId, this.financialInfoPayload).subscribe({
        next: () => {
          this.finishSave(tabKey);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Financial info saved successfully' });
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'income') {
      this.proposalsService.markTabAsFilled(proposalId, tabKey).subscribe({
        next: () => this.finishSave(tabKey),
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'credit') {
      this.proposalsService.upsertCreditInfo(proposalId, this.creditInfoPayload).subscribe({
        next: (res: any) => {
          this.creditInfoData.set(res.data);
          this.finishSave(tabKey);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Credit info saved successfully' });
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'bank_scheme') {
      this.proposalsService.updateBankScheme(proposalId, this.bankSchemePayload).subscribe({
        next: (res: any) => {
          this.bankSchemeData.set(res.data);
          this.finishSave(tabKey);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Bank scheme MIS saved successfully' });
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'loan_specific') {
      this.proposalsService.updateHigherPurchaseData(proposalId, this.higherPurchasePayload).subscribe({
        next: (res: any) => {
          this.higherPurchaseData.set(res.data);
          this.finishSave(tabKey);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Loan specific settings saved' });
        },
        error: (err: any) => this.handleSaveError(err)
      });
    } else if (tabKey === 'guarantor' || tabKey === 'coborrower') {
      this.proposalsService.markTabAsFilled(proposalId, tabKey).subscribe({
        next: () => {
          this.finishSave(tabKey);
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} section marked as complete` });
        },
        error: (err: any) => this.handleSaveError(err)
      });
    }
  }

  onPropertyRefresh() {
    const proposalId = this.proposalData()?.id;
    if (proposalId) {
      this.proposalsService.getProperties(proposalId).subscribe({
        next: (res: any) => {
          this.propertyData.set(res.data);
          this.markTabSaved('property');
        }
      });
    }
  }

  onFinancialRefresh() {
    const proposalId = this.proposalData()?.id;
    if (proposalId) {
      this.proposalsService.getFinancialInfo(proposalId).subscribe({
        next: (res: any) => {
          this.financialInfoData.set(res.data);
          this.markTabSaved('financial');
        }
      });
    }
  }

  onIncomeRefresh() {
    const proposalId = this.proposalData()?.id;
    if (proposalId) {
      this.proposalsService.getIncomes(proposalId).subscribe({
        next: (res: any) => {
          this.incomeInfoData.set(res.data);
          this.markTabSaved('income');
        }
      });
    }
  }

  private finishSave(tabKey: string) {
    this.saving.set(false);
    this.markTabSaved(tabKey);
  }

  private markTabSaved(tabKey: string) {
    this.tabStatuses.update(s => ({ ...s, [tabKey]: 'saved' }));
    this.dynamicTabs.update(tabs => tabs.map(t => 
      t.key === tabKey ? { ...t, is_filled: true } : t
    ));
  }

  private handleSaveError(err: any) {
    console.error('[EditProposal] Save failed', err);
    this.saving.set(false);
  }

  refreshParticipantCounts() {
    const id = this.proposalData()?.id;
    if (!id) return;
    
    this.proposalsService.getParticipants(id).subscribe({
      next: (res: any) => {
        const guarantors = res.data.filter((p: any) => p.entity_type === 'G').length;
        const coborrowers = res.data.filter((p: any) => p.entity_type === 'C').length;
        this.guarantorCount.set(guarantors);
        this.coborrowerCount.set(coborrowers);
      }
    });
  }

  onCancel() {
    this.ref.close();
  }

  // ── Tab Mapping Manager ──
  openTabManager() {
    this.showTabManager.set(true);
  }

  onTabMappingSaved() {
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: 'Tab configuration updated successfully' 
    });
    this.showTabManager.set(false);
    this.initialFetch(); // Refresh dynamic tabs
  }

  // ── Payload Mapping Helpers ──
  private mapToPersonalInfoPayload(d: any): any {
    if (!d) return {};
    return {
      applicant_name: d.applicant_name,
      religion: d.religion,
      cast: d.cast_name,
      dob: d.dob,
      education: d.education,
      gender: d.gender,
      marital_status: d.marital_status,
      age: d.age,
      is_bank_member: d.is_bank_member,
      member_type: d.member_type,
      membership_date: d.membership_date,
      member_no: d.member_no,
      bank_shares_amount: d.bank_shares_amount,
      pan_number: d.pan_number,
      aadhaar_number: d.aadhaar_number,
      family_members_count: d.family_members_count,
      earners_count: d.earners_out_of_them,
      net_worth_amount: d.net_worth_amount,
      net_worth_date: d.net_worth_date,
      profession: d.profession,
      relation_with_director: d.relation_with_director,
      email_id: d.email_id,
      mobile_no: d.mobile_no,
      mobile_no_2: d.mobile_no_2,
      full_address: d.full_address
    };
  }

  private mapToLoanInfoPayload(d: any): any {
    if (!d) return {};
    return {
      loan_type: d.loan_type,
      reason_of_loan: d.reason_of_loan,
      requested_amount: d.requested_amount,
      requested_amount_words: d.requested_amount_words,
      installment_type: d.installment_type,
      duration_months: d.duration_months,
      interest_rate: d.interest_rate,
      monthly_installment: d.monthly_installment,

      has_moratorium: d.has_moratorium,
      moratorium_period: d.moratorium_period,
      has_insurance: d.has_insurance,
      insurance_amount: d.insurance_amount,
      total_requested_amount: d.total_requested_amount,
      is_participation_loan: d.is_participation_loan,
      participation_details: d.participation_details ?? []
    };
  }

  private mapToFinancialInfoPayload(d: any): any {
    if (!d) return {};
    return {
      bank_name: d.bank_name,
      account_number: d.account_number,
      is_itr_filed: d.is_itr_filed,
      itr_financial_year: d.itr_financial_year,
      itr_income_amount: d.itr_income_amount,
      itr_tax_amount: d.itr_tax_amount,
      pays_property_tax: d.pays_property_tax,
      wealth_amount: d.wealth_amount,
      property_tax_amount: d.property_tax_amount,
      last_assessment_year: d.last_assessment_year,
      has_investments: d.has_investments,
      investment_details: d.investment_details,
      has_cibil: d.has_cibil,
      cibil_type: d.cibil_type,
      cibil_date: d.cibil_date,
      cibil_cmr: d.cibil_cmr,
      cibil_details: d.cibil_details
    };
  }

  finalizeRemarks = signal('');

  isAllTabsCompleted = computed(() => {
    // Check if all mandatory tabs from the dynamic list are filled
    return this.tabs()
      .filter(t => t.key !== 'finalize')
      .every(t => t.isFilled);
  });

  submitProposal() {
    this.onProposalSubmit({ remarks: this.finalizeRemarks() });
  }

  onProposalSubmit(event: { remarks: string }) {
    const proposalId = this.proposalId();
    if (!proposalId) return;

    this.saving.set(true);
    this.proposalsService.submitProposal(proposalId, event.remarks).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Proposal Submitted', 
          detail: 'The loan proposal has been successfully submitted for review.' 
        });
        setTimeout(() => this.ref.close({ submitted: true }), 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.handleSaveError(err);
      }
    });
  }
}
