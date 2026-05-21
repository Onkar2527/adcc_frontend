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

import {
    FormsModule,
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { CardModule } from 'primeng/card';

import { ProgressBarModule } from 'primeng/progressbar';

import { SkeletonModule } from 'primeng/skeleton';

import { TagModule } from 'primeng/tag';

import { AccordionModule } from 'primeng/accordion';

import { PanelModule } from 'primeng/panel';

import { BadgeModule } from 'primeng/badge';

import { RadioButtonModule } from 'primeng/radiobutton';



import { FileUploadModule } from 'primeng/fileupload';

import { AuditDashboardService } from '../services/auditor-main.service';

@Component({
    selector: 'app-internal-audit',

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

        AccordionModule,
        PanelModule,
        BadgeModule,
        RadioButtonModule,
        
        FileUploadModule,
    ],

    templateUrl:
        './internal-audit.component.html',

    styleUrl:
        './internal-audit.component.css',
})

export class InternalAuditComponent
    implements OnInit {

    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    loading =
        signal(false);

    overview =
        signal<any>(null);

    auditUnit =
        signal<any>(null);

    years =
        signal<any[]>([]);

    metrics =
        signal<any>(null);

    startPreview =
        signal<any>(null);

    menus =
        signal<any[]>([]);

    error =
        signal('');

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

        this.loadAudit();

    }

    loadAudit() {

        const auditUnitId =
            Number(
                this.route.snapshot.paramMap.get(
                    'auditUnitId',
                ),
            );

        const yearId =
            Number(
                this.route.snapshot.paramMap.get(
                    'yearId',
                ),
            );

        if (
            auditUnitId
            &&
            yearId
        ) {

            this.loadStartPreview(
                auditUnitId,
                yearId,
            );

            return;

        }

        if (auditUnitId) {

            this.loadAuditUnit(
                auditUnitId,
            );

            return;

        }

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

        this.loading.set(true);

        this.error.set('');

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

    const menus =
        (res?.menus || []).map(
            (menu: any) => ({

                ...menu,

                expanded: false,

                categories:
                    (menu.categories || []).map(
                        (category: any) => ({

                            ...category,

                            question_sets:
                                (
                                    category.question_sets || []
                                ).map(
                                    (set: any) => ({

                                        ...set,

                                        headers:
                                            (
                                                set.headers || []
                                            ).map(
                                                (header: any) => ({

                                                    ...header,

                                                    questions:
                                                        (
                                                            header.questions || []
                                                        ).map(
                                                            (question: any) => ({

                                                                ...question,

                                                                answer: null,

                                                                remark: '',

                                                                file: null,

                                                            }),
                                                        ),

                                                }),
                                            ),

                                    }),
                                ),

                        }),
                    ),

            }),
        );

    console.log(
        'MENUS',
        menus,
    );

    this.menus.set(
        menus,
    );

    this.loading.set(false);

},

                error: (err) => {

                    this.error.set(
                        err?.error?.message
                        || 'Unable to load internal audit.',
                    );

                    this.loading.set(false);

                },

            });

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

                    this.overview.set(null);

                    this.startPreview.set(null);

                    this.menus.set([]);

                    this.loading.set(false);

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

    loadStartPreview(
        auditUnitId: number,
        yearId: number,
    ) {

        this.loading.set(true);

        this.error.set('');

        this.service
            .getStartAssessmentPreview(
                auditUnitId,
                yearId,
                this.employeeId(),
            )
            .subscribe({

                next: (res: any) => {

                    this.startPreview.set(res);

                    this.auditUnit.set(null);

                    this.years.set([]);

                    this.metrics.set(null);

                    this.overview.set(null);

                    this.menus.set([]);

                    this.loading.set(false);

                },

                error: (err) => {

                    this.error.set(
                        err?.error?.message
                        || 'Unable to load start assessment details.',
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

    backToDashboard() {

        this.router.navigate([
            '/auditor/audit-dashboard',
        ]);

    }

    openCategory(
        category: any,
    ) {

        console.log(
            'Category',
            category,
        );

    }

    openAssessment(
        assessment: any,
    ) {

        if (
            !assessment?.can_continue
        ) {

            return;

        }

        this.router.navigate([
            '/auditor/internal-audit',
            assessment.id,
        ]);

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
            ['blocked', 'expired']
                .includes(
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

    onFileSelect(
        event: any,
        question: any,
    ) {

        question.file =
            event.files?.[0];

    }

    saveAudit() {

    const payload: any[] = [];

    this.menus().forEach(
        (menu: any) => {

            menu.categories?.forEach(
                (category: any) => {

                    category.question_sets?.forEach(
                        (set: any) => {

                            set.headers?.forEach(
                                (header: any) => {

                                    header.questions?.forEach(
                                        (question: any) => {

                                            payload.push({

                                                question_id:
                                                    question.question_id,

                                                answer:
                                                    question.answer,

                                                remark:
                                                    question.remark,

                                                file:
                                                    question.file,

                                            });

                                        },
                                    );

                                },
                            );

                        },
                    );

                },
            );

        },
    );

    console.log(
        'SAVE PAYLOAD',
        payload,
    );

}
getHeaderAnswered(
    header: any,
): number {

    return (
        header.questions || []
    ).filter(
        (q: any) =>
            q.answer
    ).length;

}

getHeaderProgress(
    header: any,
): number {

    const total =
        header.questions?.length || 0;

    if (!total) {
        return 0;
    }

    return Math.round(
        (
            this.getHeaderAnswered(header)
            / total
        ) * 100,
    );

}

getCategoryQuestions(
    category: any,
): number {

    let total = 0;

    category.question_sets?.forEach(
        (set: any) => {

            set.headers?.forEach(
                (header: any) => {

                    total +=
                        header.questions?.length || 0;

                },
            );

        },
    );

    return total;

}

getCategoryAnswered(
    category: any,
): number {

    let total = 0;

    category.question_sets?.forEach(
        (set: any) => {

            set.headers?.forEach(
                (header: any) => {

                    total +=
                        this.getHeaderAnswered(header);

                },
            );

        },
    );

    return total;

}

getCategoryProgress(
    category: any,
): number {

    const total =
        this.getCategoryQuestions(category);

    if (!total) {
        return 0;
    }

    return Math.round(
        (
            this.getCategoryAnswered(category)
            / total
        ) * 100,
    );

}

getMenuQuestions(
    menu: any,
): number {

    return (
        menu.categories || []
    ).reduce(
        (
            sum: number,
            category: any,
        ) =>
            sum +
            this.getCategoryQuestions(category),
        0,
    );

}

getMenuAnswered(
    menu: any,
): number {

    return (
        menu.categories || []
    ).reduce(
        (
            sum: number,
            category: any,
        ) =>
            sum +
            this.getCategoryAnswered(category),
        0,
    );

}

getMenuProgress(
    menu: any,
): number {

    const total =
        this.getMenuQuestions(menu);

    if (!total) {
        return 0;
    }

    return Math.round(
        (
            this.getMenuAnswered(menu)
            / total
        ) * 100,
    );

}

}