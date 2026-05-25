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

import {
    FormsModule,
} from '@angular/forms';

import {
    ActivatedRoute,
    Router,
} from '@angular/router';

import {
    ButtonModule,
} from 'primeng/button';

import {
    SkeletonModule,
} from 'primeng/skeleton';

import {
    FormDrawerRef,
} from '../../../../core/services/drawer/form-drawer.ref';

import {
    AuditDashboardService,
} from '../../services/auditor-main.service';

@Component({
    selector: 'app-category-assessment',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SkeletonModule,
    ],

    templateUrl:
        './category-assessment.component.html',

    styleUrl:
        '../internal-audit.component.css',
})

export class CategoryAssessmentComponent
    implements OnInit {

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

        const userData =
            localStorage.getItem(
                'user',
            ) || '{}';

        const user =
            JSON.parse(userData);

        this.employeeId =
            Number(
                user.id
                || user.employee_id
                || user.emp_id
                || 0,
            );
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

    uploadingAnnexureQuestion =
        signal<number | null>(null);

    drawerMode =
        signal(false);

    savedAny =
        signal(false);

    employeeId = 0;

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
                this.employeeId,
            )
            .subscribe({

                next: (res: any) => {

                    const prepared =
                        this.prepareCategoryDetail(
                            structuredClone(res),
                        );

                    this.categoryDetail.set(
                        prepared,
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
            detail?.annexure_risk_options || {},
        );

        return detail;
    }

    prepareSets(
        sets: any[],
        riskOptions: any,
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
                    question.annexure_rows =
                        question.answer?.annexure_rows || [];
                    question.annexure_draft =
                        this.createAnnexureDraft(
                            question,
                            undefined,
                            riskOptions,
                        );

                    question.options =
                        this.buildAnswerOptions(
                            question,
                        );

                    question.selectedSubsetSets =
                        this.buildSelectedSubsetSets(
                            question,
                        );

                    question.isAnnexureSelected =
                        this.buildIsAnnexureSelected(
                            question,
                        );

                    this.prepareSets(
                        question.subset_sets || [],
                        riskOptions,
                    );
                }
            }
        }
    }

    buildAnswerOptions(
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

                const exists =
                    options.some(
                        (option: any) =>
                            String(option.value)
                            ===
                            String(set.id),
                    );

                if (
                    exists
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

    buildSelectedSubsetSets(
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
                    String(set.id)
                    ===
                    selected,
            );
    }

    buildIsAnnexureSelected(
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

        this.answerErrors.set(
            {},
        );

        this.saveMessage.set(
            '',
        );

        this.service
            .saveInternalAuditCategoryAnswers(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
                answers,
            )
            .subscribe({

                next: (res: any) => {

                    this.savingHeader.set(
                        null,
                    );

                    if (
                        !res?.success
                    ) {

                        this.answerErrors.set(
                            res?.errors || {},
                        );

                        this.saveMessage.set(
                            res?.message
                            || 'Please correct highlighted answers.',
                        );

                        return;
                    }

                    this.saveMessage.set(
                        res.message
                        || 'Answers saved successfully',
                    );

                    this.savedAny.set(
                        true,
                    );

                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                    );
                },

                error: (err) => {

                    this.savingHeader.set(
                        null,
                    );

                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to save answers.',
                    );
                },
            });
    }

    isTextAnswer(
        question: any,
    ) {

        return Number(
            question?.option_id,
        ) === 3;
    }

    hasAnswerErrors() {

        return Object.keys(
            this.answerErrors(),
        ).length > 0;
    }

    createAnnexureDraft(
        question: any,
        row?: any,
        riskOptions: any =
            this.annexureRiskOptions(),
    ) {

        const columns =
            question?.annexure?.columns || [];

        const defaults =
            this.defaultAnnexureRisk(
                question,
                riskOptions,
            );

        return {
            id:
                row?.id || 0,
            values:
                columns.map(
                    (
                        _column: any,
                        index: number,
                    ) =>
                        row?.values?.[index] || '',
                ),
            business_risk:
                row?.business_risk || defaults.business_risk,
            control_risk:
                row?.control_risk || defaults.control_risk,
            risk_cat_id:
                row?.risk_cat_id || defaults.risk_cat_id,
        };
    }

    annexureRiskOptions() {
        return this.categoryDetail()
            ?.annexure_risk_options || {};
    }

    isCustomAnnexureRisk(
        question: any,
    ) {
        return Number(
            question?.annexure?.risk_defination_id || 0,
        ) === 1;
    }

    defaultAnnexureRisk(
        question: any,
        riskOptions: any =
            this.annexureRiskOptions(),
    ) {

        const riskCategory =
            (riskOptions?.risk_categories || [])
                .find(
                    (item: any) =>
                        Number(item.id) === 1,
                )
            ||
            (riskOptions?.risk_categories || [])[0];

        if (
            !this.isCustomAnnexureRisk(question)
        ) {
            return {
                business_risk:
                    1,
                control_risk:
                    1,
                risk_cat_id:
                    Number(riskCategory?.id || 0),
            };
        }

        return {
            business_risk:
                '',
            control_risk:
                '',
            risk_cat_id:
                '',
        };
    }

    riskLabel(
        riskId: any,
        type: 'business_risks' | 'control_risks',
    ) {
        return (
            this.annexureRiskOptions()?.[type] || []
        ).find(
            (risk: any) =>
                Number(risk.id) === Number(riskId),
        )?.label || '-';
    }

    riskCategoryLabel(
        riskCategoryId: any,
    ) {
        return (
            this.annexureRiskOptions()?.risk_categories || []
        ).find(
            (risk: any) =>
                Number(risk.id) === Number(riskCategoryId),
        )?.risk_category || '-';
    }

    annexureColumnOptions(
        column: any,
    ) {
        return Array.isArray(column?.options)
            ? column.options
            : [];
    }

    saveAnnexureRow(
        question: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !question?.id
            ||
            !question?.annexure_draft
        ) {
            return;
        }

        this.saveMessage.set('');

        this.service
            .saveInternalAuditAnnexureRow(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
                question.annexure_draft,
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        !res?.success
                    ) {
                        this.saveMessage.set(
                            res?.message || 'Unable to save annexure row.',
                        );
                        return;
                    }

                    this.saveMessage.set(
                        res.message || 'Annexure row saved successfully',
                    );
                    this.savedAny.set(true);
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                    );
                },
                error: (err) => {
                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to save annexure row.',
                    );
                },
            });
    }

    editAnnexureRow(
        question: any,
        row: any,
    ) {
        question.annexure_draft =
            this.createAnnexureDraft(
                question,
                row,
                this.annexureRiskOptions(),
            );
    }

    clearAnnexureDraft(
        question: any,
    ) {
        question.annexure_draft =
            this.createAnnexureDraft(
                question,
                undefined,
                this.annexureRiskOptions(),
            );
    }

    deleteAnnexureRow(
        question: any,
        row: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !question?.id
            ||
            !row?.id
        ) {
            return;
        }

        this.service
            .deleteInternalAuditAnnexureRow(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                Number(row.id),
                this.employeeId,
            )
            .subscribe({
                next: (res: any) => {
                    this.saveMessage.set(
                        res?.message || 'Annexure row deleted successfully',
                    );
                    this.savedAny.set(true);
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                    );
                },
                error: (err) => {
                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to delete annexure row.',
                    );
                },
            });
    }

    downloadAnnexureSample(
        question: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !question?.id
        ) {
            return;
        }

        this.saveMessage.set('');

        this.service
            .getInternalAuditAnnexureSample(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        !res?.success
                        ||
                        !res?.csv
                    ) {
                        this.saveMessage.set(
                            res?.message || 'Unable to download annexure sample.',
                        );
                        return;
                    }

                    const blob =
                        new Blob(
                            [res.csv],
                            {
                                type:
                                    'text/csv;charset=utf-8;',
                            },
                        );

                    const url =
                        URL.createObjectURL(blob);

                    const link =
                        document.createElement('a');

                    link.href =
                        url;
                    link.download =
                        res.filename || 'sample-annexure.csv';
                    link.click();

                    URL.revokeObjectURL(url);
                },
                error: (err) => {
                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to download annexure sample.',
                    );
                },
            });
    }

    uploadAnnexureCsv(
        question: any,
        event: Event,
    ) {

        const input =
            event.target as HTMLInputElement;

        const file =
            input.files?.[0];

        input.value = '';

        const detail =
            this.categoryDetail();

        if (
            !file
            ||
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !question?.id
        ) {
            return;
        }

        if (
            !file.name.toLowerCase().endsWith('.csv')
        ) {
            this.saveMessage.set(
                'Only CSV files are allowed.',
            );
            return;
        }

        this.uploadingAnnexureQuestion.set(
            Number(question.id),
        );
        this.saveMessage.set('');

        this.service
            .uploadInternalAuditAnnexureCsv(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
                file,
            )
            .subscribe({
                next: (res: any) => {
                    this.uploadingAnnexureQuestion.set(null);

                    if (
                        !res?.success
                    ) {
                        const firstError =
                            Array.isArray(res?.errors)
                                &&
                                res.errors.length
                                ? ` Row ${res.errors[0].row}: ${res.errors[0].errors?.join(', ')}`
                                : '';

                        this.saveMessage.set(
                            `${res?.message || 'Unable to upload annexure CSV.'}${firstError}`,
                        );
                        return;
                    }

                    this.saveMessage.set(
                        res.message || 'Annexure CSV uploaded successfully.',
                    );
                    this.savedAny.set(true);
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                    );
                },
                error: (err) => {
                    this.uploadingAnnexureQuestion.set(null);
                    this.saveMessage.set(
                        err?.error?.message
                        || 'Unable to upload annexure CSV.',
                    );
                },
            });
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

        if (
            !assessmentId
        ) {
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
