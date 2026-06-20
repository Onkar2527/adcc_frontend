import { Component, inject, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { ButtonModule } from 'primeng/button';

interface ReportItem {
  srNo: number;
  name: string;
  route: string;
  category: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ToastModule, TableComponent, ButtonModule],
  providers: [MessageService],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ReportsComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);

  columns: TableColumn[] = [
    {
      field: 'srNo',
      header: 'SR. NO.',
      width: '4.5rem',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    },
    { field: 'name', header: 'REPORTS', align: 'left', headerAlign: 'left', sortable: false },
    {
      field: 'action',
      header: 'ACTION',
      width: '6rem',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
    },
  ];

  reports: ReportItem[] = [
    // Master Reports (category: '1_master')
    // { srNo: 1, name: 'Financial Year Setup Report', route: '/reports/financial-year-report', category: '1_master' },
    // { srNo: 2, name: 'Financial Year Wise Risk Matrix Report', route: '/reports/financial-year-wise-risk-matrix-report', category: '1_master' },
    // { srNo: 3, name: 'Employee Master Report', route: '/reports/employee-master-report', category: '1_master' },
    // { srNo: 4, name: 'Audit Section Report', route: '/reports/audit-section-report', category: '1_master' },
    // { srNo: 5, name: 'Audit Unit Master Report', route: '/reports/audit-unit-master-report', category: '1_master' },
    // { srNo: 6, name: 'Broader Area of Audit Non-compliance Master Report', route: '/reports/broader-area-audit-unit-report', category: '1_master' },
    // { srNo: 7, name: 'Scheme Master Report', route: '/reports/scheme-master-report', category: '1_master' },
    // { srNo: 8, name: 'Menu Master Report', route: '/reports/menu-master-report', category: '1_master' },
    // { srNo: 9, name: 'Audit Unit Wise Financial Report', route: '/reports/audit-unit-wise-financial-report', category: '1_master' },
    // { srNo: 10, name: 'Audit Unit Wise Last March Position Report', route: '/reports/audit-unit-wise-last-march-position-report', category: '1_master' },
    // { srNo: 11, name: 'Audit Unit Wise Accounts Target Report', route: '/reports/audit-unit-wise-accounts-target-report', category: '1_master' },
    // { srNo: 12, name: 'Audit Frequency and Last Assesment Done Report', route: '/reports/audit-frequency-and-last-assesment-done-report', category: '1_master' },
    // { srNo: 13, name: 'Audit Duration Report', route: '/reports/audit-duration-report', category: '1_master' },
    // { srNo: 14, name: 'Risk Type Report', route: '/reports/risk-type-report', category: '1_master' },
    // { srNo: 15, name: 'Control Risk - Key Aspects Report', route: '/reports/control-risk-key-report', category: '1_master' },
    // { srNo: 16, name: 'Category Master Report', route: '/reports/category-master-report', category: '1_master' },
    // { srNo: 17, name: 'Deposit - CBS Data Upload Status Report', route: '/reports/cbs-deposit-report', category: '1_master' },
    // { srNo: 18, name: 'Advances - CBS Data Upload Status Report', route: '/reports/cbs-advances-report', category: '1_master' },
    // { srNo: 19, name: 'Vouching Error Category Report', route: '/reports/vouching-error-category-report', category: '1_master' },
    // { srNo: 20, name: 'Annexure Report', route: '/reports/annexure-report', category: '1_master' },
    // { srNo: 21, name: 'Header Details Report', route: '/reports/header-details-report', category: '1_master' },
    // { srNo: 22, name: 'Question Set Wise Mapping Report', route: '/reports/question-set-wise-mapping-report', category: '1_master' },
    // { srNo: 23, name: 'Account-Wise Scoring Report', route: '/reports/accountwise-scoring-report', category: '1_master' },

    // Audit Reports (category: '2_audit')
    {
      srNo: 24,
      name: 'Audit Status Report',
      route: '/reports/audit-status-report',
      category: '2_audit',
    },
    {
      srNo: 25,
      name: 'Audit Status Expired Report',
      route: '/reports/audit-status-expired-report',
      category: '2_audit',
    },
    {
      srNo: 26,
      name: 'Executive Summary Audit Report',
      route: '/reports/executive-summary-audit-report',
      category: '2_audit',
    },
    {
      srNo: 27,
      name: 'Executive Summary Compliance Report',
      route: '/reports/executive-summary-compliance-report',
      category: '2_audit',
    },
    {
      srNo: 28,
      name: 'Assesment Timeline Report',
      route: '/reports/assesment-timeline-report',
      category: '2_audit',
    },
    {
      srNo: 29,
      name: 'Assement Not Started Yet Report',
      route: '/reports/assement-not-started-yet-report',
      category: '2_audit',
    },
    {
      srNo: 30,
      name: 'Audit Complete Report',
      route: '/reports/audit-complete-report',
      category: '2_audit',
    },
    {
      srNo: 31,
      name: 'Compliance Report',
      route: '/reports/compliance-report',
      category: '2_audit',
    },
    {
      srNo: 32,
      name: 'Compliance Summary Report',
      route: '/reports/compliance-summary-report',
      category: '2_audit',
    },
    {
      srNo: 33,
      name: 'Audit Observations Report',
      route: '/reports/audit-observations-report',
      category: '2_audit',
    },
    {
      srNo: 34,
      name: 'Partially Pass Report',
      route: '/reports/partially-pass-report',
      category: '2_audit',
    },

    // Advanced Reports (category: '3_advanced')
    {
      srNo: 35,
      name: 'Risk Weightage Report',
      route: '/reports/risk-weightage-report',
      category: '3_advanced',
    },
    {
      srNo: 36,
      name: 'Broader Areawise Scoring Report',
      route: '/reports/broader-areawise-scoring-report',
      category: '3_advanced',
    },
    {
      srNo: 37,
      name: 'Risk Wise Audit Units Report',
      route: '/reports/risk-wise-audit-units-report',
      category: '3_advanced',
    },
    {
      srNo: 38,
      name: 'Audit Observation Count Report',
      route: '/reports/audit-observation-count-report',
      category: '3_advanced',
    },
    {
      srNo: 39,
      name: 'Pending Compliance Detailed Report',
      route: '/reports/pending-compliance-detail-report',
      category: '3_advanced',
    },
    {
      srNo: 40,
      name: 'Audit Committee Board Report - 1',
      route: '/reports/audit-committee-board-report-1',
      category: '3_advanced',
    },
    {
      srNo: 41,
      name: 'Question Wise BroaderArea Report',
      route: '/reports/questionwsie-broader-areawise-report',
      category: '3_advanced',
    },
    {
      srNo: 42,
      name: 'Internal Audit & Compliance Report',
      route: '/reports/internal-assesment-report',
      category: '3_advanced',
    },
    {
      srNo: 43,
      name: 'Performance Risk Weightage Report',
      route: '/reports/performance-risk-weightage-report',
      category: '3_advanced',
    },
    {
      srNo: 44,
      name: 'Performance Risk Weightage Report (Category Wise)',
      route: '/reports/performance-risk-weightage-report-category-wise',
      category: '3_advanced',
    },
    {
      srNo: 45,
      name: 'RBIA - Performance Risk Weightage Report (All Units)',
      route: '/reports/rbia-performance-risk-weightage-report-all-units',
      category: '3_advanced',
    },
    {
      srNo: 46,
      name: 'Risk & NPA Wise Audit Units Report',
      route: '/reports/risk-npa-wise-audit-units-report',
      category: '3_advanced',
    },
    {
      srNo: 47,
      name: 'Question Wise Scoring Report',
      route: '/reports/question-wise-scoring-report',
      category: '3_advanced',
    },
  ];

  goBack() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userTypeId = String(user.user_type_id || '');
    switch (userTypeId) {
      case '1':
        this.router.navigate(['/home']);
        break;
      case '2':
        this.router.navigate(['/auditor/audit-dashboard']);
        break;
      case '3':
        this.router.navigate(['/auditor/compliance']);
        break;
      case '4':
        this.router.navigate(['/auditor/reviewer']);
        break;
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  runReport(report: ReportItem) {
    this.router.navigate([report.route], { queryParams: { name: report.name } });
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case '1_master':
        return 'Master Reports »';
      case '2_audit':
        return 'Audit Reports »';
      case '3_advanced':
        return 'Advanced Reports »';
      default:
        return category;
    }
  }

  filteredReports: ReportItem[] = [];

  ngOnInit() {
    this.initFilteredReports();
  }

  initFilteredReports() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userTypeId = String(user.user_type_id || '');

    let rawList = [...this.reports];
    if (userTypeId !== '1' && userTypeId !== '9' && userTypeId !== '5') {
      // Filter out master reports for non-admin users
      rawList = rawList.filter((r) => r.category !== '1_master');
    }

    // Re-assign sequential SR. NO.
    this.filteredReports = rawList.map((r, index) => ({
      ...r,
      srNo: index + 1,
    }));
  }
}
