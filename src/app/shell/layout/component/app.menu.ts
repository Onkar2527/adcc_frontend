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
export class AppMenu  implements OnInit {
    private layoutService = inject(LayoutService);
    ngOnInit(): void {
         const user =
    JSON.parse(localStorage.getItem('user') || '{}');
      
        this.model =
      this.model.filter((menu: any) =>
        !menu.authority ||
        menu.authority.includes(user.user_type_id)
      );
    }
    model: MenuItem[] = [
        {
            label: 'Home',
            authority: ['1'],
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/home'] }],
        },
        {
            authority: ['2'],
            items: [{ label: 'Internal Audit', icon: 'pi pi-fw--pi-alert', routerLink: ['/auditor/select-audit-unit'] }],
        },
        {
            label: 'Masters',
            authority: ['1'],
            items: [
                
                { label: 'Employee Master', icon: 'pi pi-fw pi-users', routerLink: ['/admin/employee-master'] },
                { label: 'Password Policy', icon: 'pi pi-fw pi-lock', routerLink: ['/admin/password-policy-master'] },
                { label: 'Section Master', icon: 'pi pi-fw pi-list-check', routerLink: ['/admin/audit-section-master'] },
                { label: 'Unit Master', icon: 'pi pi-fw pi-building', routerLink: ['/admin/audit-unit-master'] },
                { label: 'Scheme Master', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/audit-scheme-master'] },
                { label: 'Question Master', icon: 'pi pi-fw pi-question-circle', routerLink: ['/admin/question-set-master'] },
                { label: 'Category Master', icon: 'pi pi-fw pi-tags', routerLink: ['/admin/audit-category-master'] },
                { label: 'Broader Area Master', icon: 'pi pi-fw pi-map-marker', routerLink: ['/admin/broader-area-master'] },
                { label: 'Periodwise Questions Master', icon: 'pi pi-fw pi-list', routerLink: ['/admin/periodwise-questions-master'] },
                { label: 'Manage Assessment Master', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/admin/manage-assessment-master'] },
                { label: 'Menu Master', icon: 'pi pi-fw pi-list', routerLink: ['/admin/menu-master'] },
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
        }
    ];

    constructor() {
        effect(() => {

        });
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
