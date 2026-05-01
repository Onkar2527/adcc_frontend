import { Component, input, output, signal, computed, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import {
  TextFieldComponent,
  SelectFieldComponent,
  NumberFieldComponent,
  DateFieldComponent,
  TextareaFieldComponent,
  CheckboxFieldComponent
} from '../../../../shared/components/form';
import { ProposalsService } from '../../proposals.service';

/* ---- Static Options ---------------------------------------- */
const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other', value: 'O' }
];

const MARITAL_STATUS_OPTIONS = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' }
];

const EDUCATION_OPTIONS = [
  { label: 'Below 10th', value: 'below_10' },
  { label: '10th Pass', value: '10th' },
  { label: '12th Pass', value: '12th' },
  { label: 'Graduate', value: 'graduate' },
  { label: 'Post Graduate', value: 'post_graduate' },
  { label: 'Professional', value: 'professional' }
];

const RELIGION_OPTIONS = [
  { label: 'Hindu', value: 'hindu' },
  { label: 'Muslim', value: 'muslim' },
  { label: 'Christian', value: 'christian' },
  { label: 'Sikh', value: 'sikh' },
  { label: 'Other', value: 'other' }
];

const MEMBER_TYPE_OPTIONS = [
  { label: 'Member', value: 'member' },
  { label: 'Nominal Member', value: 'nominal' }
];

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    ButtonModule,
    TextFieldComponent,
    SelectFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent
  ],
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent implements OnInit {
  /** Input data from parent */
  data = input<any>();

  /** Emits when value changes */
  changed = output<any>();

  /** Emits when save is clicked */
  save = output<any>();

  /** Loading state */
  loading = input<boolean>(false);
  innerLoading = signal(false); // Internal loading for separate fetch

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  /** Proposal-level ID (needed for fetching participant data) */
  proposalId = input<string | null>(null);

  /** External trigger from parent sticky footer */
  externalSaveTrigger = input<number>(0);

  /** Comparison for change detection */
  isDirty = signal(false);

  // ── Form fields ──────────────────────────────────────────
  applicantName = signal('');
  religion = signal<string | null>(null);
  cast = signal('');
  dob = signal<Date | null>(null);
  age = signal<number | null>(null);
  education = signal<string | null>(null);
  gender = signal<string | null>(null);
  maritalStatus = signal<string | null>(null);

  // Bank Membership
  isBankMember = signal(false);
  memberType = signal<string | null>(null);
  membershipDate = signal<Date | null>(null);
  memberNo = signal('');
  bankSharesAmount = signal<number | null>(null);

  // Stats
  panNumber = signal('');
  aadhaarNumber = signal('');
  familyMembersCount = signal<number | null>(null);
  earnersCount = signal<number | null>(null);
  netWorthAmount = signal<number | null>(null);
  netWorthDate = signal<Date | null>(null);

  // Verification Metadata
  verificationMetadata = signal<any>(null);

  // Career & Contact
  profession = signal('');
  relationWithDirector = signal('');
  emailId = signal('');
  mobileNumber = signal('');
  mobileNumber2 = signal('');
  fullAddress = signal('');

  // Dropdown Options
  genderOptions = GENDER_OPTIONS;
  maritalStatusOptions = MARITAL_STATUS_OPTIONS;
  educationOptions = EDUCATION_OPTIONS;
  religionOptions = RELIGION_OPTIONS;
  memberTypeOptions = MEMBER_TYPE_OPTIONS;

  private proposalsService = inject(ProposalsService);

  private isPatching = false;

  private lastHandledTrigger = -1;

  constructor() {
    // Auto-patch when input data changes
    effect(() => {
      const d = this.data();
      if (d) {
        this.isPatching = true;
        this.patchForm(d);
        setTimeout(() => this.isPatching = false, 0);
      }
    });

    // Auto-calculate age
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

    // Handle external save trigger
    effect(() => {
      const trigger = this.externalSaveTrigger();
      
      // On first run, capture the current trigger value to prevent auto-save on tab switch
      if (this.lastHandledTrigger === -1) {
        this.lastHandledTrigger = trigger;
        return;
      }

      if (trigger > 0 && trigger !== this.lastHandledTrigger) {
        this.lastHandledTrigger = trigger;
        this.onSave();
      }
    });
  }

  ngOnInit() {
    // If data is provided by parent (Borrower flow), use it
    if (this.data()) {
      this.patchForm(this.data());
    } 
    // If we have a participantId (Drawer/Associate flow), fetch it ourselves
    else if (this.participantId() && this.proposalId()) {
      this.fetchPersonalInfo();
    }
  }

  private fetchPersonalInfo() {
    this.innerLoading.set(true);
    this.proposalsService.getPersonalInfo(
      this.proposalId()!, 
      this.entityType(), 
      this.participantId()!
    ).subscribe({
      next: (res: any) => {
        if (res.data) this.patchForm(res.data);
        this.innerLoading.set(false);
      },
      error: () => this.innerLoading.set(false)
    });
  }

  private patchForm(d: any) {
    this.applicantName.set(d.applicant_name ?? '');
    this.religion.set(d.religion ?? null);
    this.cast.set(d.cast_name ?? '');
    if (d.dob) this.dob.set(new Date(d.dob));
    this.education.set(d.education ?? null);
    this.gender.set(d.gender ?? null);
    this.maritalStatus.set(d.marital_status ?? null);

    this.isBankMember.set(!!d.is_bank_member);
    this.memberType.set(d.member_type ?? null);
    if (d.membership_date) this.membershipDate.set(new Date(d.membership_date));
    this.memberNo.set(d.member_no ?? '');
    this.bankSharesAmount.set(d.bank_shares_amount ?? null);

    this.panNumber.set(d.pan_number ?? '');
    this.aadhaarNumber.set(d.aadhaar_number ?? '');
    this.familyMembersCount.set(d.family_members_count ?? null);
    this.earnersCount.set(d.earners_out_of_them ?? null);
    this.netWorthAmount.set(d.net_worth_amount ?? null);
    if (d.net_worth_date) this.netWorthDate.set(new Date(d.net_worth_date));

    this.profession.set(d.profession ?? '');
    this.relationWithDirector.set(d.relation_with_director ?? '');
    this.emailId.set(d.email_id ?? '');
    this.mobileNumber.set(d.mobile_no ?? '');
    this.mobileNumber2.set(d.mobile_no_2 ?? '');
    this.fullAddress.set(d.full_address ?? '');

    // Patch verification metadata if it exists (JSON string or object)
    if (d.verification_metadata) {
      try {
        const meta = typeof d.verification_metadata === 'string' 
          ? JSON.parse(d.verification_metadata) 
          : d.verification_metadata;
        this.verificationMetadata.set(meta);
      } catch (e) {
        console.error('Failed to parse verification metadata', e);
        this.verificationMetadata.set(null);
      }
    } else {
      this.verificationMetadata.set(null);
    }

    this.isDirty.set(false);
  }

  onFieldChange() {
    if (this.isPatching) return;
    this.isDirty.set(true);
    this.changed.emit(this.getPayload());
  }

  getPayload() {
    return {
      applicant_name: this.applicantName(),
      religion: this.religion(),
      cast: this.cast(),
      dob: this.dob(),
      education: this.education(),
      gender: this.gender(),
      marital_status: this.maritalStatus(),
      age: this.age(),
      is_bank_member: this.isBankMember(),
      member_type: this.memberType(),
      membership_date: this.membershipDate(),
      member_no: this.memberNo(),
      bank_shares_amount: this.bankSharesAmount(),
      pan_number: this.panNumber(),
      aadhaar_number: this.aadhaarNumber(),
      family_members_count: this.familyMembersCount(),
      earners_count: this.earnersCount(),
      net_worth_amount: this.netWorthAmount(),
      net_worth_date: this.netWorthDate(),
      profession: this.profession(),
      relation_with_director: this.relationWithDirector(),
      email_id: this.emailId(),
      mobile_no: this.mobileNumber(),
      mobile_no_2: this.mobileNumber2(),
      full_address: this.fullAddress()
    };
  }

  onSave() {
    this.save.emit({
      payload: this.getPayload(),
      entityType: this.entityType(),
      participantId: this.participantId()
    });
  }

  normalize(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }
}
