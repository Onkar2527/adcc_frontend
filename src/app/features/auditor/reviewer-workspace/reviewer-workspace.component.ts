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
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { AuditDashboardService } from '../services/auditor-main.service';
import { AuditUnitDashboardComponent } from '../../../shared/components/audit-unit-dashboard/audit-unit-dashboard.component';
import { InternalAuditNavService } from '../services/internal-audit-nav.service';
import { audit_flow_config } from '../../admin/services/required-data';

@Component({
    selector: 'app-reviewer-workspace',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        ButtonModule,
        SkeletonModule,
        TagModule,
        AuditUnitDashboardComponent,
        SelectModule,
        InputTextModule,
        TextareaModule,
    ],
    templateUrl: './reviewer-workspace.component.html',
    styleUrl: './reviewer-workspace.component.css',
})
export class ReviewerWorkspaceComponent implements OnInit {
    private service =
        inject(AuditDashboardService);

    private navService =
        inject(InternalAuditNavService);

    private notification =
        inject(NotificationService);

    private confirmation =
        inject(ConfirmationService);

    private router =
        inject(Router);

    private route =
        inject(ActivatedRoute);

    loadingQueue =
        signal(false);

    loadingDetail =
        signal(false);

    submitting =
        signal(false);

    bulkSaving =
        signal(false);

    actionSaving =
        signal<Record<string, boolean>>({});

    assessments =
        signal<any[]>([]);

    search =
        signal('');

    selectedStatus =
        signal<any>(null);

    reviewMode =
        signal<'regular' | 'special'>('regular');

    statusOptions = [
        {
            label: 'Audit Review',
            value: 'Audit Review',
        },
        {
            label: 'Compliance Review',
            value: 'Compliance Review',
        },
    ];

    selected =
        signal<any>(null);

    detail =
        signal<any>(null);

    annexureSavingQuestionId =
        signal<number | null>(null);

    error =
        signal('');

    overview = computed(() =>
        this.detail()?.overview || null
    );

    remarks =
        signal<any>(null);

    remarksLoading =
        signal(false);

    savingRemark =
        signal(false);

    showRemarksPanel =
        signal(false);

    remarkTab =
        signal<'add' | 'current' | 'other'>('current');

    expandedRemarks =
        signal<Record<number, boolean>>({});

    remarkNotiType: number | null = null;

    remarkSubject = '';

    remarkMessage = '';

    reviewFilter =
        signal<'all' | 'pending' | 'highRisk' | 'rework' | 'partial' | 'accepted'>('all');

    regularAssessments = computed(() =>
        this.assessments().filter(
            (assessment: any) => Number(assessment.audit_type_id || 1) === 1,
        ),
    );

    specialAssessments = computed(() =>
        this.assessments().filter(
            (assessment: any) => Number(assessment.audit_type_id || 1) !== 1,
        ),
    );

    modeAssessments = computed(() =>
        this.reviewMode() === 'special'
            ? this.specialAssessments()
            : this.regularAssessments(),
    );

    dashboardUnits = computed(() => {
        let rows =
            this.modeAssessments()
                .map((assessment: any) => {
                    const isCompliance =
                        Number(assessment.audit_status_id || 0) === 5
                        || assessment.live_manager_compliance === true;

                    return {
                        ...assessment,
                        audit_unit_id:
                            assessment.audit_unit_id,
                        audit_unit_name:
                            assessment.audit_unit_name,
                        audit_unit_code:
                            assessment.audit_unit_code,
                        display_title:
                            Number(assessment.audit_type_id || 1) !== 1
                                ? (assessment.audit_unit_code ? `(${assessment.audit_unit_code}) ${assessment.special_audit_title || assessment.audit_unit_name}` : (assessment.special_audit_title || assessment.audit_unit_name))
                                : (assessment.audit_unit_code ? `(${assessment.audit_unit_code}) ${assessment.audit_unit_name}` : assessment.audit_unit_name),
                        display_code:
                            Number(assessment.audit_type_id || 1) !== 1
                                ? `Branch: ${assessment.audit_unit_name}${assessment.audit_unit_code ? ` (${assessment.audit_unit_code})` : ''}`
                                : `Code: ${assessment.audit_unit_code}`,
                        audit_type_label:
                            Number(assessment.audit_type_id || 1) !== 1
                                ? (assessment.audit_type_name || 'Special Audit')
                                : 'Internal Audit',
                        latest_status:
                            isCompliance ? 'Compliance Review' : 'Audit Review',
                        assessment_period_label:
                            `${this.formatDate(assessment.assesment_period_from)} - ${this.formatDate(assessment.assesment_period_to)}`,
                        audit_pending:
                            isCompliance ? 0 : Number(assessment.total_points || 0),
                        review_pending:
                            Number(assessment.total_points || 0),
                        compliance_pending:
                            Number(assessment.compliance_points || 0),
                        audit_completed:
                            0,
                        not_started_count:
                            0,
                    };
                });

        const search =
            this.search()
                .trim()
                .toLowerCase();

        if (search) {
            rows = rows.filter((item: any) =>
                String(item.audit_unit_name || '')
                    .toLowerCase()
                    .includes(search)
                ||
                String(item.audit_unit_code || '')
                    .toLowerCase()
                    .includes(search),
            );
        }

        if (this.selectedStatus()) {
            rows = rows.filter((item: any) =>
                String(item.latest_status || '') === String(this.selectedStatus()),
            );
        }

        const grouped = new Map<string, any>();

        rows.forEach((item: any) => {
            const key =
                `${item.audit_type_id || 1}-${item.audit_unit_id}`;
            const existing =
                grouped.get(key);

            if (!existing) {
                grouped.set(key, {
                    ...item,
                    assessments: [item],
                    review_pending: Number(item.review_pending || 0),
                    compliance_pending: Number(item.compliance_pending || 0),
                });
                return;
            }

            existing.assessments.push(item);
            existing.review_pending += Number(item.review_pending || 0);
            existing.compliance_pending += Number(item.compliance_pending || 0);
        });

        return Array.from(grouped.values())
            .map((group: any) => ({
                ...group,
                assessments:
                    [...group.assessments].sort((a: any, b: any) =>
                        String(b.assesment_period_from || '').localeCompare(
                            String(a.assesment_period_from || ''),
                        ),
                    ),
                latest_status:
                    group.assessments.length > 1
                        ? 'Multiple Assessments'
                        : group.latest_status,
                assessment_period_label:
                    group.assessments.length > 1
                        ? `${group.assessments.length} assessment periods`
                        : group.assessment_period_label,
            }))
            .sort((a: any, b: any) =>
                String(a.audit_unit_name || '').localeCompare(String(b.audit_unit_name || '')),
            );
    });

    totalReviewPending = computed(() =>
        this.modeAssessments()
            .reduce(
                (sum, item: any) =>
                    sum + Number(item.total_points || 0),
                0,
            ),
    );

    totalCompliancePending = computed(() =>
        this.modeAssessments()
            .reduce(
                (sum, item: any) =>
                    sum + Number(item.compliance_points || 0),
                0,
            ),
    );

    reviewerSummaryItems = computed(() => [
        {
            label: 'Total Assessments',
            value: this.modeAssessments().length,
        },
        {
            label: 'Total Questions',
            value: this.totalReviewPending(),
            className: 'text-info',
        },
        {
            label: 'Compliance Marked',
            value: this.totalCompliancePending(),
            className: 'text-danger',
        },
    ]);

    reviewerCardMetrics = [
        {
            label: 'Total Questions',
            key: 'review_pending',
            className: 'text-info',
        },
        {
            label: 'Compliance',
            key: 'compliance_pending',
            className: 'text-danger',
        },
    ];

    reviewerCardMetaItems = [
        {
            label: 'Audit Type',
            key: 'audit_type_label',
        },
        {
            label: 'Assessment Period',
            key: 'assessment_period_label',
        },
    ];

    reviewAnswerGroups = computed(() =>
        this.groupReviewAnswers(
            this.filteredReviewAnswers(),
        ),
    );

    dashboardEyebrow = computed(() =>
        this.reviewMode() === 'special'
            ? 'Special Audit Review'
            : 'Review',
    );

    dashboardTitle = computed(() =>
        this.reviewMode() === 'special'
            ? 'Reviewer Workspace - Special Audits'
            : 'Reviewer Workspace',
    );

    dashboardSubtitle = computed(() =>
        this.reviewMode() === 'special'
            ? 'Select an assigned special audit to review observations or compliance responses'
            : 'Select an assigned audit unit to review audit observations or compliance responses',
    );

    dashboardPanelTitle = computed(() =>
        this.reviewMode() === 'special'
            ? 'Pending Special Audit Reviews'
            : 'Pending Reviews',
    );

    selectReviewMode(
        mode: 'regular' | 'special',
    ) {
        this.reviewMode.set(mode);
        this.search.set('');
        this.selectedStatus.set(null);
    }

    ngOnInit() {
        this.loadQueue();
    }

    employeeId() {
        const user =
            JSON.parse(
                localStorage.getItem('user')
                || '{}',
            );

        return Number(
            user.id
            || user.employee_id
            || user.emp_id
            || 0,
        );
    }

    loadQueue() {
        this.loadingQueue.set(true);
        this.error.set('');

        this.service
            .getReviewerPending(
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.assessments.set(
                        res?.assessments || [],
                    );
                    this.loadingQueue.set(false);

                    // Auto-open assessment if query param exists
                    const assessmentId = Number(this.route.snapshot.queryParamMap.get('assessmentId') || 0);
                    if (assessmentId) {
                        const matched = (res?.assessments || []).find(
                            (a: any) => Number(a.id) === assessmentId
                        );
                        if (matched) {
                            this.openAssessment(matched);
                        }
                    }
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load pending audit reviews.',
                    );
                    this.loadingQueue.set(false);
                },
            });
    }

    openAssessment(
        assessment: any,
    ) {
        this.reviewFilter.set('all');
        this.showRemarksPanel.set(false);
        this.selected.set(
            assessment,
        );
        this.loadingDetail.set(true);
        this.error.set('');
        const isLiveComplianceAssessment =
            assessment.live_manager_compliance === true
            || (
                audit_flow_config.liveManagerCompliance === true
                && Number(assessment.audit_status_id) === 5
            );
        const request =
            Number(assessment.audit_status_id) === 5
                || isLiveComplianceAssessment
                ? this.service.getReviewerComplianceAssessment(
                    Number(assessment.id),
                    this.employeeId(),
                    isLiveComplianceAssessment,
                )
                : this.service.getReviewerAssessment(
                    Number(assessment.id),
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (res: any) => {
                    res = this.initTempActions(res);
                    this.detail.set(res);
                    this.navService.setAssessmentMenus(
                        Number(assessment.id),
                        [],
                        res?.overview || null,
                    );
                    this.loadingDetail.set(false);

                    if (
                        this.canUseRemarks(
                            res?.overview,
                        )
                    ) {
                        this.loadRemarks(
                            Number(
                                assessment.id,
                            ),
                        );
                    } else {
                        this.remarks.set(
                            null,
                        );
                    }
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to open review.',
                    );
                    this.loadingDetail.set(false);
                },
            });
    }

    viewAssessmentDetails(
        assessment: any,
    ) {
        const auditUnitId = Number(
            assessment?.audit_unit_id || 0,
        );

        if (!auditUnitId) {
            return;
        }

        this.router.navigate([
            '/auditor/reviewer/unit',
            auditUnitId,
            'details',
        ]);
    }

    closeAssessment() {
        this.reviewFilter.set('all');
        this.showRemarksPanel.set(false);
        this.selected.set(null);
        this.detail.set(null);
        this.navService.clear();
        this.loadQueue();
    }

    viewExecutiveSummary() {
        const assessmentId =
            Number(
                this.selected()?.id || 0,
            );

        if (!assessmentId) {
            return;
        }

        this.router.navigate([
            '/auditor/internal-audit/executive-summary',
            assessmentId,
        ], {
            queryParams: {
                mode: 'reviewer',
            },
        });
    }

    formatDate(value: any) {
        if (!value) {
            return '-';
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    isComplianceReview() {
        return Number(
            this.selected()?.audit_status_id || 0,
        ) === 5
            || this.selected()?.live_manager_compliance === true
            || this.detail()?.overview?.live_manager_compliance === true;
    }

    isLiveManagerComplianceReview() {
        return this.selected()?.live_manager_compliance === true
            || this.detail()?.overview?.live_manager_compliance === true
            || (
                audit_flow_config.liveManagerCompliance === true
                && Number(
                    this.selected()?.audit_status_id
                    || this.detail()?.overview?.audit_status_id
                    || 0,
                ) === 5
            );
    }

    isRegularComplianceReview() {
        return this.isComplianceReview()
            && this.selected()?.live_manager_compliance !== true
            && this.detail()?.overview?.live_manager_compliance !== true;
    }

    getTimeline(observation: any): any[] {
        if (!observation || !observation.answers_data_timeline) {
            return [];
        }
        if (typeof observation.answers_data_timeline === 'string') {
            try {
                return JSON.parse(observation.answers_data_timeline);
            } catch (e) {
                return [];
            }
        }
        return Array.isArray(observation.answers_data_timeline) ? observation.answers_data_timeline : [];
    }

    reviewStatus(
        observation: any,
    ) {
        return this.isComplianceReview()
            ? observation.compliance_status_id
            : observation.audit_status_id;
    }

    isReviewActionDisabled(
        observation: any,
        action: 2 | 3 | 5 | 7,
    ) {
        const status =
            Number(
                this.reviewStatus(
                    observation,
                ) || 0,
            );

        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
        ) {
            if (
                !this.canTakeLiveComplianceReviewerAction(observation)
            ) {
                return true;
            }

            if (
                action === 2
            ) {
                return status === 14;
            }

            if (
                action === 3
            ) {
                return status === 12;
            }

            if (
                action === 5
            ) {
                return status === 5;
            }

            if (
                action === 7
            ) {
                return status === 9;
            }

            return false;
        }

        if (
            status === 9
        ) {
            return true;
        }

        if (
            action === 2
        ) {
            return status === 2;
        }

        if (
            action === 3
        ) {
            return status === 3;
        }

        if (
            action === 5
        ) {
            return status === 5;
        }

        if (
            action === 7
        ) {
            return [7, 8].includes(
                status,
            );
        }

        return false;
    }

    reviewComment(
        observation: any,
    ) {
        return this.isComplianceReview()
            ? observation.compliance_reviewer_comment || ''
            : observation.audit_reviewer_comment || '';
    }

    statusLabel(
        status: number,
    ) {
        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
        ) {
            if (Number(status) === 10) {
                return 'Pending With Auditor';
            }

            if (Number(status) === 11) {
                return 'Pending With Reviewer';
            }

            if (Number(status) === 12) {
                return 'Pending With Manager';
            }

            if (Number(status) === 13) {
                return 'Accepted By Auditor';
            }

            if (Number(status) === 14) {
                return 'Settled By Reviewer';
            }
        }

        if (
            Number(status) === 2
        ) {
            return 'Accepted';
        }

        if (
            Number(status) === 3
        ) {
            return this.isComplianceReview()
                ? 'Re-Compliance Needed'
                : 'Re-Audit Needed';
        }

        if (
            Number(status) === 5
        ) {
            return 'Carry Forward';
        }

        if (
            Number(status) === 7
        ) {
            return 'Partially Pass';
        }

        if (
            Number(status) === 8
        ) {
            return 'Partially Pass Response Pending';
        }

        if (
            Number(status) === 9
        ) {
            return 'Partially Pass Settled';
        }

        return 'Pending';
    }

    liveComplianceStatusLabel(
        observation: any,
    ) {
        const status =
            Number(
                this.reviewStatus(observation) || 0,
            );
        const managerResponse =
            String(
                observation?.compliance_response
                || observation?.audit_commpliance
                || '',
            ).trim();

        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
            && [0, 4, 11, 12].includes(status)
            && !managerResponse
        ) {
            return 'Pending With Manager';
        }

        return this.statusLabel(status);
    }

    statusSeverity(
        status: number,
    ): 'success' | 'danger' | 'secondary' | 'info' | 'warn' {
        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
        ) {
            if ([13, 14].includes(Number(status))) {
                return 'success';
            }

            if (Number(status) === 11) {
                return 'danger';
            }

            if (Number(status) === 12) {
                return 'warn';
            }

            if (Number(status) === 10) {
                return 'info';
            }

            return 'secondary';
        }

        if (
            Number(status) === 2
        ) {
            return 'success';
        }

        if (
            Number(status) === 3
        ) {
            return 'danger';
        }

        if (
            Number(status) === 5
        ) {
            return 'info';
        }

        if (
            [7, 8].includes(Number(status))
        ) {
            return 'warn';
        }

        if (
            Number(status) === 9
        ) {
            return 'success';
        }

        return 'secondary';
    }

    actionKey(
        targetType: string,
        observationId: number,
    ) {
        return `${targetType}-${observationId}`;
    }

    totalQueuePoints() {
        return this.assessments()
            .reduce(
                (total, assessment: any) =>
                    total +
                    Number(assessment.total_points || 0),
                0,
            );
    }

    totalQueueCompliancePoints() {
        return this.assessments()
            .reduce(
                (total, assessment: any) =>
                    total +
                    Number(assessment.compliance_points || 0),
                0,
            );
    }

    reviewTargets() {
        const answers =
            (this.detail()?.answers || [])
                .filter(
                    (answer: any) =>
                        Number(
                            answer?.is_compliance || 0,
                        ) === 1
                        && (
                            !this.isLiveManagerComplianceReview()
                            || this.canTakeLiveComplianceReviewerAction(answer)
                        ),
                )
                .map(
                    (answer: any) => ({
                        type:
                            'answer' as const,
                        observation:
                            answer,
                    }),
                );

        const annexureRows =
            (this.detail()?.answers || [])
                .flatMap(
                    (answer: any) =>
                        Number(
                            answer?.is_compliance || 0,
                        ) === 1
                            ? (answer.annexure_rows || [])
                                .filter(
                                    (row: any) =>
                                        !this.isLiveManagerComplianceReview()
                                        || this.canTakeLiveComplianceReviewerAction(row),
                                )
                            : [],
                )
                .map(
                    (row: any) => ({
                        type:
                            'annexure' as const,
                        observation:
                            row,
                    }),
                );

        return [
            ...answers,
            ...annexureRows,
        ];
    }

    pendingReviewCount() {
        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
        ) {
            return this.allReviewAnswers()
                .flatMap(
                    (answer: any) => [
                        answer,
                        ...(answer?.annexure_rows || []),
                    ],
                )
                .filter(
                    (observation: any) =>
                        [0, 4, 10, 11, 12, 13].includes(
                            Number(
                                this.reviewStatus(observation) || 0,
                            ),
                        ),
                )
                .length;
        }

        return this.reviewTargets()
            .filter(
                (target) =>
                    ![
                        2,
                        3,
                        ...(this.isComplianceReview()
                            ? [5, 7, 9]
                            : []),
                    ].includes(
                        Number(
                            this.reviewStatus(
                                target.observation,
                            ) || 0,
                        ),
                    ),
            )
            .length;
    }

    hasLiveReviewerSubmissionScope() {
        if (
            !this.isLiveManagerComplianceReview()
            || !this.isComplianceReview()
        ) {
            return true;
        }

        return this.allReviewAnswers()
            .flatMap(
                (answer: any) => [
                    answer,
                    ...(answer?.annexure_rows || []),
                ],
            )
            .some(
                (observation: any) =>
                    [5, 9, 11, 12, 14].includes(
                        Number(
                            this.reviewStatus(observation) || 0,
                        ),
                    ),
            );
    }

    allReviewAnswers() {
        return this.detail()?.answers || [];
    }

    filteredReviewAnswers() {
        const answers =
            this.allReviewAnswers();
        const filter =
            this.reviewFilter();

        if (filter === 'all') {
            return answers;
        }

        return answers.filter(
            (answer: any) =>
                this.answerMatchesReviewFilter(
                    answer,
                    filter,
                ),
        );
    }

    reviewFilterCount(
        filter: 'all' | 'pending' | 'highRisk' | 'rework' | 'partial' | 'accepted',
    ) {
        const answers =
            this.allReviewAnswers();

        if (filter === 'all') {
            return answers.length;
        }

        if (filter === 'rework') {
            return Number(
                this.detail()?.counts?.rejected || 0,
            );
        }

        if (filter === 'partial') {
            return Number(
                this.detail()?.counts?.partially_passed || 0,
            );
        }

        return answers.filter(
            (answer: any) =>
                this.answerMatchesReviewFilter(
                    answer,
                    filter,
                ),
        ).length;
    }

    reviewFilterLabel() {
        const labels: Record<string, string> = {
            all: 'All observations',
            pending: 'Pending observations',
            highRisk: 'High risk observations',
            rework: this.isComplianceReview()
                ? 'Re-compliance needed'
                : 'Re-audit needed',
            partial: 'Partially passed observations',
            accepted: 'Accepted observations',
        };

        return labels[this.reviewFilter()] || 'Observations';
    }

    private answerMatchesReviewFilter(
        answer: any,
        filter: 'pending' | 'highRisk' | 'rework' | 'partial' | 'accepted',
    ) {
        const answerStatus =
            Number(
                this.reviewStatus(answer) || 0,
            );

        const annexureRows =
            answer?.annexure_rows || [];

        const hasAnnexureStatus =
            (matcher: (status: number) => boolean) =>
                annexureRows.some(
                    (row: any) =>
                        matcher(
                            Number(
                                this.reviewStatus(row) || 0,
                            ),
                        ),
                );

        if (
            this.isLiveManagerComplianceReview()
            && this.isComplianceReview()
        ) {
            if (filter === 'pending') {
                return [11, 12].includes(answerStatus)
                    || hasAnnexureStatus(
                        (status: number) =>
                            [11, 12].includes(status),
                    );
            }

            if (filter === 'rework') {
                return answerStatus === 11
                    || hasAnnexureStatus(
                        (status: number) =>
                            status === 11,
                    );
            }

            if (filter === 'accepted') {
                return [13, 14].includes(answerStatus)
                    || hasAnnexureStatus(
                        (status: number) =>
                            [13, 14].includes(status),
                    );
            }

            if (filter === 'partial') {
                return [5, 9].includes(answerStatus)
                    || hasAnnexureStatus(
                        (status: number) =>
                            [5, 9].includes(status),
                    );
            }
        }

        if (filter === 'pending') {
            const pendingStatuses =
                [
                    2,
                    3,
                    ...(this.isComplianceReview()
                        ? [5, 7, 8, 9]
                        : []),
                ];

            return !pendingStatuses.includes(answerStatus)
                || hasAnnexureStatus(
                    (status) =>
                        !pendingStatuses.includes(status),
                );
        }

        if (filter === 'rework') {
            return answerStatus === 3
                || hasAnnexureStatus(
                    (status) =>
                        status === 3,
                );
        }

        if (filter === 'accepted') {
            return answerStatus === 2
                || hasAnnexureStatus(
                    (status) =>
                        status === 2,
                );
        }

        if (filter === 'partial') {
            return [7, 8, 9].includes(answerStatus)
                || hasAnnexureStatus(
                    (status: number) =>
                        [7, 8, 9].includes(status),
                );
        }

        return this.isHighRiskObservation(answer);
    }

    canTakeLiveComplianceReviewerAction(
        observation: any,
    ) {
        const status = Number(
            this.reviewStatus(observation) || 0,
        );
        const managerResponse =
            String(
                observation?.compliance_response
                || observation?.audit_commpliance
                || '',
            ).trim();

        if (
            status === 13
            || status === 8
        ) {
            return true;
        }

        if (
            [11, 12].includes(status)
            && managerResponse
        ) {
            return true;
        }

        return (observation?.annexure_rows || [])
            .some(
                (row: any) =>
                    this.canTakeLiveComplianceReviewerAction(row),
            );
    }

    private isHighRiskObservation(
        answer: any,
    ) {
        const rows =
            [
                answer,
                ...(answer?.annexure_rows || []),
            ];

        return rows.some(
            (row: any) =>
                this.riskText(row)
                    .includes('high risk'),
        );
    }

    private riskText(
        row: any,
    ) {
        return [
            row?.business_risk,
            row?.business_risk_name,
            row?.business_risk_label,
            row?.control_risk,
            row?.control_risk_name,
            row?.control_risk_label,
            row?.risk_type,
            row?.risk_type_name,
            row?.risk_type_label,
        ]
            .filter(
                (value) =>
                    value !== null
                    && value !== undefined,
            )
            .join(' ')
            .toLowerCase();
    }

    hasAccountDetails(
        answer: any,
    ) {
        return Boolean(
            answer?.account_no
            || answer?.account_holder_name
            || answer?.scheme_name
            || answer?.scheme_code
            || answer?.ucic,
        );
    }

    selectedTitle() {
        const item = this.selected();
        const name = Number(item?.audit_type_id || 1) !== 1
            ? (item?.special_audit_title || item?.audit_unit_name || item?.audit_type_name || 'Audit')
            : item?.audit_unit_name;

        return item?.audit_unit_code
            ? `(${item.audit_unit_code}) ${name}`
            : name;
    }

    selectedSubtitle() {
        const item = this.selected();
        const prefix =
            Number(item?.audit_type_id || 1) !== 1
                ? (item?.audit_type_name || 'Special Audit')
                : (item?.audit_unit_code || '');

        const stage =
            this.isComplianceReview()
                ? 'Compliance Review'
                : 'Audit Review';

        return prefix
            ? `${prefix} | ${stage}`
            : stage;
    }

    private groupReviewAnswers(
        answers: any[] = [],
    ) {
        const groups: any[] = [];
        const accountGroupMap =
            new Map<string, any>();
        let displayIndex = 0;

        for (const answer of answers || []) {
            const row =
                answer;

            row._displayIndex =
                ++displayIndex;

            if (!this.hasAccountDetails(row)) {
                groups.push({
                    isAccountGroup:
                        false,
                    account:
                        null,
                    answers:
                        [row],
                });
                continue;
            }

            const key =
                [
                    row.category_id,
                    row.dump_id,
                    row.account_no || '',
                ].join(':');

            let group =
                accountGroupMap.get(key);

            if (!group) {
                group = {
                    isAccountGroup:
                        true,
                    account:
                        row,
                    answers:
                        [],
                };
                accountGroupMap.set(key, group);
                groups.push(group);
            }

            group.answers.push(row);
        }

        return groups;
    }

    annexureColumns(
        answer: any,
    ) {
        const columns =
            Array.isArray(answer?.annexure_columns)
                ? answer.annexure_columns
                : [];

        if (
            columns.length
        ) {
            return columns;
        }

        const valueCount =
            Math.max(
                ...(answer?.annexure_rows || [])
                    .map(
                        (row: any) =>
                            row.values?.length || 0,
                    ),
                0,
            );

        return Array.from(
            {
                length:
                    valueCount,
            },
            (
                _item,
                index,
            ) => ({
                name:
                    `Column ${index + 1}`,
            }),
        );
    }

    saveBulkAction(
        action: number,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
            ||
            this.bulkSaving()
        ) {
            return;
        }

        const targets =
            this.reviewTargets();

        if (
            !targets.length
        ) {
            this.notification.error(
                'No observations are available for review action.',
            );
            return;
        }

        this.confirmation.confirm({
            header:
                this.isLiveManagerComplianceReview()
                    ? action === 2
                        ? 'Accept All Pending Points'
                        : 'Send All Pending Points to Manager'
                    : action === 2
                        ? 'Accept All Observations'
                        : 'Reject All Observations',
            message:
                this.isLiveManagerComplianceReview()
                    ? action === 2
                        ? `Accept all ${targets.length} pending point(s)?`
                        : `Send all ${targets.length} pending point(s) to Manager?`
                    : `${action === 2 ? 'Accept' : 'Reject'} all ${targets.length} observation(s)?`,
            icon:
                action === 2
                    ? 'pi pi-check-circle'
                    : 'pi pi-exclamation-triangle',
            acceptLabel:
                this.isLiveManagerComplianceReview()
                    ? action === 2
                        ? 'Accept All'
                        : 'Send to Manager'
                    : action === 2
                        ? 'Accept All'
                        : 'Reject All',
            rejectLabel:
                'Cancel',
            accept:
                () => {
                    this.bulkSaving.set(true);

                    forkJoin(
                        targets.map(
                            (target) =>
                                this.isComplianceReview()
                                    ? this.service.saveReviewerComplianceAction(
                                        assessmentId,
                                        target.type,
                                        Number(target.observation.id),
                                        this.employeeId(),
                                        action,
                                        this.reviewComment(target.observation),
                                    )
                                    : this.service.saveReviewerAction(
                                        assessmentId,
                                        target.type,
                                        Number(target.observation.id),
                                        this.employeeId(),
                                        action,
                                        this.reviewComment(target.observation),
                                    ),
                        ),
                    )
                        .subscribe({
                            next: () => {
                                this.notification.success(
                                    action === 2
                                        ? 'All observations accepted.'
                                        : 'All observations rejected.',
                                );
                                this.reloadDetail(
                                    assessmentId,
                                    '',
                                );
                                this.bulkSaving.set(false);
                            },
                            error: (err) => {
                                this.bulkSaving.set(false);
                                this.notification.error(
                                    err?.error?.message
                                    || 'Unable to save bulk review action.',
                                );
                            },
                        });
                },
        });
    }

    private initTempActions(res: any) {
        if (!res || !res.answers) return res;
        res.answers.forEach((answer: any) => {
            if (answer.annexure_rows) {
                answer.annexure_rows.forEach((row: any) => {
                    row.temp_action = this.reviewStatus(row) || '';
                    row.original_action = row.temp_action;
                    row.original_comment = this.reviewComment(row) || '';
                });
            }
        });
        return res;
    }

    hasReviewableAnnexureRows(
        answer: any,
    ): boolean {
        return (answer.annexure_rows || []).length > 0;
    }

    selectAcceptForAllAnnexureRows(
        answer: any,
    ) {
        if (answer.annexure_rows) {
            answer.annexure_rows.forEach((row: any) => {
                row.temp_action = 2;
            });
        }
    }

    saveAllAnnexureActions(
        answer: any,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );
        if (
            !assessmentId
        ) {
            return;
        }

        const rowsToSave = (answer.annexure_rows || []).filter(
            (row: any) => {
                const actionChanged = String(row.temp_action) !== String(row.original_action);
                const commentChanged = String(this.reviewComment(row)).trim() !== String(row.original_comment).trim();
                return actionChanged || commentChanged;
            }
        );

        if (
            rowsToSave.length === 0
        ) {
            this.notification.info(
                'No changes to save in annexure rows.',
            );
            return;
        }

        // Validate that all modified rows have a selected review action.
        for (const row of rowsToSave) {
            const action = Number(row.temp_action);
            if (
                ![2, 3, 5, 7].includes(action)
            ) {
                this.notification.error(
                    'Please select a valid action (Accept, Reject, etc.) for all modified rows.',
                );
                return;
            }

            if (
                this.isComplianceReview()
                && action === 7
                && !String(this.reviewComment(row) || '').trim()
            ) {
                this.notification.error(
                    'Enter a reviewer comment for every Partially Pass annexure row.',
                );
                return;
            }
        }

        this.annexureSavingQuestionId.set(answer.id);

        const requests = rowsToSave.map((row: any) => {
            const action = Number(row.temp_action);
            const comment = this.reviewComment(row);

            return this.isComplianceReview()
                ? this.service.saveReviewerComplianceAction(
                    assessmentId,
                    'annexure',
                    Number(row.id),
                    this.employeeId(),
                    action,
                    comment,
                )
                : this.service.saveReviewerAction(
                    assessmentId,
                    'annexure',
                    Number(row.id),
                    this.employeeId(),
                    action,
                    comment,
                );
        });

        forkJoin(requests).subscribe({
            next: () => {
                this.notification.success(
                    'All annexure review actions saved successfully.',
                );
                this.annexureSavingQuestionId.set(null);
                this.reloadDetail(assessmentId, '');
            },
            error: (err) => {
                this.annexureSavingQuestionId.set(null);
                this.notification.error(
                    err?.error?.message
                    || 'Unable to save some review actions. Please try again.',
                );
                this.reloadDetail(assessmentId, '');
            },
        });
    }

    saveAction(
        targetType: 'answer' | 'annexure',
        observation: any,
        action: number,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        if (
            this.isComplianceReview()
            && Number(action) === 7
            && !String(this.reviewComment(observation) || '').trim()
        ) {
            this.notification.error(
                'Enter a reviewer comment before marking the point as Partially Pass.',
            );
            return;
        }

        const key =
            this.actionKey(
                targetType,
                observation.id,
            );
        const state = {
            ...this.actionSaving(),
            [key]: true,
        };

        this.actionSaving.set(
            state,
        );

        const request =
            this.isComplianceReview()
                ? this.service.saveReviewerComplianceAction(
                    assessmentId,
                    targetType,
                    Number(observation.id),
                    this.employeeId(),
                    action,
                    this.reviewComment(observation),
                )
                : this.service.saveReviewerAction(
                    assessmentId,
                    targetType,
                    Number(observation.id),
                    this.employeeId(),
                    action,
                    this.reviewComment(observation),
                );

        request
            .subscribe({
                next: (res: any) => {
                    this.notification.success(
                        res?.message
                        || 'Review action saved.',
                    );
                    this.reloadDetail(
                        assessmentId,
                        key,
                    );
                },
                error: (err) => {
                    this.clearActionSaving(key);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save review action.',
                    );
                },
            });
    }

    viewEvidence(
        evidence: any,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
            ||
            !evidence?.id
        ) {
            return;
        }

        const request =
            this.isComplianceReview()
                ? this.service.viewReviewerComplianceEvidence(
                    assessmentId,
                    Number(evidence.id),
                    this.employeeId(),
                )
                : this.service.viewReviewerEvidence(
                    assessmentId,
                    Number(evidence.id),
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (blob: Blob) => {
                    const url =
                        URL.createObjectURL(blob);

                    window.open(
                        url,
                        '_blank',
                    );

                    setTimeout(
                        () =>
                            URL.revokeObjectURL(url),
                        60000,
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to open evidence.',
                    );
                },
            });
    }

    evidenceList(
        source: any,
        field = 'evidence',
    ) {
        if (!source) {
            return [];
        }

        const pluralField =
            field === 'compliance_evidence'
                ? 'compliance_evidences'
                : 'evidences';

        const list =
            Array.isArray(source?.[pluralField])
                ? source[pluralField]
                : [];

        const single =
            Array.isArray(source?.[field])
                ? source[field]
                : source?.[field]
                    ? [source[field]]
                    : [];

        const merged =
            [...list, ...single];

        const seen =
            new Set<number>();

        return merged.filter((evidence: any) => {
            const id =
                Number(evidence?.id || 0);

            if (!id || seen.has(id)) {
                return false;
            }

            seen.add(id);

            return true;
        });
    }

    submitReview() {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        if (
            this.pendingReviewCount() > 0
        ) {
            this.notification.error(
                'Accept or reject all observations before submitting the review.',
            );
            return;
        }

        const complianceReview =
            this.isComplianceReview();

        this.confirmation.confirm({
            header:
                complianceReview
                    ? 'Submit Compliance Review'
                    : 'Submit Review',
            message:
                complianceReview
                    ? 'Submit this completed compliance review?'
                    : 'Submit this completed audit review?',
            icon:
                'pi pi-send',
            acceptLabel:
                'Submit',
            rejectLabel:
                'Cancel',
            accept:
                () => {
                    this.submitting.set(true);

                    const request =
                        complianceReview
                            ? this.service.submitReviewerComplianceAssessment(
                                assessmentId,
                                this.employeeId(),
                            )
                            : this.service.submitReviewerAssessment(
                                assessmentId,
                                this.employeeId(),
                            );

                    request
                        .subscribe({
                            next: (res: any) => {
                                this.submitting.set(false);
                                this.notification.success(
                                    res?.message
                                    || 'Review submitted.',
                                );
                                this.closeAssessment();
                            },
                            error: (err) => {
                                this.submitting.set(false);
                                this.notification.error(
                                    err?.error?.message
                                    || 'Unable to submit review.',
                                );
                            },
                        });
                },
        });
    }

    canUseRemarks(
        audit: any = this.overview(),
    ) {
        return [2, 5].includes(
            Number(
                audit?.audit_status_id,
            ),
        );
    }

    toggleRemarksPanel() {
        this.showRemarksPanel.set(
            !this.showRemarksPanel(),
        );
    }

    loadRemarks(
        assessmentId: number,
    ) {
        this.remarksLoading.set(
            true,
        );

        this.service
            .getInternalAuditRemarks(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.remarks.set(
                        res,
                    );
                    this.remarksLoading.set(
                        false,
                    );
                },
                error: (err) => {
                    this.remarksLoading.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to load assessment remarks.',
                    );
                },
            });
    }

    saveRemark() {
        const assessmentId =
            Number(
                this.overview()?.id || 0,
            );

        if (
            !assessmentId
            ||
            this.savingRemark()
        ) {
            return;
        }

        if (
            !this.remarkNotiType
            ||
            !this.remarkSubject.trim()
            ||
            !this.remarkMessage.trim()
        ) {
            this.notification.error(
                'Select a recipient and enter subject and message.',
            );
            return;
        }

        this.savingRemark.set(
            true,
        );

        this.service
            .saveInternalAuditRemark(
                assessmentId,
                this.employeeId(),
                {
                    noti_type:
                        this.remarkNotiType,
                    subject:
                        this.remarkSubject.trim(),
                    message:
                        this.remarkMessage.trim(),
                },
            )
            .subscribe({
                next: (res: any) => {
                    this.savingRemark.set(
                        false,
                    );
                    this.remarkNotiType =
                        null;
                    this.remarkSubject =
                        '';
                    this.remarkMessage =
                        '';
                    this.remarkTab.set(
                        'current',
                    );
                    this.notification.success(
                        res?.message
                        || 'Assessment remark saved successfully.',
                    );
                    this.loadRemarks(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.savingRemark.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save assessment remark.',
                    );
                },
            });
    }

    toggleRemark(
        remark: any,
        incoming = false,
    ) {
        const expanded = {
            ...this.expandedRemarks(),
        };
        const remarkId =
            Number(remark?.id || 0);

        expanded[remarkId] =
            !expanded[remarkId];
        this.expandedRemarks.set(
            expanded,
        );

        if (
            !expanded[remarkId]
            ||
            !incoming
            ||
            !remark?.is_unread
        ) {
            return;
        }

        this.service
            .markInternalAuditRemarkRead(
                Number(this.overview()?.id),
                remarkId,
                this.employeeId(),
            )
            .subscribe({
                next: () => {
                    this.loadRemarks(
                        Number(
                            this.overview()?.id,
                        ),
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to mark remark as read.',
                    );
                },
            });
    }

    isRemarkExpanded(
        remarkId: number,
    ) {
        return Boolean(
            this.expandedRemarks()[
            Number(remarkId)
            ],
        );
    }

    removeRemark(
        remark: any,
    ) {
        if (
            !remark?.can_delete
        ) {
            return;
        }

        this.confirmation.confirm({
            header:
                'Remove Remark',
            message:
                'Remove this unread assessment remark?',
            icon:
                'pi pi-trash',
            acceptLabel:
                'Remove',
            rejectLabel:
                'Cancel',
            accept:
                () =>
                    this.performRemoveRemark(
                        Number(remark.id),
                    ),
        });
    }

    private performRemoveRemark(
        remarkId: number,
    ) {
        const assessmentId =
            Number(
                this.overview()?.id || 0,
            );

        this.service
            .deleteInternalAuditRemark(
                assessmentId,
                remarkId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.notification.success(
                        res?.message
                        || 'Assessment remark removed successfully.',
                    );
                    this.loadRemarks(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to remove assessment remark.',
                    );
                },
            });
    }

    private reloadDetail(
        assessmentId: number,
        key: string,
    ) {
        const request =
            this.isComplianceReview()
                ? this.service.getReviewerComplianceAssessment(
                    assessmentId,
                    this.employeeId(),
                    this.isLiveManagerComplianceReview(),
                )
                : this.service.getReviewerAssessment(
                    assessmentId,
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (res: any) => {
                    res = this.initTempActions(res);
                    this.detail.set(res);
                    this.navService.setAssessmentMenus(
                        assessmentId,
                        [],
                        res?.overview || null,
                    );
                    this.clearActionSaving(key);
                },
                error: () => {
                    this.clearActionSaving(key);
                },
            });
    }

    private clearActionSaving(
        key: string,
    ) {
        const state = {
            ...this.actionSaving(),
        };
        delete state[key];
        this.actionSaving.set(state);
    }

    trackByGroup(index: number, group: any): any {
        if (group.isAccountGroup && group.account) {
            return `${group.account.category_id}:${group.account.dump_id}:${group.account.account_no}`;
        }
        return group.answers?.[0]?.id || index;
    }

    trackByAnswer(index: number, answer: any): any {
        return answer.id || index;
    }

    trackByEvidence(index: number, evidence: any): any {
        return evidence.id || index;
    }

    trackByRow(index: number, row: any): any {
        return row.id || index;
    }

    trackByColumn(index: number, column: any): any {
        return column.id || index;
    }

    trackByIndex(index: number): number {
        return index;
    }
}
