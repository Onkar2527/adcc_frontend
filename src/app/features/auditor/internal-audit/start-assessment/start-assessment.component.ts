import {
    CommonModule,
    DatePipe,
} from '@angular/common';
import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuditDashboardService } from '../../services/auditor-main.service';

@Component({
    selector: 'app-start-assessment',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        ButtonModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './start-assessment.component.html',
    styleUrl: '../internal-audit.component.css',
})
export class StartAssessmentComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    loading =
        signal(false);

    startPreview =
        signal<any>(null);

    error =
        signal('');

    ngOnInit() {
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
            !auditUnitId
            ||
            !yearId
        ) {
            this.error.set(
                'Start assessment details not found.',
            );
            return;
        }

        this.loadStartPreview(
            auditUnitId,
            yearId,
        );
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

    submitStartAssessment() {

        const preview =
            this.startPreview();

        if (
            !preview?.can_start
        ) {
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.service
            .startAssessment(
                Number(
                    preview.audit_unit.id,
                ),
                Number(
                    preview.year.id,
                ),
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.loading.set(false);
                    this.router.navigate([
                        '/auditor/internal-audit',
                        res.assessment_id,
                    ]);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to start audit assessment.',
                    );
                    this.loading.set(false);
                },
            });
    }

    backToDashboard() {
        this.router.navigate([
            '/auditor/audit-dashboard',
        ]);
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
