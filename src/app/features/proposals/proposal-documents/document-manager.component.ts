import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsService, DocumentMaster, ProposalDocument } from '../documents.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    FileUploadModule, 
    DialogModule, 
    InputTextModule, 
    FormsModule,
    TagModule,
    TooltipModule
  ],
  template: `
    <div class="document-manager p-3">
      <!-- Master Documents List -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-3 flex align-items-center gap-2">
          <i class="pi pi-file-pdf text-primary"></i> Required Documents
        </h3>
        <div class="grid">
          @for (master of masterDocs(); track master.id) {
            <div class="col-12 md:col-6 lg:col-4">
              <div class="p-3 border-round-xl border-1 border-200 bg-white shadow-sm hover:shadow-md transition-all">
                <div class="flex justify-content-between align-items-start mb-2">
                  <span class="font-medium text-900">{{ master.doc_name }}</span>
                  @if (master.is_mandatory) {
                    <p-tag value="Mandatory" severity="danger" [rounded]="true" styleClass="text-xs"></p-tag>
                  }
                </div>
                
                @let uploaded = getUploadedDoc(master.id);
                @if (uploaded) {
                  <div class="flex align-items-center justify-content-between mt-3">
                    <div class="flex align-items-center gap-2 text-green-600">
                      <i class="pi pi-check-circle"></i>
                      <span class="text-sm">Uploaded</span>
                    </div>
                    <div class="flex gap-1">
                      @if (uploaded.structured_ocr_data) {
                        <i class="pi pi-database text-blue-500 mr-2" pTooltip="Structured OCR Data Available"></i>
                      }
                      <p-button icon="pi pi-eye" [text]="true" severity="secondary" (onClick)="viewDoc(uploaded)" pTooltip="View"></p-button>
                      <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteDoc(uploaded)" pTooltip="Delete"></p-button>
                    </div>
                  </div>
                } @else {
                  <p-fileUpload 
                    mode="basic" 
                    [auto]="false" 
                    chooseLabel="Upload" 
                    chooseIcon="pi pi-upload"
                    styleClass="p-button-outlined p-button-sm w-full mt-3"
                    (onSelect)="onFileSelect($event, master)">
                  </p-fileUpload>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Other Documents Section -->
      <div class="mt-5 pt-4 border-top-1 border-100">
        <div class="flex justify-content-between align-items-center mb-3">
          <h3 class="text-lg font-semibold flex align-items-center gap-2">
            <i class="pi pi-folder-open text-primary"></i> Other Documents
          </h3>
          <p-button label="Add Custom Document" icon="pi pi-plus" [outlined]="true" size="small" (onClick)="showCustomDialog = true"></p-button>
        </div>

        <p-table [value]="otherDocs()" styleClass="p-datatable-sm" [responsiveLayout]="'scroll'">
          <ng-template pTemplate="header">
            <tr>
              <th>Document Name</th>
              <th>File Name</th>
              <th>Status</th>
              <th>Uploaded At</th>
              <th style="width: 100px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr>
              <td>{{ doc.custom_doc_name }}</td>
              <td>{{ doc.file_name }}</td>
              <td>
                <p-tag [value]="doc.status" [severity]="getStatusSeverity(doc.status)"></p-tag>
              </td>
              <td>{{ doc.created_at | date:'short' }}</td>
              <td>
                <div class="flex gap-1 align-items-center">
                  @if (doc.structured_ocr_data) {
                    <i class="pi pi-database text-blue-500" pTooltip="OCR Data Available"></i>
                  }
                  <p-button icon="pi pi-eye" [text]="true" severity="secondary" (onClick)="viewDoc(doc)"></p-button>
                  <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteDoc(doc)"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4 text-500">No other documents found.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Custom Document Dialog -->
    <p-dialog [(visible)]="showCustomDialog" header="Add Custom Document" [modal]="true" [style]="{width: '400px'}">
      <div class="flex flex-column gap-3 p-2">
        <div class="flex flex-column gap-2">
          <label for="docName">Document Name</label>
          <input pInputText id="docName" [(ngModel)]="customDocName" placeholder="e.g. Electricity Bill" />
        </div>
        <div class="flex flex-column gap-2">
          <label>Select File</label>
          <p-fileUpload 
            mode="basic" 
            [auto]="false" 
            chooseLabel="Select & Upload" 
            (onSelect)="onCustomFileSelect($event)"
            [disabled]="!customDocName">
          </p-fileUpload>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    .document-manager {
      background: var(--surface-50);
      min-height: 100%;
    }
  `]
})
export class DocumentManagerComponent implements OnInit {
  @Input({ required: true }) proposalId!: string;
  @Input({ required: true }) entityType!: string;
  @Input() participantId?: number;

  private docsService = inject(DocumentsService);
  private messageService = inject(MessageService);

  masterDocs = signal<DocumentMaster[]>([]);
  uploadedDocs = signal<ProposalDocument[]>([]);
  
  otherDocs = computed(() => 
    this.uploadedDocs().filter(d => !d.document_master_id)
  );

  showCustomDialog = false;
  customDocName = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.docsService.getMasterDocuments(this.entityType).subscribe(res => {
      this.masterDocs.set(res.data);
    });
    this.refreshUploaded();
  }

  refreshUploaded() {
    this.docsService.getProposalDocuments(this.proposalId, this.entityType, this.participantId?.toString()).subscribe(res => {
      this.uploadedDocs.set(res.data);
    });
  }

  getUploadedDoc(masterId: number) {
    return this.uploadedDocs().find(d => d.document_master_id === masterId);
  }

  onFileSelect(event: any, master: DocumentMaster) {
    const file = event.files[0];
    const formData = new FormData();
    formData.append('proposalId', this.proposalId);
    formData.append('entityType', this.entityType);
    formData.append('documentMasterId', master.id.toString());
    if (this.participantId) {
      formData.append('participantId', this.participantId.toString());
    }
    formData.append('file', file);

    this.docsService.uploadDocument(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `${master.doc_name} uploaded` });
        this.refreshUploaded();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' })
    });
  }

  onCustomFileSelect(event: any) {
    const file = event.files[0];
    const formData = new FormData();
    formData.append('proposalId', this.proposalId);
    formData.append('entityType', this.entityType);
    formData.append('customDocName', this.customDocName);
    if (this.participantId) {
      formData.append('participantId', this.participantId.toString());
    }
    formData.append('file', file);

    this.docsService.uploadDocument(formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Document uploaded' });
        this.showCustomDialog = false;
        this.customDocName = '';
        this.refreshUploaded();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Upload failed' })
    });
  }

  viewDoc(doc: ProposalDocument) {
    window.open(this.docsService.getViewUrl(doc.id), '_blank');
  }

  deleteDoc(doc: ProposalDocument) {
    this.docsService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Deleted', detail: 'Document removed' });
        this.refreshUploaded();
      }
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    switch (status) {
      case 'verified': return 'success';
      case 'rejected': return 'danger';
      default: return 'warn';
    }
  }
}
