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
  exeReportData = signal<any>(null);
  generatedAt = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  error = signal('');

  filters: Record<string, any> = {};

  isAdvancedLayout(): boolean {
    const slug = this.definition()?.slug;
    return slug === 'risk-weightage-report' || slug === 'broader-areawise-scoring-report';
  }

  isExecutiveSummary(): boolean {
    const slug = this.definition()?.slug;
    return slug === 'executive-summary-audit-report' || slug === 'executive-summary-compliance-report';
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
    this.exeReportData.set(null);
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
        this.exeReportData.set(res?.exeData || null);
        this.generatedAt.set(res?.generatedAt || new Date().toISOString());
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.summary.set(null);
        this.reportHeader.set(null);
        this.exeReportData.set(null);
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
    this.exeReportData.set(null);
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

    if (
      definition.slug === 'broader-areawise-scoring-report' ||
      definition.slug === 'executive-summary-audit-report' ||
      definition.slug === 'executive-summary-compliance-report'
    ) {
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

  isLegacyData(): boolean {
    const data = this.exeReportData();
    if (!data) return false;
    const hasLegacyBp = data.branchPositions?.some((r: any) => String(r.type_id).trim().length <= 2);
    const hasLegacyFa = data.freshAccounts?.some((r: any) => String(r.type_id).trim().length <= 2);
    return !!(hasLegacyBp || hasLegacyFa);
  }

  getSchemesByType(type: string): any[] {
    const data = this.exeReportData();
    if (!data || !data.schemes) return [];

    if (type === 'NPA') {
      const advances = data.schemes.filter((s: any) => s.scheme_type === 'ADVANCES');
      return advances.map((s: any) => ({
        ...s,
        scheme_type: 'NPA',
        scheme_code: s.scheme_code + '_NPA',
        category_id: s.category_id + 6,
      }));
    }

    return data.schemes.filter((s: any) => s.scheme_type === type);
  }

  getMarchValue(scheme: any): number {
    const data = this.exeReportData();
    if (!data || !data.marchPositions) return 0;
    const row = data.marchPositions.find((r: any) => Number(r.gl_type_id) === Number(scheme.category_id));
    return Number(row?.march_position || 0);
  }

  getLegacyTypeIds(categoryId: number, isFresh: boolean): string[] {
    if (!isFresh) {
      return [String(categoryId)];
    } else {
      if (categoryId === 1) return ['1'];
      if (categoryId === 2) return ['2', '3'];
      if (categoryId >= 3 && categoryId <= 5) return [String(categoryId + 1)];
      if (categoryId === 6) return ['7', '8'];
      if (categoryId === 7) return ['9', '10'];
      if (categoryId === 8) return [];
      if (categoryId >= 9 && categoryId <= 14) return [String(categoryId + 2)];
      return [];
    }
  }

  isFirstSchemeOfCategory(scheme: any): boolean {
    const schemes = this.getSchemesByType(scheme.scheme_type);
    const first = schemes.find((s: any) => Number(s.category_id) === Number(scheme.category_id));
    return first && String(first.scheme_code).trim() === String(scheme.scheme_code).trim();
  }

  getCurrentValue(scheme: any, isFresh: boolean): number {
    const data = this.exeReportData();
    if (!data) return 0;

    // 1. Try matching scheme code directly
    if (isFresh) {
      if (data.freshAccounts) {
        const row = data.freshAccounts.find((r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim());
        if (row) return Number(row.accounts || 0);
      }
    } else {
      if (data.branchPositions) {
        const row = data.branchPositions.find((r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim());
        if (row) return Number(row.amount || 0);
      }
    }

    // 2. Fallback to legacy categories if this is the first scheme in the category
    if (this.isLegacyData() && this.isFirstSchemeOfCategory(scheme)) {
      const typeIds = this.getLegacyTypeIds(Number(scheme.category_id), isFresh);
      if (isFresh) {
        if (!data.freshAccounts) return 0;
        let sum = 0;
        for (const typeId of typeIds) {
          const row = data.freshAccounts.find((r: any) => String(r.type_id).trim() === String(typeId).trim());
          sum += Number(row?.accounts || 0);
        }
        return sum;
      } else {
        if (!data.branchPositions) return 0;
        for (const typeId of typeIds) {
          const row = data.branchPositions.find((r: any) => String(r.type_id).trim() === String(typeId).trim());
          if (row) return Number(row.amount || 0);
        }
      }
    }

    return 0;
  }

  getYtdValue(scheme: any): number {
    return this.getCurrentValue(scheme, false) - this.getMarchValue(scheme);
  }

  getComplianceComment(scheme: any, isFresh: boolean): string {
    const data = this.exeReportData();
    if (!data) return '';

    // 1. Try matching scheme code directly
    if (isFresh) {
      if (data.freshAccounts) {
        const row = data.freshAccounts.find((r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim());
        if (row) return row.audit_commpliance || '';
      }
    } else {
      if (data.branchPositions) {
        const row = data.branchPositions.find((r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim());
        if (row) return row.audit_commpliance || '';
      }
    }

    // 2. Fallback to legacy categories if this is the first scheme in the category
    if (this.isLegacyData() && this.isFirstSchemeOfCategory(scheme)) {
      const typeIds = this.getLegacyTypeIds(Number(scheme.category_id), isFresh);
      if (isFresh) {
        if (!data.freshAccounts) return '';
        for (const typeId of typeIds) {
          const row = data.freshAccounts.find((r: any) => String(r.type_id).trim() === String(typeId).trim());
          if (row?.audit_commpliance) return row.audit_commpliance;
        }
      } else {
        if (!data.branchPositions) return '';
        for (const typeId of typeIds) {
          const row = data.branchPositions.find((r: any) => String(r.type_id).trim() === String(typeId).trim());
          if (row?.audit_commpliance) return row.audit_commpliance;
        }
      }
    }

    return '';
  }

  getCategoryMarchTotal(type: string): number {
    const schemes = this.getSchemesByType(type);
    return schemes.reduce((sum, scheme) => sum + this.getMarchValue(scheme), 0);
  }

  getCategoryCurrentTotal(type: string, isFresh: boolean): number {
    const schemes = this.getSchemesByType(type);
    return schemes.reduce((sum, scheme) => sum + this.getCurrentValue(scheme, isFresh), 0);
  }

  getCategoryYtdTotal(type: string): number {
    const schemes = this.getSchemesByType(type);
    return schemes.reduce((sum, scheme) => sum + this.getYtdValue(scheme), 0);
  }

  getCdRatio(): number {
    const depositsCurrent = this.getCategoryCurrentTotal('DEPOSITS', false);
    const advancesCurrent = this.getCategoryCurrentTotal('ADVANCES', false);
    if (depositsCurrent === 0) return 0;
    return (advancesCurrent / depositsCurrent) * 100;
  }

  getPerEmployeeBusiness(): number {
    const depositsCurrent = this.getCategoryCurrentTotal('DEPOSITS', false);
    const advancesCurrent = this.getCategoryCurrentTotal('ADVANCES', false);
    const staffCount = Number(this.exeReportData()?.assessment?.staff_count || 0);
    if (staffCount === 0) return 0;
    return (advancesCurrent + depositsCurrent) / staffCount;
  }
}
