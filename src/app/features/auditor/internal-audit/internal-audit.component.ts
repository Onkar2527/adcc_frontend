import {
    Component,
    OnInit,
    inject,
    signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { auditorMainService }
from '../services/auditor-main.service';

@Component({

    selector:
        'app-select-audit-unit',

    standalone: true,

    imports: [
        CommonModule
    ],

    templateUrl:
        './internal-audit.component.html',

    styleUrls: [
        './internal-audit.component.css'
    ]

})

export class SelectAuditUnitComponent
implements OnInit {

    /* ===================================== */
    /* SERVICES */
    /* ===================================== */

    private auditorMainService =
        inject(auditorMainService);

    private router =
        inject(Router);

    /* ===================================== */
    /* SIGNALS */
    /* ===================================== */

    dashboardData =
        signal<any[]>([]);

    loading =
        signal(false);

    /* ===================================== */
    /* GET USER */
    /* ===================================== */

    employee_id(): number {

        const userData =

            localStorage.getItem(
                'user'
            ) || '{}';

        const user =
            JSON.parse(userData);

        return Number(
            user.id || 0
        );

    }

    /* ===================================== */
    /* INIT */
    /* ===================================== */

    ngOnInit(): void {

        this.loadDashboardData();

    }

    /* ===================================== */
    /* LOAD DASHBOARD */
    /* ===================================== */

    loadDashboardData(): void {

        this.loading.set(true);

        const payload = {

            auditortId:
                this.employee_id()

        };

        console.log(
            'PAYLOAD => ',
            payload
        );

        this.auditorMainService
            .findAll(payload)
            .subscribe({

                next: (result:any) => {

                    console.log(
                        'API RESULT => ',
                        result
                    );

                    const rows =
                        this.parseRows(
                            result
                        );

                    this.dashboardData.set(
                        rows
                    );

                    this.loading.set(
                        false
                    );

                },

                error: (error:any) => {

                    console.log(
                        'API ERROR => ',
                        error
                    );

                    this.dashboardData.set(
                        []
                    );

                    this.loading.set(
                        false
                    );

                }

            });

    }

    /* ===================================== */
    /* PARSE ROWS */
    /* ===================================== */

    parseRows(
        result:any
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

    /* ===================================== */
    /* STATUS CLASS */
    /* ===================================== */

    getStatusClass(
        status:string
    ): string {

        if (!status) {

            return '';

        }

        status =
            status.toLowerCase();

        if (
            status.includes(
                'audit'
            )
        ) {

            return 'audit-status';

        }

        if (
            status.includes(
                'review'
            )
        ) {

            return 'review-status';

        }

        if (
            status.includes(
                'compliance'
            )
        ) {

            return 'compliance-status';

        }

        if (
            status.includes(
                'completed'
            )
        ) {

            return 'completed-status';

        }

        return '';

    }

    /* ===================================== */
    /* OPEN AUDIT */
    /* ===================================== */

    openAudit(
        item:any
    ): void {

        console.log(
            'SELECTED AUDIT => ',
            item
        );

        this.router.navigate([

            '/dashboard/audit-details',

            item.audit_unit_code

        ]);

    }

}