import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { LayoutService } from '../service/layout.service';
import { filter, Subscription } from 'rxjs';
import { InternalAuditNavService } from '../../../features/auditor/services/internal-audit-nav.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
    <ul class="layout-menu">
      <ng-container *ngFor="let item of model; let i = index">
        <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
        <li *ngIf="item.separator" class="menu-separator"></li>
      </ng-container>
    </ul>
  `,
})
export class AppMenu implements OnInit, OnDestroy {
    private layoutService = inject(LayoutService);
    private router = inject(Router);
    private auditNavService = inject(InternalAuditNavService);
    private cdr = inject(ChangeDetectorRef);

    private routeSubscription?: Subscription;

    private refreshTimer?: ReturnType<typeof setTimeout>;

    private userTypeId = '';

    private lastAssessmentMenuKey = '';

    ngOnInit(): void {
        const user =
            JSON.parse(localStorage.getItem('user') || '{}');

        this.userTypeId =
            String(user.user_type_id || '');

        this.refreshModel();

        this.routeSubscription =
            this.router.events
                .pipe(
                    filter(
                        (event) =>
                            event instanceof NavigationEnd,
                    ),
                )
                .subscribe(
                    () =>
                        this.queueRefreshModel(),
                );
    }
    model: MenuItem[] = [];

    private baseModel: MenuItem[] = [
        {
            label: 'Home',
            authority: ['1'],
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/admin'] }],
        },
        {
            label: 'Audit Management',
            authority: ['2'],
            items: [{ label: 'Internal Audit', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/auditor/audit-dashboard'] }],
        },
        {
            label: 'Audit Review',
            authority: ['4'],
            items: [{ label: 'Pending Reviews', icon: 'pi pi-fw pi-verified', routerLink: ['/auditor/reviewer'] }],
        },
        {
            label: 'Compliance',
            authority: ['3'],
            items: [{ label: 'Pending Compliance', icon: 'pi pi-fw pi-clipboard', routerLink: ['/auditor/compliance'] }],
        },
        {
            label: 'Reports',
            authority: ['1', '2', '3', '4', '6'],
            items: [{ label: 'Reports', icon: 'pi pi-fw pi-file', routerLink: ['/reports'] }],
        },
        {
            label: 'Masters',
            authority: ['1'],
            items: [

                {
                    label: 'Employee Master', icon: 'pi pi-fw pi-users',
                    items: [
                        {
                            label: 'Manage Employee',
                            icon: 'pi pi-fw pi-users',
                            routerLink: [
                                '/admin/employee-master'
                            ]
                        },
                        {
                            label: 'Password Policy',
                            icon: 'pi pi-fw pi-lock',
                            routerLink: [
                                '/admin/password-policy-master'
                            ]
                        },
                        {
                            label: 'Policy Documents',
                            icon: 'pi pi-fw pi-file',
                            routerLink: [
                                '/admin/policy-documents'
                            ]
                        }
                    ]
                },
                { label: 'Section Master', icon: 'pi pi-fw pi-list-check', routerLink: ['/admin/audit-section-master'] },
                { label: 'Unit Master', icon: 'pi pi-fw pi-building', routerLink: ['/admin/audit-unit-master'] },
                { label: 'Region Master', icon: 'pi pi-fw pi-map', routerLink: ['/admin/region-master'] },
                { label: 'Audit Calendar', icon: 'pi pi-fw pi-calendar', routerLink: ['/admin/audit-calendar'] },
                { label: 'Audit Frequency Master', icon: 'pi pi-fw pi-cog', routerLink: ['/admin/audit-frequency-master'] },
                { label: 'Scheme Master', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/audit-scheme-master'] },
                {
                    label: 'Question Master', icon: 'pi pi-fw pi-question-circle',
                    items: [
                        {
                            label: 'Manage Question ',
                            icon: 'pi pi-fw pi-question-circle',
                            routerLink: [
                                '/admin/question-set-master'
                            ]
                        },
                        {
                            label: 'Menu Master',
                            icon: 'pi pi-fw pi-list',
                            routerLink: [
                                '/admin/menu-master'
                            ]
                        },
                        {
                            label: 'Category Master',
                            icon: 'pi pi-fw pi-tags',
                            routerLink: [
                                '/admin/audit-category-master'
                            ]
                        }
                    ]
                },
                { label: 'Broader Area Master', icon: 'pi pi-fw pi-map-marker', routerLink: ['/admin/broader-area-master'] },
                { label: 'Periodwise Questions Master', icon: 'pi pi-fw pi-list', routerLink: ['/admin/periodwise-questions-master'] },
                { label: 'Multiple Auditor Assignment', icon: 'pi pi-fw pi-users', routerLink: ['/admin/multiple-auditor-assignment'] },
                { label: 'Manage Assessment Master', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/admin/manage-assessment-master'] },
                { label: 'Special Audit', icon: 'pi pi-fw pi-flag', routerLink: ['/admin/special-audit'] },
                { label: 'Annexure Master', icon: 'pi pi-fw pi-file-edit', routerLink: ['/admin/audit-annexure-master'] },
                {
                    label: 'Risk Master',
                    icon: 'pi pi-fw pi-shield',

                    items: [

                        {
                            label: 'Risk Categories',
                            icon: 'pi pi-fw pi-tags',
                            routerLink: [
                                '/admin/risk-categories'
                            ],
                        },

                        {
                            label: 'Risk Controls',
                            icon: 'pi pi-fw pi-sliders-h',
                            routerLink: [
                                '/admin/risk-controls'
                            ],
                        },

                        {
                            label: 'Composite Risk',
                            icon: 'pi pi-fw pi-share-alt',
                            routerLink: [
                                '/admin/risk-composites'
                            ],
                        },

                        {
                            label: 'Risk Matrix',
                            icon: 'pi pi-fw pi-table',
                            routerLink: [
                                '/admin/risk-matrix'
                            ],
                        },

                        {
                            label: 'Branch Rating',
                            icon: 'pi pi-fw pi-chart-line',
                            routerLink: [
                                '/admin/branch-rating'
                            ],
                        },

                    ],
                },
            ],
        },

        {
            label: 'Manage Accounts Data',
            authority: ['1'],
            items: [
                {
                    label: 'Manage Deposit Accounts',
                    icon: 'pi pi-fw pi-wallet',
                    routerLink: ['/admin/deposit-accounts'],
                },
                {
                    label: 'Manage Advance Accounts',
                    icon: 'pi pi-fw pi-credit-card',
                    routerLink: ['/admin/advance-accounts'],
                },
            ],
        }
    ];

    constructor() {
        effect(() => {
            this.auditNavService.assessmentId();
            this.auditNavService.menus();
            this.auditNavService.overview();
            this.queueRefreshModel();
        });
    }

    private queueRefreshModel() {
        if (
            this.refreshTimer
        ) {
            clearTimeout(
                this.refreshTimer,
            );
        }

        this.refreshTimer =
            setTimeout(
                () => {
                    this.refreshTimer =
                        undefined;
                    this.refreshModel();
                    this.cdr.detectChanges();
                },
            );
    }

    private refreshModel() {
        const url = this.router.url || '';
        const isInternalAuditRoute = url.includes('/auditor/internal-audit');
        const isReviewerRoute = url.includes('/auditor/reviewer');
        const isComplianceRoute = url.includes('/auditor/compliance');
        const isReportsRoute = url.includes('/reports');

        if (!isInternalAuditRoute && !isReviewerRoute && !isComplianceRoute && !isReportsRoute) {
            this.auditNavService.clear();
        }

        const user =
            JSON.parse(localStorage.getItem('user') || '{}');

        this.userTypeId =
            String(user.user_type_id || '');

        const filtered =
            this.baseModel.filter((menu: any) =>
                !menu.authority ||
                menu.authority.includes(this.userTypeId)
            );

        let currentAssessmentId =
            this.currentAssessmentIdFromRoute();
        if (!currentAssessmentId && isReportsRoute) {
            currentAssessmentId = Number(this.auditNavService.assessmentId() || 0);
        }

        const shouldShowAssessmentMenu =
            this.shouldShowCurrentAssessmentMenu(
                currentAssessmentId,
            );

        const assessmentMenuKey =
            JSON.stringify({
                currentAssessmentId,
                shouldShowAssessmentMenu,
                navAssessmentId:
                    this.auditNavService.assessmentId(),
                menus:
                    this.auditNavService.menus()
                        .map(
                            (menu: any) => ({
                                name:
                                    menu?.name,
                                categories:
                                    (menu?.categories || [])
                                        .map(
                                            (category: any) =>
                                                `${category?.id}:${category?.name}:${category?.carry_forward}:${category?.account_based}:${category?.completed_account_count}:${category?.account_count}:${category?.answered_count}:${category?.question_count}`,
                                        ),
                            }),
                        ),
            });

        if (
            shouldShowAssessmentMenu
            &&
            currentAssessmentId
            === Number(
                this.auditNavService.assessmentId(),
            )
        ) {
            filtered.push(
                this.buildAssessmentMenu(
                    currentAssessmentId,
                ),
            );
        }

        if (
            assessmentMenuKey
            === this.lastAssessmentMenuKey
            &&
            this.model.length
        ) {
            return;
        }

        this.lastAssessmentMenuKey =
            assessmentMenuKey;

        this.model = filtered;
    }

    private buildAssessmentMenu(
        assessmentId: number,
    ): MenuItem {
        const normalized =
            (value: any) =>
                String(value || '')
                    .trim()
                    .toLowerCase();

        const dynamicItems: MenuItem[] = [
            {
                label: 'Assessment Info',
                icon: 'pi pi-fw pi-info-circle',
                routerLink: [
                    '/auditor/internal-audit',
                    assessmentId,
                ],
                queryParams: {
                    view: 'summary',
                    categoryId: null,
                    dumpId: null,
                    pending: null,
                },
                routerLinkActiveOptions: {
                    paths: 'exact',
                    queryParams: 'exact',
                    matrixParams: 'ignored',
                    fragment: 'ignored',
                },
            },
            {
                label: 'Executive Summary',
                icon: 'pi pi-fw pi-file-edit',
                routerLink: [
                    '/auditor/internal-audit/executive-summary',
                    assessmentId,
                ],
            },
        ];

        for (
            const menu
            of this.auditNavService.menus()
        ) {
            const categoryItems =
                (menu.categories || [])
                    .filter(
                        (category: any) =>
                            ![
                                'executive summary',
                                'assessment info',
                            ].includes(
                                normalized(
                                    category?.name,
                                ),
                            ),
                    )
                    .map(
                        (category: any) => {
                            const isCarryForward =
                                category?.carry_forward
                                ||
                                Number(category?.id) === 0;

                            return {
                                label:
                                    category.name,
                                meta:
                                    this.categoryProgressText(
                                        category,
                                    ),
                                icon:
                                    isCarryForward
                                        ? 'pi pi-fw pi-forward'
                                        : 'pi pi-fw pi-angle-right',
                                routerLink: [
                                    '/auditor/internal-audit',
                                    assessmentId,
                                ],
                                queryParams: isCarryForward
                                    ? {
                                        view:
                                            'carry-forward',
                                        categoryId:
                                            null,
                                        dumpId:
                                            null,
                                        pending:
                                            null,
                                    }
                                    : {
                                        view:
                                            'category',
                                        categoryId:
                                            Number(category.id),
                                        dumpId:
                                            null,
                                        pending:
                                            null,
                                    },
                                routerLinkActiveOptions: {
                                    paths:
                                        'exact',
                                    queryParams:
                                        'exact',
                                    matrixParams:
                                        'ignored',
                                    fragment:
                                        'ignored',
                                },
                            };
                        },
                    );

            if (
                !categoryItems.length
                ||
                [
                    'executive summary',
                    'assessment info',
                ].includes(
                    normalized(
                        menu?.name,
                    ),
                )
            ) {
                continue;
            }

            dynamicItems.push({
                label:
                    menu.name,
                icon:
                    'pi pi-fw pi-folder',
                items:
                    categoryItems,
            });
        }

        return {
            label:
                'Current Assessment',
            authority:
                ['2'],
            items:
                dynamicItems,
        } as MenuItem;
    }

    private categoryProgressText(
        category: any,
    ) {
        if (
            category?.account_based
        ) {
            const completed =
                Number(
                    category?.completed_account_count || 0,
                );
            const total =
                Number(
                    category?.account_count || 0,
                );

            if (total === 0) {
                return '';
            }

            const remaining =
                Math.max(
                    total - completed,
                    0,
                );

            return `${completed}/${total} accounts completed, ${remaining} remaining`;
        }

        const answered =
            Number(
                category?.answered_count || 0,
            );
        const total =
            Number(
                category?.question_count || 0,
            );

        if (total === 0) {
            return '';
        }

        const remaining =
            Math.max(
                total - answered,
                0,
            );

        return `${answered}/${total} answered, ${remaining} remaining`;
    }

    private currentAssessmentIdFromRoute() {
        const url =
            this.router.url || '';

        let match =
            url.match(
                /\/auditor\/internal-audit\/(\d+)(?:\?|$)/,
            );

        if (
            match?.[1]
        ) {
            return Number(
                match[1],
            );
        }

        match =
            url.match(
                /\/auditor\/internal-audit\/executive-summary\/(\d+)(?:\?|$)/,
            );

        return match?.[1]
            ? Number(match[1])
            : 0;
    }

    private shouldShowCurrentAssessmentMenu(
        currentAssessmentId: number,
    ) {
        if (
            !currentAssessmentId
            ||
            this.userTypeId !== '2'
        ) {
            return false;
        }

        const url =
            this.router.url || '';

        return !(
            url.includes(
                '/auditor/internal-audit/executive-summary/',
            )
            &&
            url.includes(
                'mode=reviewer',
            )
        );
    }

    ngOnDestroy() {
        this.routeSubscription?.unsubscribe();

        if (
            this.refreshTimer
        ) {
            clearTimeout(
                this.refreshTimer,
            );
        }
    }





    // private updateMenu(role: string) {
    //     // --- Common Menu Items ---
    //     const homeSection = {
    //         label: 'Home',
    //         items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] }],
    //     };

    //     const proposalsSection = {
    //         label: 'Proposals',
    //         items: [{ label: 'Proposals', icon: 'pi pi-fw pi-file', routerLink: ['/proposals'] }],
    //     };

    //     const supportSection = {
    //         label: 'Support & KMS',
    //         items: [
    //             { label: 'Helpdesk', icon: 'pi pi-fw pi-question-circle', routerLink: ['/support/helpdesk'] },
    //             { label: 'Policy Documents', icon: 'pi pi-fw pi-info-circle', routerLink: ['/support/policy'] },
    //         ],
    //     };

    //     // --- Detailed Reports ---
    //     const operationalReports = [
    //         { label: 'Stage Wise Report', icon: 'pi pi-fw pi-map', routerLink: ['/admin/reports/stage-wise'] },
    //         { label: 'Amount Wise Report', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/reports/amount-wise'] },
    //         { label: 'Branch Wise Report', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/branch-wise'] },
    //         { label: 'Date Wise Report', icon: 'pi pi-fw pi-calendar', routerLink: ['/admin/reports/date-wise'] },
    //         { label: 'Applicant Wise Report', icon: 'pi pi-fw pi-user', routerLink: ['/admin/reports/applicant-wise'] },
    //         { label: 'Loan Origination Report', icon: 'pi pi-fw pi-file-o', routerLink: ['/admin/reports/loan-origination'] },
    //         { label: 'Disbursement Report', icon: 'pi pi-fw pi-send', routerLink: ['/admin/reports/disbursement'] },
    //         { label: 'Rejection Analysis', icon: 'pi pi-fw pi-times-circle', routerLink: ['/admin/reports/rejection-analysis'] },
    //     ];

    //     const metricReports = [
    //         { label: 'Stage Wise Count Report', icon: 'pi pi-fw pi-list', routerLink: ['/admin/reports/stage-count'] },
    //         { label: 'Loan Product Wise Count Report', icon: 'pi pi-fw pi-box', routerLink: ['/admin/reports/product-count'] },
    //         { label: 'Branch Wise Count Report', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/branch-count'] },
    //         { label: 'NPA Tracking', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/admin/reports/npa-tracking'] },
    //         { label: 'Document Pending Report', icon: 'pi pi-fw pi-paperclip', routerLink: ['/admin/reports/doc-pending'] },
    //     ];

    //     const tatReports = [
    //         { label: 'TAT Report Detail', icon: 'pi pi-fw pi-list', routerLink: ['/admin/reports/tat-detail'] },
    //         { label: 'TAT Summary Report (Branchwise)', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/tat-branch-summary'] },
    //         { label: 'TAT Summary Report (Loantypewise)', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/reports/tat-loan-summary'] },
    //         { label: 'Efficiency Leaderboard', icon: 'pi pi-fw pi-chart-line', routerLink: ['/admin/reports/efficiency'] },
    //     ];

    //     // --- Role Specific Menus ---

    //     if (role === 'admin') {
    //         this.model = [
    //             homeSection,
    //             proposalsSection,
    //             {
    //                 label: 'Masters',
    //                 items: [
    //                     {
    //                         label: 'User Management',
    //                         icon: 'pi pi-fw pi-users',
    //                         items: [
    //                             { label: 'Role Master', icon: 'pi pi-fw pi-user-edit', routerLink: ['/admin/role-master'] },
    //                             { label: 'Role Permissions', icon: 'pi pi-fw pi-lock', routerLink: ['/admin/role-permissions'] },
    //                             { label: 'User Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/user-master'] },
    //                             { label: 'Employee Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/employee-master'] },
    //                             { label: 'Password Policy', icon: 'pi pi-fw pi-lock', routerLink: ['/admin/password-policy-master'] },
    //                         ],
    //                     },
    //                     {
    //                         label: 'Workflow Setup',
    //                         icon: 'pi pi-fw pi-sitemap',
    //                         items: [
    //                             { label: 'Flow Master', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/flow-master'] },
    //                             { label: 'Stage Master', icon: 'pi pi-fw pi-step-forward', routerLink: ['/admin/stage-master'] },
    //                         ],
    //                     },
    //                     {
    //                         label: 'App Configuration',
    //                         icon: 'pi pi-fw pi-cog',
    //                         items: [
    //                             { label: 'Language Master', icon: 'pi pi-fw pi-language', routerLink: ['/admin/language-master'] },
    //                             { label: 'Bank Info', icon: 'pi pi-fw pi-building', routerLink: ['/admin/bank-info'] },
    //                             { label: 'Branch Master', icon: 'pi pi-fw pi-map', routerLink: ['/admin/branch-master'] },
    //                         ],
    //                     },
    //                     {
    //                         label: 'Product Setup',
    //                         icon: 'pi pi-fw pi-box',
    //                         items: [
    //                             { label: 'Loan Type Master', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/loan-type-master'] },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             {
    //                 label: 'Reports',
    //                 items: [
    //                     { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
    //                     { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
    //                     { label: 'TAT Analysis', icon: 'pi pi-fw pi-clock', items: tatReports },
    //                 ],
    //             },
    //             {
    //                 label: 'Communications',
    //                 items: [
    //                     { label: 'SMS Logs', icon: 'pi pi-fw pi-comment', routerLink: ['/admin/sms-logs'] },
    //                     { label: 'Email Logs', icon: 'pi pi-fw pi-envelope', routerLink: ['/admin/email-logs'] },
    //                 ],
    //             },
    //             supportSection,
    //         ];
    //     } else if (role === 'ba') {
    //         this.model = [
    //             homeSection,
    //             proposalsSection,
    //             {
    //                 label: 'Masters',
    //                 items: [
    //                     {
    //                         label: 'Address Masters',
    //                         icon: 'pi pi-fw pi-map-marker',
    //                         items: [
    //                             { label: 'State Master', icon: 'pi pi-fw pi-flag', routerLink: ['/pos/address/state-master'] },
    //                             { label: 'District Master', icon: 'pi pi-fw pi-building', routerLink: ['/pos/address/district-master'] },
    //                         ],
    //                     },
    //                 ],
    //             },
    //             {
    //                 label: 'Reports',
    //                 items: [
    //                     { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
    //                     { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
    //                 ],
    //             },
    //             supportSection,
    //         ];
    //     } else if (role === 'bm') {
    //         this.model = [
    //             homeSection,
    //             proposalsSection,
    //             {
    //                 label: 'Reports',
    //                 items: [
    //                     { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
    //                     { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
    //                     { label: 'TAT Analysis', icon: 'pi pi-fw pi-clock', items: tatReports },
    //                 ],
    //             },
    //             supportSection,
    //         ];
    //     } else if (role === 'loan_officer') {
    //         this.model = [
    //             homeSection,
    //             proposalsSection,
    //             {
    //                 label: 'Reports',
    //                 items: [
    //                     { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
    //                 ],
    //             },
    //             supportSection,
    //         ];
    //     } else {
    //         this.model = [];
    //     }
    // }
}
