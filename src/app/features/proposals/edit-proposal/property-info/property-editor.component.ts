import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { FormDrawerRef } from '../../../../core/services/drawer';
import { 
  TextFieldComponent, 
  SelectFieldComponent, 
  NumberFieldComponent, 
  TextareaFieldComponent,
  DateFieldComponent,
  CheckboxFieldComponent,
  FormActionsComponent
} from '../../../../shared/components/form';
import { ProposalsService } from '../../proposals.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { MessageService } from 'primeng/api';

const AREA_UNITS = [
  { label: 'Square foot', value: 'Square foot' },
  { label: 'Square mtr',  value: 'Square mtr' },
  { label: 'Guntha',      value: 'Guntha' },
  { label: 'Hector',      value: 'Hector' },
  { label: 'Acres',       value: 'Acres' }
];

const MOVABLE_TYPES = [
  'Vehicle', 'Industrial Machinery', 'Agriculture Machinery', 'Furniture & Fixtures', 
  'Construction Equipment', 'Office Equipments', 'Stock & Debtors', 'Home Appliances', 
  'Work Orders', 'Bank Deposit', 'Insurance Policy', 'NSC/KVP', 'Invoice/Bills', 
  'Hamipatra', 'Default Guarantee', 'Live Stock', 'Crop', 'Gold Ornaments', 
  'Shares & Bonds', 'Ware House Receipt', 'Others'
].map(t => ({ label: t, value: t }));

const IMMOVABLE_TYPES = [
  'Agriculture Land', 'Open Plot', 'House Property', 'Residential Flat', 
  'Land & Building', 'Factory Land & Building', 'Shop / Office', 'Other'
].map(t => ({ label: t, value: t }));

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    TextFieldComponent,
    SelectFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent,
    DateFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  templateUrl: './property-editor.component.html',
  styleUrls: ['./property-editor.component.scss']
})
export class PropertyEditorComponent implements OnInit {
  private ref = inject(FormDrawerRef);
  private proposalsService = inject(ProposalsService);

  /* ---- Data passed from opener ---- */
  proposalId: string = '';
  property: any = null;
  entityType: string = 'B';
  participantId: string | null = null;

  saving = signal(false);

  // ── Signals for form fields ─────────────────────────────
  ownerName = signal('');
  relationshipWithBorrower = signal('');
  natureOfProperty = signal<'Movable' | 'Immovable'>('Immovable');
  propertyType = signal<string | null>(null);
  totalArea = signal<number | null>(null);
  areaUnitTotal = signal<string | null>(null);
  part = signal<number>(0);
  areaUnitPart = signal<string | null>(null);
  groupSurveyNumber = signal('');
  sara = signal('');
  monthlyRent = signal<number | null>(null);
  constructionArea = signal<number | null>(null);
  
  directionEast = signal('');
  directionWest = signal('');
  directionSouth = signal('');
  directionNorth = signal('');
  details = signal('');

  isMortgagedForThisLoan = signal<'Prime' | 'Collateral'>('Prime');
  isTaxPaid = signal(false);
  isMortgagedOther = signal(false);
  otherBankName = signal('');
  otherTotalAmount = signal<number | null>(null);
  otherLoanDueAmount = signal<number | null>(null);

  hasLegalOpinion = signal(false);
  panelAdvocate = signal('');
  legalOpinionDate = signal<Date | null>(null);
  searchReceiptNumber = signal('');
  searchReceiptDate = signal<Date | null>(null);
  isSuitableForMortgage = signal(false);
  legalOpinionDetails = signal('');

  hasSecondLegalOpinion = signal(false);
  secondPanelAdvocate = signal('');
  secondLegalOpinionDate = signal<Date | null>(null);
  secondSearchReceiptNumber = signal('');
  secondSearchReceiptDate = signal<Date | null>(null);
  secondIsSuitableForMortgage = signal(false);
  secondLegalOpinionDetails = signal('');

  visitReportDone = signal(false);
  visitorName = signal('');
  visitDate = signal<Date | null>(null);
  visitDetails = signal('');

  valuationDone = signal(false);
  valuatorName = signal('');
  marketValue = signal<number | null>(null);
  realizableValue = signal<number | null>(null);
  distressValue = signal<number | null>(null);
  governmentValue = signal<number | null>(null);
  valuationDate = signal<Date | null>(null);
  paikiPlotValue = signal<number | null>(null);
  buildingValue = signal<number | null>(null);
  buildingAge = signal<number | null>(null);
  futureLife = signal<number | null>(null);

  secondValuationDone = signal(false);
  secondValuatorName = signal('');
  secondMarketValue = signal<number | null>(null);
  secondRealizableValue = signal<number | null>(null);
  secondDistressValue = signal<number | null>(null);
  secondGovernmentValue = signal<number | null>(null);
  secondValuationDate = signal<Date | null>(null);
  secondPaikiPlotValue = signal<number | null>(null);
  secondBuildingValue = signal<number | null>(null);
  secondBuildingAge = signal<number | null>(null);
  secondFutureLife = signal<number | null>(null);

  purchaseDate = signal<Date | null>(null);
  purchaseOrderNumber = signal('');
  purchaseAmount = signal<number | null>(null);
  sellerName = signal('');

  incomeDescription = signal('');
  landmark = signal('');
  state = signal<string | null>(null);
  district = signal<string | null>(null);
  taluka = signal<string | null>(null);
  village = signal('');
  pincode = signal<number | null>(null);

  remark = signal('');

  // ── Options ──────────────────────────────────────────────
  natureOptions = [
    { label: 'Movable', value: 'Movable' },
    { label: 'Immovable', value: 'Immovable' }
  ];
  mortgageTypeOptions = [
    { label: 'Prime Security', value: 'Prime' },
    { label: 'Collateral Security', value: 'Collateral' }
  ];
  areaUnitOptions = AREA_UNITS;
  propertyTypeOptions = computed(() => {
    return this.natureOfProperty() === 'Movable' ? MOVABLE_TYPES : IMMOVABLE_TYPES;
  });

  private messageService = inject(MessageService);

  ngOnInit() {
    const data = this.ref.data;
    if (data) {
      this.proposalId = data.proposalId;
      this.entityType = data.entityType || 'B';
      this.participantId = data.participantId || null;
      if (data.property) {
        this.property = data.property;
        this.patchForm(data.property);
      }
      
      // Ensure proposalId is captured from any possible field name
      this.proposalId = data.proposalId || data.proposal_id || this.proposalId;
    }
  }

  onSave() {
    // Basic validation with feedback
    if (!this.proposalId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Internal Error: Proposal ID is missing. Please refresh and try again.' });
      return;
    }

    if (!this.ownerName()) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Owner Name is required' });
      return;
    }

    if (this.natureOfProperty() === 'Immovable') {
      if (!this.village()) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Village is required for Immovable property' });
        return;
      }
      if (!this.totalArea()) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Total Area is required' });
        return;
      }
      if (!this.areaUnitTotal()) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Area Unit is required' });
        return;
      }
    }

    const payload = this.getPayload();
    this.saving.set(true);
    
    this.proposalsService.updateProperty(this.proposalId, payload, this.entityType, this.participantId ?? undefined).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Property info saved' });
        this.ref.close({ saved: true });
      },
      error: () => this.saving.set(false)
    });
  }

  onCancel() {
    this.ref.close();
  }

  private patchForm(p: any) {
    this.ownerName.set(p.owner_name ?? '');
    this.relationshipWithBorrower.set(p.relationship_with_borrower ?? '');
    this.natureOfProperty.set(p.nature_of_property ?? 'Immovable');
    this.propertyType.set(p.property_type ?? null);
    this.totalArea.set(p.total_area ? Number(p.total_area) : null);
    this.areaUnitTotal.set(p.area_unit_total ?? null);
    this.part.set(p.part ? Number(p.part) : 0);
    this.areaUnitPart.set(p.area_unit_part ?? null);
    this.groupSurveyNumber.set(p.group_survey_number ?? '');
    this.sara.set(p.sara ?? '');
    this.monthlyRent.set(p.monthly_rent ? Number(p.monthly_rent) : null);
    this.constructionArea.set(p.construction_area ? Number(p.construction_area) : null);
    this.directionEast.set(p.direction_east ?? '');
    this.directionWest.set(p.direction_west ?? '');
    this.directionSouth.set(p.direction_south ?? '');
    this.directionNorth.set(p.direction_north ?? '');
    this.details.set(p.details ?? '');
    this.isMortgagedForThisLoan.set(p.is_prime_security ? 'Prime' : 'Collateral');
    this.isTaxPaid.set(!!p.is_tax_paid);
    this.isMortgagedOther.set(!!p.is_mortgaged_other);
    this.otherBankName.set(p.other_bank_name ?? '');
    this.otherTotalAmount.set(p.other_loan_total_amount ? Number(p.other_loan_total_amount) : null);
    this.otherLoanDueAmount.set(p.other_loan_due_amount ? Number(p.other_loan_due_amount) : null);
    this.hasLegalOpinion.set(!!p.has_legal_opinion);
    this.panelAdvocate.set(p.panel_advocate ?? '');
    this.legalOpinionDate.set(p.legal_opinion_date ? new Date(p.legal_opinion_date) : null);
    this.searchReceiptNumber.set(p.search_receipt_number ?? '');
    this.searchReceiptDate.set(p.search_receipt_date ? new Date(p.search_receipt_date) : null);
    this.isSuitableForMortgage.set(!!p.is_suitable_for_mortgage);
    this.legalOpinionDetails.set(p.legal_opinion_details ?? '');
    this.hasSecondLegalOpinion.set(!!p.has_second_legal_opinion);
    this.secondPanelAdvocate.set(p.second_panel_advocate ?? '');
    this.secondLegalOpinionDate.set(p.second_legal_opinion_date ? new Date(p.second_legal_opinion_date) : null);
    this.secondSearchReceiptNumber.set(p.second_search_receipt_number ?? '');
    this.secondSearchReceiptDate.set(p.second_search_receipt_date ? new Date(p.second_search_receipt_date) : null);
    this.secondIsSuitableForMortgage.set(!!p.second_is_suitable_for_mortgage);
    this.secondLegalOpinionDetails.set(p.second_legal_opinion_details ?? '');
    this.visitReportDone.set(!!p.visit_report_done);
    this.visitorName.set(p.visitor_name ?? '');
    this.visitDate.set(p.visit_date ? new Date(p.visit_date) : null);
    this.visitDetails.set(p.visit_details ?? '');
    this.valuationDone.set(!!p.valuation_done);
    this.valuatorName.set(p.valuator_name ?? '');
    this.marketValue.set(p.market_value ? Number(p.market_value) : null);
    this.realizableValue.set(p.realizable_value ? Number(p.realizable_value) : null);
    this.distressValue.set(p.distress_value ? Number(p.distress_value) : null);
    this.governmentValue.set(p.government_value ? Number(p.government_value) : null);
    this.valuationDate.set(p.valuation_date ? new Date(p.valuation_date) : null);
    this.paikiPlotValue.set(p.paiki_plot_value ? Number(p.paiki_plot_value) : null);
    this.buildingValue.set(p.building_value ? Number(p.building_value) : null);
    this.buildingAge.set(p.building_age ? Number(p.building_age) : null);
    this.futureLife.set(p.future_life ? Number(p.future_life) : null);
    this.secondValuationDone.set(!!p.second_valuation_done);
    this.secondValuatorName.set(p.second_valuator_name ?? '');
    this.secondMarketValue.set(p.second_market_value ? Number(p.second_market_value) : null);
    this.secondRealizableValue.set(p.second_realizable_value ? Number(p.second_realizable_value) : null);
    this.secondDistressValue.set(p.second_distress_value ? Number(p.second_distress_value) : null);
    this.secondGovernmentValue.set(p.second_government_value ? Number(p.second_government_value) : null);
    this.secondValuationDate.set(p.second_valuation_date ? new Date(p.second_valuation_date) : null);
    this.secondPaikiPlotValue.set(p.second_paiki_plot_value ? Number(p.second_paiki_plot_value) : null);
    this.secondBuildingValue.set(p.second_building_value ? Number(p.second_building_value) : null);
    this.secondBuildingAge.set(p.second_building_age ? Number(p.second_building_age) : null);
    this.secondFutureLife.set(p.second_future_life ? Number(p.second_future_life) : null);
    this.purchaseDate.set(p.purchase_date ? new Date(p.purchase_date) : null);
    this.purchaseOrderNumber.set(p.purchase_order_number ?? '');
    this.purchaseAmount.set(p.purchase_amount ? Number(p.purchase_amount) : null);
    this.sellerName.set(p.seller_name ?? '');
    this.incomeDescription.set(p.income_description ?? '');
    this.landmark.set(p.landmark ?? '');
    this.state.set(p.state_id ?? null);
    this.district.set(p.district_id ?? null);
    this.taluka.set(p.taluka_id ?? null);
    this.village.set(p.village ?? '');
    this.pincode.set(p.pincode ? Number(p.pincode) : null);
    this.remark.set(p.remark ?? '');
  }

  private getPayload() {
    return {
      id: this.property?.id,
      owner_name: this.ownerName(),
      relationship_with_borrower: this.relationshipWithBorrower(),
      nature_of_property: this.natureOfProperty(),
      property_type: this.propertyType(),
      total_area: this.totalArea(),
      area_unit_total: this.areaUnitTotal(),
      part: this.part(),
      area_unit_part: this.areaUnitPart(),
      group_survey_number: this.groupSurveyNumber(),
      sara: this.sara(),
      monthly_rent: this.monthlyRent(),
      construction_area: this.constructionArea(),
      direction_east: this.directionEast(),
      direction_west: this.directionWest(),
      direction_south: this.directionSouth(),
      direction_north: this.directionNorth(),
      details: this.details(),
      is_prime_security: this.isMortgagedForThisLoan() === 'Prime',
      is_tax_paid: this.isTaxPaid(),
      is_mortgaged_other: this.isMortgagedOther(),
      other_bank_name: this.otherBankName(),
      other_loan_total_amount: this.otherTotalAmount(),
      other_loan_due_amount: this.otherLoanDueAmount(),
      has_legal_opinion: this.hasLegalOpinion(),
      panel_advocate: this.panelAdvocate(),
      legal_opinion_date: this.legalOpinionDate(),
      search_receipt_number: this.searchReceiptNumber(),
      search_receipt_date: this.searchReceiptDate(),
      is_suitable_for_mortgage: this.isSuitableForMortgage(),
      legal_opinion_details: this.legalOpinionDetails(),
      has_second_legal_opinion: this.hasSecondLegalOpinion(),
      second_panel_advocate: this.secondPanelAdvocate(),
      second_legal_opinion_date: this.secondLegalOpinionDate(),
      second_search_receipt_number: this.secondSearchReceiptNumber(),
      second_search_receipt_date: this.secondSearchReceiptDate(),
      second_is_suitable_for_mortgage: this.secondIsSuitableForMortgage(),
      second_legal_opinion_details: this.secondLegalOpinionDetails(),
      visit_report_done: this.visitReportDone(),
      visitor_name: this.visitorName(),
      visit_date: this.visitDate(),
      visit_details: this.visitDetails(),
      valuation_done: this.valuationDone(),
      valuator_name: this.valuatorName(),
      market_value: this.marketValue(),
      realizable_value: this.realizableValue(),
      distress_value: this.distressValue(),
      government_value: this.governmentValue(),
      valuation_date: this.valuationDate(),
      paiki_plot_value: this.paikiPlotValue(),
      building_value: this.buildingValue(),
      building_age: this.buildingAge(),
      future_life: this.futureLife(),
      second_valuation_done: this.secondValuationDone(),
      second_valuator_name: this.secondValuatorName(),
      second_market_value: this.secondMarketValue(),
      second_realizable_value: this.secondRealizableValue(),
      second_distress_value: this.secondDistressValue(),
      second_government_value: this.secondGovernmentValue(),
      second_valuation_date: this.secondValuationDate(),
      second_paiki_plot_value: this.secondPaikiPlotValue(),
      second_building_value: this.secondBuildingValue(),
      second_building_age: this.secondBuildingAge(),
      second_future_life: this.secondFutureLife(),
      purchase_date: this.purchaseDate(),
      purchase_order_number: this.purchaseOrderNumber(),
      purchase_amount: this.purchaseAmount(),
      seller_name: this.sellerName(),
      income_description: this.incomeDescription(),
      landmark: this.landmark(),
      state_id: this.state(),
      district_id: this.district(),
      taluka_id: this.taluka(),
      village: this.village(),
      pincode: this.pincode(),
      remark: this.remark()
    };
  }
}
