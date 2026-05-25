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
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { AuditDashboardService } from '../../services/auditor-main.service';
import { CategoryAssessmentComponent } from '../category-assessment/category-assessment.component';

@Component({
    selector: 'app-assessment-workspace',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
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
