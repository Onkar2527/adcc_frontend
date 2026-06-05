import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ExportService } from '../../../core/services/export/export.service';
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
  private exportService = inject(ExportService);

  reportSlug = signal('');
  definition = signal<ReportDefinition | null>(null);
  rows = signal<any[]>([]);
  summary = signal<Record<string, any> | null>(null);
  reportHeader = signal<Record<string, any> | null>(null);
  generatedAt = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  error = signal('');

  filters: Record<string, any> = {};

  isAdvancedLayout(): boolean {
    const slug = this.definition()?.slug;
    return slug === 'risk-weightage-report' || slug === 'broader-areawise-scoring-report';
  }

  shouldShowFilter(filter: ReportFilterDefinition): boolean {
    if (this.isAdvancedLayout()) {
      const searchType = String(this.filters['selectSearchTypeFilter'] || '3');
      if (filter.key === 'startDate' || filter.key === 'endDate') {
        return searchType === '5' || searchType === '6';
      }
      if (filter.key === 'reportAuditAssesment') {
        return searchType === '3' || searchType === '4';
      }
    }
    return true;
  }

  filterOptions(filter: ReportFilterDefinition) {
    const options = filter.options || [];

    if (!filter.dependsOn || !filter.optionParentKey) {
      return options;
    }

    const parentValue = String(this.filters[filter.dependsOn] || '');

    return options.filter((option: any) => {
      const optionParentValue = option[filter.optionParentKey as string];

      return !optionParentValue
        || (parentValue && String(optionParentValue) === parentValue);
    });
  }

  onFilterChange(filter: ReportFilterDefinition) {
    if (this.isAdvancedLayout() && filter.key === 'selectSearchTypeFilter') {
      const searchType = String(this.filters['selectSearchTypeFilter'] || '3');
      if (searchType === '3' || searchType === '4') {
        this.filters['startDate'] = '';
        this.filters['endDate'] = '';
      } else {
        this.filters['reportAuditAssesment'] = '';
      }
    }

    const childFilters =
      this.definition()?.filters.filter((item) => item.dependsOn === filter.key)
      || [];

    childFilters.forEach((childFilter) => {
      const selectedValue = String(this.filters[childFilter.key] || '');
      const isSelectedValueValid = this
        .filterOptions(childFilter)
        .some((option) => String(option.value) === selectedValue);

      if (!isSelectedValueValid) {
        this.filters[childFilter.key] =
          childFilter.type === 'checkbox' ? [] : '';
      }
    });
  }

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
    this.reportHeader.set(null);
    this.searched.set(false);

    this.reportsService.getReportDefinition(slug).subscribe({
      next: (definition) => {
        this.definition.set(definition);
        this.filters = {
          ...(definition.defaultFilters || {}),
        };
        definition.filters
          .filter((filter) => filter.type === 'checkbox')
          .forEach((filter) => {
            this.filters[filter.key] =
              Array.isArray(this.filters[filter.key])
                ? this.filters[filter.key]
                : [];
          });
        // Programmatically preload logo image to ensure browser caching
        const logoUrl = definition.brand?.logoUrl || '/assets/images/logos/auditpro-logo.png';
        const img = new Image();
        img.src = logoUrl;

        this.loading.set(false);
      },
      error: (err) => {
        this.definition.set(null);
        this.error.set(err?.error?.message || 'Report is not available.');
        this.loading.set(false);
        const name = this.route.snapshot.queryParams['name'] || slug;
        this.router.navigate(['/reports/detail'], { queryParams: { name } });
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
        this.reportHeader.set(res?.header || null);
        this.generatedAt.set(res?.generatedAt || new Date().toISOString());
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.summary.set(null);
        this.reportHeader.set(null);
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
    definition?.filters
      .filter((filter) => filter.type === 'checkbox')
      .forEach((filter) => {
        this.filters[filter.key] =
          Array.isArray(this.filters[filter.key])
            ? this.filters[filter.key]
            : [];
      });
    this.rows.set([]);
    this.summary.set(null);
    this.reportHeader.set(null);
    this.generatedAt.set(null);
    this.searched.set(false);
    this.error.set('');
  }

  print() {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-report'));
  }

  canExportExcel() {
    return !['audit-complete-report', 'audit-observations-report', 'compliance-report', 'compliance-summary-report'].includes(
      this.definition()?.slug || '',
    );
  }

  exportExcel() {
    const definition = this.definition();
    const rows = this.rows();

    if (!definition || !rows.length) {
      return;
    }

    if (definition.slug === 'broader-areawise-scoring-report') {
      const tableElement = document.querySelector('.official-report-table');
      if (tableElement) {
        this.exportService.exportTableToExcel(
          tableElement,
          definition.fileName || definition.slug
        );
        return;
      }
    }

    const dataToExport = rows
      .filter((row) => !row.__report_group && !row.__report_annexure && !row.__report_vouching)
      .map((row) => {
        const formattedRow: any = {};
        definition.columns.forEach((column) => {
          formattedRow[column.key] = this.exportValue(row, column);
        });
        return formattedRow;
      });

    const exportCols = definition.columns.map((column) => ({
      field: column.key,
      header: column.label.toUpperCase(),
    }));

    this.exportService.exportToExcel(
      dataToExport,
      exportCols,
      definition.fileName || definition.slug
    );
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  filterLabel(filter: ReportFilterDefinition) {
    const value = this.filters[filter.key];

    if (filter.type === 'checkbox') {
      const values = Array.isArray(value)
        ? value.map(String)
        : String(value || '').split(',').filter(Boolean);

      if (!values.length) {
        return 'All';
      }

      return (filter.options || [])
        .filter((option) => values.includes(String(option.value)))
        .map((option) => option.label)
        .join(', ') || 'All';
    }

    return filter.options?.find((option) => String(option.value) === String(value))?.label || '-';
  }

  checkboxSelected(filterKey: string, optionValue: any) {
    return Array.isArray(this.filters[filterKey])
      && this.filters[filterKey].map(String).includes(String(optionValue));
  }

  toggleCheckboxFilter(filterKey: string, optionValue: any, checked: boolean) {
    const current = Array.isArray(this.filters[filterKey])
      ? this.filters[filterKey].map(String)
      : [];
    const value = String(optionValue);

    this.filters[filterKey] = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value);
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

  reportAssessmentPeriod() {
    return this.reportHeader()?.['assessmentPeriod'] || '';
  }

  reportAuditUnit() {
    return this.reportHeader()?.['auditUnit'] || '';
  }

  hasGroupedRows() {
    return this.rows().some((row) => row.__report_group);
  }

  showInlineHeader(row: any, rowIndex: number) {
    if (!row.__report_group || row.__group_level !== 'header') {
      return false;
    }

    return !this.rows()
      .slice(0, rowIndex)
      .some((item) => item.__report_group && item.__group_level === 'header');
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
