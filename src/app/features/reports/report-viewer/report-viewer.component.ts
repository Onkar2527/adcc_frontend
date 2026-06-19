import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ExportService } from '../../../core/services/export/export.service';
import { DateTimeService } from '../../../core/services/datetime/datetime.service';
import { DateRangeFieldComponent } from '../../../shared/components/form/date-range-field/date-range-field.component';
import {
  ReportColumnDefinition,
  ReportDefinition,
  ReportFilterDefinition,
  ReportsService,
} from '../services/reports.service';
import { InternalAuditNavService } from '../../auditor/services/internal-audit-nav.service';

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
  private auditNavService = inject(InternalAuditNavService);
  private dateTimeService = inject(DateTimeService);
  private readonly auditTypeFilter: ReportFilterDefinition = {
    key: 'audit_type_id',
    label: 'Audit Type',
    type: 'select',
    options: [
      { value: 'all', label: 'All Audit Types' },
      { value: '1', label: 'Internal Audit' },
      { value: '2', label: 'Special Audit' },
    ],
  };

  applyBranchFilterRestrictions(definition: ReportDefinition) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userTypeId = String(user.user_type_id || '');
    const auditUnitAuthority = String(user.audit_unit_authority || '');

    const activeOverview = this.auditNavService.overview();
    const activeUnitId = activeOverview ? Number(activeOverview.audit_unit_id || 0) : 0;

    const branchFilters = definition.filters.filter(
      (f) => f.key === 'audit_unit_id' || f.key === 'reportAuditUnit',
    );

    for (const filter of branchFilters) {
      const originalOptions = filter.options || [];
      let filteredOptions = [...originalOptions];

      if (activeUnitId) {
        filteredOptions = originalOptions.filter(
          (opt) => String(opt.value) === String(activeUnitId),
        );
      } else if (
        userTypeId === '2' ||
        userTypeId === '4' ||
        userTypeId === '3' ||
        userTypeId === '6'
      ) {
        const assignedIds = auditUnitAuthority
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        if (assignedIds.length > 0) {
          filteredOptions = originalOptions.filter((opt) =>
            assignedIds.includes(String(opt.value)),
          );
        } else if (userTypeId === '2' || userTypeId === '4' || userTypeId === '6') {
          filteredOptions = [];
        }
      }

      filter.options = filteredOptions;

      const currentValue = String(this.filters[filter.key] || '');
      let selectedValue = currentValue;

      if (activeUnitId) {
        const hasActiveUnit = filteredOptions.some(
          (opt) => String(opt.value) === String(activeUnitId),
        );
        if (hasActiveUnit) {
          selectedValue = String(activeUnitId);
        }
      }

      const isValid = filteredOptions.some((opt) => String(opt.value) === selectedValue);

      if (isValid) {
        this.filters[filter.key] = selectedValue;
      } else if (filteredOptions.length > 0) {
        this.filters[filter.key] = filteredOptions[0].value;
      }
    }
  }

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
  reportMeta = signal<Record<string, any> | null>(null);
  exeReportData = signal<any>(null);
  generatedAt = signal<string | null>(null);
  loading = signal(false);
  searched = signal(false);
  error = signal('');
  reportDateRange = signal<Date[] | null>(null);

  filters: Record<string, any> = {};

  isAdvancedLayout(): boolean {
    const slug = this.definition()?.slug;
    return (
      slug === 'risk-weightage-report' ||
      slug === 'performance-risk-weightage-report' ||
      slug === 'performance-risk-weightage-report-category-wise' ||
      slug === 'broader-areawise-scoring-report' ||
      slug === 'questionwsie-broader-areawise-report' ||
      slug === 'pending-compliance-detail-report' ||
      slug === 'rbia-performance-risk-weightage-report-all-units'
    );
  }

  showsNestedComplianceColumn(): boolean {
    const slug = this.definition()?.slug;
    return [
      'compliance-summary-report',
      'pending-compliance-detail-report',
      'carry-forward-report',
      'partially-pass-report',
    ].includes(slug || '');
  }

  showsNestedReviewerCommentColumn(): boolean {
    return [
      'pending-compliance-detail-report',
      'carry-forward-report',
      'partially-pass-report',
    ].includes(this.definition()?.slug || '');
  }

  isExecutiveSummary(): boolean {
    const slug = this.definition()?.slug;
    return (
      slug === 'executive-summary-audit-report' || slug === 'executive-summary-compliance-report'
    );
  }

  isAuditCommitteeBoardReport1(): boolean {
    return this.definition()?.slug === 'audit-committee-board-report-1';
  }

  shouldShowFilter(filter: ReportFilterDefinition): boolean {
    const slug = this.definition()?.slug;

    if (slug === 'risk-wise-audit-units-report' && filter.key === 'endDate') {
      return false;
    }

    if (slug === 'rbia-performance-risk-weightage-report-all-units') {
      return true;
    }

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

    if (filter.key === 'reportAuditAssesment') {
      const unitValue = String(this.filters['reportAuditUnit'] || '');
      const yearValue = String(this.filters['financial_year'] || '');
      const auditTypeValue = String(this.filters['audit_type_id'] || 'all');

      return options.filter((option: any) => {
        const matchesUnit = !option.audit_unit_id || String(option.audit_unit_id) === unitValue;
        const matchesYear = !option.year_id || !yearValue || yearValue === 'all' || String(option.year_id) === yearValue;
        const matchesAuditType =
          auditTypeValue === 'all'
            || !option.audit_type_id
            || String(option.audit_type_id) === auditTypeValue;
        return matchesUnit && matchesYear && matchesAuditType;
      });
    }

    if (!filter.dependsOn || !filter.optionParentKey) {
      return options;
    }

    const parentValue = String(this.filters[filter.dependsOn] || '');

    return options.filter((option: any) => {
      const optionParentValue = option[filter.optionParentKey as string];

      return !optionParentValue || (parentValue && String(optionParentValue) === parentValue);
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

    if (filter.key === 'financial_year') {
      const assessmentFilter = this.definition()?.filters.find(f => f.key === 'reportAuditAssesment');
      if (assessmentFilter) {
        const selectedValue = String(this.filters['reportAuditAssesment'] || '');
        const isSelectedValueValid = this.filterOptions(assessmentFilter).some(
          (option) => String(option.value) === selectedValue,
        );
        if (!isSelectedValueValid) {
          this.filters['reportAuditAssesment'] = '';
        }
      }
    }

    if (filter.key === 'audit_type_id') {
      const assessmentFilter = this.definition()?.filters.find((f) => f.key === 'reportAuditAssesment');
      if (assessmentFilter) {
        const selectedValue = String(this.filters['reportAuditAssesment'] || '');
        const isSelectedValueValid = this.filterOptions(assessmentFilter).some(
          (option) => String(option.value) === selectedValue,
        );
        if (!isSelectedValueValid) {
          this.filters['reportAuditAssesment'] = '';
        }
      }
    }

    const childFilters =
      this.definition()?.filters.filter((item) => item.dependsOn === filter.key) || [];

    childFilters.forEach((childFilter) => {
      const selectedValue = String(this.filters[childFilter.key] || '');
      const isSelectedValueValid = this.filterOptions(childFilter).some(
        (option) => String(option.value) === selectedValue,
      );

      if (!isSelectedValueValid) {
        this.filters[childFilter.key] = childFilter.type === 'checkbox' ? [] : '';
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
    this.reportMeta.set(null);
    this.exeReportData.set(null);
    this.searched.set(false);

    this.reportsService.getReportDefinition(slug).subscribe({
      next: (definition) => {
        definition = this.ensureAuditTypeFilter(definition);
        this.definition.set(definition);
        this.filters = {
          ...(definition.defaultFilters || {}),
        };
        this.applyBranchFilterRestrictions(definition);
        this.setReportDateRangeFromFilters();
        definition.filters
          .filter((filter) => filter.type === 'checkbox')
          .forEach((filter) => {
            this.filters[filter.key] = Array.isArray(this.filters[filter.key])
              ? this.filters[filter.key]
              : [];
          });

        if (['carry-forward-report', 'partially-pass-report'].includes(slug)) {
          const sourceAssessmentId = Number(
            this.route.snapshot.queryParamMap.get('source_assessment_id') || 0,
          );
          const auditUnitId = this.route.snapshot.queryParamMap.get('audit_unit_id');
          const financialYear = this.route.snapshot.queryParamMap.get('financial_year');

          if (sourceAssessmentId > 0) {
            this.filters['source_assessment_id'] = sourceAssessmentId;
          }
          if (auditUnitId) {
            this.filters['audit_unit_id'] = auditUnitId;
          }
          if (financialYear) {
            this.filters['financial_year'] = financialYear;
          }
        }
        // Programmatically preload logo image to ensure browser caching
        const logoUrl = definition.brand?.logoUrl || '/assets/images/logos/auditpro-logo.png';
        const img = new Image();
        img.src = logoUrl;

        this.loading.set(false);

        if (
          ['carry-forward-report', 'partially-pass-report'].includes(slug)
          && Number(this.filters['source_assessment_id'] || 0) > 0
        ) {
          this.findReport();
        }
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

  private ensureAuditTypeFilter(definition: ReportDefinition): ReportDefinition {
    const alreadyExists = definition.filters.some((filter) => filter.key === 'audit_type_id');

    if (alreadyExists) {
      return definition;
    }

    return {
      ...definition,
      defaultFilters: {
        audit_type_id: 'all',
        ...(definition.defaultFilters || {}),
      },
      filters: [
        this.auditTypeFilter,
        ...definition.filters,
      ],
    };
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
        const isHeaderMultiple = !!res?.header?.isMultipleAuditors;
        const processedRows = (res?.rows || []).map((row: any) => {
          const isMultiple = isHeaderMultiple || !!row.is_multiple_auditors;
          if (isMultiple && row.question && row.auditor_emp_code && row.auditor_emp_code !== '-') {
            return {
              ...row,
              question: `[${row.auditor_emp_code}] ${row.question}`
            };
          }
          return row;
        });
        this.rows.set(processedRows);
        this.summary.set(res?.summary || null);
        this.reportHeader.set(res?.header || null);
        this.reportMeta.set(res?.meta || null);
        this.exeReportData.set(res?.exeData || null);
        this.generatedAt.set(res?.generatedAt || new Date().toISOString());
        this.loading.set(false);
      },
      error: (err) => {
        this.rows.set([]);
        this.summary.set(null);
        this.reportHeader.set(null);
        this.reportMeta.set(null);
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
    if (definition) {
      this.applyBranchFilterRestrictions(definition);
    }
    this.setReportDateRangeFromFilters();
    definition?.filters
      .filter((filter) => filter.type === 'checkbox')
      .forEach((filter) => {
        this.filters[filter.key] = Array.isArray(this.filters[filter.key])
          ? this.filters[filter.key]
          : [];
      });
    this.rows.set([]);
    this.summary.set(null);
    this.reportHeader.set(null);
    this.reportMeta.set(null);
    this.exeReportData.set(null);
    this.generatedAt.set(null);
    this.searched.set(false);
    this.error.set('');
  }

  print() {
    const isLandscape = this.definition()?.page === 'A4L';
    if (isLandscape) {
      document.body.classList.add('print-landscape');
    }
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
      if (isLandscape) {
        document.body.classList.remove('print-landscape');
      }
    });
  }

  canExportExcel() {
    return ![
      'audit-complete-report',
      'audit-observations-report',
      'compliance-report',
      'compliance-summary-report',
    ].includes(this.definition()?.slug || '');
  }

  isInternalAssessmentReport(): boolean {
    return this.definition()?.slug === 'internal-assesment-report';
  }

  getInternalAssessmentMonths(): { label: string; monthVal: number; yearVal: number }[] {
    const header = this.reportHeader();
    if (!header || !header['financialYear']) return [];

    const yearStr = String(header['financialYear']);
    const match = yearStr.match(/\d{4}/);
    if (!match) return [];
    const startYear = Number(match[0]);

    const months: { label: string; monthVal: number; yearVal: number }[] = [];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    let m = 4; // April
    let y = startYear;

    while (true) {
      months.push({
        label: `${monthNames[m - 1]} - ${String(y).slice(-2)}`,
        monthVal: m,
        yearVal: y,
      });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      if (m === 4) break;
    }

    return months;
  }

  getInternalAssessmentRowCells(unit: any): { row1: any[]; row2: any[]; row3: any[] } {
    const months = this.getInternalAssessmentMonths();
    if (!months.length) return { row1: [], row2: [], row3: [] };

    const row1: any[] = [];
    const row2: any[] = [];
    const row3: any[] = [];

    // Clone/extract asses_data as an array of assessments
    const tempAssesData = Object.values(unit.asses_data || {}) as any[];

    let i = 0; // index in months array
    while (i < months.length) {
      const cMonthObj = months[i];
      let matched = false;

      for (let aIdx = 0; aIdx < tempAssesData.length; aIdx++) {
        const asses = tempAssesData[aIdx];
        const startDateStr = asses.assesment_period_from; // e.g. "2026-04-01"
        if (startDateStr) {
          const startDate = new Date(startDateStr);
          const mVal = startDate.getMonth() + 1; // 1-12
          if (mVal === cMonthObj.monthVal) {
            const frequency = Number(asses.frequency || 1);
            const colspan = frequency > 1 ? frequency : 1;

            row1.push({
              label: this.formatDmyDate(asses.audit_start_date),
              colspan,
              empty: false,
            });
            row2.push({
              label: this.formatDmyDate(asses.audit_review_date),
              colspan,
              empty: false,
            });
            row3.push({
              label: this.formatDmyDate(asses.compliance_start_date),
              colspan,
              empty: false,
            });

            matched = true;
            i += colspan;
            // remove from tempAssesData
            tempAssesData.splice(aIdx, 1);
            break;
          }
        }
      }

      if (!matched) {
        row1.push({ label: '', colspan: 1, empty: true });
        row2.push({ label: '', colspan: 1, empty: true });
        row3.push({ label: '', colspan: 1, empty: true });
        i++;
      }
    }

    return { row1, row2, row3 };
  }

  formatDmyDate(value: any) {
    if (!value) return '';
    const dateObj = new Date(value);
    if (isNaN(dateObj.getTime())) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  }

  isRiskWiseAuditUnitsReport() {
    return this.definition()?.slug === 'risk-wise-audit-units-report';
  }

  isRiskWiseReport() {
    const slug = this.definition()?.slug;
    return (
      slug === 'risk-wise-audit-units-report' ||
      slug === 'rbia-performance-risk-weightage-report-all-units'
    );
  }

  isPerformanceRiskWeightageReport() {
    const slug = this.definition()?.slug;
    return (
      slug === 'performance-risk-weightage-report' ||
      slug === 'performance-risk-weightage-report-category-wise'
    );
  }

  riskWiseLeadingColumns() {
    const sliceIndex =
      this.definition()?.slug === 'rbia-performance-risk-weightage-report-all-units' ? 3 : 2;
    return this.riskWiseFixedColumns().slice(0, sliceIndex);
  }

  riskWiseTrailingColumns() {
    const sliceIndex =
      this.definition()?.slug === 'rbia-performance-risk-weightage-report-all-units' ? 3 : 2;
    return this.riskWiseFixedColumns().slice(sliceIndex);
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

    if (
      definition.slug === 'internal-assesment-report' ||
      definition.slug === 'broader-areawise-scoring-report' ||
      definition.slug === 'questionwsie-broader-areawise-report' ||
      definition.slug === 'executive-summary-audit-report' ||
      definition.slug === 'executive-summary-compliance-report'
    ) {
      const tableElement = document.querySelector('.official-report-table');
      if (tableElement) {
        this.exportService.exportTableToExcel(tableElement, definition.fileName || definition.slug);
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
      header: this.isRiskWiseReport()
        ? this.riskWiseExportHeaderLabel(column).toUpperCase()
        : column.label.toUpperCase(),
      excelWidth: this.riskWiseExcelColumnWidth(column),
    }));

    this.exportService.exportToExcel(
      dataToExport,
      exportCols,
      definition.fileName || definition.slug,
      [],
      this.isRiskWiseReport() ? this.riskWiseExcelHeader() : undefined,
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
        : String(value || '')
            .split(',')
            .filter(Boolean);

      if (!values.length) {
        return 'All';
      }

      return (
        (filter.options || [])
          .filter((option) => values.includes(String(option.value)))
          .map((option) => option.label)
          .join(', ') || 'All'
      );
    }

    return filter.options?.find((option) => String(option.value) === String(value))?.label || '-';
  }

  checkboxSelected(filterKey: string, optionValue: any) {
    return (
      Array.isArray(this.filters[filterKey]) &&
      this.filters[filterKey].map(String).includes(String(optionValue))
    );
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
    return this.dateTimeService.formatDateTimeDisplay(
      this.generatedAt() || this.dateTimeService.nowISOString(),
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
    const hasLegacyBp = data.branchPositions?.some(
      (r: any) => String(r.type_id).trim().length <= 2,
    );
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
    const row = data.marchPositions.find(
      (r: any) => Number(r.gl_type_id) === Number(scheme.category_id),
    );
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
        const row = data.freshAccounts.find(
          (r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim(),
        );
        if (row) return Number(row.accounts || 0);
      }
    } else {
      if (data.branchPositions) {
        const row = data.branchPositions.find(
          (r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim(),
        );
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
          const row = data.freshAccounts.find(
            (r: any) => String(r.type_id).trim() === String(typeId).trim(),
          );
          sum += Number(row?.accounts || 0);
        }
        return sum;
      } else {
        if (!data.branchPositions) return 0;
        for (const typeId of typeIds) {
          const row = data.branchPositions.find(
            (r: any) => String(r.type_id).trim() === String(typeId).trim(),
          );
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
        const row = data.freshAccounts.find(
          (r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim(),
        );
        if (row) return row.audit_commpliance || '';
      }
    } else {
      if (data.branchPositions) {
        const row = data.branchPositions.find(
          (r: any) => String(r.type_id).trim() === String(scheme.scheme_code).trim(),
        );
        if (row) return row.audit_commpliance || '';
      }
    }

    // 2. Fallback to legacy categories if this is the first scheme in the category
    if (this.isLegacyData() && this.isFirstSchemeOfCategory(scheme)) {
      const typeIds = this.getLegacyTypeIds(Number(scheme.category_id), isFresh);
      if (isFresh) {
        if (!data.freshAccounts) return '';
        for (const typeId of typeIds) {
          const row = data.freshAccounts.find(
            (r: any) => String(r.type_id).trim() === String(typeId).trim(),
          );
          if (row?.audit_commpliance) return row.audit_commpliance;
        }
      } else {
        if (!data.branchPositions) return '';
        for (const typeId of typeIds) {
          const row = data.branchPositions.find(
            (r: any) => String(r.type_id).trim() === String(typeId).trim(),
          );
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

  private riskWiseFixedColumns() {
    return (this.definition()?.columns || []).filter((column) => !this.riskWiseColumnMatch(column));
  }

  private riskWiseColumnMatch(column: ReportColumnDefinition) {
    return /^risk_(\d+)_(score|branch_percent|all_percent|highest_score|obtained_score|percent|rating)$/.exec(
      column.key,
    );
  }

  private riskWiseGroupLabel(column: ReportColumnDefinition) {
    return String(column.label || '').split(' - ')[0] || column.label;
  }

  private riskWiseChildLabel(column: ReportColumnDefinition) {
    const label = String(column.label || '')
      .split(' - ')
      .slice(1)
      .join(' - ');

    return label || column.label;
  }

  private riskWiseExportHeaderLabel(column: ReportColumnDefinition) {
    if (!this.riskWiseColumnMatch(column)) {
      return column.label;
    }

    return this.riskWiseChildLabel(column);
  }

  private riskWiseExcelColumnWidth(column: ReportColumnDefinition) {
    if (!this.isRiskWiseReport()) {
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
    const headerRows = [new Array(columns.length).fill(''), new Array(columns.length).fill('')];
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
