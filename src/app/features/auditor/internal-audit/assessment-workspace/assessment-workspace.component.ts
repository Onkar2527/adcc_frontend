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
import { FormDrawerService } from '../../../../core/services/drawer/form-drawer.service';
import { AuditDashboardService } from '../../services/auditor-main.service';
import { CategoryAssessmentComponent } from '../category-assessment/category-assessment.component';

@Component({
    selector: 'app-assessment-workspace',
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
    templateUrl: './assessment-workspace.component.html',
    styleUrl: '../internal-audit.component.css',
})
export class AssessmentWorkspaceComponent implements OnInit {
    private route =
        inject(ActivatedRoute);

    private router =
        inject(Router);

    private service =
        inject(AuditDashboardService);

    private drawer =
        inject(FormDrawerService);

    loading =
        signal(false);

    overview =
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

        this.loadMenu(
            assessmentId,
        );
    }
    openExecutiveSummary() {

    const assessmentId =
        Number(
            this.route.snapshot.paramMap.get(
                'assessmentId',
            ),
        );

    this.router.navigate([
        '/auditor/internal-audit/executive-summary',
        assessmentId,
    ]);

}

    loadMenu(
        assessmentId: number,
    ) {
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

    async openCategory(
        category: any,
    ) {
        const assessment =
            this.overview();

        if (
            !assessment?.id
            ||
            !category?.id
        ) {
            return;
        }

        await this.drawer.open(
            CategoryAssessmentComponent,
            {
                header:
                    category.name || 'Category Assessment',
                icon:
                    'pi pi-list-check',
                width:
                    '100vw',
                dismissible:
                    false,
                data: {
                    assessmentId:
                        assessment.id,
                    categoryId:
                        category.id,
                },
            },
        );

        this.loadMenu(
            assessment.id,
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
