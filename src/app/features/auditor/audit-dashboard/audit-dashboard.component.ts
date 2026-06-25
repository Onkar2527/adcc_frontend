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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

    auditMode =
        signal<'regular' | 'special'>('regular');

    statusOptions = [
        {
            label: 'Audit Not Started',
            value: 'NOT STARTED',
        },
        {
            label: 'Audits Pending',
            value: 'AUDIT PENDING',
        },
        {
            label: 'Reviews Pending',
            value: 'REVIEW PENDING',
        },
        {
            label: 'Compliances Pending',
            value: 'COMPLIANCE PENDING',
        },
        {
            label: 'Completed Assessments',
            value: 'ASSESMENT COMPLETED',
        },
    ];

    /* ===================================================== */
    /* COMPUTED */
    /* ===================================================== */

    filteredData = computed(() => {

        let rows =
            this.modeRows();

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

    regularRows =
        computed(() =>
            this.dashboardData()
                .filter((item: any) => !item.is_special_audit),
        );

    specialRows =
        computed(() =>
            this.dashboardData()
                .filter((item: any) => item.is_special_audit),
        );

    modeRows =
        computed(() =>
            this.auditMode() === 'special'
                ? this.specialRows()
                : this.regularRows(),
        );

    dashboardEyebrow =
        computed(() =>
            this.auditMode() === 'special'
                ? 'Special Audit'
                : 'Internal Audit',
        );

    dashboardTitle =
        computed(() =>
            this.auditMode() === 'special'
                ? 'Select Special Audit'
                : 'Select Audit Unit',
        );

    dashboardSubtitle =
        computed(() =>
            this.auditMode() === 'special'
                ? 'Open assigned one-off special audit assessments'
                : 'Select a branch/unit to continue the audit workflow',
        );

    panelTitle =
        computed(() =>
            this.auditMode() === 'special'
                ? 'Assigned Special Audits'
                : 'Assigned Branches',
        );

    auditCardMetaItems = [
        {
            label: 'Audit Type',
            key: 'audit_type_label',
        },
    ];

    totalAuditPending =
        computed(() =>

            this.modeRows()
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

            this.modeRows()
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

            this.modeRows()
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

            this.modeRows()
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

    selectMode(
        mode: 'regular' | 'special',
    ) {
        this.auditMode.set(mode);
        this.search.set('');
        this.selectedStatus.set(null);
    }


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

        forkJoin({
            regular: this.service
                .findAll(payload)
                .pipe(catchError(() => of([]))),
            special: this.service
                .getSpecialAudits(this.employee_id())
                .pipe(catchError(() => of([]))),
        }).subscribe({

            next: (res: any) => {

                const rows =
                    this.parseRows(
                        res.regular,
                    ).map((row: any) => ({
                        ...row,
                        audit_type_label:
                            row.audit_type_name || 'Internal Audit',
                    }));

                const specialRows =
                    this.parseRows(
                        res.special,
                    )
                        .filter((row: any) =>
                            !row.auditor_id
                            ||
                            Number(row.auditor_id) === this.employee_id(),
                        )
                        .map((row: any) =>
                            this.mapSpecialAuditRow(row),
                        );

                this.dashboardData.set(
                    [
                        ...rows,
                        ...specialRows,
                    ],
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

    mapSpecialAuditRow(row: any) {
        const status =
            this.specialAuditStatus(row);

        return {
            ...row,
            audit_unit_id:
                row.audit_unit_id,
            audit_unit_name:
                row.audit_unit_name || row.title || row.audit_type_name || 'Audit',
            audit_unit_code:
                row.audit_unit_code || 'SPECIAL',
            display_title:
                row.title || row.audit_unit_name || row.audit_type_name || 'Audit',
            display_code:
                `Branch: ${row.audit_unit_name || '-'}${row.audit_unit_code ? ` (${row.audit_unit_code})` : ''}`,
            latest_status:
                status,
            audit_pending:
                status.includes('AUDIT') || status.includes('NOT STARTED')
                    ? 1
                    : 0,
            review_pending:
                status.includes('REVIEW')
                    ? 1
                    : 0,
            compliance_pending:
                status.includes('COMPLIANCE')
                    ? 1
                    : 0,
            audit_completed:
                status.includes('COMPLETED')
                    ? 1
                    : 0,
            is_special_audit:
                true,
            audit_type_label:
                row.audit_type_name || 'Special Audit',
            assessment_id:
                row.assessment_id || row.assesment_id || row.id,
        };
    }

    specialAuditStatus(row: any) {
        const statusId =
            Number(row.audit_status_id || 1);

        if (statusId === 6) {
            return 'ASSESMENT COMPLETED';
        }

        if (statusId === 4 || statusId === 5) {
            return 'COMPLIANCE PENDING';
        }

        if (statusId === 2 || statusId === 3) {
            return 'REVIEW PENDING';
        }

        return statusId === 1
            ? 'AUDIT PENDING'
            : 'NOT STARTED';
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

        if (
            item?.is_special_audit
            &&
            item?.assessment_id
        ) {
            this.router.navigate([
                '/auditor/internal-audit',
                item.assessment_id,
            ]);

            return;
        }

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
