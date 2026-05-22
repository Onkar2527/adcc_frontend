import {
    CommonModule,
    DatePipe,
} from '@angular/common';
import {
    Component,
    OnInit,
    computed,
    inject,
    signal,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuditDashboardService } from '../../services/auditor-main.service';

@Component({
    selector: 'app-audit-unit-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        ButtonModule,
        CardModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './audit-unit-dashboard.component.html',
    styleUrl: '../internal-audit.component.css',
})
export class AuditUnitDashboardComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    loading =
        signal(false);

    auditUnit =
        signal<any>(null);

    years =
        signal<any[]>([]);

    metrics =
        signal<any>(null);

    error =
        signal('');

    visibleYears =
        computed(() =>
            this.years()
                .filter(
                    (year: any) =>
                        year.is_latest
                        ||
                        (year.assessments || []).length > 0,
                ),
        );

    ngOnInit() {
        const auditUnitId =
            Number(
                this.route.snapshot.paramMap.get(
                    'auditUnitId',
                ),
            );

        if (!auditUnitId) {
            this.error.set(
                'Audit unit not found.',
            );
            return;
        }

        this.loadAuditUnit(
            auditUnitId,
        );
    }

    loadAuditUnit(
        auditUnitId: number,
    ) {

        this.loading.set(true);
        this.error.set('');

        this.service
            .getAuditUnitDashboard(
                auditUnitId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.auditUnit.set(
                        res?.audit_unit || null,
                    );
                    this.years.set(
                        res?.years || [],
                    );
                    this.metrics.set(
                        res?.metrics || null,
                    );
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load audit unit details.',
                    );
                    this.loading.set(false);
                },
            });
    }

    employeeId(): number {
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

    backToDashboard() {
        this.router.navigate([
            '/auditor/audit-dashboard',
        ]);
    }

    openAssessment(
        assessment: any,
    ) {

        if (
            !assessment?.can_continue
        ) {
            return;
        }

        this.router.navigate([
            '/auditor/internal-audit',
            assessment.id,
        ]);
    }

    startAssessment(
        year: any,
    ) {

        const unit =
            this.auditUnit();

        this.router.navigate([
            '/auditor/internal-audit/unit',
            unit.id,
            'start',
            year.id,
        ]);
    }

    getActionSeverity(
        assessment: any,
    ) {

        if (
            assessment?.can_continue
        ) {
            return 'success';
        }

        if (
            ['blocked', 'expired'].includes(
                assessment?.action_type,
            )
        ) {
            return 'danger';
        }

        if (
            assessment?.action_type === 'completed'
        ) {
            return 'success';
        }

        return 'secondary';
    }

    financialYearLabel(
        year: any,
    ) {

        const value =
            String(
                year?.year || '',
            );

        if (
            value.includes('-')
        ) {
            return value;
        }

        const startYear =
            Number(value);

        return startYear
            ? `${startYear} - ${startYear + 1}`
            : '-';
    }
}
