import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
  ReportColumnDefinition,
  ReportDefinition,
  ReportFilterDefinition,
  ReportsService,
} from '../services/reports.service';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule],
  templateUrl: './report-viewer.component.html',
  styleUrl: './report-viewer.component.scss',
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportsService = inject(ReportsService);

  reportSlug = signal('');
  definition = signal<ReportDefinition | null>(null);
  rows = signal<any[]>([]);
  summary = signal<Record<string, any> | null>(null);
  generatedAt = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  error = signal('');

  filters: Record<string, any> = {};

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('reportSlug') || '';
      this.reportSlug.set(slug);
      this.loadDefinition(slug);
    });
  }

  loadDefinition(slug: string) {
    this.loading.set(true);
    this.error.set('');
    this.rows.set([]);
    this.summary.set(null);
    this.searched.set(false);

    this.reportsService.getReportDefinition(slug).subscribe({
      next: (definition) => {
        this.definition.set(definition);
        this.filters = {
          ...(definition.defaultFilters || {}),
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.definition.set(null);
        this.error.set(err?.error?.message || 'Report is not available.');
        this.loading.set(false);
      },
    });
  }

  findReport() {
    const definition = this.definition();

    if (!definition) {
      return;
    }

    const missingFilter = definition.filters.find(
      (filter) => filter.required && !this.filters[filter.key],
    );

    if (missingFilter) {
      this.error.set(`${missingFilter.label} is required.`);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.searched.set(true);

    this.reportsService.getReportData(definition.slug, this.filters).subscribe({
      next: (res) => {
        this.rows.set(res?.rows || []);
        this.summary.set(res?.summary || null);
        this.generatedAt.set(res?.generatedAt || new Date().toISOString());
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.summary.set(null);
        this.error.set(err?.error?.message || 'Unable to generate report.');
        this.loading.set(false);
      },
    });
  }

  reset() {
    const definition = this.definition();
    this.filters = {
      ...(definition?.defaultFilters || {}),
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

  exportCsv() {
    const definition = this.definition();
    const rows = this.rows();

    if (!definition || !rows.length) {
      return;
    }

    const headers = definition.columns.map((column) => column.label);
    const csvRows = rows.map((row) =>
      definition.columns.map((column) => this.exportValue(row, column)),
    );

    const csv = [headers, ...csvRows]
      .map((line) => line.map((cell) => `"${String(cell ?? '-').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${definition.fileName || definition.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  filterLabel(filter: ReportFilterDefinition) {
    const value = this.filters[filter.key];
    return filter.options?.find((option) => String(option.value) === String(value))?.label || '-';
  }

  reportRunDate() {
    return this.formatDate(
      this.generatedAt() || new Date().toISOString(),
    );
  }

  reportLogo() {
    return this.definition()?.brand?.logoUrl || '/assets/images/logos/auditpro-logo.png';
  }

  reportBankName() {
    return this.definition()?.brand?.bankName || '';
  }

  cellValue(row: any, column: ReportColumnDefinition) {
    if (column.type === 'assessmentPeriod') {
      return `${this.formatDate(row.assesment_period_from)} to ${this.formatDate(row.assesment_period_to)}`;
    }

    if (column.type === 'date') {
      return this.formatDate(row[column.key]);
    }

    return row[column.key] ?? '-';
  }

  exportValue(row: any, column: ReportColumnDefinition) {
    if (column.type === 'assessmentPeriod') {
      return `${this.cellValue(row, column)} (Frequency: ${row.frequency || '-'} Months)`;
    }

    if (column.type === 'status') {
      const label = this.cellValue(row, column);
      const expired = column.expiredKey && row[column.expiredKey];
      const dueDate = column.dueDateKey ? row[column.dueDateKey] : null;

      return expired ? `${label} (Expired on ${this.formatDate(dueDate)})` : label;
    }

    return this.cellValue(row, column);
  }

  statusSeverity(row: any, column: ReportColumnDefinition) {
    const label = String(row[column.key] || '').toLowerCase();

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
}
