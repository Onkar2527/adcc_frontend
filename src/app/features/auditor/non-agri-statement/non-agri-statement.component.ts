import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { PdfDownloadService } from '../../../core/services/pdf/pdf-download.service';
import { NonAgriStatementService, NonAgriStatementPayload } from './non-agri-statement.service';
import { AuditDashboardService } from '../services/auditor-main.service';
import { InternalAuditNavService } from '../services/internal-audit-nav.service';

import { OfflineTranslationService } from '../../../core/services/offline-translation.service';

export interface ShareRow {
  ghyayache: number | null;
  ghetlele: number | null;
  apoornaSankhya: number | null;
  apoornaRs: number | null;
}

export interface StatementRow {
  srNo?: string;
  label: string;
  subLabel?: string;
  yeanebakiMembers: number | null;
  yeanebakiAmount: number | null;
  thakbakiMembers: number | null;
  thakbakiAmount: number | null;
  isSubItem?: boolean;
  isSubTotal?: boolean;
  isHeader?: boolean;
}

@Component({
  selector: 'app-non-agri-statement',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule, ToastModule],
  providers: [MessageService],
  templateUrl: './non-agri-statement.component.html',
  styleUrls: ['./non-agri-statement.component.scss']
})
export class NonAgriStatementComponent implements OnInit {
  private pdfService = inject(PdfDownloadService);
  private statementService = inject(NonAgriStatementService);
  private auditService = inject(AuditDashboardService);
  private navService = inject(InternalAuditNavService);
  private translationService = inject(OfflineTranslationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  // Context Identifiers
  id: number | null = null;
  assessmentId: number | null = null;
  yearId: number | null = null;
  auditUnitId: number | null = null;
  overview: any = null;
  auditorComment: string = '';
  isReviewMode: boolean = false;

  // Reviewer State
  reviewerAction: number = 2; // 2: Accept, 3: Re-assessment
  reviewerComment: string = '';
  savingReview: boolean = false;

  saving = false;
  loading = false;

  // Language state automatically synced with software topbar language switcher
  get currentLang(): 'mr' | 'en' {
    const lang = this.translationService?.getCurrentLanguage() || localStorage.getItem('selected_lang') || 'mr';
    return lang === 'en' ? 'en' : 'mr';
  }

  get t() {
    const isEn = this.currentLang === 'en';
    return {
      // Document Header
      bankName: isEn
        ? 'THE AHMEDNAGAR DISTRICT CENTRAL CO-OPERATIVE BANK LTD. AHMEDNAGAR'
        : 'दि अहमदनगर डिस्ट्रिक्ट सेन्ट्रल को-ऑपरेटिव्ह बँक लि. अहमदनगर',
      headOffice: isEn
        ? 'Head Office: Station Road, Ahmednagar'
        : 'प्रधान कार्यालय स्टेशन रोड, अहमदनगर',
      titlePrefix: isEn
        ? 'Information Statement of Non-Agricultural Co-operative Societies having Outstanding Balance as on '
        : 'बिगर शेती सहकारी संस्थांची दि. ',
      titleMiddle: isEn
        ? ''
        : ' अखेर ',
      titleSuffix: isEn
        ? ''
        : ' असणा-या संस्थांची माहिती पत्रके',
      statementType: isEn
        ? 'Outstanding Dues'
        : this.statementType,
      unitText: isEn
        ? '(Amount in ₹ Lakhs)'
        : '(रक्कम रूपये लाखात)',

      // Table Headers
      srNo: isEn ? 'Sr. No.' : 'अ.नं',
      statementTypeHeader: isEn ? 'Statement Particulars / Society Classification' : 'स्टेटमेंट प्रकार',
      inspectionLabel: isEn ? 'Societies Eligible for Inspection' : 'संस्था तपासणी पात्र',
      inspectionOfWhich: isEn ? 'of which' : 'पैकी',
      inspectionCompleted: isEn ? 'Audited' : 'पूर्ण',
      inspectionPending: isEn ? 'Pending' : 'अपूर्ण',

      bankShares: isEn ? 'Bank Share Capital' : 'बँक शेअर्स',
      sharesRequired: isEn ? 'Callable / Req. (₹)' : 'घ्यावयाचे(रु.)',
      sharesSubscribed: isEn ? 'Paid-up / Rec. (₹)' : 'घेतलेले (रु.)',
      sharesDeficit: isEn ? 'Deficit / Unpaid' : 'अपूर्ण',
      sharesCount: isEn ? 'Count' : 'संख्या',
      sharesAmount: isEn ? '(₹)' : '(रु.)',
      sharesSanstha: isEn ? 'a. Primary Co-op Societies' : 'अ. संस्था',
      sharesSakhar: isEn ? 'b. Co-op Sugar Factories' : 'ब. साखर का.',
      sharesTotal: isEn ? 'Total' : 'एकूण',

      // Main Statement Columns
      yeanebakiHeader: isEn ? 'Outstanding Balance (Dues)' : 'येणेबाकी स्टेटमेंट रक्कम',
      thakbakiHeader: isEn ? 'Overdue / Default' : 'थकबाकी',
      membersHeader: isEn ? 'Members / Soc.' : 'सभा./संस्था',
      amountLakhHeader: isEn ? 'Amount (₹ Lakhs)' : 'रक्कम लाख',

      // Row Items
      reFund: isEn ? 'Statutory Reserve Fund' : 'रि.फंड',
      pagardar: isEn ? 'Salary Earners\' Co-op Credit Societies' : 'पगारदार सहकारी पत संस्था',
      nagari: isEn ? 'Urban Co-operative Credit Societies (UCBs / Credit)' : 'नागरी सहकारी पत संस्था',
      ginningHeader: isEn ? 'Ginning, Pressing, Spinning Mills & Printing Presses' : 'जिनिंग प्रेसिंग सुतगिरणी मुद्रणालय',
      ginningClean: isEn ? 'a. Clean Cash Credit (Clean CC)' : 'अ कॅश क्रेडीट क्लिन',
      ginningNajarGahan: isEn ? 'b. Hypothecation (Hypo CC)' : 'ब नजरगहाण',
      subTotalGinning: isEn ? 'Sub-Total (Ginning & Processing)' : 'एकूण',

      kharediVikri: isEn ? 'Purchase & Sale Unions - Hypothecation / Oil Mills' : 'खरेदी विक्री संघ- नजरगहाण खाते/ तेले',
      dudhUtpadak: isEn ? 'Milk Producers\' Co-op Societies - Clean Cash Credit' : 'दूध उत्पादक सहकारी संस्था - क्लिन कॅश क्रेडीट',
      madhyamMudatNonAgri: isEn ? 'Medium-Term Loans to Non-Agri Societies' : 'मध्यम मुदत बिगर शेती संस्था',

      nonFarmHeader: isEn ? 'Non-Farm Sector (NFS Advances) - ' : '',
      nonFarmMediumTerm: isEn ? 'a. Medium-Term Advances' : 'अ. मध्यम मुदत',
      nonFarmWorkingCapital: isEn ? 'b. Working Capital Advances' : 'ब. खेळते भांडवल',
      subTotalNonFarm: isEn ? 'Sub-Total (Non-Farm Sector)' : 'एकूण',

      shaikshanikKarj: isEn ? 'Educational Loans (Institutional / Individual)' : 'शैक्षणिक कर्ज -',
      gramodyog: isEn ? 'Village Industries Union - NABARD Composite Loan (13 Unions)' : 'ग्रामोद्योग संघ कंपोझीट नाबार्ड (१३ संघ)',

      sugarFactoriesHeader: isEn ? 'Co-operative Sugar Factories' : 'सहकारी साखर कारखाने',
      subTotalSugar: isEn ? 'Sub-Total (Sugar Factories)' : 'एकूण',

      grandTotal: isEn ? 'GRAND TOTAL: NON-AGRI CREDIT & ADVANCES EXPOSURE' : 'बिगर शेती कर्ज पुरवठा सर्व एकूण',

      // Signatory
      designation1: isEn ? 'General Manager' : 'सरव्यवस्थापक',
      designation2: isEn ? 'Loans & Supervision (Non-Agri)' : 'कर्ज व देखरेख (बिगर शेती)',

      // Toolbar
      toolbarTitle: isEn ? 'Non-Agriculture Society Information Statement' : 'बिगर शेती सहकारी संस्था माहिती पत्रक (ADCC Non-Agri Statement)',
      sampleDataBtn: isEn ? 'Fill Sample Data' : 'नमुना डेटा भरा (Sample Data)',
      resetBtn: isEn ? 'Reset' : 'रीसेट (Reset)',
      saveBtn: isEn ? 'Save Statement' : 'जतन करा (Save)',
      printBtn: isEn ? 'Print / PDF' : 'प्रिंट / PDF',
      backBtn: isEn ? 'Back' : 'मागे जा (Back)',
    };
  }

  getSugarLabel(idx: number): string {
    if (this.currentLang === 'en') {
      const enLabels = [
        '1. Clean Cash Credit (Pre-seasonal Advance)',
        '2. Hypothecation (Consumable Stores)',
        '3. Pledge / Pledge Cash Credit (Sugar Stock)',
        '4. CC Bill Discounting / Usance Bills',
        '5. Hypothecation (Distillery & Ethanol)',
        '6. Special Cash Credit (Working Capital)',
        '7. Medium-Term Loan (Modernization & Cogen)',
        '8. Medium-Term Loan Restructuring (Rescheduled)',
        '9. Medium-Term Loan Conversion (Funded Interest)',
        '10. Societies in Liquidation (NPA / Under Winding-up)'
      ];
      return enLabels[idx] || this.sugarFactories[idx]?.label || '';
    }
    return this.sugarFactories[idx]?.label || '';
  }

  getSrNo(num: number): string {
    if (this.currentLang === 'en') {
      return String(num);
    }
    const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).split('').map(d => marathiDigits[Number(d)] || d).join('');
  }

  // Document Header
  bankName = 'दि अहमदनगर डिस्ट्रिक्ट सेन्ट्रल को-ऑपरेटिव्ह बँक लि. अहमदनगर';
  headOffice = 'प्रधान कार्यालय स्टेशन रोड, अहमदनगर';
  statementDate = '३१.३.२०२५';
  statementType = 'येणेबाकी';
  unitText = '(रक्कम रूपये लाखात)';

  // Signatory
  designation1 = 'सरव्यवस्थापक';
  designation2 = 'कर्ज व देखरेख (बिगर शेती)';

  // Section 1: Inspection
  inspection = {
    patra: 97,
    purna: 93,
    apoorna: 4
  };

  // Section 2: Bank Shares
  shares = {
    sanstha: {
      ghyayache: null,
      ghetlele: null,
      apoornaSankhya: null,
      apoornaRs: null
    } as ShareRow,
    sakhar: {
      ghyayache: null,
      ghetlele: null,
      apoornaSankhya: null,
      apoornaRs: null
    } as ShareRow
  };

  // Section 3: Reserve Fund (रि.फंड - Bank Shares Section item 3)
  reFund: ShareRow = {
    ghyayache: null,
    ghetlele: null,
    apoornaSankhya: null,
    apoornaRs: null
  };

  // Section 4: Salaried Co-op Credit Society
  pagardar: StatementRow = {
    srNo: '४',
    label: 'पगारदार सहकारी पत संस्था',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 5: Urban Co-op Credit Society
  nagari: StatementRow = {
    srNo: '५',
    label: 'नागरी सहकारी पत संस्था',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 6: Ginning & Pressing
  ginningClean: StatementRow = {
    label: 'अ कॅश क्रेडीट क्लिन',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null,
    isSubItem: true
  };

  ginningNajarGahan: StatementRow = {
    label: 'ब नजरगहाण',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null,
    isSubItem: true
  };

  // Section 7: Purchase & Sale Union
  kharediVikri: StatementRow = {
    srNo: '७',
    label: 'खरेदी विक्री संघ- नजरगहाण खाते/ तेले',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 8: Milk Producers Co-op
  dudhUtpadak: StatementRow = {
    srNo: '८',
    label: 'दूध उत्पादक सहकारी संस्था - क्लिन कॅश क्रेडीट',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 9: Medium Term Non-Agri
  madhyamMudatNonAgri: StatementRow = {
    srNo: '९',
    label: 'मध्यम मुदत बिगर शेती संस्था',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 10: Non Farm Sector
  nonFarmMediumTerm: StatementRow = {
    label: 'अ. मध्यम मुदत',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null,
    isSubItem: true
  };

  nonFarmWorkingCapital: StatementRow = {
    label: 'ब. खेळते भांडवल',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null,
    isSubItem: true
  };

  // Section 11: Educational Loan
  shaikshanikKarj: StatementRow = {
    srNo: '११',
    label: 'शैक्षणिक कर्ज -',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 12: Gramodyog Sangh NABARD
  gramodyog: StatementRow = {
    srNo: '१२',
    label: 'ग्रामोद्योग संघ कंपोझीट नाबार्ड (१३ संघ)',
    yeanebakiMembers: null,
    yeanebakiAmount: null,
    thakbakiMembers: null,
    thakbakiAmount: null
  };

  // Section 13: Co-op Sugar Factories (10 sub-items)
  sugarFactories: StatementRow[] = [
    { label: '१. क्लिन (प्रीसीझनल)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '२. न.गहाण (स्टोअर्स)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '३. मालतारण (साखर)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '४. कॅ. क्रे. बिल डिस्काऊंटींग', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '५. न.गहाण (डिस्टी.)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '६. स्पेशल कॅश क्रेडीट', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '७. मध्यम मुदत', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '८. म.मुदत (पुनर्गठण)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '९. मध्यम मुदत रुपांतर', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
    { label: '१०. अवसायनात', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true },
  ];

  ngOnInit(): void {
    // Read route path parameters (e.g. /auditor/internal-audit/non-agri-statement/:assessmentId)
    this.route.paramMap.subscribe(params => {
      const pId = params.get('assessmentId') || params.get('id');
      if (pId) {
        this.assessmentId = Number(pId);
        this.loadAssessmentContext();
      }
    });

    // Read contextual route query parameters
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'reviewer' || params['mode'] === 'compliance-view' || params['mode'] === 'view') {
        this.isReviewMode = true;
      }
      if (params['assessment_id'] || params['assessmentId']) {
        this.assessmentId = Number(params['assessment_id'] || params['assessmentId']);
        this.loadAssessmentContext();
      }
      if (params['year_id'] || params['yearId']) {
        this.yearId = Number(params['year_id'] || params['yearId']);
      }
      if (params['audit_unit_id'] || params['auditUnitId']) {
        this.auditUnitId = Number(params['audit_unit_id'] || params['auditUnitId']);
      }

      setTimeout(() => {
        this.loadSavedStatement();
      }, 0);
    });
  }

  loadAssessmentContext(): void {
    if (!this.assessmentId) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = String(user?.user_type_id || '').trim();
    const isAuditor = userType === '2';

    if (isAuditor) {
      const employeeId = Number(user?.id || user?.employee_id || user?.emp_id || 0);
      this.auditService.getInternalAuditMenu(this.assessmentId, employeeId).subscribe({
        next: (menuRes: any) => {
          this.navService.setAssessmentMenus(
            this.assessmentId!,
            menuRes?.menus || [],
            menuRes?.overview || null
          );
          if (menuRes?.overview) {
            this.overview = menuRes.overview;
            if (!this.auditUnitId && menuRes.overview.audit_unit_id) {
              this.auditUnitId = Number(menuRes.overview.audit_unit_id);
            }
            if (!this.yearId && menuRes.overview.year_id) {
              this.yearId = Number(menuRes.overview.year_id);
            }
          }
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Failed to load nav menus:', err);
        }
      });
    }
  }

  goBack(): void {
    if (this.isReviewMode) {
      this.location.back();
      return;
    }
    if (this.assessmentId) {
      this.router.navigate(['/auditor/internal-audit', this.assessmentId]);
    } else {
      this.router.navigate(['/auditor/audit-dashboard']);
    }
  }

  // --- Load Statement from Database / Local Storage ---
  loadSavedStatement(): void {
    this.loading = true;
    this.statementService.getStatement(this.assessmentId || undefined, this.auditUnitId || undefined, this.yearId || undefined)
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.data) {
            this.hydrateFormData(res.data);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // --- Hydrate State from Stored Payload ---
  hydrateFormData(data: any): void {
    if (!data) return;
    this.id = data.id || null;
    this.auditorComment = data.auditor_comment || data.statement_data?.auditor_comment || '';
    if (data.statement_date) this.statementDate = data.statement_date;
    if (data.statement_type) this.statementType = data.statement_type;
    if (data.bank_name) this.bankName = data.bank_name;
    if (data.head_office) this.headOffice = data.head_office;
    if (data.unit_text) this.unitText = data.unit_text;
    if (data.designation1) this.designation1 = data.designation1;
    if (data.designation2) this.designation2 = data.designation2;

    if (data.inspection_patra !== undefined && data.inspection_patra !== null) this.inspection.patra = Number(data.inspection_patra);
    if (data.inspection_purna !== undefined && data.inspection_purna !== null) this.inspection.purna = Number(data.inspection_purna);
    if (data.inspection_apoorna !== undefined && data.inspection_apoorna !== null) this.inspection.apoorna = Number(data.inspection_apoorna);

    let sharesData = data.shares_data;
    if (typeof sharesData === 'string') {
      try {
        sharesData = JSON.parse(sharesData);
      } catch (e) {}
    }

    if (sharesData) {
      if (sharesData.sanstha) {
        this.shares.sanstha = {
          ghyayache: sharesData.sanstha.ghyayache !== undefined && sharesData.sanstha.ghyayache !== null ? Number(sharesData.sanstha.ghyayache) : null,
          ghetlele: sharesData.sanstha.ghetlele !== undefined && sharesData.sanstha.ghetlele !== null ? Number(sharesData.sanstha.ghetlele) : null,
          apoornaSankhya: sharesData.sanstha.apoornaSankhya !== undefined && sharesData.sanstha.apoornaSankhya !== null ? Number(sharesData.sanstha.apoornaSankhya) : null,
          apoornaRs: sharesData.sanstha.apoornaRs !== undefined && sharesData.sanstha.apoornaRs !== null ? Number(sharesData.sanstha.apoornaRs) : null,
        };
      }
      if (sharesData.sakhar) {
        this.shares.sakhar = {
          ghyayache: sharesData.sakhar.ghyayache !== undefined && sharesData.sakhar.ghyayache !== null ? Number(sharesData.sakhar.ghyayache) : null,
          ghetlele: sharesData.sakhar.ghetlele !== undefined && sharesData.sakhar.ghetlele !== null ? Number(sharesData.sakhar.ghetlele) : null,
          apoornaSankhya: sharesData.sakhar.apoornaSankhya !== undefined && sharesData.sakhar.apoornaSankhya !== null ? Number(sharesData.sakhar.apoornaSankhya) : null,
          apoornaRs: sharesData.sakhar.apoornaRs !== undefined && sharesData.sakhar.apoornaRs !== null ? Number(sharesData.sakhar.apoornaRs) : null,
        };
      }
      if (sharesData.reFund) {
        this.reFund = {
          ghyayache: sharesData.reFund.ghyayache !== undefined && sharesData.reFund.ghyayache !== null ? Number(sharesData.reFund.ghyayache) : null,
          ghetlele: sharesData.reFund.ghetlele !== undefined && sharesData.reFund.ghetlele !== null ? Number(sharesData.reFund.ghetlele) : null,
          apoornaSankhya: sharesData.reFund.apoornaSankhya !== undefined && sharesData.reFund.apoornaSankhya !== null ? Number(sharesData.reFund.apoornaSankhya) : null,
          apoornaRs: sharesData.reFund.apoornaRs !== undefined && sharesData.reFund.apoornaRs !== null ? Number(sharesData.reFund.apoornaRs) : null,
        };
      }
    }

    let s = data.statement_data;
    if (typeof s === 'string') {
      try {
        s = JSON.parse(s);
      } catch (e) {}
    }

    if (s) {
      if (s.pagardar) this.pagardar = { ...this.pagardar, ...s.pagardar };
      if (s.nagari) this.nagari = { ...this.nagari, ...s.nagari };
      if (s.ginningClean) this.ginningClean = { ...this.ginningClean, ...s.ginningClean };
      if (s.ginningNajarGahan) this.ginningNajarGahan = { ...this.ginningNajarGahan, ...s.ginningNajarGahan };
      if (s.kharediVikri) this.kharediVikri = { ...this.kharediVikri, ...s.kharediVikri };
      if (s.dudhUtpadak) this.dudhUtpadak = { ...this.dudhUtpadak, ...s.dudhUtpadak };
      if (s.madhyamMudatNonAgri) this.madhyamMudatNonAgri = { ...this.madhyamMudatNonAgri, ...s.madhyamMudatNonAgri };
      if (s.nonFarmMediumTerm) this.nonFarmMediumTerm = { ...this.nonFarmMediumTerm, ...s.nonFarmMediumTerm };
      if (s.nonFarmWorkingCapital) this.nonFarmWorkingCapital = { ...this.nonFarmWorkingCapital, ...s.nonFarmWorkingCapital };
      if (s.shaikshanikKarj) this.shaikshanikKarj = { ...this.shaikshanikKarj, ...s.shaikshanikKarj };
      if (s.gramodyog) this.gramodyog = { ...this.gramodyog, ...s.gramodyog };
      if (Array.isArray(s.sugarFactories)) {
        s.sugarFactories.forEach((savedItem: any, idx: number) => {
          if (this.sugarFactories[idx]) {
            this.sugarFactories[idx].yeanebakiMembers = savedItem.yeanebakiMembers !== undefined && savedItem.yeanebakiMembers !== null ? Number(savedItem.yeanebakiMembers) : null;
            this.sugarFactories[idx].yeanebakiAmount = savedItem.yeanebakiAmount !== undefined && savedItem.yeanebakiAmount !== null ? Number(savedItem.yeanebakiAmount) : null;
            this.sugarFactories[idx].thakbakiMembers = savedItem.thakbakiMembers !== undefined && savedItem.thakbakiMembers !== null ? Number(savedItem.thakbakiMembers) : null;
            this.sugarFactories[idx].thakbakiAmount = savedItem.thakbakiAmount !== undefined && savedItem.thakbakiAmount !== null ? Number(savedItem.thakbakiAmount) : null;
          }
        });
      }
      if (s.reviewer_action !== undefined && s.reviewer_action !== null) {
        this.reviewerAction = Number(s.reviewer_action);
      }
      if (s.reviewer_comment !== undefined && s.reviewer_comment !== null) {
        this.reviewerComment = s.reviewer_comment || '';
      }
    }

    this.cdr.detectChanges();
  }

  // --- Save to Database (Auditor) ---
  saveStatement(): void {
    this.saving = true;

    const payload: NonAgriStatementPayload = {
      id: this.id || undefined,
      assessment_id: this.assessmentId,
      year_id: this.yearId,
      audit_unit_id: this.auditUnitId,
      statement_date: this.statementDate,
      statement_type: this.statementType,
      bank_name: this.bankName,
      head_office: this.headOffice,
      unit_text: this.unitText,
      inspection_patra: this.inspection.patra,
      inspection_purna: this.inspection.purna,
      inspection_apoorna: this.inspection.apoorna,
      designation1: this.designation1,
      designation2: this.designation2,
      shares_data: {
        sanstha: this.shares.sanstha,
        sakhar: this.shares.sakhar,
        reFund: this.reFund,
        total: {
          ghyayache: this.sharesTotalGhyayache,
          ghetlele: this.sharesTotalGhetlele,
          apoornaSankhya: this.sharesTotalApoornaSankhya,
          apoornaRs: this.sharesTotalApoornaRs
        }
      },
      statement_data: {
        pagardar: this.pagardar,
        nagari: this.nagari,
        ginningClean: this.ginningClean,
        ginningNajarGahan: this.ginningNajarGahan,
        ginningTotal: this.ginningTotal,
        kharediVikri: this.kharediVikri,
        dudhUtpadak: this.dudhUtpadak,
        madhyamMudatNonAgri: this.madhyamMudatNonAgri,
        nonFarmMediumTerm: this.nonFarmMediumTerm,
        nonFarmWorkingCapital: this.nonFarmWorkingCapital,
        nonFarmTotal: this.nonFarmTotal,
        shaikshanikKarj: this.shaikshanikKarj,
        gramodyog: this.gramodyog,
        sugarFactories: this.sugarFactories,
        sugarFactoriesTotal: this.sugarFactoriesTotal,
        auditor_comment: this.auditorComment,
        reviewer_action: this.reviewerAction,
        reviewer_comment: this.reviewerComment
      },
      total_yeanebaki_members: this.grandTotal.yeanebakiMembers || 0,
      total_yeanebaki_amount: this.grandTotal.yeanebakiAmount || 0,
      total_thakbaki_members: this.grandTotal.thakbakiMembers || 0,
      total_thakbaki_amount: this.grandTotal.thakbakiAmount || 0,
      auditor_comment: this.auditorComment
    };

    this.statementService.saveStatement(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res?.data?.id) {
          this.id = res.data.id;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'यशस्वी (Success)',
          detail: 'माहिती पत्रक यशस्वीरीत्या जतन केले गेले आहे (Statement saved successfully).'
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'स्थानिक पातळीवर जतन केले (Saved Locally)',
          detail: 'डेटा स्थानिक स्टोरेजमध्ये जतन केला गेला आहे.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  // --- Save Review Action (Reviewer) ---
  saveReviewAction(): void {
    this.savingReview = true;

    const payload: NonAgriStatementPayload = {
      id: this.id || undefined,
      assessment_id: this.assessmentId,
      year_id: this.yearId,
      audit_unit_id: this.auditUnitId,
      statement_date: this.statementDate,
      statement_type: this.statementType,
      bank_name: this.bankName,
      head_office: this.headOffice,
      unit_text: this.unitText,
      inspection_patra: this.inspection.patra,
      inspection_purna: this.inspection.purna,
      inspection_apoorna: this.inspection.apoorna,
      designation1: this.designation1,
      designation2: this.designation2,
      shares_data: {
        sanstha: this.shares.sanstha,
        sakhar: this.shares.sakhar,
        reFund: this.reFund,
        total: {
          ghyayache: this.sharesTotalGhyayache,
          ghetlele: this.sharesTotalGhetlele,
          apoornaSankhya: this.sharesTotalApoornaSankhya,
          apoornaRs: this.sharesTotalApoornaRs
        }
      },
      statement_data: {
        pagardar: this.pagardar,
        nagari: this.nagari,
        ginningClean: this.ginningClean,
        ginningNajarGahan: this.ginningNajarGahan,
        ginningTotal: this.ginningTotal,
        kharediVikri: this.kharediVikri,
        dudhUtpadak: this.dudhUtpadak,
        madhyamMudatNonAgri: this.madhyamMudatNonAgri,
        nonFarmMediumTerm: this.nonFarmMediumTerm,
        nonFarmWorkingCapital: this.nonFarmWorkingCapital,
        nonFarmTotal: this.nonFarmTotal,
        shaikshanikKarj: this.shaikshanikKarj,
        gramodyog: this.gramodyog,
        sugarFactories: this.sugarFactories,
        sugarFactoriesTotal: this.sugarFactoriesTotal,
        auditor_comment: this.auditorComment,
        reviewer_action: this.reviewerAction,
        reviewer_comment: this.reviewerComment
      },
      total_yeanebaki_members: this.grandTotal.yeanebakiMembers || 0,
      total_yeanebaki_amount: this.grandTotal.yeanebakiAmount || 0,
      total_thakbaki_members: this.grandTotal.thakbakiMembers || 0,
      total_thakbaki_amount: this.grandTotal.thakbakiAmount || 0,
      auditor_comment: this.auditorComment
    };

    this.statementService.saveStatement(payload).subscribe({
      next: (res) => {
        this.savingReview = false;
        if (res?.data?.id) {
          this.id = res.data.id;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'तपासणी जतन झाली (Review Saved)',
          detail: 'तपासणी अधिकारी शेरा व निर्णय यशस्वीरीत्या जतन केला गेला आहे.'
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.savingReview = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'स्थानिक पातळीवर जतन केले (Saved Locally)',
          detail: 'डेटा स्थानिक स्टोरेजमध्ये जतन केला गेला आहे.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  // --- Calculations for Shares Total ---
  get sharesTotalGhyayache(): number {
    return this.addNumbers(this.shares.sanstha.ghyayache, this.shares.sakhar.ghyayache);
  }

  get sharesTotalGhetlele(): number {
    return this.addNumbers(this.shares.sanstha.ghetlele, this.shares.sakhar.ghetlele);
  }

  get sharesTotalApoornaSankhya(): number {
    return this.addNumbers(this.shares.sanstha.apoornaSankhya, this.shares.sakhar.apoornaSankhya);
  }

  get sharesTotalApoornaRs(): number {
    return this.addNumbers(this.shares.sanstha.apoornaRs, this.shares.sakhar.apoornaRs);
  }

  // --- Calculations for Section 6: Ginning Total ---
  get ginningTotal(): StatementRow {
    return {
      label: 'एकूण',
      yeanebakiMembers: this.addNumbers(this.ginningClean.yeanebakiMembers, this.ginningNajarGahan.yeanebakiMembers),
      yeanebakiAmount: this.addNumbers(this.ginningClean.yeanebakiAmount, this.ginningNajarGahan.yeanebakiAmount),
      thakbakiMembers: this.addNumbers(this.ginningClean.thakbakiMembers, this.ginningNajarGahan.thakbakiMembers),
      thakbakiAmount: this.addNumbers(this.ginningClean.thakbakiAmount, this.ginningNajarGahan.thakbakiAmount),
      isSubTotal: true
    };
  }

  // --- Calculations for Section 10: Non Farm Total ---
  get nonFarmTotal(): StatementRow {
    return {
      label: 'एकूण',
      yeanebakiMembers: this.addNumbers(this.nonFarmMediumTerm.yeanebakiMembers, this.nonFarmWorkingCapital.yeanebakiMembers),
      yeanebakiAmount: this.addNumbers(this.nonFarmMediumTerm.yeanebakiAmount, this.nonFarmWorkingCapital.yeanebakiAmount),
      thakbakiMembers: this.addNumbers(this.nonFarmMediumTerm.thakbakiMembers, this.nonFarmWorkingCapital.thakbakiMembers),
      thakbakiAmount: this.addNumbers(this.nonFarmMediumTerm.thakbakiAmount, this.nonFarmWorkingCapital.thakbakiAmount),
      isSubTotal: true
    };
  }

  // --- Calculations for Section 13: Sugar Factories Total ---
  get sugarFactoriesTotal(): StatementRow {
    let ym = 0, ya = 0, tm = 0, ta = 0;
    for (const item of this.sugarFactories) {
      ym += Number(item.yeanebakiMembers || 0);
      ya += Number(item.yeanebakiAmount || 0);
      tm += Number(item.thakbakiMembers || 0);
      ta += Number(item.thakbakiAmount || 0);
    }
    return {
      label: 'एकूण',
      yeanebakiMembers: this.round(ym),
      yeanebakiAmount: this.round(ya),
      thakbakiMembers: this.round(tm),
      thakbakiAmount: this.round(ta),
      isSubTotal: true
    };
  }

  // --- Grand Total (Non-Agri Loan Supply All Total) ---
  get grandTotal(): StatementRow {
    const list: StatementRow[] = [
      this.pagardar,
      this.nagari,
      this.ginningTotal,
      this.kharediVikri,
      this.dudhUtpadak,
      this.madhyamMudatNonAgri,
      this.nonFarmTotal,
      this.shaikshanikKarj,
      this.gramodyog,
      this.sugarFactoriesTotal
    ];

    let ym = 0, ya = 0, tm = 0, ta = 0;
    for (const r of list) {
      ym += Number(r.yeanebakiMembers || 0);
      ya += Number(r.yeanebakiAmount || 0);
      tm += Number(r.thakbakiMembers || 0);
      ta += Number(r.thakbakiAmount || 0);
    }

    return {
      label: 'बिगर शेती कर्ज पुरवठा सर्व एकूण',
      yeanebakiMembers: this.round(ym),
      yeanebakiAmount: this.round(ya),
      thakbakiMembers: this.round(tm),
      thakbakiAmount: this.round(ta),
      isSubTotal: true
    };
  }

  private addNumbers(a: number | null | undefined, b: number | null | undefined): number {
    const sum = Number(a || 0) + Number(b || 0);
    return this.round(sum);
  }

  private round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  displayVal(val: number | null | undefined): string {
    if (val === null || val === undefined || val === 0) return '';
    return val.toLocaleString('en-IN');
  }

  // Action Methods
  print(): void {
    this.pdfService.printElement('statement-print-area');
  }

  resetForm(): void {
    this.id = null;
    this.inspection = { patra: 97, purna: 93, apoorna: 4 };
    this.shares.sanstha = { ghyayache: null, ghetlele: null, apoornaSankhya: null, apoornaRs: null };
    this.shares.sakhar = { ghyayache: null, ghetlele: null, apoornaSankhya: null, apoornaRs: null };
    this.reFund = { ghyayache: null, ghetlele: null, apoornaSankhya: null, apoornaRs: null };
    this.pagardar = { srNo: '४', label: 'पगारदार सहकारी पत संस्था', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.nagari = { srNo: '५', label: 'नागरी सहकारी पत संस्था', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.ginningClean = { label: 'अ कॅश क्रेडीट क्लिन', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true };
    this.ginningNajarGahan = { label: 'ब नजरगहाण', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true };
    this.kharediVikri = { srNo: '७', label: 'खरेदी विक्री संघ- नजरगहाण खाते/ तेले', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.dudhUtpadak = { srNo: '८', label: 'दूध उत्पादक सहकारी संस्था - क्लिन कॅश क्रेडीट', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.madhyamMudatNonAgri = { srNo: '९', label: 'मध्यम मुदत बिगर शेती संस्था', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.nonFarmMediumTerm = { label: 'अ. मध्यम मुदत', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true };
    this.nonFarmWorkingCapital = { label: 'ब. खेळते भांडवल', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null, isSubItem: true };
    this.shaikshanikKarj = { srNo: '११', label: 'शैक्षणिक कर्ज -', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.gramodyog = { srNo: '१२', label: 'ग्रामोद्योग संघ कंपोझीट नाबार्ड (१३ संघ)', yeanebakiMembers: null, yeanebakiAmount: null, thakbakiMembers: null, thakbakiAmount: null };
    this.sugarFactories.forEach(item => {
      item.yeanebakiMembers = null;
      item.yeanebakiAmount = null;
      item.thakbakiMembers = null;
      item.thakbakiAmount = null;
    });
    this.auditorComment = '';
    this.reviewerAction = 2;
    this.reviewerComment = '';
  }

  fillSampleData(): void {
    this.inspection = { patra: 97, purna: 93, apoorna: 4 };
    this.shares.sanstha = { ghyayache: 250000, ghetlele: 200000, apoornaSankhya: 2, apoornaRs: 50000 };
    this.shares.sakhar = { ghyayache: 1500000, ghetlele: 1200000, apoornaSankhya: 1, apoornaRs: 300000 };
    this.reFund = { ghyayache: 100000, ghetlele: 80000, apoornaSankhya: 1, apoornaRs: 20000 };
    this.auditorComment = 'सर्व बिगर शेती संस्थांचे कर्ज खाते व भागभांडवल तपासणी पूर्ण करण्यात आलेली आहे.';
    
    this.pagardar = { srNo: '४', label: 'पगारदार सहकारी पत संस्था', yeanebakiMembers: 48, yeanebakiAmount: 320.75, thakbakiMembers: 5, thakbakiAmount: 18.40 };
    this.nagari = { srNo: '५', label: 'नागरी सहकारी पत संस्था', yeanebakiMembers: 35, yeanebakiAmount: 512.60, thakbakiMembers: 8, thakbakiAmount: 42.10 };
    
    this.ginningClean = { label: 'अ कॅश क्रेडीट क्लिन', yeanebakiMembers: 4, yeanebakiAmount: 85.00, thakbakiMembers: 1, thakbakiAmount: 12.50, isSubItem: true };
    this.ginningNajarGahan = { label: 'ब नजरगहाण', yeanebakiMembers: 6, yeanebakiAmount: 140.20, thakbakiMembers: 2, thakbakiAmount: 25.00, isSubItem: true };
    
    this.kharediVikri = { srNo: '७', label: 'खरेदी विक्री संघ- नजरगहाण खाते/ तेले', yeanebakiMembers: 8, yeanebakiAmount: 95.80, thakbakiMembers: 1, thakbakiAmount: 8.30 };
    this.dudhUtpadak = { srNo: '८', label: 'दूध उत्पादक सहकारी संस्था - क्लिन कॅश क्रेडीट', yeanebakiMembers: 15, yeanebakiAmount: 110.40, thakbakiMembers: 3, thakbakiAmount: 14.20 };
    this.madhyamMudatNonAgri = { srNo: '९', label: 'मध्यम मुदत बिगर शेती संस्था', yeanebakiMembers: 18, yeanebakiAmount: 230.15, thakbakiMembers: 4, thakbakiAmount: 31.00 };
    
    this.nonFarmMediumTerm = { label: 'अ. मध्यम मुदत', yeanebakiMembers: 10, yeanebakiAmount: 75.00, thakbakiMembers: 2, thakbakiAmount: 9.50, isSubItem: true };
    this.nonFarmWorkingCapital = { label: 'ब. खेळते भांडवल', yeanebakiMembers: 14, yeanebakiAmount: 120.50, thakbakiMembers: 3, thakbakiAmount: 15.00, isSubItem: true };
    
    this.shaikshanikKarj = { srNo: '११', label: 'शैक्षणिक कर्ज -', yeanebakiMembers: 22, yeanebakiAmount: 88.90, thakbakiMembers: 2, thakbakiAmount: 6.40 };
    this.gramodyog = { srNo: '१२', label: 'ग्रामोद्योग संघ कंपोझीट नाबार्ड (१३ संघ)', yeanebakiMembers: 13, yeanebakiAmount: 64.30, thakbakiMembers: 1, thakbakiAmount: 4.80 };
    
    const sampleSugar = [
      [3, 450.00, 1, 65.00],
      [2, 120.00, 0, 0.00],
      [4, 850.50, 1, 110.00],
      [1, 95.00, 0, 0.00],
      [2, 210.00, 1, 35.00],
      [1, 50.00, 0, 0.00],
      [3, 310.20, 1, 40.00],
      [2, 180.00, 1, 28.50],
      [1, 75.00, 0, 0.00],
      [1, 40.00, 1, 40.00]
    ];

    this.sugarFactories.forEach((item, idx) => {
      if (sampleSugar[idx]) {
        item.yeanebakiMembers = sampleSugar[idx][0];
        item.yeanebakiAmount = sampleSugar[idx][1];
        item.thakbakiMembers = sampleSugar[idx][2];
        item.thakbakiAmount = sampleSugar[idx][3];
      }
    });
  }
}
