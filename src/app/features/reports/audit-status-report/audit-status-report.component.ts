import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ReportsService, AuditStatusReportFilters } from '../services/reports.service';

@Component({
  selector: 'app-audit-status-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, DatePipe, DecimalPipe],
  templateUrl: './audit-status-report.component.html',
  styleUrl: './audit-status-report.component.scss',
})
export class AuditStatusReportComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private router = inject(Router);

  loading = signal(false);
  searched = signal(false);
  error = signal('');
  lookups = signal<any>({
    years: [],
    auditUnits: [],
    auditStatuses: [],
    complianceStatuses: [],
  });
  rows = signal<any[]>([]);
  summary = signal<any>(null);
  generatedAt = signal<string | null>(null);

  filters: AuditStatusReportFilters = {
    audit_unit_id: 'all_branches',
    financial_year: 'all',
    audit_status: 'all',
    comp_status: 'all',
  };

  ngOnInit() {
    this.loadLookups();
  }

  loadLookups() {
    this.loading.set(true);
    this.error.set('');

    this.reportsService.getAuditStatusLookups().subscribe({
      next: (res) => {
        this.lookups.set(res || {});
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Unable to load report filters.');
        this.loading.set(false);
      },
    });
  }

  findReport() {
    if (!this.filters.audit_unit_id) {
      this.error.set('Please select audit unit.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);

    this.reportsService.getAuditStatusReport(this.filters).subscribe({
      next: (res) => {
        this.rows.set(res?.rows || []);
        this.summary.set(res?.summary || null);
        this.generatedAt.set(res?.generatedAt || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.summary.set(null);
        this.error.set(err?.error?.message || 'Unable to generate audit status report.');
        this.loading.set(false);
      },
    });
  }

  reset() {
    this.filters = {
      audit_unit_id: 'all_branches',
      financial_year: 'all',
      audit_status: 'all',
      comp_status: 'all',
    };
    this.rows.set([]);
    this.summary.set(null);
    this.generatedAt.set(null);
    this.searched.set(false);
    this.error.set('');
  }

  print() {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-report'));
  }

  selectedFinancialYearLabel() {
    return this.lookupLabel(
      this.lookups().years,
      this.filters.financial_year,
    );
  }

  selectedAuditUnitLabel() {
    return this.lookupLabel(
      this.lookups().auditUnits,
      this.filters.audit_unit_id,
    );
  }

  exportCsv() {
    const rows = this.rows();

    if (!rows.length) {
      return;
    }

    const headers = [
      'Sr. No',
      'Audit Unit',
      'Auditor',
      'Audit Start Date',
      'Audit End Date',
      'Assessment Period',
      'Audit Status',
      'Compliance Start Date',
      'Compliance End Date',
      'Compliance Status',
    ];

    const csvRows = rows.map((row) => [
      row.sr_no,
      row.audit_unit_name,
      row.auditor_name,
      this.formatDate(row.audit_start_date),
      this.formatDate(row.audit_end_date),
      `${this.formatDate(row.assesment_period_from)} to ${this.formatDate(row.assesment_period_to)} (Frequency: ${row.frequency || '-'} Months)`,
      this.statusWithExpiry(row.audit_status_label, row.audit_expired, row.audit_due_date),
      this.formatDate(row.compliance_start_date),
      this.formatDate(row.compliance_end_date),
      this.statusWithExpiry(row.compliance_status_label, row.compliance_expired, row.compliance_due_date),
    ]);

    const csv = [headers, ...csvRows]
      .map((line) => line.map((cell) => `"${String(cell ?? '-').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-status-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  statusSeverity(row: any, type: 'audit' | 'compliance') {
    const label = String(type === 'audit' ? row.audit_status_label : row.compliance_status_label).toLowerCase();

    if (label.includes('blocked') || label.includes('expired')) {
      return 'danger';
    }

    if (label.includes('completed')) {
      return 'success';
    }

    if (label.includes('review')) {
      return 'info';
    }

    if (label.includes('re-')) {
      return 'warn';
    }

    return 'secondary';
  }

  formatDate(value: any) {
    return value ? String(value).slice(0, 10) : '-';
  }

  private statusWithExpiry(label: string, expired: boolean, dueDate: any) {
    if (!expired) {
      return label || '-';
    }

    return `${label || '-'} (Expired on ${this.formatDate(dueDate)})`;
  }

  private lookupLabel(options: any[] = [], value: string) {
    return options.find((option) => String(option.value) === String(value))?.label || '-';
  }
}
