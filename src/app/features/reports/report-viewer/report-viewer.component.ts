import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ExportService } from '../../../core/services/export/export.service';
import { DateRangeFieldComponent } from '../../../shared/components/form/date-range-field/date-range-field.component';
import {
  ReportColumnDefinition,
  ReportDefinition,
  ReportFilterDefinition,
  ReportsService,
} from '../services/reports.service';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, DateRangeFieldComponent],
  templateUrl: './report-viewer.component.html',
  styleUrl: './report-viewer.component.scss',
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportsService = inject(ReportsService);
  private exportService = inject(ExportService);

  constructor() {
    effect(() => {
      if (!this.isRiskWiseAuditUnitsReport()) {
        return;
      }

      const range = this.reportDateRange();
      this.filters['startDate'] = this.dateToFilterValue(range?.[0]);
      this.filters['endDate'] = this.dateToFilterValue(range?.[1]);
    });
  }

  reportSlug = signal('');
  definition = signal<ReportDefinition | null>(null);
  rows = signal<any[]>([]);
  summary = signal<Record<string, any> | null>(null);
  reportHeader = signal<Record<string, any> | null>(null);
  generatedAt = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  error = signal('');
  reportDateRange = signal<Date[] | null>(null);

  filters: Record<string, any> = {};

  shouldShowFilter(filter: ReportFilterDefinition): boolean {
    const slug = this.definition()?.slug;
    if (slug === 'risk-wise-audit-units-report' && filter.key === 'endDate') {
      return false;
    }

    if (slug === 'risk-weightage-report') {
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
    if (
      this.definition()?.slug === 'risk-weightage-report'
      && filter.key === 'selectSearchTypeFilter'
    ) {
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
        this.setReportDateRangeFromFilters();
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
    this.setReportDateRangeFromFilters();
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

  isRiskWiseAuditUnitsReport() {
    return this.definition()?.slug === 'risk-wise-audit-units-report';
  }

  riskWiseLeadingColumns() {
    return this.riskWiseFixedColumns().slice(0, 2);
  }

  riskWiseTrailingColumns() {
    return this.riskWiseFixedColumns().slice(2);
  }

  riskWiseRiskGroups() {
    const groups = new Map<string, { label: string; columns: ReportColumnDefinition[] }>();

    (this.definition()?.columns || []).forEach((column) => {
      const match = this.riskWiseColumnMatch(column);

      if (!match) {
        return;
      }

      const groupKey = match[1];

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          label: this.riskWiseGroupLabel(column),
          columns: [],
        });
      }

      groups.get(groupKey)!.columns.push({
        ...column,
        label: this.riskWiseChildLabel(column),
      });
    });

    return Array.from(groups.values());
  }

  onReportDateRangeChange() {
    const range = this.reportDateRange();
    this.filters['startDate'] = this.dateToFilterValue(range?.[0]);
    this.filters['endDate'] = this.dateToFilterValue(range?.[1]);
  }

  exportExcel() {
    const definition = this.definition();
    const rows = this.rows();

    if (!definition || !rows.length) {
      return;
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
      header: this.isRiskWiseAuditUnitsReport()
        ? this.riskWiseExportHeaderLabel(column).toUpperCase()
        : column.label.toUpperCase(),
      excelWidth: this.riskWiseExcelColumnWidth(column),
    }));

    this.exportService.exportToExcel(
      dataToExport,
      exportCols,
      definition.fileName || definition.slug,
      [],
      this.isRiskWiseAuditUnitsReport()
        ? this.riskWiseExcelHeader()
        : undefined,
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

  private riskWiseFixedColumns() {
    return (this.definition()?.columns || [])
      .filter((column) => !this.riskWiseColumnMatch(column));
  }

  private riskWiseColumnMatch(column: ReportColumnDefinition) {
    return /^risk_(\d+)_(score|branch_percent|all_percent)$/.exec(column.key);
  }

  private riskWiseGroupLabel(column: ReportColumnDefinition) {
    return String(column.label || '').split(' - ')[0] || column.label;
  }

  private riskWiseChildLabel(column: ReportColumnDefinition) {
    const label =
      String(column.label || '').split(' - ').slice(1).join(' - ');

    return label || column.label;
  }

  private riskWiseExportHeaderLabel(column: ReportColumnDefinition) {
    if (!this.riskWiseColumnMatch(column)) {
      return column.label;
    }

    return this.riskWiseChildLabel(column);
  }

  private riskWiseExcelColumnWidth(column: ReportColumnDefinition) {
    if (!this.isRiskWiseAuditUnitsReport()) {
      return undefined;
    }

    if (column.key === 'audit_unit_code') {
      return 8;
    }

    if (column.key === 'audit_unit_name') {
      return 22;
    }

    if (column.key === 'total_score' || column.key === 'total_score_all_percent') {
      return 12;
    }

    if (column.key === 'branch_rating') {
      return 14;
    }

    return this.riskWiseColumnMatch(column) ? 10 : undefined;
  }

  private riskWiseExcelHeader() {
    const columns = this.definition()?.columns || [];
    const headerRows = [
      new Array(columns.length).fill(''),
      new Array(columns.length).fill(''),
    ];
    const merges: any[] = [];
    let columnIndex = 0;

    this.riskWiseLeadingColumns().forEach((column) => {
      headerRows[0][columnIndex] = column.label.toUpperCase();
      merges.push({
        s: { r: 0, c: columnIndex },
        e: { r: 1, c: columnIndex },
      });
      columnIndex++;
    });

    this.riskWiseRiskGroups().forEach((group) => {
      const startColumnIndex = columnIndex;
      headerRows[0][startColumnIndex] = group.label.toUpperCase();

      group.columns.forEach((column) => {
        headerRows[1][columnIndex] = column.label.toUpperCase();
        columnIndex++;
      });

      if (columnIndex - startColumnIndex > 1) {
        merges.push({
          s: { r: 0, c: startColumnIndex },
          e: { r: 0, c: columnIndex - 1 },
        });
      }
    });

    this.riskWiseTrailingColumns().forEach((column) => {
      headerRows[0][columnIndex] = column.label.toUpperCase();
      merges.push({
        s: { r: 0, c: columnIndex },
        e: { r: 1, c: columnIndex },
      });
      columnIndex++;
    });

    return {
      rows: headerRows,
      merges,
    };
  }

  private setReportDateRangeFromFilters() {
    if (!this.isRiskWiseAuditUnitsReport()) {
      this.reportDateRange.set(null);
      return;
    }

    const startDate = this.filterDateToDate(this.filters['startDate']);
    const endDate = this.filterDateToDate(this.filters['endDate']);
    const range = [startDate, endDate].filter(Boolean) as Date[];

    this.reportDateRange.set(range.length ? range : null);
  }

  private filterDateToDate(value: any) {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(String(value));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private dateToFilterValue(value: Date | undefined | null) {
    if (!value) {
      return '';
    }

    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }
}
