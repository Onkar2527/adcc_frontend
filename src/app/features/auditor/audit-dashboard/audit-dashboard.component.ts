import {
    Component,
    OnInit,
    inject,
    signal,
    computed,
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { AuditDashboardService }
    from '../services/auditor-main.service';

import { CardModule } from 'primeng/card';

import { ButtonModule } from 'primeng/button';

import { TagModule } from 'primeng/tag';

import { InputTextModule }
    from 'primeng/inputtext';

import { ProgressBarModule }
    from 'primeng/progressbar';

import { SkeletonModule }
    from 'primeng/skeleton';

import { DividerModule }
    from 'primeng/divider';

import { SelectModule }
    from 'primeng/select';

@Component({

    selector:
        'app-audit-dashboard',

    standalone: true,

    imports: [

        CommonModule,

        FormsModule,

        CardModule,

        ButtonModule,

        TagModule,

        InputTextModule,

        SelectModule,

        ProgressBarModule,

        SkeletonModule,

        DividerModule,

        DatePipe
    ],

    providers: [DatePipe],

    templateUrl: './audit-dashboard.component.html'
})

export class AuditDashboardComponent
    implements OnInit {

    /* ===================================================== */
    /* SERVICES */
    /* ===================================================== */

    private service =
        inject(AuditDashboardService);

    private router =
        inject(Router);

    // private datePipe =
    //     inject(DatePipe);

    /* ===================================================== */
    /* SIGNALS */
    /* ===================================================== */

    loading =
        signal(false);

    dashboardData =
        signal<any[]>([]);

    search =
        signal('');

    selectedStatus =
        signal<any>(null);

    /* ===================================================== */
    /* FILTER OPTIONS */
    /* ===================================================== */

    statusOptions = [

        {
            label: 'Not Started',
            value: 'NOT STARTED',
        },

        {
            label: 'Audit Pending',
            value: 'AUDIT PENDING',
        },

        {
            label: 'Review Pending',
            value: 'REVIEW PENDING',
        },

        {
            label: 'Compliance Pending',
            value: 'COMPLIANCE PENDING',
        },

        {
            label: 'Completed',
            value: 'ASSESMENT COMPLETED',
        },
    ];

    /* ===================================================== */
    /* COMPUTED */
    /* ===================================================== */

    filteredData = computed(() => {

        let rows =
            this.dashboardData();

        if (this.search()) {

            const search =
                this.search()
                    .toLowerCase();

            rows = rows.filter((x: any) =>

                x.audit_unit_name
                    ?.toLowerCase()
                    ?.includes(search)

                ||

                x.audit_unit_code
                    ?.toLowerCase()
                    ?.includes(search)
            );
        }

        if (
            this.selectedStatus()
        ) {

            rows = rows.filter((x: any) =>

                x.latest_status ===
                this.selectedStatus()
            );
        }

        return rows;
    });

    totalAuditPending =
        computed(() =>

            this.dashboardData()
                .reduce(

                    (
                        sum,
                        item: any,
                    ) =>

                        sum +
                        Number(
                            item.audit_pending || 0,
                        ),

                    0,
                ),
        );

    totalCompliancePending =
        computed(() =>

            this.dashboardData()
                .reduce(

                    (
                        sum,
                        item: any,
                    ) =>

                        sum +
                        Number(
                            item.compliance_pending || 0,
                        ),

                    0,
                ),
        );

    totalCompleted =
        computed(() =>

            this.dashboardData()
                .reduce(

                    (
                        sum,
                        item: any,
                    ) =>

                        sum +
                        Number(
                            item.audit_completed || 0,
                        ),

                    0,
                ),
        );

    /* ===================================================== */
    /* INIT */
    /* ===================================================== */

    ngOnInit() {

        this.loadData();
    }

    /* ===================================================== */
    /* USER */
    /* ===================================================== */

    employee_id(): number {

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

    /* ===================================================== */
    /* LOAD */
    /* ===================================================== */

    loadData() {

        this.loading.set(true);

        const payload = {

            employee_id:
                this.employee_id(),
        };

        this.service
            .findAll(payload)
            .subscribe({

                next: (res: any) => {

                    const rows =
                        this.parseRows(
                            res,
                        );

                    this.dashboardData.set(
                        rows,
                    );

                    this.loading.set(
                        false,
                    );
                },

                error: () => {

                    this.dashboardData.set(
                        [],
                    );

                    this.loading.set(
                        false,
                    );
                },
            });
    }

    // formatDate(
    //     date: string,
    // ) {

    //     if (!date) {

    //         return '-';
    //     }

    //     return this.datePipe.transform(

    //         date,

    //         'dd MMM yyyy',

    //     );
    // }

    /* ===================================================== */
    /* PARSE */
    /* ===================================================== */

    parseRows(
        result: any,
    ): any[] {

        if (
            Array.isArray(result)
        ) {

            return result;
        }

        if (
            Array.isArray(result?.data)
        ) {

            return result.data;
        }

        if (
            Array.isArray(result?.rows)
        ) {

            return result.rows;
        }

        return [];
    }

    /* ===================================================== */
    /* SEVERITY */
    /* ===================================================== */

    getSeverity(
        status: string,
    ) {

        if (!status) {

            return 'secondary';
        }

        status =
            status.toLowerCase();

        if (
            status.includes(
                'not started',
            )
        ) {

            return 'info';
        }

        if (
            status.includes(
                'audit',
            )
        ) {

            return 'warn';
        }

        if (
            status.includes(
                'review',
            )
        ) {

            return 'contrast';
        }

        if (
            status.includes(
                'compliance',
            )
        ) {

            return 'danger';
        }

        if (
            status.includes(
                'completed',
            )
        ) {

            return 'success';
        }

        return 'secondary';
    }

    /* ===================================================== */
    /* OPEN */
    /* ===================================================== */

    openAssessment(
        item: any,
    ) {

        const payload = {

            employee_id:
                this.employee_id(),

            audit_unit_id:
                Number(
                    item.audit_unit_id,
                ),
        };

        this.service
            .openAssessment(payload)
            .subscribe({

                next: (res: any) => {

                    if (
                        res.action ===
                        'continue'
                        ||
                        res.action ===
                        'unit_dashboard'
                    ) {

                        this.router.navigate([

                            '/auditor/internal-audit/unit',

                            res.audit_unit_id
                            ||
                            item.audit_unit_id,

                        ]);

                        return;
                    }

                    alert(
                        res.message
                        ||
                        'Start assessment flow will be implemented next.',
                    );
                },

                error: (err) => {

                    alert(
                        err?.error?.message
                        ||
                        'Unable to open this audit assessment.',
                    );
                },
            });
    }
}
