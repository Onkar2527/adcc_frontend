import {
    CommonModule,
    DatePipe,
} from '@angular/common';
import {
    Component,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { AuditDashboardService } from '../../services/auditor-main.service';

@Component({
    selector: 'app-audit-unit-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DatePipe,
        ButtonModule,
        SelectModule,
        SkeletonModule,
        TagModule,
        ChartModule,
    ],
    templateUrl: './audit-unit-dashboard.component.html',
    styleUrls: [
        '../internal-audit.component.css',
        '../../../dashboard/dashboard.scss'
    ],
})
export class AuditUnitDashboardComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    loading =
        signal(false);

    auditUnit =
        signal<any>(null);

    years =
        signal<any[]>([]);

    metrics =
        signal<any>(null);

    selectedYearId =
        signal<number | null>(null);

    error =
        signal('');

    readOnly = false;

    backRoute = '/auditor/audit-dashboard';

    // Dashboard indicators
    unitSummary = signal<any>(null);
    detailsLoading = signal(false);
    chartsLoading = signal(false);
    selectedAssessmentPeriodId = signal<string>('all');
    assessmentPeriods = signal<any[]>([]);
    unitHeatmap = signal<number[][]>([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);

    // Chart datasets
    unitPieData = signal<any>(null);
    unitBarData = signal<any>(null);
    unitStackedData = signal<any>(null);

    // Chart options
    unitPieOptions = signal<any>(null);
    unitBarOptions = signal<any>(null);
    unitStackedOptions = signal<any>(null);

    visibleYears =
        computed(() =>
            this.years()
                .filter(
                    (year: any) =>
                        year.is_latest
                        ||
                        (year.assessments || []).length > 0,
                ),
        );

    yearFilterOptions =
        computed(() =>
            this.visibleYears()
                .map((year: any) => ({
                    label: this.financialYearLabel(year),
                    value: Number(year.id),
                })),
        );

    filteredAssessmentPeriods =
        computed(() => {
            const yearId =
                this.selectedYearId();

            const periods =
                this.assessmentPeriods();

            if (!yearId) {
                return periods;
            }

            const selectedYear =
                this.years()
                    .find(
                        (year: any) =>
                            Number(year.id) === Number(yearId),
                    );

            if (!selectedYear) {
                return periods;
            }

            const scheduledAssessmentIds =
                (selectedYear.assessments || [])
                    .map((ass: any) => Number(ass.id));

            const allOption = periods.find(p => p.value === 'all');
            const filteredRest = periods.filter(
                (p: any) =>
                    p.value !== 'all'
                    &&
                    scheduledAssessmentIds.includes(Number(p.value)),
            );

            return allOption
                ? [allOption, ...filteredRest]
                : filteredRest;
        });

    computedWeightedRisk =
        computed(() => {
            const yearId = this.selectedYearId();
            const summary = this.unitSummary();
            if (!summary) return '0.00';

            const assessmentList = summary.assessmentList || [];
            const periods = summary.assessmentPeriods || [];

            const targetYearIds = yearId ? [Number(yearId)] : this.years().map((y: any) => Number(y.id));

            const targetAssessmentIds = new Set<number>();
            this.years().forEach((y: any) => {
                if (targetYearIds.includes(Number(y.id))) {
                    (y.assessments || []).forEach((ass: any) => {
                        targetAssessmentIds.add(Number(ass.id));
                    });
                }
            });

            let sum = 0;
            for (let i = 0; i < assessmentList.length; i++) {
                const assId = Number(periods[i]?.value);
                if (targetAssessmentIds.has(assId)) {
                    sum += Number(assessmentList[i].weighted_score || 0);
                }
            }

            return sum.toFixed(2);
        });

    computedAssessmentNotStartedCount =
        computed(() => {
            return this.assessmentRows()
                .filter(row => row.assessment === null)
                .length;
        });

    computedAssessmentExpiredCount =
        computed(() => {
            const yearId = this.selectedYearId();
            const yearsList = this.years();
            const userTypeId = this.userTypeId();
            const currentDate = new Date();

            const targetYears = yearId 
                ? yearsList.filter((y: any) => Number(y.id) === Number(yearId))
                : yearsList;

            let auditExpCount = 0;
            let complianceExpCount = 0;

            targetYears.forEach((year: any) => {
                (year.assessments || []).forEach((ass: any) => {
                    const statusId = Number(ass.audit_status_id || 0);
                    if ([4, 6].includes(statusId)) {
                        if (ass.compliance_due_date && new Date(ass.compliance_due_date) < currentDate) {
                            complianceExpCount++;
                        }
                    } else if ([1, 3].includes(statusId)) {
                        if (ass.audit_due_date && new Date(ass.audit_due_date) < currentDate) {
                            auditExpCount++;
                        }
                    }
                });
            });

            if (userTypeId === 2) {
                return auditExpCount;
            } else if (userTypeId === 3) {
                return complianceExpCount;
            } else {
                return auditExpCount + complianceExpCount;
            }
        });

    computedAssessmentPendingCount =
        computed(() => {
            const yearId = this.selectedYearId();
            const yearsList = this.years();
            const userTypeId = this.userTypeId();

            const targetYears = yearId 
                ? yearsList.filter((y: any) => Number(y.id) === Number(yearId))
                : yearsList;

            let count = 0;
            targetYears.forEach((year: any) => {
                (year.assessments || []).forEach((ass: any) => {
                    const statusId = Number(ass.audit_status_id || 0);
                    if (userTypeId === 2) {
                        if (statusId === 1 || statusId === 3) {
                            count++;
                        }
                    } else if (userTypeId === 3) {
                        if (statusId === 4 || statusId === 6) {
                            count++;
                        }
                    } else if (userTypeId === 4) {
                        if (statusId === 2 || statusId === 5) {
                            count++;
                        }
                    } else {
                        if (statusId !== 7) {
                            count++;
                        }
                    }
                });
            });
            return count;
        });

    filteredYears =
        computed(() => {
            const yearId =
                this.selectedYearId();

            if (!yearId) {
                return this.visibleYears();
            }

            return this.visibleYears()
                .filter(
                    (year: any) =>
                        Number(year.id) === Number(yearId),
                );
        });

    assessmentRows =
        computed(() => {
            const rows: any[] = [];

            this.filteredYears()
                .forEach((year: any) => {
                    const assessments =
                        year.assessments || [];

                    if (!assessments.length) {
                        rows.push({
                            year,
                            assessment: null,
                        });
                        return;
                    }

                    assessments.forEach(
                        (assessment: any) =>
                            rows.push({
                                year,
                                assessment,
                            }),
                    );

                    if (
                        year.can_start
                        && !this.readOnly
                    ) {
                        rows.push({
                            year,
                            assessment: null,
                        });
                    }
                });

            return rows;
        });

    ngOnInit() {
        this.readOnly =
            this.route.snapshot.data['readOnly'] === true;

        this.backRoute =
            this.route.snapshot.data['backRoute']
            || '/auditor/audit-dashboard';

        const auditUnitId =
            Number(
                this.route.snapshot.paramMap.get(
                    'auditUnitId',
                ),
            );

        if (!auditUnitId) {
            this.error.set(
                'Audit unit not found.',
            );
            return;
        }

        this.loadAuditUnit(
            auditUnitId,
        );
    }

    loadAuditUnit(
        auditUnitId: number,
    ) {

        this.loading.set(true);
        this.error.set('');

        this.service
            .getAuditUnitDashboard(
                auditUnitId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.auditUnit.set(
                        res?.audit_unit || null,
                    );
                    this.years.set(
                        res?.years || [],
                    );
                    this.metrics.set(
                        res?.metrics || null,
                    );

                    const latestYear =
                        (res?.years || [])
                            .find((year: any) => year.is_latest);

                    this.selectedYearId.set(
                        latestYear?.id
                            ? Number(latestYear.id)
                            : null,
                    );

                    this.loading.set(false);
                    this.loadUnitDashboardData(auditUnitId);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load audit unit details.',
                    );
                    this.loading.set(false);
                },
            });
    }

    employeeId(): number {
        const userData =
            localStorage.getItem(
                'user',
            ) || '{}';

        const user =
            JSON.parse(userData);

        return Number(
            user.id
            || user.employee_id
            || user.emp_id
            || 0,
        );
    }

    userTypeId(): number {
        const userData = localStorage.getItem('user') || '{}';
        const user = JSON.parse(userData);
        return Number(user.user_type_id || 0);
    }

    loadUnitDashboardData(auditUnitId: number) {
        this.detailsLoading.set(true);
        this.service.getUnitDashboardDetails(auditUnitId, this.employeeId(), this.userTypeId()).subscribe({
            next: (res) => {
                this.unitSummary.set(res);
                this.assessmentPeriods.set([
                    { label: 'All Periods', value: 'all' },
                    ...(res.assessmentPeriods || [])
                ]);
                this.prepareUnitStackedChart(res);
                this.loadUnitCharts(auditUnitId, this.selectedAssessmentPeriodId());
                this.detailsLoading.set(false);
            },
            error: (err) => {
                console.error("Unit details load failed:", err);
                this.detailsLoading.set(false);
            }
        });
    }

    onYearChange(yearId: number | null) {
        this.selectedYearId.set(yearId);
        
        // Reset period filter when year changes to ensure no mismatch
        this.selectedAssessmentPeriodId.set('all');
        const unit = this.auditUnit();
        if (unit?.id) {
            this.loadUnitCharts(Number(unit.id), 'all');
        }
    }

    onPeriodChange(periodId: string) {
        this.selectedAssessmentPeriodId.set(periodId);
        const unit = this.auditUnit();
        if (unit?.id) {
            this.loadUnitCharts(Number(unit.id), periodId);
        }
    }

    loadUnitCharts(unitId: number, periodId: string) {
        this.chartsLoading.set(true);
        this.service.getUnitChartsData(unitId, periodId).subscribe({
            next: (res) => {
                this.prepareUnitPieChart(res.riskCategoryScore);
                this.prepareUnitBarChart(res.riskTypeWiseScore);

                // Heatmap processing
                const matrix = [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0]
                ];
                (res.heatmap || []).forEach((item: any) => {
                    const br = Number(item.business_risk);
                    const cr = Number(item.control_risk);
                    const count = Number(item.count || 0);

                    const rIdx = br - 1;
                    const cIdx = 3 - cr;

                    if (rIdx >= 0 && rIdx < 3 && cIdx >= 0 && cIdx < 3) {
                        matrix[rIdx][cIdx] = count;
                    }
                });
                this.unitHeatmap.set(matrix);

                this.chartsLoading.set(false);
            },
            error: (err) => {
                console.error("Unit charts load failed:", err);
                this.chartsLoading.set(false);
            }
        });
    }

    prepareUnitPieChart(riskCategoryScore: any[]) {
        const labels = riskCategoryScore.map(d => d.label);
        const data = riskCategoryScore.map(d => d.y);
        const colors = ["#EF4444", "#F59E0B", "#10B981"];

        this.unitPieData.set({
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: colors,
                    hoverBackgroundColor: colors
                }
            ]
        });

        this.unitPieOptions.set({
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { boxWidth: 12 }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        });
    }

    prepareUnitBarChart(riskTypeWiseScore: any[]) {
        const labels = riskTypeWiseScore.map(d => d.label);
        const data = riskTypeWiseScore.map(d => d.y);

        this.unitBarData.set({
            labels,
            datasets: [
                {
                    label: "Risk Score",
                    data,
                    backgroundColor: "#3B82F6",
                    borderRadius: 4
                }
            ]
        });

        this.unitBarOptions.set({
            indexAxis: "y",
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } }
            },
            responsive: true,
            maintainAspectRatio: false
        });
    }

    prepareUnitStackedChart(summary: any) {
        const labels = (summary.highRiskTrend || []).map((h: any) => h.label);
        const highData = (summary.highRiskTrend || []).map((h: any) => h.y);
        const medData = (summary.mediumRiskTrend || []).map((h: any) => h.y);
        const lowData = (summary.lowRiskTrend || []).map((h: any) => h.y);

        this.unitStackedData.set({
            labels,
            datasets: [
                {
                    label: "High Risk",
                    data: highData,
                    backgroundColor: "rgba(220, 20, 60, 0.85)",
                },
                {
                    label: "Medium Risk",
                    data: medData,
                    backgroundColor: "rgba(255, 165, 0, 0.85)",
                },
                {
                    label: "Low Risk",
                    data: lowData,
                    backgroundColor: "rgba(34, 139, 34, 0.85)",
                }
            ]
        });

        this.unitStackedOptions.set({
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true }
            },
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12 } }
            },
            responsive: true,
            maintainAspectRatio: false
        });
    }

    backToDashboard() {
        this.router.navigate([
            this.backRoute,
        ]);
    }

    openAssessment(
        assessment: any,
    ) {

        if (
            !assessment?.can_continue
        ) {
            return;
        }

        const userData = localStorage.getItem('user') || '{}';
        const user = JSON.parse(userData);
        const userTypeId = Number(user.user_type_id || 0);

        if (userTypeId === 4) {
            this.router.navigate(['/auditor/reviewer'], {
                queryParams: { assessmentId: assessment.id }
            });
        } else if (userTypeId === 3) {
            this.router.navigate(['/auditor/compliance'], {
                queryParams: { assessmentId: assessment.id }
            });
        } else {
            this.router.navigate([
                '/auditor/internal-audit',
                assessment.id,
            ]);
        }
    }

    openCarryForwardReport(
        assessment: any,
        year: any,
    ) {
        if (
            !assessment?.id
            || Number(assessment?.carry_forward_count || 0) <= 0
        ) {
            return;
        }

        this.router.navigate(
            ['/reports/carry-forward-report'],
            {
                queryParams: {
                    source_assessment_id: Number(assessment.id),
                    audit_unit_id: Number(assessment.audit_unit_id),
                    financial_year: Number(year?.id || assessment.year_id || 0),
                },
            },
        );
    }

    openPartiallyPassReport(
        assessment: any,
        year: any,
    ) {
        if (
            !assessment?.id
            || Number(assessment?.partially_pass_count || 0) <= 0
        ) {
            return;
        }

        this.router.navigate(
            ['/reports/partially-pass-report'],
            {
                queryParams: {
                    source_assessment_id: Number(assessment.id),
                    audit_unit_id: Number(assessment.audit_unit_id),
                    financial_year: Number(year?.id || assessment?.year_id || 0),
                },
            },
        );
    }

    startAssessment(
        year: any,
    ) {

        const unit =
            this.auditUnit();

        this.router.navigate([
            '/auditor/internal-audit/unit',
            unit.id,
            'start',
            year.id,
        ]);
    }

    getActionSeverity(
        assessment: any,
    ) {

        if (
            assessment?.can_continue
        ) {
            return 'success';
        }

        if (
            ['blocked', 'expired'].includes(
                assessment?.action_type,
            )
        ) {
            return 'danger';
        }

        if (
            assessment?.action_type === 'completed'
        ) {
            return 'success';
        }

        return 'secondary';
    }

    getStatusSeverity(
        assessment: any,
    ) {

        if (!assessment) {
            return 'info';
        }

        const statusId =
            Number(
                assessment.audit_status_id || 0,
            );

        if ([1, 3].includes(statusId)) {
            return 'warn';
        }

        if ([2, 5].includes(statusId)) {
            return 'contrast';
        }

        if ([4, 6].includes(statusId)) {
            return 'danger';
        }

        if (statusId === 7) {
            return 'success';
        }

        return 'secondary';
    }

    hasVisibleDueDate(
        assessment: any,
    ) {

        if (!assessment) {
            return false;
        }

        return (
            assessment.audit_due_date
            &&
            [1, 3].includes(
                Number(assessment.audit_status_id),
            )
        )
            ||
            (
                assessment.compliance_due_date
                &&
                [4, 6].includes(
                    Number(assessment.audit_status_id),
                )
            );
    }

    financialYearLabel(
        year: any,
    ) {

        const value =
            String(
                year?.year || '',
            );

        if (
            value.includes('-')
        ) {
            return value;
        }

        const startYear =
            Number(value);

        return startYear
            ? `${startYear} - ${startYear + 1}`
            : '-';
    }
}
