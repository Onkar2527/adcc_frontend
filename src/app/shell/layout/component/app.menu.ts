import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { LayoutService } from '../service/layout.service';

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
export class AppMenu implements OnInit {
    private layoutService = inject(LayoutService);
    model: MenuItem[] = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] }],
        },
        // {
        //     label: 'Proposals',
        //     items: [{ label: 'Proposals', icon: 'pi pi-fw pi-file', routerLink: ['/proposals'] }],
        // },
        {
            label: 'Employee Management',
            items: [
                { label: 'Employee Master', icon: 'pi pi-fw pi-users', routerLink: ['/employees'] },
                { label: 'Password Policy', icon: 'pi pi-fw pi-lock', routerLink: ['/password-policy'] }
            ],
        }
    ];

    constructor() {
        effect(() => {

        });
    }

    ngOnInit() {
    }

    private updateMenu(role: string) {
        // --- Common Menu Items ---
        const homeSection = {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] }],
        };

        const proposalsSection = {
            label: 'Proposals',
            items: [{ label: 'Proposals', icon: 'pi pi-fw pi-file', routerLink: ['/proposals'] }],
        };

        const supportSection = {
            label: 'Support & KMS',
            items: [
                { label: 'Helpdesk', icon: 'pi pi-fw pi-question-circle', routerLink: ['/support/helpdesk'] },
                { label: 'Policy Documents', icon: 'pi pi-fw pi-info-circle', routerLink: ['/support/policy'] },
            ],
        };

        // --- Detailed Reports ---
        const operationalReports = [
            { label: 'Stage Wise Report', icon: 'pi pi-fw pi-map', routerLink: ['/admin/reports/stage-wise'] },
            { label: 'Amount Wise Report', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/reports/amount-wise'] },
            { label: 'Branch Wise Report', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/branch-wise'] },
            { label: 'Date Wise Report', icon: 'pi pi-fw pi-calendar', routerLink: ['/admin/reports/date-wise'] },
            { label: 'Applicant Wise Report', icon: 'pi pi-fw pi-user', routerLink: ['/admin/reports/applicant-wise'] },
            { label: 'Loan Origination Report', icon: 'pi pi-fw pi-file-o', routerLink: ['/admin/reports/loan-origination'] },
            { label: 'Disbursement Report', icon: 'pi pi-fw pi-send', routerLink: ['/admin/reports/disbursement'] },
            { label: 'Rejection Analysis', icon: 'pi pi-fw pi-times-circle', routerLink: ['/admin/reports/rejection-analysis'] },
        ];

        const metricReports = [
            { label: 'Stage Wise Count Report', icon: 'pi pi-fw pi-list', routerLink: ['/admin/reports/stage-count'] },
            { label: 'Loan Product Wise Count Report', icon: 'pi pi-fw pi-box', routerLink: ['/admin/reports/product-count'] },
            { label: 'Branch Wise Count Report', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/branch-count'] },
            { label: 'NPA Tracking', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/admin/reports/npa-tracking'] },
            { label: 'Document Pending Report', icon: 'pi pi-fw pi-paperclip', routerLink: ['/admin/reports/doc-pending'] },
        ];

        const tatReports = [
            { label: 'TAT Report Detail', icon: 'pi pi-fw pi-list', routerLink: ['/admin/reports/tat-detail'] },
            { label: 'TAT Summary Report (Branchwise)', icon: 'pi pi-fw pi-building', routerLink: ['/admin/reports/tat-branch-summary'] },
            { label: 'TAT Summary Report (Loantypewise)', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/reports/tat-loan-summary'] },
            { label: 'Efficiency Leaderboard', icon: 'pi pi-fw pi-chart-line', routerLink: ['/admin/reports/efficiency'] },
        ];

        // --- Role Specific Menus ---

        if (role === 'admin') {
            this.model = [
                homeSection,
                proposalsSection,
                {
                    label: 'Masters',
                    items: [
                        {
                            label: 'User Management',
                            icon: 'pi pi-fw pi-users',
                            items: [
                                { label: 'Role Master', icon: 'pi pi-fw pi-user-edit', routerLink: ['/admin/role-master'] },
                                { label: 'Role Permissions', icon: 'pi pi-fw pi-lock', routerLink: ['/admin/role-permissions'] },
                                { label: 'User Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/user-master'] },
                            ],
                        },
                        {
                            label: 'Workflow Setup',
                            icon: 'pi pi-fw pi-sitemap',
                            items: [
                                { label: 'Flow Master', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/flow-master'] },
                                { label: 'Stage Master', icon: 'pi pi-fw pi-step-forward', routerLink: ['/admin/stage-master'] },
                            ],
                        },
                        {
                            label: 'App Configuration',
                            icon: 'pi pi-fw pi-cog',
                            items: [
                                { label: 'Language Master', icon: 'pi pi-fw pi-language', routerLink: ['/admin/language-master'] },
                                { label: 'Bank Info', icon: 'pi pi-fw pi-building', routerLink: ['/admin/bank-info'] },
                                { label: 'Branch Master', icon: 'pi pi-fw pi-map', routerLink: ['/admin/branch-master'] },
                            ],
                        },
                        {
                            label: 'Product Setup',
                            icon: 'pi pi-fw pi-box',
                            items: [
                                { label: 'Loan Type Master', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/loan-type-master'] },
                            ],
                        },
                    ],
                },
                {
                    label: 'Reports',
                    items: [
                        { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
                        { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
                        { label: 'TAT Analysis', icon: 'pi pi-fw pi-clock', items: tatReports },
                    ],
                },
                {
                    label: 'Communications',
                    items: [
                        { label: 'SMS Logs', icon: 'pi pi-fw pi-comment', routerLink: ['/admin/sms-logs'] },
                        { label: 'Email Logs', icon: 'pi pi-fw pi-envelope', routerLink: ['/admin/email-logs'] },
                    ],
                },
                supportSection,
            ];
        } else if (role === 'ba') {
            this.model = [
                homeSection,
                proposalsSection,
                {
                    label: 'Masters',
                    items: [
                        {
                            label: 'Address Masters',
                            icon: 'pi pi-fw pi-map-marker',
                            items: [
                                { label: 'State Master', icon: 'pi pi-fw pi-flag', routerLink: ['/pos/address/state-master'] },
                                { label: 'District Master', icon: 'pi pi-fw pi-building', routerLink: ['/pos/address/district-master'] },
                            ],
                        },
                    ],
                },
                {
                    label: 'Reports',
                    items: [
                        { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
                        { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
                    ],
                },
                supportSection,
            ];
        } else if (role === 'bm') {
            this.model = [
                homeSection,
                proposalsSection,
                {
                    label: 'Reports',
                    items: [
                        { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
                        { label: 'Metric Reports', icon: 'pi pi-fw pi-chart-bar', items: metricReports },
                        { label: 'TAT Analysis', icon: 'pi pi-fw pi-clock', items: tatReports },
                    ],
                },
                supportSection,
            ];
        } else if (role === 'loan_officer') {
            this.model = [
                homeSection,
                proposalsSection,
                {
                    label: 'Reports',
                    items: [
                        { label: 'Operational Reports', icon: 'pi pi-fw pi-file', items: operationalReports },
                    ],
                },
                supportSection,
            ];
        } else {
            this.model = [];
        }
    }
}
