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
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuditDashboardService } from '../services/auditor-main.service';

@Component({
    selector: 'app-internal-audit',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        ButtonModule,
        CardModule,
        ProgressBarModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './internal-audit.component.html',
    styleUrl: './internal-audit.component.css',
})
export class InternalAuditComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    loading =
        signal(false);

    overview =
        signal<any>(null);

    auditUnit =
        signal<any>(null);

    years =
        signal<any[]>([]);

    metrics =
        signal<any>(null);

    startPreview =
        signal<any>(null);

    menus =
        signal<any[]>([]);

    error =
        signal('');

    totalCategories =
        computed(() =>
            this.menus()
                .reduce(
                    (
                        sum,
                        menu: any,
                    ) =>
                        sum +
                        Number(
                            menu.categories?.length || 0,
                        ),
                    0,
                ),
        );

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

    totalQuestions =
        computed(() =>
            this.menus()
                .reduce(
                    (
                        sum,
                        menu: any,
                    ) =>
                        sum +
                        (menu.categories || [])
                            .reduce(
                                (
                                    catSum: number,
                                    category: any,
                                ) =>
                                    catSum +
                                    Number(
                                        category.question_count || 0,
                                    ),
                                0,
                            ),
                    0,
                ),
        );

    ngOnInit() {
        this.loadAudit();
    }

    loadAudit() {
        const auditUnitId =
            Number(
                this.route.snapshot.paramMap.get(
                    'auditUnitId',
                ),
            );

        const yearId =
            Number(
                this.route.snapshot.paramMap.get(
                    'yearId',
                ),
            );

        if (
            auditUnitId
            &&
            yearId
        ) {
            this.loadStartPreview(
                auditUnitId,
                yearId,
            );
            return;
        }

        if (auditUnitId) {
            this.loadAuditUnit(
                auditUnitId,
            );
            return;
        }

        const assessmentId =
            Number(
                this.route.snapshot.paramMap.get(
                    'assessmentId',
                ),
            );

        if (!assessmentId) {
            this.error.set(
                'Assessment not found.',
            );
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.service
            .getInternalAuditMenu(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.overview.set(
                        res?.overview || null,
                    );
                    this.menus.set(
                        res?.menus || [],
                    );
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load internal audit.',
                    );
                    this.loading.set(false);
                },
            });
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
                    this.overview.set(null);
                    this.startPreview.set(null);
                    this.menus.set([]);
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

    loadStartPreview(
        auditUnitId: number,
        yearId: number,
    ) {

        this.loading.set(true);
        this.error.set('');

        this.service
            .getStartAssessmentPreview(
                auditUnitId,
                yearId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.startPreview.set(res);
                    this.auditUnit.set(null);
                    this.years.set([]);
                    this.metrics.set(null);
                    this.overview.set(null);
                    this.menus.set([]);
                    this.loading.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load start assessment details.',
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

    openCategory(
        category: any,
    ) {
        console.log(
            'Category workflow will be implemented next',
            category,
        );
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

    getStatusSeverity(
        overview: any,
    ) {
        if (
            overview?.can_continue
        ) {
            return 'success';
        }

        if (
            overview?.block_reason
        ) {
            return 'danger';
        }

        return 'secondary';
    }
}
