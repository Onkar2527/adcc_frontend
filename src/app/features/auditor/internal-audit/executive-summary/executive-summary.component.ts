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
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { InternalAuditNavService } from '../../services/internal-audit-nav.service';

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
        SelectModule,
        DatePickerModule


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
    private navService =
        inject(
            InternalAuditNavService,
        );

    assessmentId!: number;

    summary: any = null;
    user: any = null;
    reviewModeFromRoute = false;
    viewOnlyModeFromRoute = false;

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

        return !this.viewOnlyModeFromRoute
            && (this.reviewModeFromRoute
            || ['3', '4'].includes(userType)
            || roleText.includes('reviewer'));
    }

    /** Show review columns whenever this screen is opened in reviewer mode. */
    get shouldShowReviewColumns(): boolean {
        if (Number(this.summary?.audit_status_id || 0) === 1) {
            return false;
        }
        return this.isReviewMode;
    }

    get shouldShowReviewerFeedback(): boolean {
        if (Number(this.summary?.audit_status_id || 0) === 1) {
            return false;
        }
        return !this.viewOnlyModeFromRoute
            && !this.isReviewMode
            && this.financialPositionData.some(
                (row: any) => !row.isHeader && this.hasExecutiveReviewFeedback(row),
            );
    }

    get backButtonLabel(): string {
        if (this.viewOnlyModeFromRoute) {
            return 'Back to Compliance';
        }

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

        const mode =
            this.route.snapshot.queryParamMap.get('mode');

        this.reviewModeFromRoute =
            mode === 'reviewer';

        this.viewOnlyModeFromRoute =
            mode === 'compliance-view';

        this.assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        this.getExecutiveSummary();

    }
    legacyCategories: any = {
        DEPOSITS: [
            { scheme_code: 'legacy_casa', scheme_name: 'CASA Deposit', category_id: 1, position_type_id: '1', fresh_type_ids: ['1'] },
            { scheme_code: 'legacy_term', scheme_name: 'Term Deposit', category_id: 2, position_type_id: '2', fresh_type_ids: ['2', '3'] },
        ],
        ADVANCES: [
            { scheme_code: 'legacy_clean', scheme_name: 'Clean Loan', category_id: 3, position_type_id: '3', fresh_type_ids: ['4'] },
            { scheme_code: 'legacy_vehicle', scheme_name: 'Vehicle Loan', category_id: 4, position_type_id: '4', fresh_type_ids: ['5'] },
            { scheme_code: 'legacy_gold', scheme_name: 'Gold Loan', category_id: 5, position_type_id: '5', fresh_type_ids: ['6'] },
            { scheme_code: 'legacy_other_term', scheme_name: 'Other Term Loan', category_id: 6, position_type_id: '6', fresh_type_ids: ['7', '8'] },
            { scheme_code: 'legacy_cc', scheme_name: 'Cash Credit Loan', category_id: 7, position_type_id: '7', fresh_type_ids: ['9', '10'] },
            { scheme_code: 'legacy_decreed', scheme_name: 'Decreed Loan', category_id: 8, position_type_id: '8', fresh_type_ids: [] },
        ],
        NPA: [
            { scheme_code: 'legacy_clean_npa', scheme_name: 'Clean Loan', category_id: 9, position_type_id: '9', fresh_type_ids: ['11'] },
            { scheme_code: 'legacy_vehicle_npa', scheme_name: 'Vehicle Loan', category_id: 10, position_type_id: '10', fresh_type_ids: ['12'] },
            { scheme_code: 'legacy_gold_npa', scheme_name: 'Gold Loan', category_id: 11, position_type_id: '11', fresh_type_ids: ['13'] },
            { scheme_code: 'legacy_other_term_npa', scheme_name: 'Other Term Loan', category_id: 12, position_type_id: '12', fresh_type_ids: ['14'] },
            { scheme_code: 'legacy_cc_npa', scheme_name: 'Cash Credit Loan', category_id: 13, position_type_id: '13', fresh_type_ids: ['15'] },
            { scheme_code: 'legacy_decreed_npa', scheme_name: 'Decreed Loan', category_id: 14, position_type_id: '14', fresh_type_ids: ['16'] },
        ]
    };

    isLegacyData(): boolean {
        return false;
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
        return this.viewOnlyModeFromRoute
            || this.isReviewMode
            || (
                this.isExecutiveReAuditMode()
                && Number(row?.review_action || 0) !== 3
            );
    }

    isExecutiveAccountsReadOnly(row: any): boolean {
        return this.isExecutiveAmountReadOnly(row);
    }

    getBranchFinancialPosition() {

        this.loading.set(true);

        if (this.isLegacyData()) {
            setTimeout(() => {
                const branchPositionMap = new Map<string, any>();
                this.branchPositionLines.forEach((x: any) => {
                    if (x && x.type_id !== undefined && x.type_id !== null) {
                        branchPositionMap.set(String(x.type_id).trim(), x);
                    }
                });

                const freshAccountsMap = new Map<string, any>();
                this.summary?.fresh_accounts?.forEach((x: any) => {
                    if (x && x.type_id !== undefined && x.type_id !== null) {
                        freshAccountsMap.set(String(x.type_id).trim(), x);
                    }
                });

                const marchPositionsMap = new Map<string, any>();
                this.summary?.march_positions?.forEach((x: any) => {
                    if (x && x.gl_type_id !== undefined && x.gl_type_id !== null) {
                        marchPositionsMap.set(String(x.gl_type_id).trim(), x);
                    }
                });

                const groupedData: any[] = [];
                let prefixIndex = 0;
                const keys = ['DEPOSITS', 'ADVANCES', 'NPA'];
                keys.forEach((type) => {
                    const items = this.legacyCategories[type];
                    const rowItems: any[] = [];
                    let totalAccounts = 0;
                    let totalAmount = 0;
                    let totalMarch = 0;

                    items.forEach((item: any, index: number) => {
                        const savedLine = branchPositionMap.get(
                            String(item.position_type_id).trim()
                        );
                        
                        let accounts: any = '';
                        let savedFreshLine: any = null;
                        if (item.fresh_type_ids.length > 0) {
                            for (const typeId of item.fresh_type_ids) {
                                const fl = freshAccountsMap.get(
                                    String(typeId).trim()
                                );
                                if (fl) {
                                    if (accounts === '') accounts = 0;
                                    accounts += Number(fl.accounts || 0);
                                    if (!savedFreshLine || fl.review_action) {
                                        savedFreshLine = fl;
                                    }
                                }
                            }
                        }

                        const categoryMarch = marchPositionsMap.get(
                            String(item.category_id).trim()
                        );
                        const marchPositionValue = Number((categoryMarch ? Number(categoryMarch.march_position || 0) : 0).toFixed(2));

                        const amount = this.savedAmountOrDefault(
                            savedLine,
                            type === 'NPA' ? '' : 0,
                        );

                        const displayAmount = (type === 'NPA')
                            ? (amount !== '' && amount !== null && amount !== undefined ? Number((Number(amount) / 100000).toFixed(2)) : '')
                            : Number((Number(amount) / 100000).toFixed(2));

                        totalAccounts += Number(accounts || 0);
                        totalAmount += Number(displayAmount || 0);
                        totalMarch += marchPositionValue;

                        rowItems.push({
                            isHeader: false,
                            isNpa: type === 'NPA',
                            index: index + 1,
                            scheme_code: item.scheme_code,
                            category_id: item.category_id,
                            scheme_name: item.scheme_name,
                            total_accounts: accounts,
                            account_input: accounts,
                            march_position: marchPositionValue,
                            total_amount: displayAmount,
                            amount_input: displayAmount,
                            type_id: type === 'NPA' ? item.position_type_id : item.scheme_code,
                            position_type_id: item.position_type_id,
                            fresh_type_ids: item.fresh_type_ids,
                            scheme_type: type,
                            review_action: this.executiveReviewAction(savedLine, savedFreshLine),
                            reviewer_comment: this.executiveReviewComment(savedLine, savedFreshLine),
                        });
                    });

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
                });

                this.financialPositionData = groupedData;
                this.loading.set(false);
                this.cdr.detectChanges();
            });
            return;
        }

        this.service
            .getBranchFinancialPosition(
                this.summary?.audit_unit_id,
                this.assessmentId,
            )
            .subscribe({

                next: (res: any) => {

                    setTimeout(() => {

                        const branchPositionMap = new Map<string, any>();
                        this.branchPositionLines.forEach((x: any) => {
                            if (x && x.type_id !== undefined && x.type_id !== null) {
                                branchPositionMap.set(String(x.type_id).trim(), x);
                            }
                        });

                        const freshAccountsMap = new Map<string, any>();
                        this.summary?.fresh_accounts?.forEach((x: any) => {
                            if (x && x.type_id !== undefined && x.type_id !== null) {
                                freshAccountsMap.set(String(x.type_id).trim(), x);
                            }
                        });

                        const marchPositionsMap = new Map<string, any>();
                        this.summary?.march_positions?.forEach((x: any) => {
                            if (x && x.gl_type_id !== undefined && x.gl_type_id !== null) {
                                marchPositionsMap.set(String(x.gl_type_id).trim(), x);
                            }
                        });

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
                                            const savedLine = branchPositionMap.get(
                                                String(item.position_type_id || item.scheme_code).trim()
                                            );
                                            const savedFreshLine = freshAccountsMap.get(
                                                String(item.fresh_type_ids?.[0] || item.scheme_code).trim()
                                            );
                                            const categoryMarch = marchPositionsMap.get(
                                                String(item.scheme_code).trim()
                                            );
                                            const marchPositionValue = Number((categoryMarch ? Number(categoryMarch.march_position || 0) : 0).toFixed(2));

                                            const accounts = this.savedAccountsOrDefault(
                                                savedFreshLine,
                                                Number(item.total_accounts || 0),
                                            );
                                            const amount = Number((this.savedAmountOrDefault(
                                                savedLine,
                                                Math.abs(Number(item.total_amount || 0)),
                                            ) / 100000).toFixed(2));

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
                                                type_id: item.position_type_id || item.scheme_code,
                                                scheme_type: type,
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
                                const npaKey = String(item.scheme_code).trim() + '_NPA';
                                const savedLine = branchPositionMap.get(npaKey);
                                const savedFreshLine = freshAccountsMap.get(npaKey);
                                const categoryMarch = marchPositionsMap.get(npaKey);
                                const marchPositionValue = Number((categoryMarch ? Number(categoryMarch.march_position || 0) : 0).toFixed(2));

                                const accountInput = this.savedAccountsOrDefault(
                                    savedFreshLine,
                                    '',
                                );
                                const amountInputRaw = this.savedAmountOrDefault(
                                    savedLine,
                                    '',
                                );
                                const amountInput = amountInputRaw !== '' && amountInputRaw !== null && amountInputRaw !== undefined ? Number((Number(amountInputRaw) / 100000).toFixed(2)) : '';

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
                                    scheme_type: 'NPA',
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

                        this.loading.set(false);

                        this.cdr.detectChanges();

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
                    this.summary_detail =
                        res.summary_detail || [];

                    const dateItem = this.summary_detail.find(
                        (x: any) => x.label === '9. Audit Report Submitted Date'
                    );
                    if (dateItem) {
                        dateItem.value = this.parseDate(dateItem.value);
                    }

                    if (this.summary?.audit_unit_id) {
                        this.getBranchFinancialPosition();
                    } else {
                        this.loading.set(false);
                    }

                    const userType = String(this.user?.user_type_id || '').trim();
                    const isAuditor = userType === '2';
                    if (isAuditor && !this.viewOnlyModeFromRoute && !this.reviewModeFromRoute) {
                        const employeeId = Number(
                            this.user?.id
                            || this.user?.employee_id
                            || this.user?.emp_id
                            || 0,
                        );
                        this.service.getInternalAuditMenu(this.assessmentId, employeeId).subscribe({
                            next: (menuRes: any) => {
                                this.navService.setAssessmentMenus(
                                    this.assessmentId,
                                    menuRes?.menus || [],
                                    menuRes?.overview || null
                                );
                            },
                            error: (err) => {
                                console.error('Failed to load nav menus:', err);
                            }
                        });
                    }

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
                return this.formatDateToString(val);
            })(),

            staff_count:
                (() => {
                    const val = this.summary_detail.find(
                        x =>
                            x.label ===
                            '12. Number of Staff including Contractual/Daily wages staff',
                    )?.value;
                    return val === '' || val === null || val === undefined ? 0 : Number(val);
                })(),

            manual_challans_per_day:
                (() => {
                    const val = this.summary_detail.find(
                        x =>
                            x.label ===
                            '13. Approximate Number of manual Challans per day',
                    )?.value;
                    return val === '' || val === null || val === undefined ? 0 : Number(val);
                })(),

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
            if (row.isHeader || (!row.scheme_code && !row.position_type_id)) return;

            if (this.isLegacyData()) {
                if (!row.isNpa) {
                    const amtVal = Number(row.total_amount) * 100000;
                    const amount = Number.isFinite(amtVal) && amtVal >= 0 ? amtVal : 0;
                    branch_positions.push({
                        type_id: row.position_type_id,
                        amount
                    });

                    const acctVal = Number(row.total_accounts);
                    const accounts = Number.isFinite(acctVal) && acctVal >= 0 ? Math.floor(acctVal) : 0;
                    if (row.fresh_type_ids && row.fresh_type_ids.length > 0) {
                        fresh_accounts.push({
                            type_id: row.fresh_type_ids[0],
                            accounts
                        });
                    }
                } else {
                    const amtVal = Number(row.amount_input) * 100000;
                    const amount = Number.isFinite(amtVal) && amtVal >= 0 ? amtVal : 0;
                    branch_positions.push({
                        type_id: row.position_type_id,
                        amount
                    });

                    const acctVal = Number(row.account_input);
                    const accounts = Number.isFinite(acctVal) && acctVal >= 0 ? Math.floor(acctVal) : 0;
                    if (row.fresh_type_ids && row.fresh_type_ids.length > 0) {
                        fresh_accounts.push({
                            type_id: row.fresh_type_ids[0],
                            accounts
                        });
                    }
                }
            } else {
                const schemeCode = String(row.scheme_code).trim();

                if (!row.isNpa) {
                    const amtVal = Number(row.total_amount) * 100000;
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
                    const amtVal = Number(row.amount_input) * 100000;
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
            this.viewOnlyModeFromRoute
        ) {
            this.router.navigate([
                '/auditor/compliance',
            ]);
            return;
        }

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

    getCategoryHeaderTotal(schemeType: string, column: 'accounts' | 'march' | 'current' | 'ytd'): number {
        let total = 0;
        this.financialPositionData.forEach((row: any) => {
            if (row.isHeader) return;
            const rowSchemeType = row.scheme_type || (row.isNpa ? 'NPA' : (row.category_id <= 2 ? 'DEPOSITS' : 'ADVANCES'));
            if (rowSchemeType !== schemeType) return;

            const accounts = Number(row.isNpa ? row.account_input : row.total_accounts) || 0;
            const march = Number(row.march_position) || 0;
            const current = Number(row.isNpa ? row.amount_input : row.total_amount) || 0;

            if (column === 'accounts') {
                total += accounts;
            } else if (column === 'march') {
                total += march;
            } else if (column === 'current') {
                total += current;
            } else if (column === 'ytd') {
                total += (current - march);
            }
        });
        return column === 'accounts' ? total : Number(total.toFixed(2));
    }

    parseDate(value: any): Date | null {
        if (!value) return null;
        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }

    formatDateToString(value: any): string {
        if (!value) return '';
        if (value instanceof Date) {
            if (isNaN(value.getTime())) return '';
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        if (typeof value === 'string') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            return value;
        }
        return '';
    }

    clearIfZero(obj: any, prop: string = 'value') {
        if (obj[prop] === 0 || obj[prop] === '0') {
            obj[prop] = '';
        }
    }

    restoreIfEmpty(obj: any, prop: string = 'value') {
        if (obj[prop] === '' || obj[prop] === null || obj[prop] === undefined) {
            obj[prop] = 0;
        }
    }

}
