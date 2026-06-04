// src/app/shared/components/audit-unit-dashboard/audit-unit-dashboard.component.ts

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-audit-unit-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TagModule,
    ],
    templateUrl: './audit-unit-dashboard.component.html',
    styleUrl: './audit-unit-dashboard.component.css',
})
export class AuditUnitDashboardComponent {
    @Input() eyebrow = 'Internal Audit';
    @Input() title = 'Select Audit Unit';
    @Input() subtitle = 'Select a branch/unit to continue the audit workflow';

    @Input() units: any[] = [];
    @Input() loading = false;

    @Input() search = '';
    @Input() selectedStatus: any = null;
    @Input() statusOptions: any[] = [];

    @Input() totalUnits = 0;
    @Input() totalAuditPending = 0;
    @Input() totalReviewPending = 0;
    @Input() totalCompliancePending = 0;
    @Input() totalCompleted = 0;

    @Input() panelTitle = 'Assigned Branches';
    @Input() emptyTitle = 'No audit units found';
    @Input() emptyMessage = 'Try changing the search or status filter.';
    @Input() refreshLabel = 'Refresh';

    @Output() searchChange = new EventEmitter<string>();
    @Output() selectedStatusChange = new EventEmitter<any>();
    @Output() refresh = new EventEmitter<void>();
    @Output() openUnit = new EventEmitter<any>();

    getSeverity(status: string | null | undefined) {
        if (!status) {
            return 'secondary';
        }

        const value = status.toLowerCase();

        if (value.includes('not started')) {
            return 'info';
        }

        if (value.includes('audit')) {
            return 'warn';
        }

        if (value.includes('review')) {
            return 'contrast';
        }

        if (value.includes('compliance')) {
            return 'danger';
        }

        if (value.includes('completed')) {
            return 'success';
        }

        return 'secondary';
    }

    onSearchChange(value: string) {
        this.searchChange.emit(value);
    }

    onStatusChange(value: any) {
        this.selectedStatusChange.emit(value);
    }

    onRefresh() {
        this.refresh.emit();
    }

    onOpenUnit(item: any) {
        this.openUnit.emit(item);
    }
}