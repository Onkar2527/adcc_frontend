import {
    CommonModule,
} from '@angular/common';

import {
    ChangeDetectorRef,
    Component,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnChanges,
    Optional,
    SimpleChanges,
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
    NotificationService,
} from '../../../../core/services/notification/notification.service';

import {
    AuditDashboardService,
} from '../../services/auditor-main.service';
import { TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-category-assessment',

    standalone: true,

    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        SkeletonModule,
        TableModule,
        AccordionModule,
    ],

    templateUrl:
        './category-assessment.component.html',

    styleUrl:
        '../internal-audit.component.css',
})

export class CategoryAssessmentComponent
    implements OnInit, OnChanges {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private cdr =
        inject(ChangeDetectorRef);

    private service =
        inject(AuditDashboardService);

    private notification =
        inject(NotificationService);

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

    loadingSubsetKey =
        signal('');

    error =
        signal('');

    answerErrors =
        signal<Record<string, string>>({});

    savingHeader =
        signal<number | null>(null);

    savingAllHeaders =
        signal(false);

    openedHeaders =
        signal<Record<string, string[]>>({});

    savingAnnexureQuestion =
        signal<number | null>(null);

    uploadingAnnexureQuestion =
        signal<number | null>(null);

    deletingAnnexureRowKey =
        signal('');

    uploadingEvidenceKey =
        signal('');

    drawerMode =
        signal(false);

    pendingOnly =
        signal(false);

    savedAny =
        signal(false);

    @Output()
    saved = new EventEmitter<void>();

    markSaved() {
        this.savedAny.set(true);
        this.saved.emit();
    }

    selectedDumpId =
        signal(0);

    completingAccount =
        signal(false);

    completingRemainingAccounts =
        signal(false);

    samplingOpen =
        signal(false);

    samplingLoading =
        signal(false);

    samplingSaving =
        signal(false);

    samplingData =
        signal<any>(null);

    accountSearch = '';

    samplingFilterType = 0;

    samplingPrimaryValue = '';

    samplingSecondaryValue = '';

    samplingSelection: number[] = [];

    employeeId = 0;
    riskOptions: any = {};

    columnOptionsMap: any = {};

    private activeLoadKey = '';

    private categoryLoadRequest = 0;

    private readonly defaultOpenedHeaders = ['0'];

    @Input()
    assessmentIdInput:
        number | null = null;

    @Input()
    categoryIdInput:
        number | null = null;

    @Input()
    pendingQuestionIdsInput:
        number[] = [];

    @Input()
    dumpIdInput = 0;

    @Input()
    workspaceMode = false;

    private pendingQuestionIds =
        new Set<number>();

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

        this.pendingQuestionIds =
            new Set<number>(
                (
                    this.pendingQuestionIdsInput?.length
                        ? this.pendingQuestionIdsInput
                        : drawerData.pendingQuestionIds || []
                )
                    .map(
                        (questionId: any) =>
                            Number(questionId),
                    )
                    .filter(Boolean),
            );

        this.pendingOnly.set(
            this.pendingQuestionIds.size > 0,
        );

        this.selectedDumpId.set(
            Number(
                this.dumpIdInput || drawerData.dumpId || 0,
            ),
        );

        const assessmentId =
            Number(
                this.assessmentIdInput
                ||
                drawerData.assessmentId
                ||
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        const categoryId =
            Number(
                this.categoryIdInput
                ||
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

        if (
            this.workspaceMode
            &&
            this.assessmentIdInput
            &&
            this.categoryIdInput
        ) {
            return;
        }

        this.loadCategory(
            assessmentId,
            categoryId,
        );
    }

    ngOnChanges(
        changes: SimpleChanges,
    ) {
        if (
            !this.workspaceMode
            ||
            !this.assessmentIdInput
            ||
            !this.categoryIdInput
        ) {
            return;
        }

        if (
            changes['pendingQuestionIdsInput']
        ) {
            this.pendingQuestionIds =
                new Set<number>(
                    (this.pendingQuestionIdsInput || [])
                        .map(
                            (questionId: any) =>
                                Number(questionId),
                        )
                        .filter(Boolean),
                );

            this.pendingOnly.set(
                this.pendingQuestionIds.size > 0,
            );
        }

        if (
            changes['dumpIdInput']
        ) {
            this.selectedDumpId.set(
                Number(
                    this.dumpIdInput || 0,
                ),
            );
        }

        if (
            changes['assessmentIdInput']
            ||
            changes['categoryIdInput']
            ||
            changes['dumpIdInput']
            ||
            changes['pendingQuestionIdsInput']
        ) {
            this.loadCategory(
                Number(
                    this.assessmentIdInput,
                ),
                Number(
                    this.categoryIdInput,
                ),
            );
        }
    }

    loadCategory(
        assessmentId: number,
        categoryId: number,
        showLoader = true,
        dumpId = this.selectedDumpId(),
    ) {
        const loadKey =
            [
                Number(assessmentId) || 0,
                Number(categoryId) || 0,
                Number(dumpId) || 0,
                this.pendingOnly() ? 'pending' : 'all',
                Array.from(this.pendingQuestionIds)
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            first - second,
                    )
                    .join(','),
            ].join(':');

        if (
            this.activeLoadKey === loadKey
        ) {
            return;
        }

        this.activeLoadKey =
            loadKey;

        const requestId =
            ++this.categoryLoadRequest;

        if (
            showLoader
        ) {
            this.loading.set(true);

            this.error.set('');
        }

        this.service
            .getInternalAuditCategory(
                assessmentId,
                categoryId,
                this.employeeId,
                dumpId,
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        requestId !== this.categoryLoadRequest
                    ) {
                        return;
                    }

                    this.activeLoadKey = '';

                    const prepared =
                        this.prepareCategoryDetail(
                            structuredClone(res),
                        );

                    this.categoryDetail.set(
                        prepared,
                    );

                    this.selectedDumpId.set(
                        Number(
                            prepared?.selected_account?.id || 0,
                        ),
                    );

                    if (
                        showLoader
                    ) {
                        this.loading.set(false);
                    }
                },

                error: (err) => {
                    if (
                        requestId !== this.categoryLoadRequest
                    ) {
                        return;
                    }

                    this.activeLoadKey = '';

                    if (
                        showLoader
                    ) {
                        this.error.set(
                            err?.error?.message
                            || 'Unable to load category questions.',
                        );

                        this.loading.set(false);
                    } else {
                        this.notification.error(
                            err?.error?.message
                            || 'Saved, but unable to refresh category questions.',
                        );
                    }
                },
            });
    }


    prepareCategoryDetail(
        detail: any,
    ) {

        if (
            this.pendingOnly()
        ) {
            detail.sets =
                this.filterPendingSets(
                    detail?.sets || [],
                );
        }

        this.prepareSets(
            detail?.sets || [],
            detail?.annexure_risk_options || {},
        );

        return detail;
    }

    filterPendingSets(
        sets: any[],
    ): any[] {

        return (sets || [])
            .map(
                (set: any) => ({
                    ...set,
                    headers:
                        (set.headers || [])
                            .map(
                                (header: any) => ({
                                    ...header,
                                    questions:
                                        (header.questions || [])
                                            .map(
                                                (question: any) => {
                                                    const pendingSubsetSets =
                                                        this.filterPendingSets(
                                                            question.subset_sets || [],
                                                        );

                                                    if (
                                                        !this.pendingQuestionIds.has(
                                                            Number(question.id),
                                                        )
                                                        &&
                                                        !pendingSubsetSets.length
                                                    ) {
                                                        return null;
                                                    }

                                                    return {
                                                        ...question,
                                                        pending_subset_sets:
                                                            pendingSubsetSets,
                                                    };
                                                },
                                            )
                                            .filter(Boolean),
                                }),
                            )
                            .filter(
                                (header: any) =>
                                    header.questions.length,
                            ),
                }),
            )
            .filter(
                (set: any) =>
                    set.headers.length,
            );
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
                        Number(question.option_id) === 5
                            ? ''
                            : question.answer?.answer_given || '';

                    question.audit_comment =
                        question.answer?.audit_comment || '';

                    question.is_compliance =
                        Boolean(
                            Number(
                                question.answer?.is_compliance || 0,
                            ),
                        );
                    question.audit_compulsary_ev_upload =
                        Boolean(
                            Number(
                                question.answer?.audit_compulsary_ev_upload || 0,
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
                    question.is_re_audit =
                        this.isReAudit
                    question.selectedSubsetSets = [];

                    question.isAnnexureSelected =
                        this.buildIsAnnexureSelected(
                            question,
                        );

                    this.prepareSets(
                        question.subset_sets || [],
                        riskOptions,
                    );

                    if (
                        this.pendingOnly()
                        &&
                        question.pending_subset_sets?.length
                    ) {
                        this.prepareSets(
                            question.pending_subset_sets,
                            riskOptions,
                        );
                    }
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
        ) {
            const subsetOptions =
                Array.isArray(question?.subset_options)
                    ? question.subset_options
                    : [];

            if (
                subsetOptions.length
            ) {
                return subsetOptions.map(
                    (option: any) => ({
                        value:
                            String(option.id),

                        label:
                            option.name || `Subset ${option.id}`,
                    }),
                );
            }

            if (
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
            const subsetOptions =
                Array.isArray(question?.subset_options)
                    ? question.subset_options
                    : [];

            return String(question.subset_multi_id)
                .split(',')
                .map(
                    (item) =>
                        item.trim(),
                )
                .filter(Boolean)
                .map(
                    (item) => {
                        const matched =
                            subsetOptions.find(
                                (option: any) =>
                                    String(option.id) === String(item),
                            );

                        return {
                            value:
                                item,

                            label:
                                matched?.name || `Subset ${item}`,
                        };
                    },
                );
        }

        return [];
    }

    onQuestionAnswerChange(
        question: any,
    ) {
        question.isAnnexureSelected =
            this.buildIsAnnexureSelected(
                question,
            );

        if (
            Number(question?.option_id) !== 5
        ) {
            return;
        }

        question.subset_sets = [];
        question.selectedSubsetSets = [];

        this.cdr.detectChanges();

        if (
            !question.answer_value
        ) {
            return;
        }

        setTimeout(() => {
            this.loadSelectedSubsetSet(
                question,
            );
        }, 0);
    }

    backToAccountList(
        detail: any = this.categoryDetail(),
    ) {
        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
        ) {
            return;
        }

        this.selectedDumpId.set(
            0,
        );

        this.accountSearch = '';

        this.loadCategory(
            Number(detail.overview.id),
            Number(detail.category.id),
            true,
            0,
        );
    }

    loadSelectedSubsetSet(
        question: any,
    ) {
        const detail =
            this.categoryDetail();

        const subsetSetId =
            Number(question?.answer_value || 0);

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !question?.id
            ||
            !subsetSetId
        ) {
            question.subset_sets = [];
            question.selectedSubsetSets = [];
            this.cdr.detectChanges();
            return;
        }

        const key =
            `${question.id}:${subsetSetId}`;

        if (
            this.loadingSubsetKey() === key
        ) {
            return;
        }

        this.loadingSubsetKey.set(
            key,
        );

        this.service
            .getInternalAuditCategorySubsetSet(
                Number(detail.overview.id),
                Number(detail.category.id),
                subsetSetId,
                this.employeeId,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.loadingSubsetKey.set('');

                    if (
                        !res?.subset_set
                    ) {
                        setTimeout(() => {
                            question.subset_sets = [];
                            question.selectedSubsetSets = [];

                            this.notification.error(
                                'Selected subset questions are not configured.',
                            );

                            this.cdr.detectChanges();
                        }, 0);

                        return;
                    }

                    const subsetSet =
                        structuredClone(
                            res.subset_set,
                        );

                    this.prepareSets(
                        [subsetSet],
                        detail.annexure_risk_options || {},
                    );

                    setTimeout(() => {
                        question.subset_sets = [
                            subsetSet,
                        ];

                        question.selectedSubsetSets = [
                            subsetSet,
                        ];

                        this.cdr.detectChanges();
                    }, 0);
                },

                error: (err) => {
                    this.loadingSubsetKey.set('');

                    setTimeout(() => {
                        question.subset_sets = [];
                        question.selectedSubsetSets = [];

                        this.notification.error(
                            err?.error?.message ||
                            'Unable to load selected subset questions.',
                        );

                        this.cdr.detectChanges();
                    }, 0);
                },
            });
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
            new Set(
                String(
                    question.answer_value || '',
                )
                    .split(',')
                    .map(
                        (item) =>
                            item.trim(),
                    )
                    .filter(Boolean),
            );

        const subsetSets =
            this.pendingOnly()
                ? question.pending_subset_sets || []
                : question.subset_sets || [];

        return subsetSets
            .filter(
                (set: any) =>
                    selected.has(
                        String(set.id),
                    ),
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

    selectDefaultAnswers(
        header: any,
    ) {

        if (
            !this.canApplyDefaults()
        ) {
            this.notification.error(
                'Default answers can be applied only during active audit entry.',
            );

            return;
        }

        if (
            !header?.questions?.length
        ) {
            this.notification.error(
                'No questions are available for default answers.',
            );

            return;
        }

        const appliedCount =
            this.applyDefaultAnswersToQuestions(
                header.questions || [],
            );

        if (!appliedCount) {
            this.notification.error(
                'No default answers are configured for this header.',
            );

            return;
        }

        this.notification.success(
            `${appliedCount} default answer${appliedCount === 1 ? '' : 's'} applied. Please review and save.`,
        );
    }

    selectDefaultAnswersForAccount() {
        const detail =
            this.categoryDetail();

        if (
            !this.canApplyDefaults()
        ) {
            this.notification.error(
                'Default answers can be applied only during active audit entry.',
            );

            return;
        }

        if (
            !this.isAccountCategory(detail)
            ||
            !detail?.selected_account
        ) {
            this.notification.error(
                'Select an account before applying default answers.',
            );

            return;
        }

        const questions =
            (detail.sets || [])
                .flatMap(
                    (set: any) =>
                        set.headers || [],
                )
                .flatMap(
                    (header: any) =>
                        header.questions || [],
                );

        const appliedCount =
            this.applyDefaultAnswersToQuestions(
                questions,
            );

        if (
            !appliedCount
        ) {
            this.notification.error(
                'No default answers are configured for this account.',
            );

            return;
        }

        this.notification.success(
            `${appliedCount} default answer${appliedCount === 1 ? '' : 's'} applied for this account. Please review and save.`,
        );
    }

    visibleQuestionSets(
        detail: any,
    ) {
        if (
            this.isAccountCategory(detail)
            &&
            !detail?.selected_account
        ) {
            return [];
        }

        return detail?.sets || [];
    }

    private visibleHeaders(
        detail: any = this.categoryDetail(),
    ) {
        return this.visibleQuestionSets(
            detail,
        )
            .flatMap(
                (set: any) =>
                    set.headers || [],
            );
    }

    selectDefaultAnswersForCategory() {
        if (
            !this.canApplyDefaults()
        ) {
            this.notification.error(
                'Default answers can be applied only during active audit entry.',
            );

            return;
        }

        const headers =
            this.visibleHeaders();

        if (
            !headers.length
        ) {
            this.notification.error(
                'No questions are available for default answers.',
            );

            return;
        }

        const questions =
            headers.flatMap(
                (header: any) =>
                    header.questions || [],
            );

        const appliedCount =
            this.applyDefaultAnswersToQuestions(
                questions,
            );

        const pendingTextHeaders =
            this.openHeadersWithPendingTextAnswers();

        if (
            !appliedCount
        ) {
            this.notification.error(
                'No default answers are configured for these headers.',
            );

            return;
        }

        if (
            pendingTextHeaders
        ) {
            this.notification.info(
                `${appliedCount} default answer${appliedCount === 1 ? '' : 's'} applied. Text answers still need audit input.`,
            );

            return;
        }

        this.notification.success(
            `${appliedCount} default answer${appliedCount === 1 ? '' : 's'} applied. Please review and save.`,
        );
    }

    private applyDefaultAnswersToQuestions(
        questions: any[],
    ) {
        let appliedCount = 0;

        for (
            const question
            of questions || []
        ) {
            const defaultAnswer =
                this.defaultAnswerValue(
                    question,
                );

            if (
                defaultAnswer !== null
            ) {
                question.answer_value =
                    defaultAnswer;
                appliedCount++;
            }

            for (
                const subsetSet
                of this.buildSelectedSubsetSets(question)
            ) {
                const subsetQuestions =
                    (subsetSet.headers || [])
                        .flatMap(
                            (header: any) =>
                                header.questions || [],
                        );

                appliedCount +=
                    this.applyDefaultAnswersToQuestions(
                        subsetQuestions,
                    );
            }
        }

        return appliedCount;
    }

    getAnsweredCount(header: any): number {
        if (!header?.questions?.length) {
            return 0;
        }
        let count = 0;
        for (const q of header.questions) {
            if (q.answer_value !== null && q.answer_value !== undefined && String(q.answer_value).trim() !== '') {
                count++;
            }
        }
        return count;
    }

    canApplyDefaults() {

        return Number(
            this.categoryDetail()?.overview?.audit_status_id || 0,
        ) === 1;
    }

    isReAudit(
        detail: any = this.categoryDetail(),
    ) {

        return Number(
            detail?.overview?.audit_status_id || 0,
        ) === 3;
    }

    reviewerComment(
        question: any,
    ) {

        return question?.answer?.audit_reviewer_comment || '';
    }

    defaultAnswerValue(
        question: any,
    ): string | null {

        if (
            this.isTextAnswer(
                question,
            )
        ) {
            return null;
        }

        const parameters =
            Array.isArray(
                question?.parameters,
            )
                ? question.parameters
                : [];

        if (
            !parameters.length
        ) {
            const firstOption =
                question?.options?.[0]?.value;

            return firstOption === undefined
                ? null
                : String(firstOption);
        }

        let defaultIndex = 0;
        let previousRiskTotal = 0;
        let hasOnlyNeutralRisk = true;
        const riskTotals: number[] = [];

        for (
            let index = 0;
            index < parameters.length;
            index++
        ) {
            const option =
                parameters[index];

            const totalRisk =
                Number(option?.br || 0)
                +
                Number(option?.cr || 0);

            riskTotals.push(
                totalRisk,
            );

            if (
                ![0, 4.4, 8].includes(
                    totalRisk,
                )
            ) {
                hasOnlyNeutralRisk =
                    false;
            }

            if (
                previousRiskTotal < totalRisk
            ) {
                defaultIndex =
                    index;
            }

            previousRiskTotal =
                totalRisk;
        }

        if (
            hasOnlyNeutralRisk
            &&
            riskTotals.length
            &&
            riskTotals.every(
                (risk) =>
                    risk === riskTotals[0],
            )
        ) {
            defaultIndex =
                parameters.length - 1;
        }

        const answer =
            parameters[defaultIndex]?.rt;

        return answer === undefined
            ? null
            : String(answer);
    }

    private collectHeaderQuestionsForSave(
        header: any,
    ) {
        const questions: any[] = [];

        const visitQuestion =
            (question: any) => {
                questions.push(
                    question,
                );

                for (
                    const subsetSet
                    of this.buildSelectedSubsetSets(question)
                ) {
                    for (
                        const subsetHeader
                        of subsetSet.headers || []
                    ) {
                        for (
                            const subsetQuestion
                            of subsetHeader.questions || []
                        ) {
                            visitQuestion(
                                subsetQuestion,
                            );
                        }
                    }
                }
            };

        for (
            const question
            of header.questions || []
        ) {
            visitQuestion(
                question,
            );
        }

        return questions;
    }

    private buildAnswersForHeader(
        header: any,
    ) {
        return this.collectHeaderQuestionsForSave(
            header,
        )
            .map(
                (question: any) => ({
                    question_id:
                        question.id,

                    header_id:
                        question.header_id || header.id,

                    answer_given:
                        question.answer_value || '',

                    audit_comment:
                        question.audit_comment || '',

                    is_compliance:
                        question.is_compliance === true,

                    audit_compulsary_ev_upload:
                        question.audit_compulsary_ev_upload === true,
                }),
            );
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
            this.notification.error(
                'No answers are available to save for this header.',
            );

            return;
        }

        const requiredTextErrors =
            this.validateRequiredTextAnswers(
                [header],
            );

        if (
            Object.keys(
                requiredTextErrors,
            ).length
        ) {
            this.answerErrors.set(
                requiredTextErrors,
            );

            this.openHeadersWithAnswerErrors(
                requiredTextErrors,
            );

            this.notification.error(
                'Please complete the remaining manual answers before saving this header.',
            );

            return;
        }

        const answers =
            this.buildAnswersForHeader(
                header,
            );

        this.savingHeader.set(
            header.id,
        );

        this.answerErrors.set(
            {},
        );

        this.service
            .saveInternalAuditCategoryAnswers(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
                answers,
                this.selectedDumpId(),
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

                        this.notification.error(
                            res?.message
                            || 'Please correct highlighted answers.',
                        );

                        return;
                    }

                    this.notification.success(
                        res.message
                        || 'Answers saved successfully',
                    );

                    this.markSaved();

                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                    );
                },

                error: (err) => {

                    this.savingHeader.set(
                        null,
                    );

                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save answers.',
                    );
                },
            });
    }

    saveAllHeaders() {
        const detail =
            this.categoryDetail();

        const headers =
            this.visibleHeaders(
                detail,
            );

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !headers.length
        ) {
            this.notification.error(
                'No answers are available to save.',
            );

            return;
        }

        const requiredTextErrors =
            this.validateRequiredTextAnswers(
                headers,
            );

        if (
            Object.keys(
                requiredTextErrors,
            ).length
        ) {
            this.answerErrors.set(
                requiredTextErrors,
            );

            this.openHeadersWithAnswerErrors(
                requiredTextErrors,
            );

            this.notification.error(
                'Please complete the remaining manual answers before saving all headers.',
            );

            return;
        }

        const answers =
            headers.flatMap(
                (header: any) =>
                    this.buildAnswersForHeader(
                        header,
                    ),
            );

        if (
            !answers.length
        ) {
            this.notification.error(
                'No answers are available to save.',
            );

            return;
        }

        this.savingAllHeaders.set(
            true,
        );

        this.answerErrors.set(
            {},
        );

        this.service
            .saveInternalAuditCategoryAnswers(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
                answers,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.savingAllHeaders.set(
                        false,
                    );

                    if (
                        !res?.success
                    ) {
                        this.answerErrors.set(
                            res?.errors || {},
                        );

                        this.openHeadersWithAnswerErrors(
                            res?.errors || {},
                        );

                        this.notification.error(
                            res?.message
                            || 'Please correct highlighted answers.',
                        );

                        return;
                    }

                    this.notification.success(
                        res.message
                        || 'All header answers saved successfully',
                    );

                    this.markSaved();

                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                    );
                },

                error: (err) => {
                    this.savingAllHeaders.set(
                        false,
                    );

                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save answers.',
                    );
                },
            });
    }

    private questionNeedsTextAnswer(
        question: any,
    ) {
        return this.isTextAnswer(
            question,
        )
            &&
            !String(
                question?.answer_value || '',
            ).trim();
    }

    private headerHasPendingTextAnswer(
        header: any,
    ) {
        return this.collectHeaderQuestionsForSave(
            header,
        )
            .some(
                (question: any) =>
                    this.questionNeedsTextAnswer(
                        question,
                    ),
            );
    }

    private headerHasAnswerError(
        header: any,
        errors: Record<string, string>,
    ) {
        return this.collectHeaderQuestionsForSave(
            header,
        )
            .some(
                (question: any) =>
                    Boolean(
                        errors?.[question.id],
                    ),
            );
    }

    private validateRequiredTextAnswers(
        headers: any[],
    ) {
        const errors: Record<string, string> = {};

        for (
            const header
            of headers || []
        ) {
            for (
                const question
                of this.collectHeaderQuestionsForSave(
                    header,
                )
            ) {
                if (
                    this.questionNeedsTextAnswer(
                        question,
                    )
                ) {
                    errors[question.id] =
                        'Manual answer is required before saving this header.';
                }
            }
        }

        return errors;
    }

    accordionKey(
        set: any,
        setIndex: number,
    ) {
        return String(
            set?.id
            || set?.name
            || setIndex,
        );
    }

    openedHeaderValues(
        set: any,
        setIndex: number,
    ) {
        const key =
            this.accordionKey(
                set,
                setIndex,
            );

        return this.openedHeaders()[key] || this.defaultOpenedHeaders;
    }

    setOpenedHeaderValues(
        set: any,
        setIndex: number,
        value: any,
    ) {
        const key =
            this.accordionKey(
                set,
                setIndex,
            );

        const values =
            Array.isArray(
                value,
            )
                ? value
                : [value];

        this.openedHeaders.update(
            (current) => ({
                ...current,
                [key]:
                    values.map(
                        (item) =>
                            String(item),
                    ),
            }),
        );
    }

    private openHeadersByPredicate(
        predicate: (header: any) => boolean,
    ) {
        const detail =
            this.categoryDetail();

        const nextOpenState: Record<string, string[]> = {};
        let openedCount = 0;

        this.visibleQuestionSets(
            detail,
        )
            .forEach(
                (set: any, setIndex: number) => {
                    const values =
                        (set.headers || [])
                            .map(
                                (header: any, headerIndex: number) =>
                                    predicate(header)
                                        ? String(headerIndex)
                                        : '',
                            )
                            .filter(Boolean);

                    if (
                        values.length
                    ) {
                        nextOpenState[
                            this.accordionKey(
                                set,
                                setIndex,
                            )
                        ] =
                            values;

                        openedCount +=
                            values.length;
                    }
                },
            );

        if (
            openedCount
        ) {
            this.openedHeaders.update(
                (current) => ({
                    ...current,
                    ...nextOpenState,
                }),
            );
        }

        return openedCount;
    }

    private openHeadersWithPendingTextAnswers() {
        return this.openHeadersByPredicate(
            (header: any) =>
                this.headerHasPendingTextAnswer(
                    header,
                ),
        );
    }

    private openHeadersWithAnswerErrors(
        errors: Record<string, string>,
    ) {
        return this.openHeadersByPredicate(
            (header: any) =>
                this.headerHasAnswerError(
                    header,
                    errors,
                ),
        );
    }

    isTextAnswer(
        question: any,
    ) {

        return Number(
            question?.option_id,
        ) === 3;
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

    annexureColumnCount(
        question: any,
    ) {
        return Math.max(
            question?.annexure?.columns?.length || 0,
            1,
        );
    }

    annexureEntryGridTemplate(
        question: any,
    ) {
        return `repeat(${this.annexureColumnCount(question)}, minmax(4rem, 1fr)) repeat(3, minmax(4rem, .8fr))`;
    }

    annexureEntryMinWidth(
        question: any,
    ) {
        return `${Math.max(
            380,
            (
                this.annexureColumnCount(question)
                + 3
            ) * 65,
        )}px`;
    }

    annexureTableMinWidth(
        question: any,
    ) {
        return `${Math.max(
            440,
            (
                this.annexureColumnCount(question)
                + 5
            ) * 60,
        )}px`;
    }

    annexureRowKey(
        questionId: any,
        rowId: any,
    ) {
        return `${Number(questionId) || 0}:${Number(rowId) || 0}`;
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

        if (
            this.savingAnnexureQuestion()
            === Number(question.id)
        ) {
            return;
        }

        this.savingAnnexureQuestion.set(
            Number(question.id),
        );

        this.service
            .saveInternalAuditAnnexureRow(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
                question.annexure_draft,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.savingAnnexureQuestion.set(
                        null,
                    );

                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message || 'Unable to save annexure row.',
                        );
                        return;
                    }

                    this.notification.success(
                        res.message || 'Annexure row saved successfully',
                    );
                    this.markSaved();

                    if (
                        res?.row?.id
                    ) {
                        const nextAnswer = {
                            ...(question.answer || {}),
                            id:
                                Number(
                                    res?.answer_id
                                    || question.answer?.id
                                    || 0,
                                ),
                            answer_given:
                                question.answer_value,
                        };

                        const rowIndex =
                            (question.annexure_rows || [])
                                .findIndex(
                                    (row: any) =>
                                        Number(row.id)
                                        === Number(res.row.id),
                                );

                        const currentRows =
                            question.annexure_rows || [];

                        question.annexure_rows =
                            rowIndex >= 0
                                ? currentRows.map(
                                    (
                                        currentRow: any,
                                        index: number,
                                    ) =>
                                        index === rowIndex
                                            ? {
                                                ...currentRow,
                                                ...res.row,
                                            }
                                            : currentRow,
                                )
                                : [
                                    ...currentRows,
                                    res.row,
                                ];

                        question.answer = {
                            ...nextAnswer,
                            annexure_rows: [
                                ...question.annexure_rows,
                            ],
                        };

                        this.clearAnnexureDraft(
                            question,
                        );
                    } else {
                        this.loadCategory(
                            Number(detail.overview.id),
                            Number(detail.category.id),
                            false,
                        );
                    }
                },
                error: (err) => {
                    this.savingAnnexureQuestion.set(
                        null,
                    );

                    this.notification.error(
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

        const rowKey =
            this.annexureRowKey(
                question.id,
                row.id,
            );

        if (
            this.deletingAnnexureRowKey()
            === rowKey
        ) {
            return;
        }

        this.deletingAnnexureRowKey.set(
            rowKey,
        );

        this.service
            .deleteInternalAuditAnnexureRow(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                Number(row.id),
                this.employeeId,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.deletingAnnexureRowKey.set(
                        '',
                    );

                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message || 'Unable to delete annexure row.',
                        );
                        return;
                    }

                    this.notification.success(
                        res?.message || 'Annexure row deleted successfully',
                    );
                    this.markSaved();
                    question.annexure_rows =
                        (question.annexure_rows || [])
                            .filter(
                                (currentRow: any) =>
                                    Number(currentRow.id)
                                    !== Number(row.id),
                            );

                    if (
                        question.answer
                    ) {
                        question.answer = {
                            ...question.answer,
                            annexure_rows: [
                                ...question.annexure_rows,
                            ],
                        };
                    }

                    if (
                        Number(question.annexure_draft?.id || 0)
                        === Number(row.id)
                    ) {
                        this.clearAnnexureDraft(
                            question,
                        );
                    }
                },
                error: (err) => {
                    this.deletingAnnexureRowKey.set(
                        '',
                    );

                    this.notification.error(
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

        this.service
            .getInternalAuditAnnexureSample(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        !res?.success
                        ||
                        !res?.csv
                    ) {
                        this.notification.error(
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
                    this.notification.success(
                        'Annexure sample downloaded successfully.',
                    );
                },
                error: (err) => {
                    this.notification.error(
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
            this.notification.error(
                'Only CSV files are allowed.',
            );
            return;
        }

        this.uploadingAnnexureQuestion.set(
            Number(question.id),
        );
        this.service
            .uploadInternalAuditAnnexureCsv(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                this.employeeId,
                file,
                this.selectedDumpId(),
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

                        this.notification.error(
                            `${res?.message || 'Unable to upload annexure CSV.'}${firstError}`,
                        );
                        return;
                    }

                    this.notification.success(
                        res.message || 'Annexure CSV uploaded successfully.',
                    );
                    this.markSaved();
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                    );
                },
                error: (err) => {
                    this.uploadingAnnexureQuestion.set(null);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to upload annexure CSV.',
                    );
                },
            });
    }

    isAccountCategory(
        detail: any =
            this.categoryDetail(),
    ) {
        return [1, 2].includes(
            Number(
                detail?.category?.linked_table_id,
            ),
        );
    }

    filteredAccounts() {
        const accounts =
            this.categoryDetail()?.accounts || [];
        const search =
            this.accountSearch
                .trim()
                .toLowerCase();

        return search
            ? accounts.filter(
                (account: any) =>
                    String(account.account_no || '')
                        .toLowerCase()
                        .includes(search)
                    ||
                    String(account.account_holder_name || '')
                        .toLowerCase()
                        .includes(search)
                    ||
                    String(account.scheme_code || '')
                        .toLowerCase()
                        .includes(search),
            )
            : accounts;
    }

    canManageSampling(
        detail: any = this.categoryDetail(),
    ) {
        return (
            this.isAccountCategory(detail)
            &&
            Number(detail?.overview?.audit_status_id || 0) === 1
        );
    }

    toggleSampling() {
        if (
            this.samplingOpen()
        ) {
            this.samplingOpen.set(false);
            return;
        }

        this.samplingOpen.set(true);
        this.loadSampling();
    }

    loadSampling() {
        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !this.canManageSampling(detail)
        ) {
            return;
        }

        this.samplingLoading.set(true);
        this.samplingSelection = [];

        this.service
            .getInternalAuditAccountSampling(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
                Number(this.samplingFilterType || 0),
                this.samplingPrimaryValue.trim(),
                this.samplingSecondaryValue.trim(),
            )
            .subscribe({
                next: (res: any) => {
                    this.samplingData.set(
                        res,
                    );
                    this.samplingLoading.set(false);
                },
                error: (err) => {
                    this.samplingLoading.set(false);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to load sampling accounts.',
                    );
                },
            });
    }

    toggleSamplingAccount(
        accountId: number,
        checked: boolean,
    ) {
        const id =
            Number(accountId);

        if (
            checked
            &&
            !this.samplingSelection.includes(id)
        ) {
            this.samplingSelection = [
                ...this.samplingSelection,
                id,
            ];
        } else if (
            !checked
        ) {
            this.samplingSelection =
                this.samplingSelection.filter(
                    (value: number) =>
                        value !== id,
                );
        }
    }

    toggleAllSamplingAccounts(
        checked: boolean,
    ) {
        this.samplingSelection =
            checked
                ? (this.samplingData()?.candidates || [])
                    .map(
                        (account: any) =>
                            Number(account.id),
                    )
                : [];
    }

    samplingAccountSelected(
        accountId: number,
    ) {
        return this.samplingSelection.includes(
            Number(accountId),
        );
    }

    applySampling() {
        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
        ) {
            return;
        }

        if (
            !this.samplingSelection.length
        ) {
            this.notification.error(
                'Select at least one account for sampling.',
            );
            return;
        }

        this.samplingSaving.set(true);

        this.service
            .applyInternalAuditAccountSampling(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
                this.samplingSelection,
            )
            .subscribe({
                next: (res: any) => {
                    this.samplingSaving.set(false);
                    this.notification.success(
                        res?.message
                        || 'Sampled accounts applied successfully.',
                    );
                    this.markSaved();
                    this.loadSampling();
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                    );
                },
                error: (err) => {
                    this.samplingSaving.set(false);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to apply sampled accounts.',
                    );
                },
            });
    }

    removeSampling(
        account: any,
    ) {
        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !account?.id
            ||
            !window.confirm(
                'Remove this account from sampling?',
            )
        ) {
            return;
        }

        this.service
            .removeInternalAuditAccountSampling(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(account.id),
                this.employeeId,
            )
            .subscribe({
                next: (res: any) => {
                    this.notification.success(
                        res?.message
                        || 'Sampled account removed successfully.',
                    );
                    this.markSaved();
                    this.selectedDumpId.set(0);
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                        0,
                    );

                    if (
                        this.samplingOpen()
                    ) {
                        this.loadSampling();
                    }
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to remove sampled account.',
                    );
                },
            });
    }

    selectAccount(
        account: any,
    ) {
        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !account?.id
        ) {
            return;
        }

        this.selectedDumpId.set(
            Number(account.id),
        );
        this.loadCategory(
            Number(detail.overview.id),
            Number(detail.category.id),
            true,
            Number(account.id),
        );
    }

    completeAccount() {
        const detail =
            this.categoryDetail();
        const dumpId =
            this.selectedDumpId();

        if (
            this.completingAccount()
        ) {
            return;
        }

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !dumpId
        ) {
            return;
        }

        const localPending =
            this.accountCompletionPendingMessages(
                detail,
            );

        if (
            localPending.length
        ) {
            this.notification.error(
                localPending[0],
            );
            return;
        }

        this.completingAccount.set(
            true,
        );

        this.service
            .completeInternalAuditAccount(
                Number(detail.overview.id),
                Number(detail.category.id),
                dumpId,
                this.employeeId,
            )
            .subscribe({
                next: (res: any) => {
                    this.completingAccount.set(
                        false,
                    );

                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message
                            || 'Complete pending account points first.',
                        );
                        return;
                    }

                    this.notification.success(
                        res?.message
                        || 'Account assessment marked complete.',
                    );
                    this.markSaved();
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                        dumpId,
                    );
                },
                error: (err) => {
                    this.completingAccount.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to complete account assessment.',
                    );
                },
            });
    }

    completeRemainingAccounts() {
        const detail =
            this.categoryDetail();

        if (
            this.completingRemainingAccounts()
        ) {
            return;
        }

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !this.isAccountCategory(detail)
        ) {
            return;
        }

        if (
            !window.confirm(
                'Mark all remaining sampled accounts in this current period as complete?',
            )
        ) {
            return;
        }

        this.completingRemainingAccounts.set(
            true,
        );

        this.service
            .completeInternalAuditRemainingAccounts(
                Number(detail.overview.id),
                Number(detail.category.id),
                this.employeeId,
            )
            .subscribe({
                next: (res: any) => {
                    this.completingRemainingAccounts.set(
                        false,
                    );

                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message
                            || 'Unable to complete remaining accounts.',
                        );
                        return;
                    }

                    this.notification.success(
                        res?.message
                        || 'Remaining account assessments marked complete.',
                    );
                    this.markSaved();
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                        this.selectedDumpId(),
                    );
                },
                error: (err) => {
                    this.completingRemainingAccounts.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to complete remaining accounts.',
                    );
                },
            });
    }

    private accountCompletionPendingMessages(
        detail: any,
    ) {
        const messages: string[] = [];

        for (
            const question
            of this.flattenQuestions(
                detail?.sets || [],
            )
        ) {
            if (
                this.isQuestionPendingForCompletion(question)
            ) {
                messages.push(
                    'Save all account answers before marking the account complete.',
                );
                break;
            }

            if (
                this.isQuestionEvidencePending(question)
            ) {
                messages.push(
                    'Upload required evidence before marking the account complete.',
                );
                break;
            }
        }

        return messages;
    }

    private flattenQuestions(
        sets: any[],
    ): any[] {
        const questions: any[] = [];

        for (
            const set
            of sets || []
        ) {
            for (
                const header
                of set.headers || []
            ) {
                for (
                    const question
                    of header.questions || []
                ) {
                    questions.push(
                        question,
                    );

                    questions.push(
                        ...this.flattenQuestions(
                            this.buildSelectedSubsetSets(question),
                        ),
                    );
                }
            }
        }

        return questions;
    }

    private isQuestionPendingForCompletion(
        question: any,
    ) {
        const hasAnswer =
            String(question?.answer_value || '')
                .trim()
                .length > 0;

        if (
            !hasAnswer
            ||
            !question?.answer?.id
        ) {
            return true;
        }

        if (
            this.buildIsAnnexureSelected(question)
            &&
            !question?.annexure_rows?.length
        ) {
            return true;
        }

        return false;
    }

    private isQuestionEvidencePending(
        question: any,
    ) {
        if (
            !this.isEvidenceRequired(question)
        ) {
            return false;
        }

        if (
            this.buildIsAnnexureSelected(question)
        ) {
            const rows =
                question?.annexure_rows || [];

            return !rows.length
                ||
                rows.some(
                    (row: any) =>
                        !this.evidenceList(
                            row,
                        ).length,
                );
        }

        return !this.evidenceList(
            question?.answer,
        ).length;
    }

    isEvidenceRequired(
        question: any,
    ) {

        return question?.audit_compulsary_ev_upload === true;
    }

    evidenceKey(
        question: any,
        row?: any,
    ) {

        return `${Number(question?.id || 0)}:${Number(row?.id || 0)}`;
    }

    evidenceList(
        source: any,
        field = 'evidence',
    ) {
        if (
            !source
        ) {
            return [];
        }

        const pluralField =
            field === 'compliance_evidence'
                ? 'compliance_evidences'
                : 'evidences';

        const list =
            Array.isArray(
                source?.[pluralField],
            )
                ? source[pluralField]
                : [];

        const single =
            Array.isArray(
                source?.[field],
            )
                ? source[field]
                : source?.[field]
                    ? [source[field]]
                    : [];

        const merged =
            [...list, ...single];

        const seen =
            new Set<number>();

        return merged.filter(
            (evidence: any) => {
                const id =
                    Number(evidence?.id || 0);

                if (
                    !id
                    ||
                    seen.has(id)
                ) {
                    return false;
                }

                seen.add(id);

                return true;
            },
        );
    }

    uploadEvidence(
        question: any,
        event: Event,
        row?: any,
    ) {

        const input =
            event.target as HTMLInputElement;

        const files =
            Array.from(
                input.files || [],
            );

        input.value = '';

        const detail =
            this.categoryDetail();

        if (
            !files.length
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
            !question.answer?.id
        ) {
            this.notification.error(
                'Save the answer before uploading evidence.',
            );
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
        ];

        if (
            files.some(
                (file) =>
                    !allowedTypes.includes(
                        file.type,
                    ),
            )
        ) {
            this.notification.error(
                'Only JPG, JPEG, PNG and PDF evidence files are allowed.',
            );
            return;
        }

        if (
            files.some(
                (file) =>
                    file.size > 5 * 1024 * 1024,
            )
        ) {
            this.notification.error(
                'Evidence file size must be less than or equal to 5 MB.',
            );
            return;
        }

        this.uploadingEvidenceKey.set(
            this.evidenceKey(
                question,
                row,
            ),
        );

        this.uploadEvidenceFiles(
            question,
            row,
            files,
            0,
        );
    }

    private uploadEvidenceFiles(
        question: any,
        row: any,
        files: File[],
        index: number,
    ) {
        const detail =
            this.categoryDetail();

        const file =
            files[index];

        if (
            !file
        ) {
            this.uploadingEvidenceKey.set('');

            this.notification.success(
                `${files.length} evidence file${files.length === 1 ? '' : 's'} uploaded successfully.`,
            );

            this.markSaved();
            this.loadCategory(
                Number(detail.overview.id),
                Number(detail.category.id),
                false,
            );

            return;
        }

        this.service
            .uploadInternalAuditEvidence(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(question.id),
                Number(row?.id || 0),
                this.employeeId,
                file,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        !res?.success
                    ) {
                        this.uploadingEvidenceKey.set('');

                        this.notification.error(
                            res?.message || 'Unable to upload evidence.',
                        );

                        return;
                    }

                    this.uploadEvidenceFiles(
                        question,
                        row,
                        files,
                        index + 1,
                    );
                },
                error: (err) => {
                    this.uploadingEvidenceKey.set('');
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to upload evidence.',
                    );
                },
            });
    }

    viewEvidence(
        evidence: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !evidence?.id
        ) {
            return;
        }

        this.service
            .viewInternalAuditEvidence(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(evidence.id),
                this.employeeId,
                this.selectedDumpId(),
            )
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

    deleteEvidence(
        evidence: any,
    ) {

        const detail =
            this.categoryDetail();

        if (
            !detail?.overview?.id
            ||
            !detail?.category?.id
            ||
            !evidence?.id
        ) {
            return;
        }

        this.service
            .deleteInternalAuditEvidence(
                Number(detail.overview.id),
                Number(detail.category.id),
                Number(evidence.id),
                this.employeeId,
                this.selectedDumpId(),
            )
            .subscribe({
                next: (res: any) => {
                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message || 'Unable to remove evidence.',
                        );
                        return;
                    }

                    this.notification.success(
                        res.message || 'Evidence removed successfully.',
                    );
                    this.markSaved();
                    this.loadCategory(
                        Number(detail.overview.id),
                        Number(detail.category.id),
                        false,
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to remove evidence.',
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
