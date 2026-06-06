import {
    CommonModule,
} from '@angular/common';

import {
    ChangeDetectorRef,
    Component,
    OnInit,
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
    TagModule,
} from 'primeng/tag';
import { AccordionModule }
from 'primeng/accordion';
import {
    AuditDashboardService,
} from '../../services/auditor-main.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';

@Component({

    selector:
        'app-executive-summary',

    standalone:
        true,

    imports: [

        CommonModule,
        FormsModule,
        ButtonModule,
        SkeletonModule,
        TagModule,
        CardModule,
        InputTextModule,
        TableModule,
        AccordionModule,
        SelectModule


    ],

    templateUrl:
        './executive-summary.component.html',

})

export class ExecutiveSummaryComponent
    implements OnInit {

    private service =
        inject(
            AuditDashboardService,
        );

    private route =
        inject(
            ActivatedRoute,
        );

    private router =
        inject(
            Router,
        );
    private cdr =
        inject(ChangeDetectorRef);
    private messageService =
        inject(
            MessageService,
        );

    assessmentId!: number;

    summary: any = null;
    user: any = null;
    reviewModeFromRoute = false;

    summary_detail: any[] = [];

    loading =
        signal(false);

    // ---------- Review Mode Helpers ----------
    /** Returns true if the logged-in user is a Reviewer (user_type_id = 4) */
    get isReviewMode(): boolean {
        const userType =
            String(this.user?.user_type_id || this.user?.role_id || '').trim();

        const roleText =
            String(this.user?.role || this.user?.role_name || this.user?.designation || '').toLowerCase();

        return this.reviewModeFromRoute
            || ['3', '4'].includes(userType)
            || roleText.includes('reviewer');
    }

    /** Show review columns whenever this screen is opened in reviewer mode. */
    get shouldShowReviewColumns(): boolean {
        return this.isReviewMode;
    }

    get shouldShowReviewerFeedback(): boolean {
        return !this.isReviewMode
            && this.financialPositionData.some(
                (row: any) => !row.isHeader && this.hasExecutiveReviewFeedback(row),
            );
    }

    get backButtonLabel(): string {
        return this.reviewModeFromRoute
            ? 'Back to Review'
            : 'Back to Menu';
    }

    reviewActionOptions = [
        {
            label: 'Accept',
            value: 2,
        },
        {
            label: 'Re-assessment',
            value: 3,
        },
    ];

    applyDefaultExecutiveAccept() {
        this.financialPositionData
            .filter((row: any) => !row.isHeader)
            .forEach((row: any) => {
                row.review_action = 2;
            });

        this.messageService.add({
            severity: 'success',
            summary: 'Default applied',
            detail: 'All executive summary rows marked as accepted.',
        });
    }

    ngOnInit(): void {
        this.user =
            JSON.parse(localStorage.getItem('user') || '{}');

        this.reviewModeFromRoute =
            this.route.snapshot.queryParamMap.get('mode') === 'reviewer';

        this.assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        this.getExecutiveSummary();

    }
    financialPositionData: any[] = [];
    branchPositionLines: any[] = [];

    private savedAmountOrDefault(
        savedLine: any,
        defaultValue: any,
    ) {
        return savedLine
            &&
            savedLine.amount !== ''
            &&
            savedLine.amount !== null
            &&
            savedLine.amount !== undefined
                ? Number(savedLine.amount)
                : defaultValue;
    }

    private savedAccountsOrDefault(
        savedFreshLine: any,
        defaultValue: any,
    ) {
        return savedFreshLine
            &&
            savedFreshLine.accounts !== ''
            &&
            savedFreshLine.accounts !== null
            &&
            savedFreshLine.accounts !== undefined
                ? Number(savedFreshLine.accounts)
                : defaultValue;
    }

    private executiveReviewAction(savedLine: any, savedFreshLine: any) {
        return Number(savedLine?.review_action || savedFreshLine?.review_action || 0) || null;
    }

    private executiveReviewComment(savedLine: any, savedFreshLine: any) {
        return savedLine?.reviewer_comment || savedFreshLine?.reviewer_comment || '';
    }

    hasExecutiveReviewFeedback(row: any): boolean {
        return !!Number(row?.review_action || 0) || !!String(row?.reviewer_comment || '').trim();
    }

    executiveReviewStatusLabel(row: any): string {
        const action = Number(row?.review_action || 0);

        if (action === 2) {
            return 'Accepted';
        }

        if (action === 3) {
            return 'Re-assessment';
        }

        return 'Pending review';
    }

    executiveReviewSeverity(row: any): 'success' | 'danger' | 'warn' {
        const action = Number(row?.review_action || 0);

        if (action === 2) {
            return 'success';
        }

        if (action === 3) {
            return 'danger';
        }

        return 'warn';
    }

    isExecutiveReAuditMode(): boolean {
        const statusText =
            String(this.summary?.audit_status || '').toLowerCase();

        return !this.isReviewMode
            && (
                Number(this.summary?.audit_status_id || 0) === 3
                || statusText.includes('re audit')
            );
    }

    isExecutiveAmountReadOnly(row: any): boolean {
        return this.isReviewMode
            || (
                this.isExecutiveReAuditMode()
                && Number(row?.review_action || 0) !== 3
            );
    }

    isExecutiveAccountsReadOnly(row: any): boolean {
        return !row?.isNpa || this.isExecutiveAmountReadOnly(row);
    }

    getBranchFinancialPosition() {

        this.loading.set(true);

        this.service
            .getBranchFinancialPosition(
                this.summary?.audit_unit_id,
            )
            .subscribe({

                next: (res: any) => {

                    setTimeout(() => {

                        const groupedData: any[] = [];

                        const grouped =
                            res.reduce(
                                (
                                    acc: any,
                                    item: any,
                                ) => {

                                    if (
                                        !acc[
                                        item.scheme_type
                                        ]
                                    ) {

                                        acc[
                                            item.scheme_type
                                        ] = [];

                                    }

                                    acc[
                                        item.scheme_type
                                    ].push(item);

                                    return acc;

                                },
                                {},
                            );

                        let prefixIndex = 0;

                        Object.keys(grouped)
                            .forEach(
                                (
                                    type: string,
                                ) => {

                                    const items =
                                        grouped[type];

                                    const rowItems: any[] = [];
                                    let totalAccounts = 0;
                                    let totalAmount = 0;
                                    let totalMarch = 0;

                                    items.forEach(
                                        (
                                            item: any,
                                            index: number,
                                        ) => {
                                            const savedLine = this.branchPositionLines.find(
                                                (x: any) => String(x.type_id).trim() === String(item.scheme_code).trim()
                                            );
                                            const savedFreshLine = this.summary?.fresh_accounts?.find(
                                                (x: any) => String(x.type_id).trim() === String(item.scheme_code).trim()
                                            );
                                            const categoryMarch = this.summary?.march_positions?.find(
                                                (x: any) => x.gl_type_id === item.category_id
                                            );
                                            const marchPositionValue = categoryMarch ? Number(categoryMarch.march_position || 0) : 0;

                                            const accounts = this.savedAccountsOrDefault(
                                                savedFreshLine,
                                                Number(item.total_accounts || 0),
                                            );
                                            const amount = this.savedAmountOrDefault(
                                                savedLine,
                                                Math.abs(Number(item.total_amount || 0)),
                                            );

                                            totalAccounts += Number(accounts || 0);
                                            totalAmount += Number(amount || 0);
                                            totalMarch += Number(marchPositionValue || 0);

                                            rowItems.push({
                                                isHeader: false,
                                                isNpa: false,
                                                index: index + 1,
                                                scheme_code: item.scheme_code,
                                                category_id: item.category_id,
                                                scheme_name: item.scheme_name,
                                                total_accounts: accounts,
                                                march_position: marchPositionValue,
                                                total_amount: amount,
                                                type_id: item.scheme_code,
                                                review_action: this.executiveReviewAction(savedLine, savedFreshLine),
                                                reviewer_comment: this.executiveReviewComment(savedLine, savedFreshLine),
                                            });
                                        },
                                    );

                                    groupedData.push({
                                        isHeader: true,
                                        prefix: String.fromCharCode(65 + prefixIndex),
                                        scheme_type: type,
                                        total_accounts: totalAccounts,
                                        march_position: totalMarch,
                                        total_amount: totalAmount,
                                    });

                                    groupedData.push(...rowItems);
                                    prefixIndex++;

                                },
                            );

                        // NPA SECTION

                        const advanceItems =
                            grouped['ADVANCES'] || [];

                        let totalNpaMarch = 0;
                        let totalNpaAccounts = 0;
                        let totalNpaAmount = 0;
                        const npaRows: any[] = [];

                        advanceItems.forEach(
                            (
                                item: any,
                                index: number,
                            ) => {
                                const savedLine = this.branchPositionLines.find(
                                    (x: any) => String(x.type_id).trim() === String(item.scheme_code + '_NPA').trim()
                                );
                                const savedFreshLine = this.summary?.fresh_accounts?.find(
                                    (x: any) => String(x.type_id).trim() === String(item.scheme_code + '_NPA').trim()
                                );
                                const categoryMarch = this.summary?.march_positions?.find(
                                    (x: any) => x.gl_type_id === (item.category_id + 6)
                                );
                                const marchPositionValue = categoryMarch ? Number(categoryMarch.march_position || 0) : 0;

                                const accountInput = this.savedAccountsOrDefault(
                                    savedFreshLine,
                                    '',
                                );
                                const amountInput = this.savedAmountOrDefault(
                                    savedLine,
                                    '',
                                );

                                totalNpaAccounts += Number(accountInput || 0);
                                totalNpaAmount += Number(amountInput || 0);
                                totalNpaMarch += Number(marchPositionValue || 0);

                                npaRows.push({
                                    isHeader: false,
                                    isNpa: true,
                                    index: index + 1,
                                    scheme_code: item.scheme_code,
                                    category_id: item.category_id,
                                    scheme_name: item.scheme_name,
                                    account_input: accountInput,
                                    amount_input: amountInput,
                                    type_id: item.scheme_code + '_NPA',
                                    march_position: marchPositionValue,
                                    review_action: this.executiveReviewAction(savedLine, savedFreshLine),
                                    reviewer_comment: this.executiveReviewComment(savedLine, savedFreshLine),
                                });
                            },
                        );

                        groupedData.push({
                            isHeader: true,
                            prefix: 'C',
                            scheme_type: 'NPA',
                            total_accounts: totalNpaAccounts,
                            march_position: totalNpaMarch,
                            total_amount: totalNpaAmount,
                        });

                        groupedData.push(...npaRows);

                        this.financialPositionData =
                            groupedData;

                        this.cdr.detectChanges();

                        this.loading.set(false);

                    });

                },

                error: (err: any) => {

                    console.log(err);

                    this.loading.set(false);

                },

            });

    }

    getExecutiveSummary() {

        this.loading.set(
            true,
        );

        this.service
            .getExecutiveSummary(
                this.assessmentId,
                Number(
                    this.user?.id
                    || this.user?.employee_id
                    || this.user?.emp_id
                    || 0,
                ),
            )
            .subscribe({

                next: (
                    res: any,
                ) => {

                    this.summary =
                        res || null;
                    this.branchPositionLines =
                        res.branch_positions || [];
                    if (this.summary?.audit_unit_id) {

                        this.getBranchFinancialPosition();

                    }

                    this.summary_detail =
                        res.summary_detail || [];

                    this.loading.set(
                        false,
                    );
                    this.cdr.detectChanges();

                },

                error: () => {

                    this.loading.set(
                        false,
                    );

                },

            });

    }

    saveExecutiveSummaryBasic() {

        const payload = {

            assessment_id:
                this.assessmentId,

            year_id:
                this.summary?.year_id,

            admin_id:
                this.user?.id
                || this.user?.employee_id
                || this.user?.emp_id,

            employee_id:
                this.user?.id
                || this.user?.employee_id
                || this.user?.emp_id,

            audit_report_submitted_date: (() => {
                const val = this.summary_detail.find(
                    x =>
                        x.label ===
                        '9. Audit Report Submitted Date',
                )?.value;
                if (!val) return '';
                if (typeof val === 'string' && val.includes('T')) {
                    return val.split('T')[0];
                }
                return val;
            })(),

            staff_count:
                this.summary_detail.find(
                    x =>
                        x.label ===
                        '12. Number of Staff including Contractual/Daily wages staff',
                )?.value,

            manual_challans_per_day:
                this.summary_detail.find(
                    x =>
                        x.label ===
                        '13. Approximate Number of manual Challans per day',
                )?.value,

        };

        this.loading.set(true);

        this.service
            .saveExecutiveSummaryBasic(payload)
            .subscribe({

                next: (res: any) => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Basic details saved successfully'
                    });
                    this.getExecutiveSummary();

                },

                error: (err: any) => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save basic details'
                    });

                },

            });

    }

    saveExecutiveSummaryFinancials() {
        const branch_positions: any[] = [];
        const fresh_accounts: any[] = [];

        this.financialPositionData.forEach((row: any) => {
            if (row.isHeader || !row.scheme_code || String(row.scheme_code).trim() === '') return;

            const schemeCode = String(row.scheme_code).trim();

            if (!row.isNpa) {
                const amtVal = Number(row.total_amount);
                const amount = Number.isFinite(amtVal) && amtVal >= 0 ? amtVal : 0;

                const acctVal = Number(row.total_accounts);
                const accounts = Number.isFinite(acctVal) && acctVal >= 0 ? Math.floor(acctVal) : 0;

                branch_positions.push({
                    type_id: schemeCode,
                    amount
                });
                fresh_accounts.push({
                    type_id: schemeCode,
                    accounts
                });
            } else {
                const amtVal = Number(row.amount_input);
                const amount = Number.isFinite(amtVal) && amtVal >= 0 ? amtVal : 0;

                const acctVal = Number(row.account_input);
                const accounts = Number.isFinite(acctVal) && acctVal >= 0 ? Math.floor(acctVal) : 0;

                branch_positions.push({
                    type_id: schemeCode + '_NPA',
                    amount
                });
                fresh_accounts.push({
                    type_id: schemeCode + '_NPA',
                    accounts
                });
            }
        });

        const payload = {
            assessment_id: this.assessmentId,
            year_id: this.summary?.year_id,
            admin_id: this.user?.id || this.user?.employee_id || this.user?.emp_id,
            employee_id: this.user?.id || this.user?.employee_id || this.user?.emp_id,
            branch_positions,
            fresh_accounts
        };

        this.loading.set(true);

        this.service
            .saveExecutiveSummaryFinancials(payload)
            .subscribe({

                next: (res: any) => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Branch financial details saved successfully'
                    });
                    this.getExecutiveSummary();

                },

                error: (err: any) => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save branch financial details'
                    });

                },

            });
    }

    backToDashboard() {
        if (
            this.reviewModeFromRoute
        ) {
            this.router.navigate([
                '/auditor/reviewer',
            ]);
            return;
        }

        this.router.navigate([
            '/auditor/internal-audit',
            this.assessmentId,
        ]);

    }

    /** Collect review actions from financial rows and save */
    saveExecutiveSummaryReview() {
        const reviewRows = this.financialPositionData
            .filter((row: any) => {
                const typeId =
                    String(row.type_id || row.scheme_code || '').trim();

                return !row.isHeader && !!typeId;
            });

        const missingAction = reviewRows
            .filter((row: any) => ![2, 3].includes(Number(row.review_action || 0)));

        if (missingAction.length) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Review incomplete',
                detail: 'Please accept or mark re-assessment for all executive summary rows.',
            });
            return;
        }

        const missingComment = reviewRows
            .filter((row: any) => Number(row.review_action || 0) === 3 && !String(row.reviewer_comment || '').trim());

        if (missingComment.length) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Comment required',
                detail: 'Reviewer comment is required for re-assessment rows.',
            });
            return;
        }

        const reviews = reviewRows
            .map((row: any) => ({
                type_id: row.type_id || row.scheme_code,
                review_action: row.review_action,
                reviewer_comment: row.reviewer_comment || '',
            }));

        if (!reviews.length) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a review action for at least one row.',
            });
            return;
        }

        const payload = {
            assessment_id: this.assessmentId,
            employee_id: this.user?.id || this.user?.employee_id || this.user?.emp_id,
            reviews,
        };

        this.loading.set(true);

        this.service
            .saveExecutiveSummaryReview(payload)
            .subscribe({
                next: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Executive summary review saved successfully.',
                    });
                    this.getExecutiveSummary();
                },
                error: () => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save executive summary review.',
                    });
                },
            });
    }

}
