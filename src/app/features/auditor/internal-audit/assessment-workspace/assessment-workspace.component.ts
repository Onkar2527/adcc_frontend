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
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { NotificationService } from '../../../../core/services/notification/notification.service';
import { AuditDashboardService } from '../../services/auditor-main.service';
import { CategoryAssessmentComponent } from '../category-assessment/category-assessment.component';

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

    private drawer =
        inject(FormDrawerService);

    private confirmationService =
        inject(ConfirmationService);

    private notification =
        inject(NotificationService);

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
    ) {
        this.loading.set(true);
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

    async openCategory(
        category: any,
        pendingIssues: any[] = [],
    ) {
        const assessment =
            this.overview();
        const refreshSubmission =
            Boolean(
                this.submissionPreview(),
            );

        if (
            !assessment?.id
            ||
            !category?.id
        ) {
            return;
        }

        await this.drawer.open(
            CategoryAssessmentComponent,
            {
                header:
                    pendingIssues.length
                        ? `Pending: ${category.name || 'Category Assessment'}`
                        : category.name || 'Category Assessment',
                icon:
                    'pi pi-list-check',
                width:
                    '100vw',
                dismissible:
                    false,
                data: {
                    assessmentId:
                        assessment.id,
                    categoryId:
                        category.id,
                    pendingQuestionIds:
                        pendingIssues.map(
                            (issue: any) =>
                                Number(issue.question_id),
                        ),
                },
            },
        );

        this.loadMenu(
            assessment.id,
            refreshSubmission,
        );
    }

    checkSubmission() {

        const assessment =
            this.overview();

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
                'Submit Audit',
            message:
                'Submit this audit for reviewer action?',
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

    openPendingCategory(
        issue: any,
    ) {

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
                    );

            this.openCategory(
                category,
                pendingIssues,
            );
        }
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
}
