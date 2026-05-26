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
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { AuditDashboardService } from '../services/auditor-main.service';

@Component({
    selector: 'app-reviewer-workspace',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        ButtonModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './reviewer-workspace.component.html',
    styleUrl: './reviewer-workspace.component.css',
})
export class ReviewerWorkspaceComponent implements OnInit {
    private service =
        inject(AuditDashboardService);

    private notification =
        inject(NotificationService);

    private confirmation =
        inject(ConfirmationService);

    loadingQueue =
        signal(false);

    loadingDetail =
        signal(false);

    submitting =
        signal(false);

    actionSaving =
        signal<Record<string, boolean>>({});

    assessments =
        signal<any[]>([]);

    selected =
        signal<any>(null);

    detail =
        signal<any>(null);

    error =
        signal('');

    ngOnInit() {
        this.loadQueue();
    }

    employeeId() {
        const user =
            JSON.parse(
                localStorage.getItem('user')
                || '{}',
            );

        return Number(
            user.id
            || user.employee_id
            || user.emp_id
            || 0,
        );
    }

    loadQueue() {
        this.loadingQueue.set(true);
        this.error.set('');

        this.service
            .getReviewerPending(
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.assessments.set(
                        res?.assessments || [],
                    );
                    this.loadingQueue.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to load pending audit reviews.',
                    );
                    this.loadingQueue.set(false);
                },
            });
    }

    openAssessment(
        assessment: any,
    ) {
        this.selected.set(
            assessment,
        );
        this.loadingDetail.set(true);
        this.error.set('');

        const request =
            Number(assessment.audit_status_id) === 5
                ? this.service.getReviewerComplianceAssessment(
                    Number(assessment.id),
                    this.employeeId(),
                )
                : this.service.getReviewerAssessment(
                    Number(assessment.id),
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (res: any) => {
                    this.detail.set(res);
                    this.loadingDetail.set(false);
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to open review.',
                    );
                    this.loadingDetail.set(false);
                },
            });
    }

    closeAssessment() {
        this.selected.set(null);
        this.detail.set(null);
        this.loadQueue();
    }

    isComplianceReview() {
        return Number(
            this.selected()?.audit_status_id || 0,
        ) === 5;
    }

    reviewStatus(
        observation: any,
    ) {
        return this.isComplianceReview()
            ? observation.compliance_status_id
            : observation.audit_status_id;
    }

    reviewComment(
        observation: any,
    ) {
        return this.isComplianceReview()
            ? observation.compliance_reviewer_comment || ''
            : observation.audit_reviewer_comment || '';
    }

    statusLabel(
        status: number,
    ) {
        if (
            Number(status) === 2
        ) {
            return 'Accepted';
        }

        if (
            Number(status) === 3
        ) {
            return this.isComplianceReview()
                ? 'Re-Compliance Needed'
                : 'Re-Audit Needed';
        }

        return 'Pending';
    }

    statusSeverity(
        status: number,
    ): 'success' | 'danger' | 'secondary' {
        if (
            Number(status) === 2
        ) {
            return 'success';
        }

        if (
            Number(status) === 3
        ) {
            return 'danger';
        }

        return 'secondary';
    }

    actionKey(
        targetType: string,
        observationId: number,
    ) {
        return `${targetType}-${observationId}`;
    }

    saveAction(
        targetType: 'answer' | 'annexure',
        observation: any,
        action: number,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        const key =
            this.actionKey(
                targetType,
                observation.id,
            );
        const state = {
            ...this.actionSaving(),
            [key]: true,
        };

        this.actionSaving.set(
            state,
        );

        const request =
            this.isComplianceReview()
                ? this.service.saveReviewerComplianceAction(
                    assessmentId,
                    targetType,
                    Number(observation.id),
                    this.employeeId(),
                    action,
                    this.reviewComment(observation),
                )
                : this.service.saveReviewerAction(
                    assessmentId,
                    targetType,
                    Number(observation.id),
                    this.employeeId(),
                    action,
                    this.reviewComment(observation),
                );

        request
            .subscribe({
                next: (res: any) => {
                    this.notification.success(
                        res?.message
                        || 'Review action saved.',
                    );
                    this.reloadDetail(
                        assessmentId,
                        key,
                    );
                },
                error: (err) => {
                    this.clearActionSaving(key);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save review action.',
                    );
                },
            });
    }

    viewEvidence(
        evidence: any,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
            ||
            !evidence?.id
        ) {
            return;
        }

        const request =
            this.isComplianceReview()
                ? this.service.viewReviewerComplianceEvidence(
                    assessmentId,
                    Number(evidence.id),
                    this.employeeId(),
                )
                : this.service.viewReviewerEvidence(
                    assessmentId,
                    Number(evidence.id),
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (blob: Blob) => {
                    const url =
                        URL.createObjectURL(blob);

                    window.open(
                        url,
                        '_blank',
                    );

                    setTimeout(
                        () =>
                            URL.revokeObjectURL(url),
                        60000,
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to open evidence.',
                    );
                },
            });
    }

    submitReview() {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        const complianceReview =
            this.isComplianceReview();

        this.confirmation.confirm({
            header:
                complianceReview
                    ? 'Submit Compliance Review'
                    : 'Submit Review',
            message:
                complianceReview
                    ? 'Submit this compliance review? Pending responses will be accepted.'
                    : 'Submit this audit review? Any pending observations will be accepted.',
            icon:
                'pi pi-send',
            acceptLabel:
                'Submit',
            rejectLabel:
                'Cancel',
            accept:
                () => {
                    this.submitting.set(true);

                    const request =
                        complianceReview
                            ? this.service.submitReviewerComplianceAssessment(
                                assessmentId,
                                this.employeeId(),
                            )
                            : this.service.submitReviewerAssessment(
                                assessmentId,
                                this.employeeId(),
                            );

                    request
                        .subscribe({
                            next: (res: any) => {
                                this.submitting.set(false);
                                this.notification.success(
                                    res?.message
                                    || 'Review submitted.',
                                );
                                this.closeAssessment();
                            },
                            error: (err) => {
                                this.submitting.set(false);
                                this.notification.error(
                                    err?.error?.message
                                    || 'Unable to submit review.',
                                );
                            },
                        });
                },
        });
    }

    private reloadDetail(
        assessmentId: number,
        key: string,
    ) {
        const request =
            this.isComplianceReview()
                ? this.service.getReviewerComplianceAssessment(
                    assessmentId,
                    this.employeeId(),
                )
                : this.service.getReviewerAssessment(
                    assessmentId,
                    this.employeeId(),
                );

        request
            .subscribe({
                next: (res: any) => {
                    this.detail.set(res);
                    this.clearActionSaving(key);
                },
                error: () => {
                    this.clearActionSaving(key);
                },
            });
    }

    private clearActionSaving(
        key: string,
    ) {
        const state = {
            ...this.actionSaving(),
        };
        delete state[key];
        this.actionSaving.set(state);
    }
}
