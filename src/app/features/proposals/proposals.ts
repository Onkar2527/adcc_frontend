import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PageComponent } from '../../shared/components/page/page.component';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/table/table.component';
import { FormDrawerService } from '../../core/services/drawer';
import { ProposalsService, ProposalPayload } from './proposals.service';
import { NewProposalComponent } from './new-proposal/new-proposal.component';
import { EditProposalComponent } from './edit-proposal/edit-proposal.component';
import { TabMappingComponent } from './tab-mapping/tab-mapping.component';
import { PdfViewerComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LoanApplicationComponent } from './forms-proposal/loan-application/loan-application';
import { branchscrutiny } from './forms-proposal/branch-scrutiny/branch-scrutiny';
import { ProposalDocumentsComponent } from './proposal-documents/proposal-documents.component';
import { PdfDownloadService } from '../../core/services/pdf/pdf-download.service';


/* ---- Data model ---------------------------------------------- */
interface Proposal {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  applicant_name: string;
  loan_type: string;
  requested_amount: number;
  mobile_no: string;
  age: number;
  customer_id_or_pan: string;
  pan_number: string;
  aadhaar_number: string;
  created_at: Date;
  updated_at: Date;
}

@Component({
  selector: 'app-proposals',
  standalone: true,
  imports: [CommonModule, PageComponent, TableComponent, DrawerModule, ToastModule, TabMappingComponent, ProposalDocumentsComponent],
  providers: [MessageService],
  template: `
    <app-page title="Loan Proposals" icon="pi pi-file">


      <app-table
        [columns]="columns"
        [data]="allProposals()"
        (onActionClick)="handleColumnAction($event)"
        (onRefresh)="refreshData()"
        (onAdd)="onCreate()"
        [loading]="loading()"
        [loadingRowIds]="loadingRowIds()">
      </app-table>
      
      <!-- Tab Mapping Dialog -->
      <p-drawer 
        header="Tab Mapping" 
        [(visible)]="showTabMappingDialog" 
        position="right"
        [style]="{ width: '600px' }"
        styleClass="tab-manager-dialog"
      >
        <app-tab-mapping 
          *ngIf="showTabMappingDialog()" 
          [proposalId]="selectedProposalId()"
          (onSaved)="onTabMappingSaved()"
          (onCancel)="showTabMappingDialog.set(false)"
        ></app-tab-mapping>
      </p-drawer>

      <!-- Documents Drawer -->
      <p-drawer 
        header="Proposal Documents" 
        [(visible)]="showDocsDrawer" 
        position="right"
        [style]="{ width: '1000px' }"
        styleClass="docs-drawer"
      >
        @if (showDocsDrawer()) {
          <app-proposal-documents 
            [proposalId]="selectedProposalId()">
          </app-proposal-documents>
        }
      </p-drawer>

      <p-toast></p-toast>
    </app-page>
  `
})
export class Proposals implements OnInit {
  private formDrawer = inject(FormDrawerService);
  private proposalsService = inject(ProposalsService);
  private pdfDownloadService = inject(PdfDownloadService);

  /* ---- State ------------------------------------------------ */
  today = new Date();
  loading = signal(false);

  showTabMappingDialog = signal(false);
  showDocsDrawer = signal(false);
  selectedProposalId = signal<string>('');

  loadingRowIds = signal<Set<string>>(new Set());
  private messageService = inject(MessageService);

  /* ---- Source data as signal -------------------------------- */
  private _proposals = signal<Proposal[]>([]);

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    this.proposalsService.getProposals().subscribe({
      next: (response) => {
        const mapped = response.data.map((p: any) => ({
          ...p,
          created_at: new Date(p.created_at),
          updated_at: new Date(p.updated_at)
        }));
        this._proposals.set(mapped);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch proposals', err);
        this.loading.set(false);
      }
    });
  }

  /* ---- Computed filtered datasets --------------------------- */
  allProposals = computed(() => this._proposals());

  /* ---- Column definitions ----------------------------------- */
  columns: TableColumn[] = [
    { field: '_edit', header: 'Edit', type: 'action', actionIcon: 'pi pi-pencil', actionName: 'edit', width: '60px', align: 'center', tooltip: 'Edit Proposal' },
    { field: '_print', header: 'Print', type: 'action', actionIcon: 'pi pi-print', actionName: 'print' },
    { field: '_docs', header: 'Docs', type: 'action', actionIcon: 'pi pi-file-pdf', actionName: 'docs', width: '60px', align: 'center', tooltip: 'Upload Documents' },
    { field: 'id', header: 'Application ID', width: '180px' },
    { field: 'loan_type', header: 'Loan Type', width: '120px' },
    { field: 'requested_amount', header: 'Demand Amount', type: 'currency', width: '150px' },
    { field: 'applicant_name', header: 'Name', width: '200px' },
    { field: 'mobile_no', header: 'Mobile', width: '120px' },
    { field: 'age', header: 'Age', width: '70px', align: 'center' },
    { field: 'customer_id_or_pan', header: 'Customer ID', width: '120px' },
    { field: 'pan_number', header: 'PAN', width: '120px' },
    { field: 'created_at', header: 'Filed On', type: 'date', width: '120px' },
    { field: 'updated_at', header: 'Last Modified', type: 'date', width: '130px' }
  ];

  /* ---- Row actions ------------------------------------------ */
  tableActions: TableAction[] = [
    { label: 'Edit', icon: 'pi pi-pencil', command: (row) => this.onAction('edit', row), styleClass: 'p-button-info' },
    { label: 'Tab Mapping', icon: 'pi pi-cog', command: (row) => this.onAction('tabs', row), styleClass: 'p-button-warning' },
    { label: 'Upload Documents', icon: 'pi pi-upload', command: (row) => this.onAction('upload', row), styleClass: 'p-button-success' },
    { label: 'Print Application', icon: 'pi pi-print', command: (row) => this.onAction('print_app', row), styleClass: 'p-button-secondary' },
    { label: 'Download Application (Direct)', icon: 'pi pi-download', command: (row) => this.onAction('download_app', row), styleClass: 'p-button-success' },
    { label: 'Print Scrutiny', icon: 'pi pi-print', command: (row) => this.onAction('print_scrutiny', row), styleClass: 'p-button-secondary' },
    { label: 'Print Sanction Note', icon: 'pi pi-print', command: (row) => this.onAction('print_sanction', row), styleClass: 'p-button-secondary' },
  ];



  handleColumnAction(event: { name: string; row: any }) {
    const { name, row } = event;

    if (name === 'edit') {
      this.onEdit(row);

    } else if (name === 'print_app') {
      this.openLoanApplication(row);

    } else if (name === 'print_scrutiny') {
      this.openBranchScrutiny(row);
    } else if (name === 'docs') {
      this.selectedProposalId.set(row.id);
      this.showDocsDrawer.set(true);
    }
  }

  async onCreate() {
    const result = await this.formDrawer.open(NewProposalComponent, {
      header: 'New Loan Proposal',
      icon: 'pi pi-file',
      width: '900px',
    });

    if (result.saved) {
      this.onProposalSubmitted(result.data);
    }
  }

  onProposalSubmitted(payload: ProposalPayload) {
    this.loading.set(true);
    this.proposalsService.createProposal(payload).subscribe({
      next: (res) => {
        console.log('New proposal created:', res.data);
        this.refreshData(); // Reload list to include the newly created item
      },
      error: (err) => {
        console.error('Failed to create proposal', err);
        this.loading.set(false);
      }
    });
  }

  onAction(type: string, row: Proposal) {
    if (type === 'edit') {
      this.onEdit(row);
    } else if (type === 'tabs') {
      this.selectedProposalId.set(row.id);
      this.showTabMappingDialog.set(true);
    } else if (type === 'download_app') {
      this.downloadApplicationDirect(row);
    } else {
      console.log(`Action: ${type} for ${row.id}`);
    }
  }

  onTabMappingSaved() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Tab configuration updated successfully'
    });
    this.showTabMappingDialog.set(false);
    this.refreshData();
  }

  async onEdit(proposal: Proposal) {
    const result = await this.formDrawer.open(EditProposalComponent, {
      header: `Edit Proposal: ${proposal.id}`,
      icon: 'pi pi-pencil',
      width: '1000px',
      data: proposal
    });

    if (result.saved) {
      // In a real app we'd call an update API
      console.log('Proposal updated:', result.data);
      this.refreshData();
    }
  }

  downloadApplicationDirect(proposal: Proposal) {
    this.proposalsService.downloadScrutinyReport(proposal.id).subscribe({
      next: (blob) => {
        this.pdfDownloadService.download(blob, `Proposal_Application_${proposal.id}.pdf`);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.messageService.add({ severity: 'error', summary: 'Download Failed', detail: 'Could not download the PDF' });
      }
    });
  }

  printScrutiny(proposal: Proposal) {
    const loadingKey = `${proposal.id}:print`;

    // Add to loading row IDs locally
    this.loadingRowIds.update(set => {
      const next = new Set(set);
      next.add(loadingKey);
      return next;
    });

    this.proposalsService.downloadScrutinyReport(proposal.id).subscribe({
      next: async (blob) => {
        // Open PDF Preview in the standard application drawer
        await this.formDrawer.open(PdfViewerComponent, {
          header: 'Scrutiny Report Preview',
          icon: 'pi pi-file-pdf',
          width: '80vw',
          data: {
            blob,
            filename: `Branch_Scrutiny_Report_${proposal.id}.pdf`
          }
        });

        // Remove from loading row IDs
        this.loadingRowIds.update(set => {
          const next = new Set(set);
          next.delete(loadingKey);
          return next;
        });
      },
      error: (err) => {
        console.error('Failed to download report', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Print Error',
          detail: 'Could not generate scrutiny report'
        });

        // Remove from loading row IDs
        this.loadingRowIds.update(set => {
          const next = new Set(set);
          next.delete(loadingKey);
          return next;
        });
      }
    });
  }

  async openLoanApplication(proposal: Proposal) {
    await this.formDrawer.open(LoanApplicationComponent, {
      header: 'Loan Application Form',
      icon: 'pi pi-file',
      width: '75vw',
      data: proposal
    });
  }

  async openBranchScrutiny(proposal: Proposal) {
    await this.formDrawer.open(branchscrutiny, {
      header: 'Branch Scrutiny Form',
      icon: 'pi pi-file',
      width: '75vw',
      data: proposal
    });
  }

}
