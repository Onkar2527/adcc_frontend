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

    getBranchFinancialPosition() {

        this.loading.set(true);

        this.service
            .getBranchFinancialPosition(
                this.summary?.branch_code,
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

                                    const totalMarch =
                                        items.reduce(
                                            (
                                                sum: number,
                                                x: any,
                                            ) =>
                                                sum +
                                                Number(
                                                    x.march_position || 0,
                                                ),
                                            0,
                                        );

                                    const totalAmount =
    items.reduce(
        (
            sum: number,
            x: any,
        ) =>
            sum +
            Math.abs(
                Number(
                    x.total_amount || 0,
                ),
            ),
        0,
    );

                                    const totalAccounts =
                                        items.reduce(
                                            (
                                                sum: number,
                                                x: any,
                                            ) =>
                                                sum +
                                                Number(
                                                    x.total_accounts || 0,
                                                ),
                                            0,
                                        );

                                    groupedData.push({

                                        isHeader:
                                            true,

                                        prefix:
                                            String.fromCharCode(
                                                65 + prefixIndex,
                                            ),

                                        scheme_type:
                                            type,

                                        total_accounts:
                                            totalAccounts,

                                        march_position:
                                            totalMarch,

                                        total_amount:
                                            totalAmount,

                                    });

                                    items.forEach(
                                        (
                                            item: any,
                                            index: number,
                                        ) => {

                                            groupedData.push({

                                                isHeader:
                                                    false,

                                                isNpa:
                                                    false,

                                                index:
                                                    index + 1,

                                                scheme_name:
                                                    item.scheme_name,

                                                total_accounts:
                                                    Number(
                                                        item.total_accounts || 0,
                                                    ),

                                                march_position:
                                                    Number(
                                                        item.march_position || 0,
                                                    ),

                                               total_amount:
    Math.abs(
        Number(
            item.total_amount || 0,
        ),
    ),


                                            });

                                        },
                                    );

                                    prefixIndex++;

                                },
                            );

                        // NPA SECTION

                        const advanceItems =
                            grouped['ADVANCES'] || [];

                        const totalNpaMarch =
                            advanceItems.reduce(
                                (
                                    sum: number,
                                    x: any,
                                ) =>
                                    sum +
                                    Number(
                                        x.march_position || 0,
                                    ),
                                0,
                            );

                        groupedData.push({

                            isHeader: true,

                            prefix: 'C',

                            scheme_type: 'NPA',

                            total_accounts: '-',

                            march_position:
                                totalNpaMarch,

                            total_amount: 0,

                        });

                        advanceItems.forEach(
                            (
                                item: any,
                                index: number,
                            ) => {

                                groupedData.push({

                                    isHeader:
                                        false,

                                    isNpa:
                                        true,

                                    index:
                                        index + 1,

                                    scheme_name:
                                        item.scheme_name,

                                    account_input:
                                        '',

                                    amount_input:
                                        '',

                                    march_position:
                                        Number(
                                            item.march_position || 0,
                                        ),

                                });

                            },
                        );

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
            )
            .subscribe({

                next: (
                    res: any,
                ) => {

                    this.summary =
                        res || null;
                    if (this.summary?.branch_code) {

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



    saveExecutiveSummary() {

        const payload = {

            assessment_id:
                this.assessmentId,

            year_id:
                this.summary?.year_id,

            admin_id:
                this.user?.id,

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

                },

                error: (err: any) => {

                    this.loading.set(false);



                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save executive summary'
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