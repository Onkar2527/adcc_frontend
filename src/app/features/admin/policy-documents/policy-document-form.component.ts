import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';
import { 
  TextFieldComponent, 
  TextareaFieldComponent, 
  CheckboxFieldComponent,
  DateFieldComponent,
  MultiSelectFieldComponent,
  SelectFieldComponent,
  FormActionsComponent 
} from '../../../shared/components/form';
import { PolicyDocumentsService, RoleService } from '../services/masters.service';
import { approvedByOptions } from '../services/required-data';

@Component({
  selector: 'app-policy-document-form',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule,
    TextFieldComponent, 
    TextareaFieldComponent, 
    CheckboxFieldComponent,
    DateFieldComponent,
    MultiSelectFieldComponent,
    SelectFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="flex flex-column h-full p-4" style="max-height: 90vh; overflow-y: auto;">
      <div class="flex-grow-1 overflow-y-auto pr-2">
        <div class="grid">
          <div class="col-12 md:col-6 mb-3">
            <app-text-field
              label="Document Code"
              [field]="documentCode"
              placeholder="Auto-generated"
              [disabled]="true"
            ></app-text-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-text-field
              label="Version No"
              [field]="versionNo"
              placeholder="e.g. 1.0"
              [required]="true"
            ></app-text-field>
          </div>

          <div class="col-12 mb-3">
            <app-text-field
              label="Document Title"
              [field]="documentTitle"
              placeholder="e.g. Loan Audit Policy 2026"
              [required]="true"
            ></app-text-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-text-field
              label="Department"
              [field]="department"
              placeholder="Enter department name"
            ></app-text-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-multi-select-field
              label="User Access"
              [field]="selectedRoles"
              [options]="roleOptions()"
              optionLabel="label"
              optionValue="value"
              [filter]="false"
              placeholder="Select roles..."
            ></app-multi-select-field>
          </div>

          <div class="col-12 mb-3">
            <app-textarea-field
              label="Description"
              [field]="description"
              placeholder="Enter policy description"
              [rows]="3"
            ></app-textarea-field>
          </div>

          <!-- Dates Section -->
          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Issue Date"
              [field]="issueDate"
            ></app-date-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Effective Date"
              [field]="effectiveDate"
            ></app-date-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Renewal Date"
              [field]="reviewDate"
            ></app-date-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Expiry Date"
              [field]="expiryDate"
            ></app-date-field>
          </div>

          <!-- Approval Section -->
          <div class="col-12 md:col-6 mb-3">
            <app-select-field
              label="Approved By"
              [field]="approvedBy"
              [options]="approvedByOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select approver..."
              [filter]="true"
            ></app-select-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Approved Date"
              [field]="approvedDate"
            ></app-date-field>
          </div>

          <!-- Certification Section -->
          <div class="col-12 md:col-6 mb-3">
            <app-text-field
              label="Certified Authority"
              [field]="certifiedAuthority"
              placeholder="Certification authority"
            ></app-text-field>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <app-date-field
              label="Certified Date"
              [field]="certifiedDate"
            ></app-date-field>
          </div>

          <div class="col-12 mb-3">
            <app-textarea-field
              label="Certification Remarks"
              [field]="certificationRemarks"
              placeholder="Enter certification remarks"
              [rows]="2"
            ></app-textarea-field>
          </div>

          <!-- File Upload -->
          <div class="col-12 mb-3">
            <label class="block text-900 font-semibold mb-2">
              Policy Document File <span *ngIf="!isEdit" class="text-red-500">*</span>
            </label>
            <div class="border-2 border-dashed border-300 border-round p-4 text-center">
              <input
                #fileInput
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                hidden
                (change)="onFileSelect($event)"
              />
              <button
                pButton
                type="button"
                icon="pi pi-upload"
                class="p-button-outlined"
                [label]="selectedFileName() ? 'Change File' : 'Choose Document File'"
                (click)="fileInput.click()"
              ></button>
              
              @if (selectedFileName()) {
                <div class="mt-3 text-sm font-medium text-primary">
                  Selected File: {{ selectedFileName() }}
                </div>
              }
            </div>
          </div>

          <div class="col-12 mb-3">
            <app-checkbox-field
              label="Is Active"
              [field]="isActive"
            ></app-checkbox-field>
          </div>
        </div>
      </div>

      <app-form-actions
        class="mt-4 pt-4 border-top-1 border-gray-200"
        [loading]="saving()"
        [saveDisabled]="!isValid()"
        (save)="save()"
        (cancel)="cancel()"
      ></app-form-actions>
    </div>
  `
})
export class PolicyDocumentFormComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private policyService = inject(PolicyDocumentsService);
  private roleService = inject(RoleService);

  documentCode = signal('');
  documentTitle = signal('');
  department = signal('');
  description = signal('');
  versionNo = signal('');
  issueDate = signal<Date | null>(null);
  effectiveDate = signal<Date | null>(null);
  reviewDate = signal<Date | null>(null);
  expiryDate = signal<Date | null>(null);
  approvedBy = signal<string | null>('');
  approvedDate = signal<Date | null>(null);
  certifiedAuthority = signal('');
  certifiedDate = signal<Date | null>(null);
  certificationRemarks = signal('');
  selectedRoles = signal<string[]>([]);
  isActive = signal(true);

  // File Upload State
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');

  saving = signal(false);
  isEdit = false;

  roleOptions = signal<any[]>([]);
  approvedByOptions = approvedByOptions;

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.roleService.findAll().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.roleOptions.set(res.data.map((r: any) => ({
            label: r.role_name,
            value: String(r.id)
          })));
        }
      },
      error: (err) => {
        console.error('Failed to load roles', err);
      }
    });
  }

  constructor() {
    const data = this.ref.data;
    if (data && data.id) {
      this.isEdit = true;
      this.documentCode.set(data.document_code || '');
      this.documentTitle.set(data.document_title || '');
      this.department.set(data.department || '');
      this.description.set(data.description || '');
      this.versionNo.set(data.version_no || '');
      this.issueDate.set(data.issue_date ? new Date(data.issue_date) : null);
      this.effectiveDate.set(data.effective_date ? new Date(data.effective_date) : null);
      this.reviewDate.set(data.review_date ? new Date(data.review_date) : null);
      this.expiryDate.set(data.expiry_date ? new Date(data.expiry_date) : null);
      this.approvedBy.set(data.approved_by || '');
      this.approvedDate.set(data.approved_date ? new Date(data.approved_date) : null);
      this.certifiedAuthority.set(data.certified_authority || '');
      this.certifiedDate.set(data.certified_date ? new Date(data.certified_date) : null);
      this.certificationRemarks.set(data.certification_remarks || '');
      this.selectedRoles.set(data.user_access ? data.user_access.split(',') : []);
      this.isActive.set(Number(data.is_active) === 1);
      this.selectedFileName.set(data.uploaded_file_path || '');
    } else {
      this.documentCode.set('Loading...');
      this.issueDate.set(new Date());
      this.policyService.getNextCode().subscribe({
        next: (res) => {
          this.documentCode.set(res.code);
        },
        error: () => {
          this.documentCode.set('Auto-generated');
        }
      });
    }
  }

  isValid(): boolean {
    const hasTitle = !!this.documentTitle().trim();
    const hasVersion = !!this.versionNo().trim();
    const hasFile = this.isEdit || this.selectedFile() !== null;

    return hasTitle && hasVersion && hasFile;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.selectedFileName.set(file.name);
    }
  }

  save() {
    if (!this.isValid()) return;

    this.saving.set(true);

    const formData = new FormData();
    formData.append('document_code', this.documentCode().trim());
    formData.append('document_title', this.documentTitle().trim());
    formData.append('department', this.department().trim());
    formData.append('description', this.description().trim());
    formData.append('version_no', this.versionNo().trim());
    
    formData.append('issue_date', this.issueDate() ? this.issueDate()!.toISOString() : '');
    formData.append('effective_date', this.effectiveDate() ? this.effectiveDate()!.toISOString() : '');
    formData.append('review_date', this.reviewDate() ? this.reviewDate()!.toISOString() : '');
    formData.append('expiry_date', this.expiryDate() ? this.expiryDate()!.toISOString() : '');
    
    formData.append('approved_by', (this.approvedBy() || '').trim());
    formData.append('approved_date', this.approvedDate() ? this.approvedDate()!.toISOString() : '');
    
    formData.append('certified_authority', (this.certifiedAuthority() || '').trim());
    formData.append('certified_date', this.certifiedDate() ? this.certifiedDate()!.toISOString() : '');
    
    formData.append('certification_remarks', (this.certificationRemarks() || '').trim());
    formData.append('user_access', this.selectedRoles().join(','));
    formData.append('is_active', this.isActive() ? '1' : '0');

    // Currently logged in user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      formData.append('uploaded_by', user.id);
    }

    if (this.selectedFile()) {
      formData.append('file', this.selectedFile()!);
    }

    const obs = this.isEdit 
      ? this.policyService.update(this.ref.data.id, formData)
      : this.policyService.create(formData);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: () => this.saving.set(false)
    });
  }

  cancel() {
    this.ref.close();
  }
}
