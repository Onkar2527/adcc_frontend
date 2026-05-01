import { Component, signal, inject, input, output, WritableSignal, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { MessageService } from 'primeng/api';
import { ProposalsService } from '../../../proposals.service';
import { 
  TextFieldComponent, 
  NumberFieldComponent, 
  DateFieldComponent, 
  SelectFieldComponent,
  CheckboxFieldComponent,
  TextareaFieldComponent 
} from '../../../../../shared/components/form';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule,
    DividerModule,
    TableModule,
    PanelModule,
    TextFieldComponent,
    NumberFieldComponent,
    DateFieldComponent,
    SelectFieldComponent,
    CheckboxFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './business-form.component.html'
})
export class BusinessFormItemComponent {
  proposalId = input.required<string>();
  category = input.required<string>(); // 'business' or 'profession'
  record = input<any>(null);
  onSave = output<any>();

  /** Multi-participant support */
  entityType = input<string>('B');
  participantId = input<string | null>(null);

  private proposalsService = inject(ProposalsService);
  private messageService = inject(MessageService);

  loading = signal(false);

  // Field Signals (Linked to Record Input)
  firmName = linkedSignal(() => this.record()?.firm_name || '');
  natureOfBusiness = linkedSignal(() => this.record()?.nature_of_business || '');
  licenseOwnerName = linkedSignal(() => this.record()?.license_owner_name || '');
  yearsInBusiness = linkedSignal<number | null>(() => this.record()?.years_in_business || null);
  turnoverAmount = linkedSignal<number>(() => Number(this.record()?.turnover_amount) || 0);
  netProfitLoss = linkedSignal<number>(() => Number(this.record()?.net_profit_loss) || 0);
  contactNo = linkedSignal(() => this.record()?.contact_no || '');
  emailId = linkedSignal(() => this.record()?.email_id || '');
  spaceStatus = linkedSignal(() => this.record()?.space_status || '');
  businessConstitution = linkedSignal(() => this.record()?.business_constitution || '');
  panNumber = linkedSignal(() => this.record()?.pan_number || '');
  hasRequiredLaws = linkedSignal(() => this.record()?.has_required_laws || false);
  ownershipType = linkedSignal(() => this.record()?.ownership_type || '');
  isMsmeRegistered = linkedSignal(() => this.record()?.is_msme_registered || false);
  msmeRegistrationNumber = linkedSignal(() => this.record()?.msme_registration_number || '');
  msmeRegistrationDate = linkedSignal<Date | null>(() => this.record()?.msme_registration_date ? new Date(this.record().msme_registration_date) : null);
  hasDistCert = linkedSignal(() => this.record()?.has_dist_cert || false);
  isGstRegistered = linkedSignal(() => this.record()?.has_gst_cert || false);
  gstNumber = linkedSignal(() => this.record()?.gst_number || '');
  hasShopAct = linkedSignal(() => this.record()?.is_shop_act_licensed || false);
  shopActNumber = linkedSignal(() => this.record()?.shop_act_number || '');
  isShopActRenewed = linkedSignal(() => this.record()?.is_shop_act_renewed || false);
  businessRemark = linkedSignal(() => this.record()?.business_remark || '');
  placeOwnerName = linkedSignal(() => this.record()?.place_owner_name || '');
  hasRentalAgreement = linkedSignal<boolean>(() => this.record()?.has_rental_agreement ?? false);
  leaseExpiryDate = linkedSignal<Date | null>(() => this.record()?.lease_expiry_date ? new Date(this.record().lease_expiry_date) : null);
  businessAddress = linkedSignal(() => this.record()?.business_address || '');

  // 3-Year Financial Statement
  private defaultYear(order: number) {
    return {
      year_order: order, year_label: '',
      sales: 0, purchases: 0, depreciation: 0,
      int_on_cc: 0, int_on_tl: 0, net_profit: 0,
      capital: 0, cash_credit_loan: 0, term_loan: 0,
      unsecured_loans: 0, creditors: 0, other_liabilities: 0,
      fixed_asset: 0, investments: 0, stock: 0,
      debtors: 0, cash_and_bank: 0, loans_and_advances: 0, other_asset: 0
    };
  }
  financials = linkedSignal<any[]>(() => {
    const existing = this.record()?.financials || [];
    return [1, 2, 3].map(o => ({ ...this.defaultYear(o), ...(existing.find((f: any) => f.year_order === o) || {}) }));
  });

  getYearField(yearIndex: number, field: string): WritableSignal<any> {
    const self = this;
    const s = (() => self.financials()[yearIndex][field]) as any;
    s.set = (val: any) => self.financials.update(rows => rows.map((r, i) => i === yearIndex ? { ...r, [field]: val } : r));
    s.update = (fn: any) => self.financials.update(rows => rows.map((r, i) => i === yearIndex ? { ...r, [field]: fn(r[field]) } : r));
    s.asReadonly = () => () => self.financials()[yearIndex][field];
    return s as WritableSignal<any>;
  }

  // Child Lists
  branches = linkedSignal<any[]>(() => [...(this.record()?.branches || [])]);
  licenses = linkedSignal<any[]>(() => [...(this.record()?.licenses || [])]);

  /** Adapter to treat plain object properties as WritableSignals for custom components */
  getRowSignal(row: any, field: string): WritableSignal<any> {
    const s = (() => row[field]) as any;
    s.set = (val: any) => row[field] = val;
    s.update = (fn: (v: any) => any) => row[field] = fn(row[field]);
    s.asReadonly = () => () => row[field];
    return s as WritableSignal<any>;
  }

  // Options
  spaceOptions = [
    { label: 'Own', value: 'Own' },
    { label: 'On Lease', value: 'On Lease' }
  ];

  constitutionOptions = [
    { label: 'Proprietary', value: 'Proprietary' },
    { label: 'Partnership Firm', value: 'Partnership Firm' },
    { label: 'Private Ltd. Company', value: 'Private Ltd. Company' },
    { label: 'Public Ltd. Company', value: 'Public Ltd. Company' },
    { label: 'HUF', value: 'HUF' },
    { label: 'Charitable Trust', value: 'Charitable Trust' },
    { label: 'Limited Liability Partnership', value: 'Limited Liability Partnership' },
    { label: 'Other', value: 'Other' }
  ];

  ownershipOptions = [
    { label: 'Owner', value: 'Owner' },
    { label: 'In Partnership', value: 'In Partnership' },
    { label: 'Company', value: 'Company' }
  ];

  yearOptions = (() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => {
      const y = currentYear - 3 + i;
      const label = `${y}-${(y + 1).toString().slice(2)}`;
      return { label, value: label };
    });
  })();

  financialRows = [
    { label: 'Sales / Receipts',   key: 'sales' },
    { label: 'Purchases',          key: 'purchases' },
    { label: 'Depreciation',       key: 'depreciation' },
    { label: 'Int On CC',          key: 'int_on_cc' },
    { label: 'Int On TL',          key: 'int_on_tl' },
    { label: 'Net Profit',         key: 'net_profit' },
    { label: 'Capital',            key: 'capital' },
    { label: 'Cash Credit Loan',   key: 'cash_credit_loan' },
    { label: 'Term Loan',          key: 'term_loan' },
    { label: 'Unsecured Loans',    key: 'unsecured_loans' },
    { label: 'Creditors',         key: 'creditors' },
    { label: 'Other Liabilities',  key: 'other_liabilities' },
    { label: 'Fixed Asset',        key: 'fixed_asset' },
    { label: 'Investments',        key: 'investments' },
    { label: 'Stock',              key: 'stock' },
    { label: 'Debtors',           key: 'debtors' },
    { label: 'Cash & Bank',        key: 'cash_and_bank' },
    { label: 'Loans & Advances',   key: 'loans_and_advances' },
    { label: 'Other Asset',        key: 'other_asset' }
  ];

  addBranch() {
    this.branches.update(prev => [...prev, { branch_name: '', address: '' }]);
  }

  removeBranch(index: number) {
    this.branches.update(prev => prev.filter((_, i) => i !== index));
  }

  addLicense() {
    this.licenses.update(prev => [...prev, { license_name: '', license_number: '' }]);
  }

  removeLicense(index: number) {
    this.licenses.update(prev => prev.filter((_, i) => i !== index));
  }

  save() {
    const payload = {
      id: this.record() ? this.record().id : undefined,
      category: this.category(),
      firm_name: this.firmName(),
      nature_of_business: this.natureOfBusiness(),
      license_owner_name: this.licenseOwnerName(),
      years_in_business: this.yearsInBusiness(),
      turnover_amount: this.turnoverAmount(),
      net_profit_loss: this.netProfitLoss(),
      contact_no: this.contactNo(),
      email_id: this.emailId(),
      space_status: this.spaceStatus(),
      business_constitution: this.businessConstitution(),
      pan_number: this.panNumber(),
      has_required_laws: this.hasRequiredLaws(),
      ownership_type: this.ownershipType(),
      is_msme_registered: this.isMsmeRegistered(),
      msme_registration_number: this.msmeRegistrationNumber(),
      msme_registration_date: this.msmeRegistrationDate(),
      has_dist_cert: this.hasDistCert(),
      has_gst_cert: this.isGstRegistered(),
      gst_number: this.gstNumber(),
      is_shop_act_licensed: this.hasShopAct(),
      shop_act_number: this.shopActNumber(),
      is_shop_act_renewed: this.isShopActRenewed(),
      business_remark: this.businessRemark(),
      place_owner_name: this.placeOwnerName(),
      has_rental_agreement: this.hasRentalAgreement(),
      lease_expiry_date: this.leaseExpiryDate(),
      business_address: this.businessAddress(),
      financials: this.financials(),
      branches: this.branches(),
      licenses: this.licenses()
    };

    this.loading.set(true);
    this.proposalsService.updateIncome(this.proposalId(), this.category(), payload, this.entityType(), this.participantId()).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `${this.category().charAt(0).toUpperCase() + this.category().slice(1)} income saved successfully` });
        this.onSave.emit(res.data);
      },
      error: () => this.loading.set(false)
    });
  }
}
