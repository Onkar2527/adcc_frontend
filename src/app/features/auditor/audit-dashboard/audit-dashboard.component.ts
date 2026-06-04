import {
    Component,
    OnInit,
    inject,
    signal,
    computed,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { AuditDashboardService }
    from '../services/auditor-main.service';

import { AuditUnitDashboardComponent } from '../../../shared/components/audit-unit-dashboard/audit-unit-dashboard.component';

@Component({

    selector:
        'app-audit-dashboard',

    standalone: true,

    imports: [

        CommonModule,

        FormsModule,

        AuditUnitDashboardComponent
    ],

    templateUrl: './audit-dashboard.component.html',

    styleUrl: './audit-dashboard.component.css',
})

export class AuditDashboardComponent
    implements OnInit {

    private service =
        inject(AuditDashboardService);

    private router =
        inject(Router);

    loading =
        signal(false);

    dashboardData =
        signal<any[]>([]);

    search =
        signal('');

    selectedStatus =
        signal<any>(null);

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

    totalReviewPending =
        computed(() =>

            this.dashboardData()
                .reduce(

                    (
                        sum,
                        item: any,
                    ) =>

                        sum +
                        Number(
                            item.review_pending || 0,
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


    ngOnInit() {

        this.loadData();
    }


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
