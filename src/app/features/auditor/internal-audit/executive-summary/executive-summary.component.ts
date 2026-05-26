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
        AccordionModule


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

    summary_detail: any[] = [];

    loading =
        signal(false);

    ngOnInit(): void {
        this.user =
            JSON.parse(localStorage.getItem('user') || '{}');

        this.assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        this.getExecutiveSummary();

    }
    financialPositionData: any[] = [];
    freshAccountsData: any[] = [];

    private prepareFinancialPositionRows(
        rows: any[],
        calculatedRows: any[] = [],
    ) {
        const groups = [
            'Deposits',
            'Advances',
            'NPA',
        ];
        const result: any[] = [];

        groups.forEach(
            (
                group: string,
                index: number,
            ) => {
                const items =
                    rows.filter(
                        (row: any) =>
                            row.group === group,
                    );
                const detailRows =
                    items.map(
                        (
                            row: any,
                            itemIndex: number,
                        ) => {
                            const calculated =
                                this.findCalculatedPosition(
                                    row,
                                    calculatedRows,
                                );
                            const savedAmount =
                                row.amount !== ''
                                && row.amount !== null
                                && row.amount !== undefined;

                            return {
                                ...row,
                                isHeader:
                                    false,
                                isNpa:
                                    group === 'NPA',
                                index:
                                    itemIndex + 1,
                                scheme_name:
                                    row.name,
                                total_accounts:
                                    Number(
                                        calculated?.total_accounts || 0,
                                    ),
                                total_amount:
                                    savedAmount
                                        ? Number(row.amount)
                                        : group === 'NPA'
                                            ? ''
                                            : this.toLakhs(
                                                calculated?.total_amount,
                                            ),
                            };
                        },
                    );

                result.push({
                    isHeader:
                        true,
                    prefix:
                        String.fromCharCode(65 + index),
                    scheme_type:
                        group.toUpperCase(),
                    total_accounts:
                        detailRows.reduce(
                            (
                                total: number,
                                row: any,
                            ) =>
                                total + Number(row.total_accounts || 0),
                            0,
                        ),
                    march_position:
                        detailRows.reduce(
                            (
                                total: number,
                                row: any,
                            ) =>
                                total + Number(row.march_position || 0),
                            0,
                        ),
                    total_amount:
                        detailRows.reduce(
                            (
                                total: number,
                                row: any,
                            ) =>
                                total + Number(row.total_amount || 0),
                            0,
                        ),
                });

                result.push(...detailRows);
            },
        );

        return result;
    }

    private findCalculatedPosition(
        line: any,
        calculatedRows: any[],
    ) {
        const sourceGroup =
            line.group === 'NPA'
                ? 'ADVANCES'
                : String(line.group || '').toUpperCase();
        const lineName =
            this.normalizedPositionName(line.name);

        return calculatedRows.find(
            (row: any) =>
                String(row.scheme_type || '').toUpperCase()
                === sourceGroup
                && this.normalizedPositionName(row.scheme_name)
                === lineName,
        );
    }

    private normalizedPositionName(
        value: string,
    ) {
        return String(value || '')
            .replace(/\b(advances|npa)\b/gi, '')
            .replace(/[^a-z0-9]/gi, '')
            .replace(/loans$/i, 'loan')
            .toLowerCase();
    }

    private toLakhs(
        value: any,
    ) {
        return Number(value || 0) / 100000;
    }

    financialGroupTotal(
        group: string,
        field: 'march_position' | 'total_amount',
    ) {
        return this.financialPositionData
            .filter(
                (row: any) =>
                    !row.isHeader
                    &&
                    String(row.group || '').toUpperCase()
                    === String(group || '').toUpperCase(),
            )
            .reduce(
                (
                    total: number,
                    row: any,
                ) =>
                    total + Number(row[field] || 0),
                0,
            );
    }

    cdRatio() {
        const deposits =
            this.financialGroupTotal(
                'DEPOSITS',
                'total_amount',
            );
        const advances =
            this.financialGroupTotal(
                'ADVANCES',
                'total_amount',
            );

        return deposits
            ? (advances / deposits) * 100
            : 0;
    }

    perEmployeeBusiness() {
        const staffCount =
            Number(
                this.summary_detail[11]?.value || 0,
            );
        const deposits =
            this.financialGroupTotal(
                'DEPOSITS',
                'total_amount',
            );
        const advances =
            this.financialGroupTotal(
                'ADVANCES',
                'total_amount',
            );

        return staffCount
            && deposits
            && advances
                ? (deposits + advances) / staffCount
                : 0;
    }

    getBranchFinancialPosition(
        savedRows: any[],
    ) {

        this.loading.set(true);

        this.service
            .getBranchFinancialPosition(
                this.assessmentId,
            )
            .subscribe({

                next: (res: any) => {

                    this.financialPositionData =
                        this.prepareFinancialPositionRows(
                            savedRows,
                            Array.isArray(res)
                                ? res
                                : [],
                        );
                    this.cdr.detectChanges();
                    this.loading.set(false);

                },

                error: () => {
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

                    this.summary_detail =
                        res.summary_detail || [];
                    this.financialPositionData =
                        this.prepareFinancialPositionRows(
                            res.branch_positions || [],
                        );
                    this.freshAccountsData =
                        res.fresh_accounts || [];
                    this.getBranchFinancialPosition(
                        res.branch_positions || [],
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



    saveExecutiveSummary() {

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

            audit_report_submitted_date:
                this.summary_detail.find(
                    x =>
                        x.label ===
                        '9. Audit Report Submitted Date',
                )?.value,

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

            branch_positions:
                this.financialPositionData
                    .filter(
                        (row: any) =>
                            !row.isHeader,
                    )
                    .map(
                        (row: any) => ({
                            type_id:
                                row.type_id,
                            amount:
                                row.total_amount,
                        }),
                    ),

            fresh_accounts:
                this.freshAccountsData.map(
                    (row: any) => ({
                        type_id:
                            row.type_id,
                        accounts:
                            row.accounts,
                    }),
                ),

        };

        this.loading.set(true);

        this.service
            .saveExecutiveSummary(payload)
            .subscribe({

                next: (res: any) => {

                    this.loading.set(false);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Executive summary saved successfully'
                    });
                    this.getExecutiveSummary();

                },

                error: (err: any) => {

                    this.loading.set(false);



                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            err?.error?.message
                            || 'Failed to save executive summary'
                    });

                },

            });

    }

    backToDashboard() {

        this.router.navigate([
            '/auditor/internal-audit',
            this.assessmentId,
        ]);

    }

}
