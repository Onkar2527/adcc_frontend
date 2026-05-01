import {
  Component, signal, computed, inject, effect, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
import { DialogModule } from 'primeng/dialog';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FormDrawerRef } from '../../../core/services/drawer';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {
  TextFieldComponent,
  NumberFieldComponent,
  SelectFieldComponent,
  DateFieldComponent,
  CheckboxFieldComponent,
  TextareaFieldComponent,
  FormActionsComponent
} from '../../../shared/components/form';
import { LoanTypeService } from '../../admin/services/masters.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ProposalsService } from '../proposals.service';
import { DocumentsService } from '../documents.service';
import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/* ── Field helpers ────────────────────────────────────────── */
function txt(v = '') { return signal(v); }
function num() { return signal<number | null>(null); }
function dt() { return signal<Date | null>(null); }
function bool(v = false) { return signal(v); }

/* ── Static option lists ──────────────────────────────────── */
const GENDER_OPTIONS = [
  { label: 'Male',   value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other',  value: 'O' },
];

const EDUCATION_OPTIONS = [
  { label: 'Below 10th',    value: 'below_10' },
  { label: '10th Pass',     value: '10th' },
  { label: '12th Pass',     value: '12th' },
  { label: 'Graduate',      value: 'graduate' },
  { label: 'Post Graduate', value: 'post_graduate' },
  { label: 'Professional',  value: 'professional' },
];

const GRADING_OPTIONS = [
  { label: 'A+', value: 'A+' },
  { label: 'A',  value: 'A'  },
  { label: 'B+', value: 'B+' },
  { label: 'B',  value: 'B'  },
  { label: 'C',  value: 'C'  },
  { label: 'D',  value: 'D'  },
];


@Component({
  selector: 'app-new-proposal',
  standalone: true,
  imports: [
    CommonModule,
    DividerModule,
    ButtonModule,
    TextFieldComponent,
    NumberFieldComponent,
    SelectFieldComponent,
    DateFieldComponent,
    TextareaFieldComponent,
    PanelModule,
    FieldsetModule,
    FileUploadModule,
    DialogModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    FormsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './new-proposal.component.html',
  styleUrls: ['./new-proposal.component.scss'],
})
export class NewProposalComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private loanTypeService = inject(LoanTypeService);
  private currencyService = inject(CurrencyService);
  private proposalsService = inject(ProposalsService);
  private docsService = inject(DocumentsService);
  private messageService = inject(MessageService);

  /** Today's date — used as maxDate on DOB picker */
  today = new Date();

  /** Loading / saving state */
  saving = signal(false);

  // ── Form fields ──────────────────────────────────────────
  isExistingCustomer = bool(false);
  customerIdOrPan    = txt();

  applicantName  = txt();
  gender         = signal<string | null>(null);
  education      = signal<string | null>(null);
  dob            = dt();
  age            = num();
  panNumber      = txt();
  grading        = signal<string | null>(null);
  aadhaarNumber  = txt();
  midNumber      = txt();
  ckycNumber     = txt();
  emailId        = txt();
  mobileNo       = txt();

  loanType             = signal<string | null>(null);
  requestedAmount      = num();
  requestedAmountWords = txt();
  reasonOfLoan         = txt();
  
  // Document Files & Temp IDs
  panFile = signal<File | null>(null);
  panTempId = signal<string | null>(null);
  aadhaarFile = signal<File | null>(null);
  aadhaarTempId = signal<string | null>(null);
  
  uploadingDocs = signal(false);
  processingPan = signal(false);
  processingAadhaar = signal(false);
  processingStatus = signal<string | null>(null);

  // Verification States
  panVerified = signal(false);
  aadhaarVerified = signal(false);
  verifyingPan = signal(false);
  verifyingAadhaar = signal(false);
  
  showAadhaarOtpDialog = signal(false);
  aadhaarOtp = signal('');
  aadhaarTxnId = signal('');

  // OCR Results (from file upload)
  panOcrData = signal<any>(null);
  aadhaarOcrData = signal<any>(null);

  // Verification Results (from official APIs)
  panData = signal<any>(null);
  aadhaarData = signal<any>(null);

  // ── Static options ────────────────────────────────────────
  genderOptions    = GENDER_OPTIONS;
  educationOptions = EDUCATION_OPTIONS;
  gradingOptions   = GRADING_OPTIONS;
  loanTypeOptions  = signal<any[]>([]);
  
  selectedLoanTypeLabel = computed(() => {
    const id = this.loanType();
    if (!id) return null;
    const option = this.loanTypeOptions().find(o => o.value === id);
    return option ? option.label : null;
  });

  // ── Computed age from DOB ─────────────────────────────────
  constructor() {
    effect(() => {
      const d = this.dob();
      if (!d) {
        this.age.set(null);
        return;
      }
      const today = new Date();
      let years = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
      this.age.set(years);
    }, { allowSignalWrites: true });

    // ── Effect: Auto-calculate Amount in Words ─────────────
    effect(() => {
      const amt = this.requestedAmount();
      if (amt !== null && amt !== undefined) {
        const words = this.currencyService.amountToWords(amt);
        if (words) {
          this.requestedAmountWords.set(words);
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.fetchLoanTypes();
  }

  private fetchLoanTypes() {
    this.loanTypeService.findAll().subscribe({
      next: (res: any) => {
        const options = res.data.map((t: any) => ({
          label: t.type_name,
          value: t.type_code
        }));
        this.loanTypeOptions.set(options);
      },
      error: (err) => console.error('[NewProposal] Failed to fetch loan types', err)
    });
  }

  // ── Validation ────────────────────────────────────────────
  errors = computed((): Record<string, string | undefined> => {
    const e: Record<string, string | undefined> = {};
    if (!this.applicantName())   e['applicantName']   = 'Applicant name is required';
    if (!this.mobileNo())        e['mobileNo']        = 'Mobile number is required';
    if (!this.panNumber())       e['panNumber']       = 'PAN number is required';
    if (!this.loanType())        e['loanType']        = 'Please select loan type';
    if (!this.requestedAmount()) e['requestedAmount'] = 'Requested amount is required';
    return e;
  });

  isValid = computed(() => Object.keys(this.errors()).length === 0);

  onCancel() {
    this.ref.close({ saved: false });
  }

  onPanUpload(event: any) {
    const file = event.files[0];
    if (!file) return;

    this.panFile.set(file);
    this.processingPan.set(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'PAN');

    this.processingStatus.set('Processing PAN OCR...');
    this.docsService.uploadTemporaryDocument(formData).subscribe({
      next: (res) => {
        this.panTempId.set(res.data.id);
        this.panOcrData.set(res.ocrData);
        
        if (res.ocrData) {
          this.panNumber.set(res.ocrData.panNumber || '');
          this.applicantName.set(res.ocrData.applicantName || '');
        }
        
        this.processingPan.set(false);
        this.processingStatus.set(null);
        this.checkOcrCrossConsistency();
      },
      error: () => {
        this.processingPan.set(false);
        this.processingStatus.set(null);
      }
    });
  }

  onAadhaarUpload(event: any) {
    const file = event.files[0];
    if (!file) return;

    this.aadhaarFile.set(file);
    this.processingAadhaar.set(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'AADHAAR');

    this.processingStatus.set('Processing Aadhaar OCR...');
    this.docsService.uploadTemporaryDocument(formData).subscribe({
      next: (res) => {
        this.aadhaarTempId.set(res.data.id);
        this.aadhaarOcrData.set(res.ocrData);
        
        if (res.ocrData) {
          this.aadhaarNumber.set(res.ocrData.aadhaarNumber || '');
          if (!this.applicantName()) this.applicantName.set(res.ocrData.applicantName || '');
          if (!this.dob()) this.dob.set(res.ocrData.dob ? new Date(res.ocrData.dob) : null);
          if (!this.gender()) this.gender.set(res.ocrData.gender || null);
        }
        
        this.processingAadhaar.set(false);
        this.processingStatus.set(null);
        this.checkOcrCrossConsistency();
      },
      error: () => {
        this.processingAadhaar.set(false);
        this.processingStatus.set(null);
      }
    });
  }

  checkOcrCrossConsistency() {
    const p = this.panOcrData();
    const a = this.aadhaarOcrData();
    if (!p || !a) return;

    const nameMatch = this.normalize(p.applicantName) === this.normalize(a.applicantName);
    if (!nameMatch) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Data Mismatch', 
        detail: 'Name on PAN does not match Name on Aadhaar (OCR)' 
      });
    }
  }

  normalize(val: any): string {
    return (val || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  verifyPan() {
    if (!this.panNumber()) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter PAN number' });
      return;
    }
    this.verifyingPan.set(true);
    
    this.proposalsService.verifyPan(this.panNumber()).subscribe({
      next: (res) => {
        this.verifyingPan.set(false);
        if (res.status === 'success') {
          // CHECK: Match with OCR Data
          const ocrName = this.panOcrData()?.applicantName;
          const verifyName = res.data.full_name;
          
          if (this.normalize(ocrName) !== this.normalize(verifyName)) {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Verification Mismatch', 
              detail: 'Official PAN Name does not match OCR Data' 
            });
            return;
          }

          this.panVerified.set(true);
          this.panData.set(res.data);
          if (res.data.full_name) {
            this.applicantName.set(res.data.full_name);
          }
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'PAN verified successfully' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'PAN verification failed' });
        }
      },
      error: (err) => {
        this.verifyingPan.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'PAN verification failed' });
      }
    });
  }

  verifyAadhaar() {
    if (!this.aadhaarNumber()) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter Aadhaar number' });
      return;
    }
    this.verifyingAadhaar.set(true);
    
    this.proposalsService.verifyAadhaarOtp(this.aadhaarNumber()).subscribe({
      next: (res) => {
        this.verifyingAadhaar.set(false);
        if (res.status === 'success') {
          this.aadhaarTxnId.set(res.data.client_id);
          this.showAadhaarOtpDialog.set(true);
          this.messageService.add({ severity: 'info', summary: 'OTP Sent', detail: 'OTP sent to registered mobile number' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'Failed to send OTP' });
        }
      },
      error: (err) => {
        this.verifyingAadhaar.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Aadhaar verification failed' });
      }
    });
  }

  submitAadhaarOtp() {
    if (!this.aadhaarOtp()) return;
    
    this.verifyingAadhaar.set(true);
    this.proposalsService.verifyAadhaarData(this.aadhaarTxnId(), this.aadhaarOtp(), this.aadhaarNumber()).subscribe({
      next: (res) => {
        this.verifyingAadhaar.set(false);
        if (res.status === 'success') {
          // CHECK: Match with OCR Data
          const ocrName = this.aadhaarOcrData()?.applicantName;
          const verifyName = res.data.full_name;
          
          if (this.normalize(ocrName) !== this.normalize(verifyName)) {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Verification Mismatch', 
              detail: 'Official Aadhaar Name does not match OCR Data' 
            });
            return;
          }

          this.showAadhaarOtpDialog.set(false);
          this.aadhaarVerified.set(true);
          this.aadhaarData.set(res.data);
          
          const data = res.data;
          if (data.full_name) this.applicantName.set(data.full_name);
          if (data.gender) {
            const g = data.gender.toUpperCase();
            if (g === 'MALE') this.gender.set('M');
            else if (g === 'FEMALE') this.gender.set('F');
          }
          if (data.dob) this.dob.set(new Date(data.dob));
          
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Aadhaar verified successfully' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: res.message || 'OTP verification failed' });
        }
      },
      error: (err) => {
        this.verifyingAadhaar.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Aadhaar verification failed' });
      }
    });
  }

  onSave() {
    if (!this.isValid()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all required fields' });
      return;
    }

    this.saving.set(true);
    const payload = {
      customerIdentity: {
        isExistingCustomer: this.isExistingCustomer(),
        customerIdOrPan: this.panNumber()
      },
      applicantDetails: {
        applicantName: this.applicantName(),
        gender: this.gender(),
        education: this.education(),
        dob: this.dob(),
        age: this.age(),
        panNumber: this.panNumber(),
        grading: this.grading(),
        aadhaarNumber: this.aadhaarNumber(),
        midNumber: this.midNumber(),
        ckycNumber: this.ckycNumber(),
        emailId: this.emailId(),
        mobileNo: this.mobileNo()
      },
      loanDetails: {
        loan_type: this.loanType(),
        requested_amount: this.requestedAmount(),
        requested_amount_words: this.requestedAmountWords(),
        reason_of_loan: this.reasonOfLoan()
      },
      verification_metadata: {
        pan_ocr: this.panOcrData(),
        aadhaar_ocr: this.aadhaarOcrData(),
        pan_data: this.panData(),
        aadhaar_data: this.aadhaarData()
      }
    };

    this.proposalsService.createProposal(payload).pipe(
      switchMap(res => {
        const proposalId = res.data.id;
        const commits = [];

        if (this.panTempId()) {
          commits.push(this.docsService.commitTemporaryDocument({
            tempId: this.panTempId()!,
            proposalId,
            entityType: 'B',
            customDocName: 'PAN Card'
          }));
        }

        if (this.aadhaarTempId()) {
          commits.push(this.docsService.commitTemporaryDocument({
            tempId: this.aadhaarTempId()!,
            proposalId,
            entityType: 'B',
            customDocName: 'Aadhaar Card'
          }));
        }

        if (commits.length > 0) {
          this.uploadingDocs.set(true);
          return forkJoin(commits).pipe(
            switchMap(() => of(res))
          );
        }
        return of(res);
      })
    ).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.uploadingDocs.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Proposal created successfully' });
        this.ref.close({ saved: true, data: res.data });
      },
      error: (err) => {
        this.saving.set(false);
        this.uploadingDocs.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create proposal' });
      }
    });
  }
}
