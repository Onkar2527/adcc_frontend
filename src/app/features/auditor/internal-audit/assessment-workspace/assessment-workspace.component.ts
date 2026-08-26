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
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuditDashboardService } from '../../services/auditor-main.service';
import { CategoryAssessmentComponent } from '../category-assessment/category-assessment.component';
import { InternalAuditNavService } from '../../services/internal-audit-nav.service';
import { audit_flow_config } from '../../../admin/services/required-data';

@Component({
    selector: 'app-assessment-workspace',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        ButtonModule,
        CardModule,
        ProgressBarModule,
        SkeletonModule,
        TagModule,
        CategoryAssessmentComponent,
    ],
    templateUrl: './assessment-workspace.component.html',
    styleUrl: '../internal-audit.component.css',
})
export class AssessmentWorkspaceComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    private confirmationService =
        inject(ConfirmationService);

    private notification =
        inject(NotificationService);

    private navService =
        inject(InternalAuditNavService);

    loading =
        signal(false);

    overview =
        signal<any>(null);

    menus =
        signal<any[]>([]);

    error =
        signal('');

    submissionPreview =
        signal<any>(null);

    checkingSubmission =
        signal(false);

    submitting =
        signal(false);

    submissionMessage =
        signal('');

    selectedCategoryId =
        signal<number | null>(null);

    selectedView =
        signal<'summary' | 'category' | 'carry-forward'>('summary');

    selectedPendingQuestionIds =
        signal<number[]>([]);

    selectedDumpId =
        signal(0);

    applyingDefaultsAll =
        signal(false);

    carryForward =
        signal<any[]>([]);

    carryForwardLoading =
        signal(false);

    savingCarryForwardId =
        signal<number | null>(null);

    remarks =
        signal<any>(null);

    remarksLoading =
        signal(false);

    savingRemark =
        signal(false);

    remarkTab =
        signal<'add' | 'current' | 'other'>('current');

    expandedRemarks =
        signal<Record<number, boolean>>({});

    remarkNotiType: number | null = null;

    remarkSubject = '';

    remarkMessage = '';

    private submissionCheckRequest = 0;

    totalCategories =
        computed(() =>
            this.menus()
                .reduce(
                    (
                        sum,
                        menu: any,
                    ) =>
                        sum +
                        Number(
                            menu.categories?.length || 0,
                        ),
                    0,
                ),
        );

    totalQuestions =
        computed(() =>
            this.menus()
                .reduce(
                    (
                        sum,
                        menu: any,
                    ) =>
                        sum +
                        (menu.categories || [])
                            .reduce(
                                (
                                    catSum: number,
                                    category: any,
                                ) =>
                                    catSum +
                                    Number(
                                        category.question_count || 0,
                                    ),
                                0,
                            ),
                    0,
                ),
        );

    selectedCategory =
        computed(() =>
            this.menus()
                .flatMap(
                    (menu: any) =>
                        menu.categories || [],
                )
                .find(
                    (category: any) =>
                        Number(category.id)
                        === Number(
                            this.selectedCategoryId(),
                        ),
                )
            || null,
        );

    ngOnInit() {
        const assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        if (!assessmentId) {
            this.error.set(
                'Assessment not found.',
            );
            return;
        }

        this.loadMenu(
            assessmentId,
        );

        this.route.queryParamMap.subscribe(
            (params) =>
                this.applyRouteSelection(
                    params.get('view'),
                    params.get('categoryId'),
                    params.get('dumpId'),
                    params.get('pending'),
                ),
        );
    }
    openExecutiveSummary() {

        const assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        this.router.navigate([
            '/auditor/internal-audit/executive-summary',
            assessmentId,
        ]);

    }

    loadMenu(
        assessmentId: number,
        refreshSubmission = false,
        showLoader = true,
    ) {
        if (
            showLoader
        ) {
            this.loading.set(true);
        }
        this.error.set('');

        if (
            refreshSubmission
        ) {
            ++this.submissionCheckRequest;

            this.checkingSubmission.set(
                true,
            );
            this.submissionMessage.set(
                'Refreshing completion summary...',
            );
        }

        this.service
            .getInternalAuditMenu(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.overview.set(
                        res?.overview || null,
                    );
                    this.menus.set(
                        res?.menus || [],
                    );
                    this.navService.setAssessmentMenus(
                        assessmentId,
                        res?.menus || [],
                        res?.overview || null,
                    );
                    this.ensureSelectedCategory();
                    if (
                        this.selectedView() === 'carry-forward'
                    ) {
                        this.loadCarryForward(
                            assessmentId,
                        );
                    }
                    this.loading.set(false);

                    if (
                        this.canUseRemarks(
                            res?.overview,
                        )
                    ) {
                        this.loadRemarks(
                            assessmentId,
                        );
                    } else {
                        this.remarks.set(
                            null,
                        );
                    }

                    if (
                        refreshSubmission
                        &&
                        res?.overview?.can_continue
                    ) {
                        this.checkSubmission();
                    } else {
                        this.submissionPreview.set(
                            null,
                        );
                        this.checkingSubmission.set(
                            false,
                        );
                    }
                },
                error: (err) => {
                    this.navService.clear();
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load internal audit.',
                    );
                    this.loading.set(false);
                    this.checkingSubmission.set(
                        false,
                    );
                },
            });
    }

    canUseRemarks(
        audit: any = this.overview(),
    ) {
        return [1, 3].includes(
            Number(
                audit?.audit_status_id,
            ),
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

        this.confirmationService.confirm({
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

    backToDashboard() {
        this.router.navigate([
            '/auditor/audit-dashboard',
        ]);
    }

    openCategory(
        category: any,
        pendingIssues: any[] = [],
    ) {
        if (
            !category?.id
        ) {
            return;
        }

        const categoryId =
            Number(category.id);

        if (
            category?.carry_forward
            ||
            categoryId === 0
        ) {
            this.router.navigate(
                [],
                {
                    relativeTo:
                        this.route,
                    queryParams: {
                        view:
                            'carry-forward',
                        categoryId:
                            null,
                        dumpId:
                            null,
                        pending:
                            null,
                    },
                    queryParamsHandling:
                        'merge',
                    replaceUrl:
                        false,
                },
            );
            return;
        }

        const pendingQuestionIds =
            pendingIssues
                .map(
                    (issue: any) =>
                        Number(issue.question_id),
                )
                .filter(Boolean);

        const dumpId =
            Number(
                pendingIssues[0]?.dump_id || 0,
            );

        const currentPending =
            this.selectedPendingQuestionIds();

        const isSameSelection =
            this.selectedView() === 'category'
            && Number(this.selectedCategoryId()) === categoryId
            && Number(this.selectedDumpId()) === dumpId
            && currentPending.length === pendingQuestionIds.length
            && currentPending.every(
                (
                    questionId,
                    index,
                ) =>
                    Number(questionId) === Number(pendingQuestionIds[index]),
            );

        if (
            isSameSelection
        ) {
            return;
        }

        this.selectedCategoryId.set(
            categoryId,
        );
        this.selectedPendingQuestionIds.set(
            pendingQuestionIds,
        );
        this.selectedDumpId.set(
            dumpId,
        );

        this.router.navigate(
            [],
            {
                relativeTo:
                    this.route,
                queryParams: {
                    view:
                        'category',
                    categoryId:
                        categoryId,
                    dumpId:
                        dumpId || null,
                    pending:
                        pendingQuestionIds.length
                            ? pendingQuestionIds
                                .join(',')
                            : null,
                },
                queryParamsHandling:
                    'merge',
                replaceUrl:
                    false,
            },
        );
    }

    checkSubmission() {

        const assessment =
            this.overview();

        if (
            this.checkingSubmission()
        ) {
            return;
        }

        if (
            !assessment?.id
        ) {
            return;
        }

        const requestId =
            ++this.submissionCheckRequest;

        this.checkingSubmission.set(
            true,
        );
        this.submissionMessage.set('');

        this.service
            .getInternalAuditSubmissionPreview(
                Number(assessment.id),
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        requestId !== this.submissionCheckRequest
                    ) {
                        return;
                    }

                    this.submissionPreview.set(
                        res,
                    );
                    this.submissionMessage.set(
                        res?.message || '',
                    );
                    this.checkingSubmission.set(
                        false,
                    );
                },
                error: (err) => {
                    if (
                        requestId !== this.submissionCheckRequest
                    ) {
                        return;
                    }

                    this.submissionMessage.set(
                        err?.error?.message
                        || 'Unable to check audit completion.',
                    );
                    this.checkingSubmission.set(
                        false,
                    );
                },
            });
    }

    loadCarryForward(
        assessmentId?: number,
    ) {
        const id =
            Number(
                assessmentId
                || this.overview()?.id
                || this.route.snapshot.paramMap.get(
                    'assessmentId',
                )
                || 0,
            );

        if (
            !id
        ) {
            return;
        }

        this.carryForwardLoading.set(true);

        this.service
            .getInternalAuditCarryForwardPoints(
                id,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.carryForward.set(
                        res?.points || [],
                    );
                    this.carryForwardLoading.set(false);
                },
                error: (err) => {
                    this.carryForwardLoading.set(false);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to load carry forward points.',
                    );
                },
            });
    }

    saveCarryForwardComment(
        point: any,
    ) {
        const assessmentId =
            Number(
                this.overview()?.id
                || this.route.snapshot.paramMap.get(
                    'assessmentId',
                )
                || 0,
            );

        const annexureId =
            Number(point?.id || 0);

        if (
            !assessmentId
            ||
            !annexureId
        ) {
            this.notification.error(
                'Unable to identify carry-forward point.',
            );
            return;
        }

        if (
            this.savingCarryForwardId()
        ) {
            return;
        }

        this.savingCarryForwardId.set(
            annexureId,
        );

        this.service
            .saveInternalAuditCarryForwardComment(
                assessmentId,
                annexureId,
                this.employeeId(),
                point.audit_comment || '',
            )
            .subscribe({
                next: (res: any) => {
                    this.savingCarryForwardId.set(
                        null,
                    );
                    const saved =
                        res?.point || {};

                    this.carryForward.update(
                        (points) =>
                            points.map(
                                (item) =>
                                    Number(item.id) === annexureId
                                        ? {
                                            ...item,
                                            audit_comment:
                                                saved.audit_comment
                                                ?? point.audit_comment
                                                ?? '',
                                            audit_status_id:
                                                Number(saved.audit_status_id || 1),
                                        }
                                        : item,
                            ),
                    );
                    this.notification.success(
                        res?.message
                        || 'Carry-forward comment saved successfully.',
                    );
                    this.loadMenu(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.savingCarryForwardId.set(
                        null,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save carry-forward comment.',
                    );
                },
            });
    }

    submitForReview() {

        const assessment =
            this.overview();

        if (
            !assessment?.id
            ||
            !this.submissionPreview()?.can_submit
        ) {
            return;
        }

        this.confirmationService.confirm({
            header:
                Number(assessment.audit_status_id) === 3
                    ? 'Submit Re-Audit'
                    : this.isLiveManagerComplianceFlow()
                        ? this.liveSubmitHeading()
                        : 'Submit Audit',
            message:
                Number(assessment.audit_status_id) === 3
                    ? 'Resubmit corrected audit points for reviewer action?'
                    : this.isLiveManagerComplianceFlow()
                        ? this.liveSubmitMessage()
                        : 'Submit this audit for reviewer action?',
            icon:
                'pi pi-send',
            acceptLabel:
                'Submit',
            rejectLabel:
                'Cancel',
            accept:
                () =>
                    this.performSubmit(
                        Number(assessment.id),
                    ),
        });
    }

    backToSummary() {
        this.selectedView.set(
            'summary',
        );

        this.selectedCategoryId.set(
            null,
        );

        this.selectedPendingQuestionIds.set(
            [],
        );

        this.selectedDumpId.set(
            0,
        );

        this.router.navigate(
            [],
            {
                relativeTo:
                    this.route,
                queryParams: {
                    view:
                        'summary',
                    categoryId:
                        null,
                    dumpId:
                        null,
                    pending:
                        null,
                },
                queryParamsHandling:
                    'merge',
            },
        );
    }

    showBackToSummaryButton() {
        return (
            this.selectedView() === 'category'
            &&
            (
                this.selectedPendingQuestionIds().length > 0
                ||
                Number(this.selectedDumpId() || 0) > 0
            )
        );
    }

    openPendingCategory(
        issue: any,
    ) {

        if (
            issue?.type === 'executive_summary'
        ) {
            this.openExecutiveSummary();
            return;
        }

        if (
            issue?.type === 'carry_forward'
        ) {
            this.selectedView.set(
                'carry-forward',
            );
            this.selectedCategoryId.set(
                null,
            );
            this.router.navigate(
                [],
                {
                    relativeTo:
                        this.route,
                    queryParams: {
                        view:
                            'carry-forward',
                        categoryId:
                            null,
                    },
                    queryParamsHandling:
                        'merge',
                },
            );
            this.loadCarryForward();
            return;
        }

        if (
            this.checkingSubmission()
        ) {
            return;
        }

        const category =
            this.menus()
                .flatMap(
                    (menu: any) =>
                        menu.categories || [],
                )
                .find(
                    (item: any) =>
                        Number(item.id)
                        === Number(issue?.category_id),
                );

        if (
            category
        ) {
            const pendingIssues =
                (this.submissionPreview()?.issues || [])
                    .filter(
                        (pendingIssue: any) =>
                            Number(pendingIssue.category_id)
                            === Number(issue?.category_id),
                    )
                    .filter(
                        (pendingIssue: any) =>
                            !Number(issue?.dump_id || 0)
                            ||
                            Number(pendingIssue.dump_id || 0)
                            === Number(issue?.dump_id),
                    );

            this.openCategory(
                category,
                pendingIssues,
            );
        }
    }

    isSelectedCategory(
        categoryId: any,
    ) {
        return Number(categoryId)
            === Number(
                this.selectedCategoryId(),
            );
    }

    private ensureSelectedCategory() {
        const categories =
            this.menus()
                .flatMap(
                    (menu: any) =>
                        menu.categories || [],
                );

        if (
            !categories.length
        ) {
            this.selectedCategoryId.set(
                null,
            );
            return;
        }

        const exists =
            categories.some(
                (category: any) =>
                    Number(category.id)
                    === Number(
                        this.selectedCategoryId(),
                    ),
            );

        if (
            exists
        ) {
            return;
        }

        this.selectedCategoryId.set(
            null,
        );
        this.selectedPendingQuestionIds.set(
            [],
        );
        this.selectedDumpId.set(0);

        this.router.navigate(
            [],
            {
                relativeTo:
                    this.route,
                queryParams: {
                    view:
                        'summary',
                    categoryId:
                        null,
                    dumpId:
                        null,
                    pending:
                        null,
                },
                queryParamsHandling:
                    'merge',
                replaceUrl:
                    true,
            },
        );
    }

    private applyRouteSelection(
        viewParam: string | null,
        categoryIdParam: string | null,
        dumpIdParam: string | null,
        pendingParam: string | null,
    ) {
        const view =
            viewParam === 'category'
                ? 'category'
                : viewParam === 'carry-forward'
                    ? 'carry-forward'
                : 'summary';

        this.selectedView.set(
            view,
        );

        const categoryId =
            Number(categoryIdParam || 0);

        if (
            view === 'category'
            &&
            categoryId
        ) {
            this.selectedCategoryId.set(
                categoryId,
            );
        } else if (
            view === 'summary'
            ||
            view === 'carry-forward'
        ) {
            this.selectedCategoryId.set(
                null,
            );
        }

        if (
            view === 'carry-forward'
        ) {
            this.loadCarryForward();
        }

        this.selectedDumpId.set(
            Number(dumpIdParam || 0),
        );

        this.selectedPendingQuestionIds.set(
            String(pendingParam || '')
                .split(',')
                .map(
                    (questionId: string) =>
                        Number(questionId),
                )
                .filter(Boolean),
        );
    }

    private performSubmit(
        assessmentId: number,
    ) {

        this.submitting.set(
            true,
        );
        this.submissionMessage.set('');

        this.service
            .submitInternalAudit(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.submitting.set(
                        false,
                    );
                    this.submissionMessage.set(
                        res?.message || '',
                    );

                    if (
                        !res?.success
                    ) {
                        this.submissionPreview.set(
                            res,
                        );
                        return;
                    }

                    this.submissionPreview.set(
                        null,
                    );
                    this.loadMenu(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.submitting.set(
                        false,
                    );
                    this.submissionMessage.set(
                        err?.error?.message
                        || 'Unable to submit audit.',
                    );
                },
            });
    }

    isLiveManagerComplianceFlow() {
        return audit_flow_config.liveManagerCompliance === true;
    }

    canShowApplyDefaultsButton() {
        return Number(audit_flow_config.showApplyDefaultsAndSaveAll || 0) === 1;
    }

    submitActionLabel(audit: any) {
        if (
            Number(audit?.audit_status_id) === 3
        ) {
            return 'Resubmit to Reviewer';
        }

        return this.isLiveManagerComplianceFlow()
            ? this.liveSubmitHeading()
            : 'Submit for Review';
    }

    liveSubmitHeading() {
        const currentStatus =
            Number(
                this.overview()?.audit_status_id || 0,
            );
        const nextStatus =
            Number(
                this.submissionPreview()?.live_next_status || 0,
            );

        if (!nextStatus && currentStatus === 1) {
            return 'Submit to Manager';
        }

        if (!nextStatus && currentStatus === 4) {
            return 'Submit to Reviewer';
        }

        if (nextStatus === 4) {
            return 'Submit to Manager';
        }

        if (nextStatus === 5) {
            return 'Submit to Reviewer';
        }

        return 'Complete Assessment';
    }

    private liveSubmitMessage() {
        const currentStatus =
            Number(
                this.overview()?.audit_status_id || 0,
            );
        const nextStatus =
            Number(
                this.submissionPreview()?.live_next_status || 0,
            );

        if (!nextStatus && currentStatus === 1) {
            return 'Submit this audit to Manager for compliance responses?';
        }

        if (!nextStatus && currentStatus === 4) {
            return 'Submit the Auditor-reviewed compliance points to Reviewer?';
        }

        if (nextStatus === 4) {
            return 'Submit this audit to Manager for compliance responses?';
        }

        if (nextStatus === 5) {
            return 'Submit the Auditor-reviewed compliance points to Reviewer?';
        }

        return 'Complete this audit assessment?';
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

    getStatusSeverity(
        overview: any,
    ) {
        if (
            overview?.can_continue
        ) {
            return 'success';
        }

        if (
            overview?.block_reason
        ) {
            return 'danger';
        }

        return 'secondary';
    }

    applyDefaultsAndSaveAll(assessmentId: number) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to apply default answers and save for all unanswered questions across all categories in this assessment?',
            header: 'Apply Defaults & Save All',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.applyingDefaultsAll.set(true);
                this.service.applyDefaultsAll(assessmentId, this.employeeId())
                    .subscribe({
                        next: (res: any) => {
                            this.applyingDefaultsAll.set(false);
                            if (res?.success) {
                                this.notification.success(res?.message || 'Default answers applied and saved successfully.');
                                this.loadMenu(assessmentId, true, true);
                            } else {
                                this.notification.error(res?.message || 'Unable to apply default answers.');
                            }
                        },
                        error: (err) => {
                            this.applyingDefaultsAll.set(false);
                            this.notification.error(err?.error?.message || 'Error occurred while applying defaults.');
                        }
                    });
            }
        });
    }
}
