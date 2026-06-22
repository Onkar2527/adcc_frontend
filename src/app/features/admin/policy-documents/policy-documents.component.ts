import {
    Component,
    OnInit,
    inject,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableColumn, TableComponent } from '../../../shared/components/table/table.component';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { PolicyDocumentsService } from '../services/masters.service';
import { PolicyDocumentFormComponent } from './policy-document-form.component';

@Component({
    selector: 'app-policy-documents',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableComponent,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule,
        TooltipModule,
    ],
    providers: [ConfirmationService, MessageService],
    template: `
  <div class="card">
    <div class="flex align-items-center justify-content-between mb-4">
      <h5 class="m-0 text-xl font-semibold">
        {{ isAdmin() ? 'Policy Documents Master' : 'Policy Documents' }}
      </h5>
    </div>

    @if (isAdmin()) {
      <app-table
        [columns]="columns"
        [data]="documents()"
        [loading]="loading()"
        [globalFilterFields]="globalFilterFields"
        [actionDisplayMode]="'buttons'"
        [showAddButton]="true"
        (onAdd)="openForm()"
        (onActionClick)="onAction($event)"
        (onRefresh)="load()"
      ></app-table>
    } @else {
      <!-- Modern Non-Admin Cards View -->
      <div class="search-bar-container mb-4 flex align-items-center justify-content-between gap-3">
        <div class="relative w-full md:w-20rem">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            class="search-input w-full"
            placeholder="Search policy documents..."
            (input)="onSearchInput($event)"
          />
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-secondary refresh-btn"
          (click)="load()"
          pTooltip="Refresh Policies"
        ></button>
      </div>

      @if (loading()) {
        <div class="grid">
          @for (x of [1, 2, 3, 4, 5, 6]; track x) {
            <div class="col-12 md:col-6 lg:col-4 p-3">
              <div class="skeleton-card">
                <div class="flex align-items-center mb-3">
                  <div class="skeleton-icon mr-3"></div>
                  <div class="skeleton-text-title w-full"></div>
                </div>
                <div class="skeleton-text mb-2"></div>
                <div class="skeleton-text mb-2 w-8"></div>
                <div class="skeleton-btn mt-4"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredDocuments().length === 0) {
        <div class="text-center py-8 empty-card w-full">
          <i class="pi pi-folder-open text-6xl text-gray-400 mb-4 block"></i>
          <span class="text-xl font-medium text-gray-500">No policy documents found</span>
        </div>
      } @else {
        <div class="grid">
          @for (doc of filteredDocuments(); track doc.id) {
            <div class="col-12 md:col-6 lg:col-4 p-3">
              <div class="policy-card">
                <div class="card-header">
                  <div class="icon-container" [ngClass]="getFileIconClass(doc.uploaded_file_path)">
                    <i [ngClass]="getFileIcon(doc.uploaded_file_path)"></i>
                  </div>
                  <div class="title-section">
                    <span class="doc-code">{{ doc.document_code }}</span>
                    <h6 class="doc-title" [pTooltip]="doc.document_title" tooltipPosition="top">
                      {{ doc.document_title }}
                    </h6>
                  </div>
                </div>

                <div class="card-body">
                  @if (doc.department) {
                    <div class="dept-badge-container mb-3">
                      <span class="dept-badge">
                        <i class="pi pi-building mr-1"></i>
                        {{ doc.department }}
                      </span>
                      <span class="version-badge">
                        v{{ doc.version_no }}
                      </span>
                    </div>
                  } @else {
                    <div class="dept-badge-container mb-3">
                      <span class="version-badge">
                        Version {{ doc.version_no }}
                      </span>
                    </div>
                  }

                  @if (doc.description) {
                    <p class="doc-desc">{{ doc.description }}</p>
                  }

                  <div class="metadata-grid mt-4">
                    <div class="meta-item">
                      <i class="pi pi-calendar-plus text-primary"></i>
                      <div class="meta-details">
                        <span class="meta-label">Renewal Date</span>
                        <span class="meta-value">{{ formatDate(doc.review_date) || '-' }}</span>
                      </div>
                    </div>
                    <div class="meta-item">
                      <i class="pi pi-calendar-times text-danger"></i>
                      <div class="meta-details">
                        <span class="meta-label">Expiry Date</span>
                        <span class="meta-value">{{ formatDate(doc.expiry_date) || '-' }}</span>
                      </div>
                    </div>
                    @if (doc.approved_by) {
                      <div class="meta-item col-span-2">
                        <i class="pi pi-verified text-success"></i>
                        <div class="meta-details">
                          <span class="meta-label">Approved By</span>
                          <span class="meta-value">{{ doc.approved_by }}</span>
                        </div>
                      </div>
                    }
                    @if (doc.certified_authority) {
                      <div class="meta-item col-span-2">
                        <i class="pi pi-shield text-info"></i>
                        <div class="meta-details">
                          <span class="meta-label">Certified Authority</span>
                          <span class="meta-value">{{ doc.certified_authority }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="card-footer">
                  <button
                    pButton
                    type="button"
                    class="w-full download-button p-button-raised flex align-items-center justify-content-center gap-2"
                    (click)="downloadFile(doc)"
                  >
                    <i class="pi pi-download"></i>
                    <span>View / Download Document</span>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    }
  </div>

  <p-toast></p-toast>
  <p-confirmDialog></p-confirmDialog>
`,
    styles: [`
  .search-bar-container {
    margin-top: 0.5rem;
  }
  .search-input {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    color: var(--text-color);
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
    font-size: 1rem;
    pointer-events: none;
  }

  .refresh-btn {
    border-radius: 8px !important;
    width: 2.75rem !important;
    height: 2.75rem !important;
  }

  .policy-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: var(--card-shadow, 0 2px 8px rgba(0,0,0,0.05));
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .icon-container {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;

    &.pdf-icon {
      background: #ffebee;
      color: #c62828;
    }
    &.word-icon {
      background: #e3f2fd;
      color: #1565c0;
    }
    &.img-icon {
      background: #efebe9;
      color: #4e342e;
    }
    &.default-icon {
      background: #f5f5f5;
      color: #616161;
    }
  }

  .title-section {
    flex-grow: 1;
    min-width: 0;
  }

  .doc-code {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .doc-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-body {
    flex-grow: 1;
  }

  .dept-badge-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dept-badge {
    background: var(--surface-100);
    color: var(--text-color-secondary);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
  }

  .version-badge {
    background: rgba(33, 150, 243, 0.1);
    color: var(--primary-color);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .doc-desc {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    line-height: 1.45;
    margin: 0.75rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    height: 3.9rem;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    border-top: 1px solid var(--surface-border);
    padding-top: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    
    i {
      font-size: 1rem;
      margin-top: 0.15rem;
    }

    &.col-span-2 {
      grid-column: span 2;
    }
  }

  .meta-details {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    margin-bottom: 0.15rem;
  }

  .meta-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .card-footer {
    margin-top: 1.5rem;
  }

  ::ng-deep .download-button {
    border-radius: 8px !important;
    font-weight: 600 !important;
    padding: 0.75rem 1rem !important;
    transition: all 0.2s ease !important;
    background: var(--primary-color, #2196f3) !important;
    border-color: var(--primary-color, #2196f3) !important;
    color: #ffffff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.5rem !important;

    i, span {
      color: #ffffff !important;
    }

    &:hover {
      background: var(--primary-color-hover, #1976d2) !important;
      border-color: var(--primary-color-hover, #1976d2) !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
      
      i, span {
        color: #ffffff !important;
      }
    }
  }

  .text-success {
    color: #4caf50;
  }
  .text-danger {
    color: #f44336;
  }
  .text-primary {
    color: var(--primary-color);
  }
  .text-info {
    color: #00bcd4;
  }

  /* Skeleton styling */
  .skeleton-card {
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
  }
  .skeleton-icon {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 10px;
    background: var(--surface-200);
    animation: pulse 1.5s infinite ease-in-out;
  }
  .skeleton-text-title {
    height: 1.25rem;
    border-radius: 4px;
    background: var(--surface-200);
    animation: pulse 1.5s infinite ease-in-out;
  }
  .skeleton-text {
    height: 0.85rem;
    border-radius: 4px;
    background: var(--surface-200);
    animation: pulse 1.5s infinite ease-in-out;
  }
  .skeleton-btn {
    height: 2.5rem;
    border-radius: 8px;
    background: var(--surface-200);
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }

  .empty-card {
    border-radius: 12px;
    border: 1px solid var(--surface-border);
    background: var(--surface-card);
  }
`],
})
export class PolicyDocumentsComponent implements OnInit {
    private service = inject(PolicyDocumentsService);
    private drawer = inject(FormDrawerService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    documents = signal<any[]>([]);
    loading = signal(false);
    isAdmin = signal(false);
    searchQuery = signal('');

    filteredDocuments = computed(() => {
        const query = this.searchQuery().toLowerCase().trim();
        const docs = this.documents();
        if (!query) return docs;
        return docs.filter(doc => 
            String(doc.document_title || '').toLowerCase().includes(query) ||
            String(doc.document_code || '').toLowerCase().includes(query) ||
            String(doc.department || '').toLowerCase().includes(query) ||
            String(doc.description || '').toLowerCase().includes(query)
        );
    });

    globalFilterFields = [
        'document_code',
        'document_title',
        'department',
        'description',
        'version_no',
    ];

    columns: TableColumn[] = [];

    private allColumns: TableColumn[] = [
        {
            field: '_edit',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-pencil',
            actionName: 'edit',
            width: '50px',
            align: 'center',
            tooltip: 'Edit Policy',
        },
        {
            field: '_download',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-download',
            actionName: 'download',
            width: '50px',
            align: 'center',
            tooltip: 'View/Download File',
        },
        {
            field: 'document_code',
            header: 'Code',
            width: '130px',
            sortable: true,
        },
        {
            field: 'document_title',
            header: 'Title',
            width: '200px',
            sortable: true,
        },
        {
            field: 'version_no',
            header: 'Version',
            width: '90px',
        },
        {
            field: 'department',
            header: 'Department',
            width: '135px',
            sortable: true,
        },
        {
            field: 'description',
            header: 'Description',
            width: '200px',
        },
        {
            field: 'issue_date',
            header: 'Issue Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'effective_date',
            header: 'Effective Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'review_date',
            header: 'Renewal Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'expiry_date',
            header: 'Expiry Date',
            type: 'date',
            width: '110px',
        },
        {
            field: 'approved_by',
            header: 'Approved By',
            width: '130px',
        },
        {
            field: 'approved_date',
            header: 'Approved Date',
            type: 'date',
            width: '120px',
        },
        {
            field: 'certified_authority',
            header: 'Certified Authority',
            width: '150px',
        },
        {
            field: 'certified_date',
            header: 'Certified Date',
            type: 'date',
            width: '120px',
        },
        {
            field: 'certification_remarks',
            header: 'Certification Remarks',
            width: '180px',
        },
        {
            field: 'user_access',
            header: 'User Access',
            width: '120px',
        },
        {
            field: 'uploaded_by_name',
            header: 'Uploaded By',
            width: '130px',
        },
        {
            field: 'is_active',
            header: 'Status',
            type: 'status',
            width: '100px',
            align: 'center',
        },
        {
            field: '_status',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-sync',
            actionName: 'toggle-status',
            width: '50px',
            align: 'center',
            tooltip: 'Toggle Status',
        },
        {
            field: '_delete',
            header: '',
            type: 'action',
            actionIcon: 'pi pi-trash',
            actionName: 'delete',
            width: '50px',
            align: 'center',
            tooltip: 'Delete Policy',
            cssClass: 'text-danger',
        },
    ];

    private demoDocuments = [
        {
            id: 9991,
            document_code: 'POL-2026-001',
            document_title: 'Information Security & Cybersecurity Policy',
            department: 'IT & Security',
            description: 'Guidelines and standards for maintaining information security, data encryption, and access controls across the organization.',
            version_no: '2.4',
            issue_date: '2026-01-15',
            effective_date: '2026-01-15',
            review_date: '2026-12-15',
            expiry_date: '2027-06-15',
            approved_by: 'IT Committee Board',
            approved_date: '2026-01-14',
            certified_authority: 'Statutory Board',
            certified_date: '2026-01-15',
            certification_remarks: 'Approved by statutory auditors.',
            user_access: '1,2,3,4',
            uploaded_file_path: 'demo_security_policy.pdf',
            is_active: 1
        },
        {
            id: 9992,
            document_code: 'POL-2026-002',
            document_title: 'KYC & AML Compliance Policy',
            department: 'Compliance',
            description: 'Rules and procedures for Customer Due Diligence (CDD), Know Your Customer (KYC) records, and suspicious transaction monitoring.',
            version_no: '1.0',
            issue_date: '2026-02-01',
            effective_date: '2026-02-01',
            review_date: '2026-10-01',
            expiry_date: '2027-04-01',
            approved_by: 'BOD (Board of Directors)',
            approved_date: '2026-01-28',
            certified_authority: 'Audit Committee Board',
            certified_date: '2026-02-01',
            certification_remarks: 'Complies with central bank guidelines.',
            user_access: '1,2,3',
            uploaded_file_path: 'demo_aml_policy.docx',
            is_active: 1
        },
        {
            id: 9993,
            document_code: 'POL-2026-003',
            document_title: 'Credit Risk Management Guidelines',
            department: 'Credit & Loans',
            description: 'Framework for measuring, monitoring, and mitigating credit risks, loan appraisal criteria, and exposure limits.',
            version_no: '3.1',
            issue_date: '2026-03-10',
            effective_date: '2026-03-10',
            review_date: '2026-11-20',
            expiry_date: '2027-05-20',
            approved_by: 'Loan Committee of Board',
            approved_date: '2026-03-05',
            certified_authority: 'Board of Management',
            certified_date: '2026-03-10',
            certification_remarks: 'Updated with latest risk limits.',
            user_access: '1,2,4',
            uploaded_file_path: 'demo_credit_risk.pdf',
            is_active: 1
        },
        {
            id: 9994,
            document_code: 'POL-2026-004',
            document_title: 'Whistleblower Protection Policy',
            department: 'Human Resources',
            description: 'Standard operational procedures for reporting unethical practices, bribery, or corruption safely without fear of retaliation.',
            version_no: '1.2',
            issue_date: '2026-04-05',
            effective_date: '2026-04-05',
            review_date: '2026-09-10',
            expiry_date: '2027-03-10',
            approved_by: 'Chairman',
            approved_date: '2026-04-02',
            certified_authority: 'Consultant',
            certified_date: '2026-04-05',
            certification_remarks: 'Reviewed by external counsel.',
            user_access: '1,3,4',
            uploaded_file_path: 'demo_whistleblower.png',
            is_active: 1
        },
        {
            id: 9995,
            document_code: 'POL-2026-005',
            document_title: 'Business Continuity & Disaster Recovery Plan',
            department: 'Operations',
            description: 'Procedures and recovery guidelines for business units to ensure continuous operations and service availability during disruptions.',
            version_no: '2.0',
            issue_date: '2026-01-20',
            effective_date: '2026-01-20',
            review_date: '2026-12-01',
            expiry_date: '2027-06-01',
            approved_by: 'Board of Management',
            approved_date: '2026-01-18',
            certified_authority: 'Statutory Board',
            certified_date: '2026-01-20',
            certification_remarks: 'Approved by disaster recovery auditors.',
            user_access: '1,2,3,4',
            uploaded_file_path: 'demo_bcp_policy.pdf',
            is_active: 1
        },
        {
            id: 9996,
            document_code: 'POL-2026-006',
            document_title: 'Conflict of Interest & Ethics Code',
            department: 'Legal',
            description: 'Standards of conduct, rules on gift acceptance, and guidelines for managing personal and professional conflicts of interest.',
            version_no: '1.1',
            issue_date: '2026-03-01',
            effective_date: '2026-03-01',
            review_date: '2026-08-15',
            expiry_date: '2027-02-15',
            approved_by: 'BOD (Board of Directors)',
            approved_date: '2026-02-25',
            certified_authority: 'Chairman',
            certified_date: '2026-03-01',
            certification_remarks: 'All staff signed and acknowledged.',
            user_access: '1,2,3,4',
            uploaded_file_path: 'demo_ethics_code.docx',
            is_active: 1
        }
    ];

    ngOnInit() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleId = String(user.user_type_id || '');
        this.isAdmin.set(roleId === '1');

        if (this.isAdmin()) {
            this.columns = this.allColumns;
        } else {
            this.columns = this.allColumns.filter(col => 
                !['_edit', '_status', '_delete', 'issue_date', 'effective_date', 'approved_date', 'certified_date', 'certification_remarks', 'user_access', 'is_active'].includes(col.field)
            );
        }

        this.load();
    }

    load() {
        this.loading.set(true);
        this.service.findAll()
            .subscribe({
                next: (res: any) => {
                    let rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : [];

                    if (rows.length === 0) {
                        rows = this.demoDocuments;
                    }

                    if (!this.isAdmin()) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const roleId = String(user.user_type_id || '');
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);

                        rows = rows.filter((doc: any) => {
                            // Only active documents
                            if (Number(doc.is_active) !== 1) {
                                return false;
                            }

                            // User access filter (role check)
                            const roles = doc.user_access ? doc.user_access.split(',').map((r: string) => r.trim()) : [];
                            const hasAccess = !doc.user_access || roles.includes(roleId);
                            if (!hasAccess) {
                                return false;
                            }

                            // Effective date (show date) check
                            if (doc.effective_date) {
                                const effective = new Date(doc.effective_date);
                                if (effective > now) {
                                    return false;
                                }
                            }

                            // Expiry date check
                            if (doc.expiry_date) {
                                const expiry = new Date(doc.expiry_date);
                                if (expiry < now) {
                                    return false;
                                }
                            }

                            return true;
                        });
                    }

                    this.documents.set(rows);
                    this.loading.set(false);
                },
                error: () => {
                    let rows = this.demoDocuments;
                    if (!this.isAdmin()) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const roleId = String(user.user_type_id || '');
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);

                        rows = rows.filter((doc: any) => {
                            if (Number(doc.is_active) !== 1) return false;
                            const roles = doc.user_access ? doc.user_access.split(',').map((r: string) => r.trim()) : [];
                            const hasAccess = !doc.user_access || roles.includes(roleId);
                            if (!hasAccess) return false;
                            if (doc.effective_date && new Date(doc.effective_date) > now) return false;
                            if (doc.expiry_date && new Date(doc.expiry_date) < now) return false;
                            return true;
                        });
                    }
                    this.documents.set(rows);
                    this.loading.set(false);
                },
            });
    }

    async openForm(row?: any) {
        let formData = {};
        if (row?.id) {
            formData = { ...row };
        }

        const res = await this.drawer.open(
            PolicyDocumentFormComponent,
            {
                header: row ? 'Update Policy Document' : 'Create Policy Document',
                data: formData,
                width: 'min(700px, 100vw)',
            },
        );

        if (res?.saved) {
            this.load();
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: `Policy document ${row ? 'updated' : 'created'} successfully`,
            });
        }
    }

    onAction(event: { name: string; row: any }) {
        if (event.name === 'edit') {
            this.openForm(event.row);
            return;
        }

        if (event.name === 'download') {
            if (event.row.uploaded_file_path) {
                const url = this.service.getViewUrl(event.row.id);
                window.open(url, '_blank');
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Not Available',
                    detail: 'No file uploaded for this policy document',
                });
            }
            return;
        }

        if (event.name === 'toggle-status') {
            this.toggleStatus(event.row);
            return;
        }

        if (event.name === 'delete') {
            this.confirmDelete(event.row);
            return;
        }
    }

    toggleStatus(row: any) {
        this.service
            .toggleStatus(row.id)
            .subscribe({
                next: () => {
                    this.load();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Status updated successfully',
                    });
                },
            });
    }

    confirmDelete(row: any) {
        this.confirmationService
            .confirm({
                message: 'Are you sure you want to delete this policy document?',
                header: 'Delete Confirmation',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.confirmationService.close();
                    this.service
                        .remove(row.id)
                        .subscribe({
                            next: () => {
                                this.load();
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Success',
                                    detail: 'Policy document deleted successfully',
                                });
                            },
                        });
                },
            });
    }

    onSearchInput(event: Event) {
        const val = (event.target as HTMLInputElement).value;
        this.searchQuery.set(val);
    }

    downloadFile(doc: any) {
        if (doc.uploaded_file_path) {
            const url = this.service.getViewUrl(doc.id);
            window.open(url, '_blank');
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Not Available',
                detail: 'No file uploaded for this policy document',
            });
        }
    }

    getFileIcon(filePath: string): string {
        if (!filePath) return 'pi pi-file';
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pi pi-file-pdf';
        if (['doc', 'docx'].includes(ext || '')) return 'pi pi-file-word';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return 'pi pi-image';
        return 'pi pi-file';
    }

    getFileIconClass(filePath: string): string {
        if (!filePath) return 'default-icon';
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'pdf-icon';
        if (['doc', 'docx'].includes(ext || '')) return 'word-icon';
        if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return 'img-icon';
        return 'default-icon';
    }

    formatDate(dateStr: any): string {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch {
            return dateStr;
        }
    }
}
