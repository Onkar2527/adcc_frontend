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
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { AuditDashboardService } from '../services/auditor-main.service';
import { InternalAuditNavService } from '../services/internal-audit-nav.service';

@Component({
    selector: 'app-compliance-workspace',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        ButtonModule,
        SkeletonModule,
        TagModule,
        SelectModule,
        InputTextModule,
        TextareaModule,
    ],
    templateUrl: './compliance-workspace.component.html',
    styleUrl: './compliance-workspace.component.css',
})
export class ComplianceWorkspaceComponent implements OnInit {
    private service =
        inject(AuditDashboardService);

    private navService =
        inject(InternalAuditNavService);

    private notification =
        inject(NotificationService);

    private confirmation =
        inject(ConfirmationService);

    loadingQueue =
        signal(false);

    loadingDetail =
        signal(false);

    checkingSubmission =
        signal(false);

    submitting =
        signal(false);

    responseSaving =
        signal<Record<string, boolean>>({});

    uploadingEvidenceKey =
        signal('');

    annexureSavingQuestionId =
        signal<number | null>(null);

    assessments =
        signal<any[]>([]);

    selected =
        signal<any>(null);

    detail =
        signal<any>(null);

    submissionPreview =
        signal<any>(null);

    error =
        signal('');

    overview = computed(() =>
        this.detail()?.overview || null
    );

    remarks =
        signal<any>(null);

    remarksLoading =
        signal(false);

    savingRemark =
        signal(false);

    showRemarksPanel =
        signal(false);

    remarkTab =
        signal<'add' | 'current' | 'other'>('current');

    expandedRemarks =
        signal<Record<number, boolean>>({});

    remarkNotiType: number | null = null;

    remarkSubject = '';

    remarkMessage = '';

    complianceAnswerGroups = computed(() =>
        this.groupComplianceAnswers(
            this.detail()?.answers || [],
        ),
    );

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
            .getCompliancePending(
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
                        || 'Unable to load pending compliance assessments.',
                    );
                    this.loadingQueue.set(false);
                },
            });
    }

    openAssessment(
        assessment: any,
    ) {
        this.showRemarksPanel.set(false);
        this.selected.set(
            assessment,
        );
        this.loadDetail(
            Number(assessment.id),
        );
        this.checkCompletion();
    }

    closeAssessment() {
        this.showRemarksPanel.set(false);
        this.selected.set(null);
        this.detail.set(null);
        this.submissionPreview.set(null);
        this.navService.clear();
        this.loadQueue();
    }

    isReCompliance() {
        return Number(
            this.selected()?.audit_status_id
            || this.detail()?.overview?.audit_status_id
            || 0,
        ) === 6;
    }

    responseRequired(
        observation: any,
    ) {
        return observation?.response_required !== false;
    }

    actionKey(
        targetType: string,
        observationId: number,
    ) {
        return `${targetType}-${observationId}`;
    }

    evidenceKey(
        targetType: string,
        observationId: number,
    ) {
        return `${targetType}-${observationId}`;
    }

    isSaved(
        observation: any,
    ) {
        const saved =
            String(
                observation?._savedComplianceResponse || '',
            ).trim();
        const current =
            String(
                observation?.compliance_response || '',
            ).trim();

        return Boolean(
            saved
            &&
            saved === current,
        );
    }

    hasAccountDetails(
        answer: any,
    ) {
        return Number(answer?.dump_id || 0) > 0
            &&
            (
                answer?.account_no
                ||
                answer?.account_holder_name
                ||
                answer?.scheme_name
                ||
                answer?.scheme_code
            );
    }

    private groupComplianceAnswers(
        answers: any[] = [],
    ) {
        const groups: any[] = [];
        const accountGroupMap =
            new Map<string, any>();
        let displayIndex = 0;

        for (const answer of answers || []) {
            const row =
                answer;

            row._displayIndex =
                ++displayIndex;

            if (!this.hasAccountDetails(row)) {
                groups.push({
                    isAccountGroup:
                        false,
                    account:
                        null,
                    answers:
                        [row],
                });
                continue;
            }

            const key =
                [
                    row.category_id,
                    row.dump_id,
                    row.account_no || '',
                ].join(':');

            let group =
                accountGroupMap.get(key);

            if (!group) {
                group = {
                    isAccountGroup:
                        true,
                    account:
                        row,
                    answers:
                        [],
                };
                accountGroupMap.set(key, group);
                groups.push(group);
            }

            group.answers.push(row);
        }

        return groups;
    }

    annexureColumns(
        answer: any,
    ) {
        const columns =
            Array.isArray(answer?.annexure_columns)
                ? answer.annexure_columns
                : [];

        if (
            columns.length
        ) {
            return columns;
        }

        const valueCount =
            Math.max(
                ...(answer?.annexure_rows || [])
                    .map(
                        (row: any) =>
                            row.values?.length || 0,
                    ),
                0,
            );

        return Array.from(
            {
                length:
                    valueCount,
            },
            (
                _item,
                index,
            ) => ({
                name:
                    `Column ${index + 1}`,
            }),
        );
    }

    hasUnsavedChanges() {
        const detail =
            this.detail();

        for (
            const answer
            of detail?.answers || []
        ) {
            if (
                this.responseRequired(
                    answer,
                )
                &&
                this.hasEditedResponse(
                    answer,
                )
            ) {
                return true;
            }

            for (
                const row
                of answer.annexure_rows || []
            ) {
                if (
                    this.responseRequired(
                        row,
                    )
                    &&
                    this.hasEditedResponse(
                        row,
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    hasSaveableAnnexureRows(
        answer: any,
    ): boolean {
        return (answer.annexure_rows || []).some(
            (row: any) => this.responseRequired(row),
        );
    }

    fillCompliedForAllAnnexureRows(
        answer: any,
    ) {
        if (answer.annexure_rows) {
            answer.annexure_rows.forEach((row: any) => {
                if (this.responseRequired(row)) {
                    row.compliance_response = 'Complied';
                }
            });
        }
    }

    saveAllAnnexureRows(
        answer: any,
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

        const rowsToSave = (answer.annexure_rows || []).filter(
            (row: any) =>
                this.responseRequired(row) && this.hasEditedResponse(row),
        );

        if (
            rowsToSave.length === 0
        ) {
            this.notification.info(
                'No changes to save in annexure rows.',
            );
            return;
        }

        // Validate that all modified rows have a non-empty response
        for (const row of rowsToSave) {
            const response =
                String(
                    row.compliance_response || '',
                ).trim();
            if (
                !response
            ) {
                this.notification.error(
                    'Enter a compliance response for all edited rows before saving.',
                );
                return;
            }
        }

        this.annexureSavingQuestionId.set(answer.id);

        const requests = rowsToSave.map((row: any) => {
            const response =
                String(
                    row.compliance_response || '',
                ).trim();
            return this.service.saveComplianceResponse(
                assessmentId,
                'annexure',
                Number(row.id),
                this.employeeId(),
                response,
            );
        });

        forkJoin(requests).subscribe({
            next: () => {
                rowsToSave.forEach((row: any) => {
                    const response =
                        String(
                            row.compliance_response || '',
                        ).trim();
                    row.compliance_response = response;
                    row._savedComplianceResponse = response;
                });
                this.refreshCounts();
                this.annexureSavingQuestionId.set(null);
                this.notification.success(
                    'All annexure responses saved successfully.',
                );
                this.checkCompletion();
            },
            error: (err) => {
                this.annexureSavingQuestionId.set(null);
                this.notification.error(
                    err?.error?.message
                    || 'Unable to save some annexure responses. Please try again.',
                );
                this.loadDetail(assessmentId);
            },
        });
    }

    saveResponse(
        targetType: 'answer' | 'annexure',
        observation: any,
    ) {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );
        const response =
            String(
                observation?.compliance_response || '',
            ).trim();

        if (
            !response
        ) {
            this.notification.error(
                'Enter a compliance response before saving.',
            );
            return;
        }

        const key =
            this.actionKey(
                targetType,
                observation.id,
            );

        this.responseSaving.set({
            ...this.responseSaving(),
            [key]: true,
        });

        this.service
            .saveComplianceResponse(
                assessmentId,
                targetType,
                Number(observation.id),
                this.employeeId(),
                response,
            )
            .subscribe({
                next: (res: any) => {
                    observation.compliance_response =
                        response;
                    observation._savedComplianceResponse =
                        response;
                    this.refreshCounts();
                    this.clearSaving(key);
                    this.notification.success(
                        res?.message
                        || 'Compliance response saved.',
                    );
                    this.checkCompletion();
                },
                error: (err) => {
                    this.clearSaving(key);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save compliance response.',
                    );
                },
            });
    }

    checkCompletion() {
        const assessmentId =
            Number(
                this.selected()?.id
                || this.detail()?.overview?.id
                || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        this.checkingSubmission.set(true);

        this.service
            .getComplianceSubmissionPreview(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.submissionPreview.set(res);
                    this.checkingSubmission.set(false);
                },
                error: (err) => {
                    this.checkingSubmission.set(false);
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to check compliance completion.',
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

        this.service
            .viewComplianceEvidence(
                assessmentId,
                Number(evidence.id),
                this.employeeId(),
            )
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

    viewComplianceEvidence(
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

        this.service
            .viewComplianceUploadedEvidence(
                assessmentId,
                Number(evidence.id),
                this.employeeId(),
            )
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
                        || 'Unable to open compliance evidence.',
                    );
                },
            });
    }

    uploadEvidence(
        targetType: 'answer' | 'annexure',
        observation: any,
        event: Event,
    ) {
        const input =
            event.target as HTMLInputElement;
        const file =
            input.files?.[0];

        input.value = '';

        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !file
            ||
            !assessmentId
            ||
            !observation?.id
        ) {
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/pdf',
        ];

        if (
            !allowedTypes.includes(file.type)
        ) {
            this.notification.error(
                'Only JPG, JPEG, PNG and PDF evidence files are allowed.',
            );
            return;
        }

        if (
            file.size > 5 * 1024 * 1024
        ) {
            this.notification.error(
                'Evidence file size must be less than or equal to 5 MB.',
            );
            return;
        }

        const key =
            this.evidenceKey(
                targetType,
                observation.id,
            );

        this.uploadingEvidenceKey.set(key);

        this.service
            .uploadComplianceEvidence(
                assessmentId,
                targetType,
                Number(observation.id),
                this.employeeId(),
                file,
            )
            .subscribe({
                next: (res: any) => {
                    this.uploadingEvidenceKey.set('');

                    if (
                        !res?.success
                    ) {
                        this.notification.error(
                            res?.message
                            || 'Unable to upload compliance evidence.',
                        );
                        return;
                    }

                    this.notification.success(
                        res?.message
                        || 'Compliance evidence uploaded successfully.',
                    );
                    this.loadDetail(assessmentId);
                    this.checkCompletion();
                },
                error: (err) => {
                    this.uploadingEvidenceKey.set('');
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to upload compliance evidence.',
                    );
                },
            });
    }

    submitCompliance() {
        const assessmentId =
            Number(
                this.detail()?.overview?.id || 0,
            );

        if (
            !assessmentId
        ) {
            return;
        }

        if (
            this.hasUnsavedChanges()
        ) {
            this.notification.error(
                'Save edited compliance responses before submitting.',
            );
            return;
        }

        if (
            !this.submissionPreview()?.can_submit
        ) {
            this.checkCompletion();
            return;
        }

        this.confirmation.confirm({
            header:
                'Submit Compliance',
            message:
                'Submit these compliance responses to Reviewer?',
            icon:
                'pi pi-send',
            acceptLabel:
                'Submit',
            rejectLabel:
                'Cancel',
            accept:
                () => {
                    this.submitting.set(true);
                    this.service
                        .submitComplianceAssessment(
                            assessmentId,
                            this.employeeId(),
                        )
                        .subscribe({
                            next: (res: any) => {
                                this.submitting.set(false);
                                this.notification.success(
                                    res?.message
                                    || 'Compliance submitted.',
                                );
                                this.closeAssessment();
                            },
                            error: (err) => {
                                this.submitting.set(false);
                                this.notification.error(
                                    err?.error?.message
                                    || 'Unable to submit compliance.',
                                );
                            },
                        });
                },
        });
    }

    private loadDetail(
        assessmentId: number,
    ) {
        this.loadingDetail.set(true);
        this.error.set('');

        this.service
            .getComplianceAssessment(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    res.answers =
                        (res?.answers || [])
                            .filter(
                                (answer: any) =>
                                    Number(answer?.is_compliance || 0) === 1,
                            );

                    for (
                        const answer
                        of res?.answers || []
                    ) {
                        answer._savedComplianceResponse =
                            this.savedResponse(
                                answer,
                                res?.overview,
                            );

                        for (
                            const row
                            of answer.annexure_rows || []
                        ) {
                            row._savedComplianceResponse =
                                this.savedResponse(
                                    row,
                                    res?.overview,
                                );
                        }
                    }

                    this.detail.set(res);
                    this.navService.setAssessmentMenus(
                        assessmentId,
                        [],
                        res?.overview || null,
                    );
                    this.loadingDetail.set(false);

                    if (
                        this.canUseRemarks(
                            res?.overview,
                        )
                    ) {
                        this.loadRemarks(
                            assessmentId,
                        );
                    } else {
                        this.remarks.set(
                            null,
                        );
                    }
                },
                error: (err) => {
                    this.error.set(
                        err?.error?.message
                        || 'Unable to open compliance assessment.',
                    );
                    this.loadingDetail.set(false);
                },
            });
    }

    private refreshCounts() {
        const detail =
            this.detail();

        if (
            !detail
        ) {
            return;
        }

        let total = 0;
        let completed = 0;

        for (
            const answer
            of detail.answers || []
        ) {
            if (
                this.responseRequired(
                    answer,
                )
            ) {
                total++;
                completed += this.isSaved(answer)
                    ? 1
                    : 0;
            }

            for (
                const row
                of answer.annexure_rows || []
            ) {
                if (
                    this.responseRequired(
                        row,
                    )
                ) {
                    total++;
                    completed += this.isSaved(row)
                        ? 1
                        : 0;
                }
            }
        }

        this.detail.set({
            ...detail,
            counts: {
                total,
                completed,
                pending:
                    total - completed,
            },
        });
    }

    private clearSaving(
        key: string,
    ) {
        const state = {
            ...this.responseSaving(),
        };
        delete state[key];
        this.responseSaving.set(state);
    }

    private hasEditedResponse(
        observation: any,
    ) {
        return String(
            observation?.compliance_response || '',
        ).trim() !== String(
            observation?._savedComplianceResponse || '',
        ).trim();
    }

    private savedResponse(
        observation: any,
        overview: any,
    ) {
        if (
            Number(overview?.audit_status_id) === 6
            &&
            String(observation?.batch_key || '')
            !==
            String(overview?.batch_key || '')
        ) {
            return '';
        }

        return observation?.compliance_response || '';
    }

    canUseRemarks(
        audit: any = this.overview(),
    ) {
        return [4, 6].includes(
            Number(
                audit?.audit_status_id,
            ),
        );
    }

    toggleRemarksPanel() {
        this.showRemarksPanel.set(
            !this.showRemarksPanel(),
        );
    }

    loadRemarks(
        assessmentId: number,
    ) {
        this.remarksLoading.set(
            true,
        );

        this.service
            .getInternalAuditRemarks(
                assessmentId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.remarks.set(
                        res,
                    );
                    this.remarksLoading.set(
                        false,
                    );
                },
                error: (err) => {
                    this.remarksLoading.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to load assessment remarks.',
                    );
                },
            });
    }

    saveRemark() {
        const assessmentId =
            Number(
                this.overview()?.id || 0,
            );

        if (
            !assessmentId
            ||
            this.savingRemark()
        ) {
            return;
        }

        if (
            !this.remarkNotiType
            ||
            !this.remarkSubject.trim()
            ||
            !this.remarkMessage.trim()
        ) {
            this.notification.error(
                'Select a recipient and enter subject and message.',
            );
            return;
        }

        this.savingRemark.set(
            true,
        );

        this.service
            .saveInternalAuditRemark(
                assessmentId,
                this.employeeId(),
                {
                    noti_type:
                        this.remarkNotiType,
                    subject:
                        this.remarkSubject.trim(),
                    message:
                        this.remarkMessage.trim(),
                },
            )
            .subscribe({
                next: (res: any) => {
                    this.savingRemark.set(
                        false,
                    );
                    this.remarkNotiType =
                        null;
                    this.remarkSubject =
                        '';
                    this.remarkMessage =
                        '';
                    this.remarkTab.set(
                        'current',
                    );
                    this.notification.success(
                        res?.message
                        || 'Assessment remark saved successfully.',
                    );
                    this.loadRemarks(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.savingRemark.set(
                        false,
                    );
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to save assessment remark.',
                    );
                },
            });
    }

    toggleRemark(
        remark: any,
        incoming = false,
    ) {
        const expanded = {
            ...this.expandedRemarks(),
        };
        const remarkId =
            Number(remark?.id || 0);

        expanded[remarkId] =
            !expanded[remarkId];
        this.expandedRemarks.set(
            expanded,
        );

        if (
            !expanded[remarkId]
            ||
            !incoming
            ||
            !remark?.is_unread
        ) {
            return;
        }

        this.service
            .markInternalAuditRemarkRead(
                Number(this.overview()?.id),
                remarkId,
                this.employeeId(),
            )
            .subscribe({
                next: () => {
                    this.loadRemarks(
                        Number(
                            this.overview()?.id,
                        ),
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to mark remark as read.',
                    );
                },
            });
    }

    isRemarkExpanded(
        remarkId: number,
    ) {
        return Boolean(
            this.expandedRemarks()[
            Number(remarkId)
            ],
        );
    }

    removeRemark(
        remark: any,
    ) {
        if (
            !remark?.can_delete
        ) {
            return;
        }

        this.confirmation.confirm({
            header:
                'Remove Remark',
            message:
                'Remove this unread assessment remark?',
            icon:
                'pi pi-trash',
            acceptLabel:
                'Remove',
            rejectLabel:
                'Cancel',
            accept:
                () =>
                    this.performRemoveRemark(
                        Number(remark.id),
                    ),
        });
    }

    private performRemoveRemark(
        remarkId: number,
    ) {
        const assessmentId =
            Number(
                this.overview()?.id || 0,
            );

        this.service
            .deleteInternalAuditRemark(
                assessmentId,
                remarkId,
                this.employeeId(),
            )
            .subscribe({
                next: (res: any) => {
                    this.notification.success(
                        res?.message
                        || 'Assessment remark removed successfully.',
                    );
                    this.loadRemarks(
                        assessmentId,
                    );
                },
                error: (err) => {
                    this.notification.error(
                        err?.error?.message
                        || 'Unable to remove assessment remark.',
                    );
                },
            });
    }
}
