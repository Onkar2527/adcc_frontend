import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { AuditCalendarService } from '../services/masters.service';
import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';
import { MasterBulkUploadComponent } from '../shared/master-bulk-upload/master-bulk-upload.component';
import { MasterBulkUploadService } from '../services/master-bulk-upload.service';

export interface RiskFrequency {
    risk_type_id: number;
    frequency: number;
    riskName?: string;
    description?: string;
    colorClass?: string;
}

@Component({
    selector: 'app-audit-frequency-master',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="grid p-fluid">
        <!-- Header Section -->
        <div class="col-12">
            <div class="card shadow-2 p-4 apcard mb-4">
                <div class="flex align-items-center justify-content-between">
                    <h5 class="m-0 text-2xl font-bold text-gray-900 flex align-items-center">
                        <i class="pi pi-cog text-primary text-3xl mr-2"></i>
                        Audit Frequency Master
                    </h5>
                    <div class="flex align-items-center gap-2 ml-auto">
                        <button 
                            pButton
                            type="button"
                            label="Bulk Upload CSV"
                            icon="pi pi-upload"
                            class="p-button-outlined"
                            style="width: auto;"
                            (click)="openBulkUpload()"
                        ></button>
                        <button 
                            pButton 
                            type="button" 
                            label="Back to Calendar" 
                            icon="pi pi-arrow-left" 
                            class="p-button-outlined p-button-secondary"
                            routerLink="/admin/audit-calendar"
                            style="width: auto;"
                        ></button>
                    </div>
                </div>
                <p class="text-gray-500 mt-2">
                    Define the recommended standard audit frequency (in months) for each of the core risk classifications.
                    These values drive the automated audit calendar scheduling.
                </p>
            </div>
        </div>

        <!-- Configuration Form Panel -->
        <div class="col-12 md:col-8 col-centered">
            <div class="card shadow-2 p-4 apcard">
                <div class="flex align-items-center justify-content-between mb-4 border-bottom-1 surface-border pb-3">
                    <h6 class="text-lg font-semibold text-gray-800 m-0">
                        <i class="pi pi-sliders-h text-info mr-2"></i>
                        Frequencies Mapping Settings
                    </h6>
                    <span class="text-xs text-gray-500 font-semibold italic">* All frequency values are in months</span>
                </div>

                <div *ngIf="loading()" class="flex align-items-center justify-content-center p-5">
                    <i class="pi pi-spin pi-spinner text-primary text-3xl mr-3"></i>
                    <span class="text-gray-600 font-medium">Loading frequency master settings...</span>
                </div>

                <div *ngIf="!loading()">
                    <div class="flex flex-column gap-4">
                        <!-- Frequency Config Rows -->
                        <div *ngFor="let item of frequencies()" class="config-row p-3 border-round border-1 surface-border">
                            <div class="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between gap-3">
                                <div>
                                    <span class="px-3 py-1 border-round text-xs font-bold mr-2 uppercase" [ngClass]="item.colorClass">
                                        {{ item.riskName }}
                                    </span>
                                    <p class="text-gray-500 text-sm mt-2 mb-0">{{ item.description }}</p>
                                </div>
                                
                                <div class="flex align-items-center gap-2 min-width-150">
                                    <input 
                                        type="number" 
                                        [(ngModel)]="item.frequency" 
                                        min="1" 
                                        max="60"
                                        class="w-full p-2 border-1 border-round surface-border text-base bg-white font-semibold text-center text-gray-800"
                                        style="height: 42px; width: 80px;"
                                        (ngModelChange)="onValueChange()"
                                    />
                                    <span class="font-medium text-gray-700 text-sm">Months</span>
                                </div>
                            </div>
                        </div>

                        <!-- Info Alert Box -->
                        <div class="info-alert p-3 border-round flex align-items-start gap-3 mt-2">
                            <i class="pi pi-exclamation-triangle text-orange-500 text-xl mt-1"></i>
                            <div class="text-sm text-gray-700 leading-normal">
                                <strong>Important Notice:</strong> Modifying these settings will immediately affect the recommended scheduling frequencies 
                                for all audit units. Individual unit manual overrides will be preserved.
                            </div>
                        </div>

                        <!-- Action Bar -->
                        <div class="flex justify-content-end gap-3 mt-4 pt-3 border-top-1 surface-border">
                            <button 
                                pButton 
                                type="button" 
                                label="Cancel" 
                                class="p-button-outlined p-button-secondary"
                                style="width: auto; height: 42px;"
                                (click)="cancelChanges()"
                                [disabled]="!isDirty()"
                            ></button>
                            <button 
                                pButton 
                                type="button" 
                                label="Save Frequency Settings" 
                                icon="pi pi-check" 
                                class="p-button-primary"
                                style="width: auto; height: 42px;"
                                (click)="saveFrequencies()"
                                [disabled]="!isDirty() || saving()"
                            ></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .apcard {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.05);
        }
        .config-row {
            background: #fbfbfb;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .config-row:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            background: #ffffff;
        }
        .info-alert {
            background: rgba(255, 193, 7, 0.08);
            border: 1px solid rgba(255, 193, 7, 0.25);
        }
        .col-centered {
            margin: 0 auto;
        }
        .min-width-150 {
            min-width: 150px;
        }
        .bg-high-risk {
            background: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.2);
        }
        .bg-medium-risk {
            background: rgba(253, 126, 20, 0.1);
            color: #fd7e14;
            border: 1px solid rgba(253, 126, 20, 0.2);
        }
        .bg-low-risk {
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.2);
        }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            opacity: 1;
        }
    `]
})
export class AuditFrequencyMasterComponent implements OnInit {
    private service = inject(AuditCalendarService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private drawer = inject(FormDrawerService);
    private bulkUploadService = inject(MasterBulkUploadService);

    frequencies = signal<RiskFrequency[]>([]);
    loading = signal(false);
    saving = signal(false);
    isDirty = signal(false);

    private originalValues: Record<number, number> = {};

    ngOnInit() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.isDirty.set(false);
        this.service.getRiskFrequencies().subscribe({
            next: (data) => {
                const mapped: RiskFrequency[] = data.map(item => {
                    const rId = Number(item.risk_type_id);
                    let riskName = 'LOW RISK';
                    let description = 'Assigned to units with lower calculated risk index share.';
                    let colorClass = 'bg-low-risk';

                    if (rId === 1) {
                        riskName = 'HIGH RISK';
                        description = 'Assigned to units with high dynamic risk index share (requires frequent review).';
                        colorClass = 'bg-high-risk';
                    } else if (rId === 2) {
                        riskName = 'MEDIUM RISK';
                        description = 'Assigned to units with medium risk score share.';
                        colorClass = 'bg-medium-risk';
                    }

                    // Store original for cancellation comparison
                    this.originalValues[rId] = Number(item.frequency);

                    return {
                        risk_type_id: rId,
                        frequency: Number(item.frequency),
                        riskName,
                        description,
                        colorClass
                    };
                });

                this.frequencies.set(mapped);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unable to fetch dynamic risk frequency master configuration'
                });
            }
        });
    }

    onValueChange() {
        let dirty = false;
        this.frequencies().forEach(item => {
            if (this.originalValues[item.risk_type_id] !== item.frequency) {
                dirty = true;
            }
        });
        this.isDirty.set(dirty);
    }

    async openBulkUpload() {
        const res = await this.drawer.open(MasterBulkUploadComponent, {
            header: 'Audit Frequency Bulk Upload',
            data: {
                config: this.bulkUploadService.getConfig('frequencies'),
            },
            width: 'min(980px, 100vw)',
        });

        if (res?.saved) {
            this.load();
        }
    }

    cancelChanges() {
        const resetData = this.frequencies().map(item => ({
            ...item,
            frequency: this.originalValues[item.risk_type_id]
        }));
        this.frequencies.set(resetData);
        this.isDirty.set(false);
        this.messageService.add({
            severity: 'info',
            summary: 'Cancelled',
            detail: 'Changes reverted to original values'
        });
    }

    saveFrequencies() {
        // Validate frequencies values
        let valid = true;
        this.frequencies().forEach(item => {
            if (!item.frequency || item.frequency <= 0 || item.frequency > 60) {
                valid = false;
            }
        });

        if (!valid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Frequencies must be positive numbers between 1 and 60 months'
            });
            return;
        }

        this.confirmationService.confirm({
            message: 'Are you sure you want to update the standard audit frequency mappings? This will immediately apply to dynamic audit calendar scheduling.',
            header: 'Save Configurations',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.saving.set(true);
                const payload = this.frequencies().map(item => ({
                    risk_type_id: item.risk_type_id,
                    frequency: Number(item.frequency)
                }));

                this.service.updateRiskFrequencies(payload).subscribe({
                    next: (res) => {
                        this.saving.set(false);
                        this.isDirty.set(false);
                        // Save new original references
                        payload.forEach(item => {
                            this.originalValues[item.risk_type_id] = item.frequency;
                        });
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: res.message || 'Audit frequency settings updated successfully'
                        });
                    },
                    error: (err) => {
                        this.saving.set(false);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: err?.error?.message || 'Failed to update frequency master configurations'
                        });
                    }
                });
            }
        });
    }
}
