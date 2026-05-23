import {
    CommonModule,
} from '@angular/common';
import {
    Component,
    OnInit,
    Optional,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { FormDrawerRef } from '../../../../core/services/drawer/form-drawer.ref';
import { AuditDashboardService } from '../../services/auditor-main.service';

@Component({
    selector: 'app-category-assessment',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SkeletonModule,
    ],
    templateUrl: './category-assessment.component.html',
    styleUrl: '../internal-audit.component.css',
})
export class CategoryAssessmentComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    constructor(
        @Optional()
        private drawerRef?: FormDrawerRef<any, any>,
    ) {
    }

    loading =
        signal(false);

    categoryDetail =
        signal<any>(null);

    error =
        signal('');

    answerErrors =
        signal<Record<string, string>>({});

    saveMessage =
        signal('');

    savingHeader =
        signal<number | null>(null);

    drawerMode =
        signal(false);

    savedAny =
        signal(false);

    ngOnInit() {
        const drawerData =
            this.drawerRef?.data || {};

        this.drawerMode.set(
            Boolean(
                drawerData.assessmentId
                &&
                drawerData.categoryId,
            ),
        );

        const assessmentId =
            Number(
                drawerData.assessmentId
                ||
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        const categoryId =
            Number(
                drawerData.categoryId
                ||
                this.route.snapshot.paramMap.get(
                    'categoryId',
                ),
            );

        if (
            !assessmentId
            ||
            !categoryId
        ) {
            this.error.set(
                'Category not found.',
            );
            return;
        }

        this.loadCategory(
            assessmentId,
            categoryId,
        );
    }

    loadCategory(
        assessmentId: number,
        categoryId: number,
    ) {

        this.loading.set(true);
        this.error.set('');

        this.service
            .getInternalAuditCategory(
                assessmentId,
                categoryId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.categoryDetail.set(
                        this.prepareCategoryDetail(res),
                    );
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load category questions.',
                    );
                    this.loading.set(false);
                },
            });
    }

    prepareCategoryDetail(
        detail: any,
    ) {

        this.prepareSets(
            detail?.sets || [],
        );

        return detail;
    }

    prepareSets(
        sets: any[],
    ) {

        for (
            const set
            of sets
        ) {

            for (
                const header
                of set.headers || []
            ) {

                for (
                    const question
                    of header.questions || []
                ) {

                    question.answer_value =
                        question.answer?.answer_given || '';
                    question.audit_comment =
                        question.answer?.audit_comment || '';
                    question.is_compliance =
                        Boolean(
                            Number(
                                question.answer?.is_compliance || 0,
                            ),
                        );
                    this.prepareSets(
                        question.subset_sets || [],
                    );
                }
            }
        }
    }

    saveHeader(
        header: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !header?.questions?.length
        ) {
            return;
        }

        const answers =
            header.questions.map(
                (question: any) => ({
                    question_id:
                        question.id,
                    header_id:
                        header.id,
                    answer_given:
                        question.answer_value || '',
                    audit_comment:
                        question.audit_comment || '',
                    is_compliance:
                        question.is_compliance === true,
                }),
            );

        this.savingHeader.set(
            header.id,
        );
        this.answerErrors.set({});
        this.saveMessage.set('');

        this.service
            .saveInternalAuditCategoryAnswers(
                Number(
                    detail.overview.id,
                ),
                Number(
                    detail.category.id,
                ),
                this.employeeId(),
                answers,
            )
            .subscribe({
                next: (res: any) => {
                    this.savingHeader.set(null);

                    if (
                        !res?.success
                    ) {
                        this.answerErrors.set(
                            res?.errors || {},
                        );
                        this.saveMessage.set(
                            res?.message || 'Please correct highlighted answers.',
                        );
                        return;
                    }

                    this.saveMessage.set(
                        res.message || 'Answers saved successfully',
                    );
                    this.savedAny.set(true);
                    this.loadCategory(
                        Number(
                            detail.overview.id,
                        ),
                        Number(
                            detail.category.id,
                        ),
                    );
                },
                error: (err) => {
                    this.savingHeader.set(null);
                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to save answers.',
                    );
                },
            });
    }

    answerOptions(
        question: any,
    ) {

        const parameters =
            Array.isArray(
                question?.parameters,
            )
                ? question.parameters
                : [];

        const options =
            parameters.map(
                (item: any) => ({
                    value:
                        item.rt,
                    label:
                        item.rt,
                }),
            );

        if (
            Number(question?.option_id) === 4
            &&
            question?.annexure_id
        ) {

            options.push({
                value:
                    String(question.annexure_id),
                label:
                    'As per annexure',
            });
        }

        if (
            Number(question?.option_id) === 5
            &&
            question?.subset_sets?.length
        ) {

            for (
                const set
                of question.subset_sets
            ) {

                if (
                    options.some(
                        (option: any) =>
                            String(option.value)
                            ===
                            String(set.id),
                    )
                ) {
                    continue;
                }

                options.push({
                    value:
                        String(set.id),
                    label:
                        set.name,
                });
            }
        }

        if (
            options.length
        ) {

            return options;
        }

        if (
            Number(question?.option_id) === 5
            &&
            question?.subset_multi_id
        ) {

            return String(question.subset_multi_id)
                .split(',')
                .map(
                    (item) =>
                        item.trim(),
                )
                .filter(Boolean)
                .map(
                    (item) => ({
                        value:
                            item,
                        label:
                            `Subset ${item}`,
                    }),
                );
        }

        return [];
    }

    isTextAnswer(
        question: any,
    ) {
        return Number(
            question?.option_id,
        ) === 3;
    }

    selectedSubsetSets(
        question: any,
    ) {

        if (
            Number(question?.option_id) !== 5
        ) {
            return [];
        }

        const selected =
            String(
                question.answer_value || '',
            );

        return (question.subset_sets || [])
            .filter(
                (set: any) =>
                    String(set.id) === selected,
            );
    }

    isAnnexureSelected(
        question: any,
    ) {

        return Number(question?.option_id) === 4
            &&
            question?.annexure_id
            &&
            String(question.answer_value || '')
            ===
            String(question.annexure_id);
    }

    questionError(
        question: any,
    ) {
        return this.answerErrors()[question?.id] || '';
    }

    hasAnswerErrors() {
        return Object.keys(
            this.answerErrors(),
        ).length > 0;
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
        if (
            this.drawerMode()
        ) {
            this.closeDrawer();
            return;
        }

        this.router.navigate([
            '/auditor/audit-dashboard',
        ]);
    }

    backToWorkspace() {
        if (
            this.drawerMode()
        ) {
            this.closeDrawer();
            return;
        }

        const assessmentId =
            this.categoryDetail()?.overview?.id;

        if (!assessmentId) {
            return;
        }

        this.router.navigate([
            '/auditor/internal-audit',
            assessmentId,
        ]);
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

    closeDrawer() {
        this.drawerRef?.close({
            saved:
                this.savedAny(),
        });
    }
}
