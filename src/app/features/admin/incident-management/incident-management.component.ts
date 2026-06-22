import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { IncidentService, Incident } from '../services/incident.service';
import { UnitsService } from '../services/masters.service';
import { ExportService } from '../../../core/services/export/export.service';
import { PdfDownloadService } from '../../../core/services/pdf/pdf-download.service';
import { APP_CONFIG } from '../../../core/services/config/config.token';

@Component({
  selector: 'app-incident-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    ButtonModule,
    TooltipModule,
    FormsModule,
    SelectModule,
    DialogModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="incidents-container">
      <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 class="m-0 text-3xl font-bold text-900">Incident Logs</h3>
          <p class="text-color-secondary mt-1 m-0">
            Monitor, report, and track branch issues, network outages, and staff altercations.
          </p>
        </div>
        @if (canReport()) {
          <button
            pButton
            type="button"
            label="Report Incident"
            icon="pi pi-plus"
            class="p-button-primary p-button-raised border-round-lg px-4 py-2 font-semibold"
            (click)="openForm()"
          ></button>
        }
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card total-stats">
          <div class="stat-info">
            <span class="stat-value">{{ stats().total }}</span>
            <span class="stat-label">Total Reported</span>
          </div>
          <div class="stat-icon-wrapper">
            <i class="pi pi-file-edit"></i>
          </div>
        </div>

        <div class="stat-card network-stats">
          <div class="stat-info">
            <span class="stat-value">{{ stats().network }}</span>
            <span class="stat-label">Network Issues</span>
          </div>
          <div class="stat-icon-wrapper">
            <i class="pi pi-wifi"></i>
          </div>
        </div>

        <div class="stat-card fighting-stats">
          <div class="stat-info">
            <span class="stat-value">{{ stats().fighting }}</span>
            <span class="stat-label">Staff Altercations</span>
          </div>
          <div class="stat-icon-wrapper">
            <i class="pi pi-users"></i>
          </div>
        </div>

        <div class="stat-card utility-stats">
          <div class="stat-info">
            <span class="stat-value">{{ stats().utility }}</span>
            <span class="stat-label">Utility & Light Issues</span>
          </div>
          <div class="stat-icon-wrapper">
            <i class="pi pi-sun"></i>
          </div>
        </div>
      </div>

      <!-- Controls Bar -->
      <div class="controls-bar">
        <div class="search-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search incidents..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
        </div>
        <div class="flex gap-3 align-items-center flex-wrap">
          @if (userRole() !== '3') {
            <p-select
              [options]="unitFilterOptions()"
              [ngModel]="selectedUnitId()"
              (onChange)="selectedUnitId.set($event.value)"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Audit Unit"
              class="w-full md:w-15rem"
              styleClass="w-full border-round-lg"
              appendTo="body"
              [filter]="true"
              filterBy="label"
            ></p-select>
          }

          @if (isReviewer() || isAdminOrMgmt()) {
            <button
              pButton
              type="button"
              icon="pi pi-file-excel"
              class="p-button-outlined p-button-success export-btn"
              (click)="exportExcel()"
              pTooltip="Export Excel"
              [disabled]="filteredIncidents().length === 0"
            ></button>
            <button
              pButton
              type="button"
              icon="pi pi-file-pdf"
              class="p-button-outlined p-button-danger export-btn"
              (click)="exportPdf()"
              pTooltip="Export PDF"
              [disabled]="filteredIncidents().length === 0"
            ></button>
          }

          <button
            pButton
            type="button"
            icon="pi pi-refresh"
            class="p-button-outlined p-button-secondary refresh-btn"
            (click)="load()"
            pTooltip="Refresh Log"
          ></button>
        </div>
      </div>

      <!-- Content Layout -->
      @if (loading()) {
        <div class="grid">
          @for (x of [1, 2, 3, 4, 5, 6]; track x) {
            <div class="col-12 md:col-6 lg:col-4 p-3">
              <div class="skeleton-card">
                <div class="flex align-items-center justify-content-between mb-4">
                  <div class="skeleton-badge"></div>
                  <div class="skeleton-actions"></div>
                </div>
                <div class="skeleton-text-title mb-2"></div>
                <div class="skeleton-text mb-3"></div>
                <div class="skeleton-desc mb-2"></div>
                <div class="skeleton-desc mb-4 w-8"></div>
                <div class="skeleton-footer pt-3"></div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredIncidents().length === 0) {
        <div class="empty-state py-8">
          <i class="pi pi-exclamation-circle empty-icon"></i>
          <h4 class="text-xl font-semibold m-0 text-900">No Incidents Found</h4>
          <p class="text-color-secondary mt-2 mb-4">
            No incident reports match your criteria or are currently available to view.
          </p>
          @if (canReport()) {
            <button
              pButton
              type="button"
              label="Report Incident"
              icon="pi pi-plus"
              class="p-button-outlined p-button-primary"
              (click)="openForm()"
            ></button>
          }
        </div>
      } @else {
        <div class="grid">
          @for (inc of filteredIncidents(); track inc.id) {
            <div class="col-12 md:col-6 lg:col-4 p-3">
              <div
                class="incident-card"
                [ngClass]="getCardClass(inc.incident_type)"
                (click)="openDetails(inc)"
              >
                <div class="card-top">
                  <span class="type-badge">
                    <i [ngClass]="getIconClass(inc.incident_type)"></i>
                    {{ inc.incident_type }}
                  </span>

                  @if (isAdminOrMgmt() || inc.reported_by === userId) {
                    <div class="actions-wrapper">
                      <button
                        class="action-btn"
                        pTooltip="Edit Report"
                        tooltipPosition="top"
                        (click)="onEditClick($event, inc)"
                      >
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button
                        class="action-btn delete-btn"
                        pTooltip="Delete Report"
                        tooltipPosition="top"
                        (click)="onDeleteClick($event, inc)"
                      >
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  }
                </div>

                <div class="card-body flex-grow-1">
                  <h4 class="unit-title" [pTooltip]="inc.audit_unit_name" tooltipPosition="top">
                    {{ inc.audit_unit_name }}
                  </h4>
                  <span class="unit-code">Code: {{ inc.audit_unit_code || 'N/A' }}</span>
                  <p class="card-description">{{ inc.description }}</p>
                </div>

                <div class="card-footer">
                  <div class="reporter-badge">
                    <div class="reporter-avatar">
                      {{ getInitials(inc.reported_by_name) }}
                    </div>
                    <span class="reporter-name">{{ inc.reported_by_name || 'System' }}</span>
                  </div>
                  <div class="report-date">
                    <i class="pi pi-calendar-plus mr-1"></i>
                    <span>{{ formatDate(inc.reported_date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- Report/Edit Incident Dialog -->
    <p-dialog
      [header]="dialogHeader()"
      [(visible)]="displayFormDialog"
      [modal]="true"
      [style]="{ width: 'min(500px, 95vw)' }"
      [draggable]="false"
      [resizable]="false"
      appendTo="body"
    >
      <div class="p-3">
        @if (userRole() !== '3') {
          <div class="field mb-3 flex flex-column gap-2">
            <label class="font-semibold text-900"
              >Audit Unit <span class="text-red-500">*</span></label
            >
            <p-select
              [options]="unitOptions()"
              [ngModel]="formAuditUnitId()"
              (onChange)="formAuditUnitId.set($event.value)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Audit Unit..."
              styleClass="w-full"
              appendTo="body"
              [filter]="true"
              filterBy="label"
            ></p-select>
          </div>
        }

        <div class="field mb-3 flex flex-column gap-2">
          <label class="font-semibold text-900"
            >Incident Type <span class="text-red-500">*</span></label
          >
          <p-select
            [options]="incidentTypeOptions"
            [ngModel]="formIncidentType()"
            (onChange)="formIncidentType.set($event.value)"
            optionLabel="label"
            optionValue="value"
            placeholder="Select Incident Type..."
            styleClass="w-full"
            appendTo="body"
          ></p-select>
        </div>

        <div class="field mb-4 flex flex-column gap-2">
          <label class="font-semibold text-900"
            >Description <span class="text-red-500">*</span></label
          >
          <textarea
            rows="5"
            class="w-full border-round-lg p-3 surface-ground border-1 border-300"
            [value]="formDescription()"
            (input)="onDescriptionInput($event)"
            placeholder="Enter incident details..."
          ></textarea>
        </div>

        <div class="flex justify-content-end gap-2 border-top-1 border-300 pt-3">
          <button
            pButton
            type="button"
            label="Cancel"
            class="p-button-outlined p-button-secondary border-round-lg"
            (click)="displayFormDialog.set(false)"
          ></button>
          <button
            pButton
            type="button"
            [label]="formSaving() ? 'Saving...' : 'Save'"
            class="p-button-primary border-round-lg px-4"
            [disabled]="!isFormValid() || formSaving()"
            (click)="saveIncident()"
          ></button>
        </div>
      </div>
    </p-dialog>

    <!-- Incident Details Dialog -->
    <p-dialog
      header="Incident Details"
      [(visible)]="displayDetailsDialog"
      [modal]="true"
      [style]="{ width: 'min(550px, 95vw)' }"
      [draggable]="false"
      [resizable]="false"
      appendTo="body"
    >
      @if (selectedIncident(); as inc) {
        <div class="p-3">
          <div
            class="flex align-items-center justify-content-between mb-4 pb-3 border-bottom-1 border-300"
          >
            <span class="type-badge" [ngClass]="getCardClass(inc.incident_type)">
              <i [ngClass]="getIconClass(inc.incident_type)" class="mr-1"></i>
              {{ inc.incident_type }}
            </span>
            <span class="incident-id-badge font-semibold">ID: #{{ inc.id }}</span>
          </div>

          <div class="grid">
            <div class="col-12 mb-3">
              <div class="detail-label mb-1"><i class="pi pi-building mr-2"></i>Audit Unit</div>
              <div class="detail-value text-xl font-semibold text-900">
                {{ inc.audit_unit_name }}
              </div>
              <div class="detail-subvalue text-sm text-color-secondary mt-1">
                Unit Code: {{ inc.audit_unit_code || 'N/A' }}
              </div>
            </div>

            <div class="col-12 md:col-6 mb-3">
              <div class="detail-label mb-1"><i class="pi pi-user mr-2"></i>Reported By</div>
              <div class="detail-value font-medium text-900">
                {{ inc.reported_by_name || 'System' }}
              </div>
            </div>

            <div class="col-12 md:col-6 mb-3">
              <div class="detail-label mb-1"><i class="pi pi-calendar mr-2"></i>Reported Date</div>
              <div class="detail-value font-medium text-900">
                {{ formatDate(inc.reported_date) }}
              </div>
            </div>

            <div class="col-12 mb-3">
              <div class="detail-label mb-1">
                <i class="pi pi-align-left mr-2"></i>Incident Description
              </div>
              <div
                class="detail-desc-box mt-2 p-3 border-round-lg bg-light text-900 border-1 border-300"
              >
                {{ inc.description }}
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-top-1 border-300 flex justify-content-end">
            <button
              pButton
              type="button"
              label="Close"
              class="p-button-outlined p-button-secondary border-round-lg px-4"
              (click)="displayDetailsDialog.set(false)"
            ></button>
          </div>
        </div>
      }
    </p-dialog>

    <!-- Hidden Print Element for PDF Export -->
    <div style="display: none;">
      <div id="incident-print-section" class="official-report-sheet">
        <style>
          /* Self-contained overrides for the print preview window */
          #incident-print-section {
            background: #ffffff !important;
            padding: 10px !important;
            font-family:
              'Inter',
              -apple-system,
              BlinkMacSystemFont,
              'Segoe UI',
              Roboto,
              sans-serif !important;
          }
          #incident-print-section .official-report-logo {
            display: inline-block !important;
            width: 44mm !important;
            height: 12mm !important;
            background-color: #182433 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            position: relative !important;
          }
          #incident-print-section .official-report-brand-row {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            margin-bottom: 18px !important;
            padding-bottom: 2px !important;
            border-bottom: 1px solid #d9d9d9 !important;
          }
          #incident-print-section .official-report-bank {
            min-width: 220px !important;
            text-align: right !important;
          }
          #incident-print-section .official-report-meta {
            margin-bottom: 18px !important;
          }
          #incident-print-section .official-report-header p {
            margin: 0 !important;
            color: #102a43 !important;
            font-size: 12px !important;
            line-height: 1.35 !important;
          }
          #incident-print-section .official-report-table-wrap {
            overflow: visible !important;
            border: 0 !important;
          }
          #incident-print-section .official-report-table {
            min-width: 0 !important;
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px !important;
          }
          #incident-print-section .official-report-table th,
          #incident-print-section .official-report-table td {
            border: 1px solid #333 !important;
            padding: 6px 8px !important;
            vertical-align: top !important;
            text-align: left !important;
          }
          #incident-print-section .official-report-table th {
            background: #e6e6e6 !important;
            color: #000 !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
          }
          #incident-print-section .official-report-table td strong {
            font-weight: 600 !important;
          }
        </style>

        <div class="official-report-header">
          <div class="official-report-brand-row">
            <div class="official-report-logo" data-id="auditproLogo" aria-label="AuditPro">
              <img
                [src]="logoUrl()"
                alt="Logo"
                style="height: 10mm; display: block; margin: 1px auto 0"
              />
            </div>
            <div class="official-report-bank">
              <p><strong>Report Date:</strong> {{ reportRunDate() }}</p>
              <p *ngIf="config.bank_name"><strong>Bank:</strong> {{ config.bank_name }}</p>
            </div>
          </div>
          <div class="official-report-meta">
            <p><strong>Report:</strong> Incident Management Logs</p>
            <p><strong>Report Run Date:</strong> {{ reportRunDate() }}</p>
            <p><strong>Audit Unit:</strong> {{ selectedUnitName() }}</p>
          </div>
        </div>

        <div class="official-report-table-wrap">
          <table class="official-report-table">
            <thead>
              <tr>
                <th style="width: 140px;">Audit Unit</th>
                <th style="width: 80px;">Unit Code</th>
                <th style="width: 120px;">Incident Type</th>
                <th>Description</th>
                <th style="width: 120px;">Reported By</th>
                <th style="width: 90px;">Date</th>
              </tr>
            </thead>
            <tbody>
              @for (inc of filteredIncidents(); track inc.id) {
                <tr>
                  <td>
                    <strong>{{ inc.audit_unit_name }}</strong>
                  </td>
                  <td>{{ inc.audit_unit_code || 'N/A' }}</td>
                  <td>{{ formatIncidentTypeLabel(inc.incident_type) }}</td>
                  <td style="white-space: pre-line;">{{ inc.description }}</td>
                  <td>{{ inc.reported_by_name || 'System' }}</td>
                  <td>{{ formatDate(inc.reported_date) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .incidents-container {
        padding: 0.5rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
        margin-top: 1rem;
      }

      .stat-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.06);
        }

        &.total-stats {
          border-left: 4px solid #6366f1;
        }
        &.network-stats {
          border-left: 4px solid #3b82f6;
        }
        &.fighting-stats {
          border-left: 4px solid #ef4444;
        }
        &.utility-stats {
          border-left: 4px solid #f59e0b;
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.85rem;
        font-weight: 700;
        color: var(--text-900, #212529);
      }

      .stat-label {
        font-size: 0.88rem;
        color: var(--text-color-secondary, #6c757d);
        margin-top: 0.25rem;
        font-weight: 500;
      }

      .stat-icon-wrapper {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;

        .total-stats & {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }
        .network-stats & {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .fighting-stats & {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .utility-stats & {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
      }

      .controls-bar {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 12px;
        padding: 0.75rem 1.25rem;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .search-wrapper {
        position: relative;
        width: 100%;
        max-width: 320px;
      }

      .search-input {
        width: 100%;
        padding: 0.6rem 1rem 0.6rem 2.5rem;
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        background: var(--surface-card);
        color: var(--text-color);
        font-size: 0.95rem;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
      }

      .search-icon {
        position: absolute;
        left: 0.85rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-color-secondary);
        font-size: 0.95rem;
      }

      .refresh-btn {
        border-radius: 8px !important;
        width: 2.5rem !important;
        height: 2.5rem !important;
      }

      .export-btn {
        border-radius: 8px !important;
        width: 2.5rem !important;
        height: 2.5rem !important;
      }

      .incident-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 12px;
        padding: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        cursor: pointer;
        transition:
          transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.25s ease;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        &.light-issue {
          border-top: 4px solid #f59e0b;
        }
        &.network-issue {
          border-top: 4px solid #3b82f6;
        }
        &.fighting-with-staff {
          border-top: 4px solid #ef4444;
        }
        &.other {
          border-top: 4px solid #8b5cf6;
        }
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
      }

      .type-badge {
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;

        .light-issue & {
          background: rgba(245, 158, 11, 0.1);
          color: #b45309;
        }
        .network-issue & {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }
        .fighting-with-staff & {
          background: rgba(239, 68, 68, 0.1);
          color: #b91c1c;
        }
        .other & {
          background: rgba(139, 92, 246, 0.1);
          color: #6d28d9;
        }
      }

      .actions-wrapper {
        display: flex;
        gap: 0.25rem;
      }

      .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.95rem;
        color: var(--text-color-secondary);
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          color: var(--text-color);
          background: var(--surface-hover);
        }

        &.delete-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
      }

      .unit-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--text-900);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .unit-code {
        display: inline-block;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-color-secondary);
        background: var(--surface-ground);
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        margin-top: 0.3rem;
        margin-bottom: 1rem;
      }

      .card-description {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
        line-height: 1.5;
        margin: 0 0 1.5rem 0;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        height: 5.4rem;
        white-space: pre-line;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--surface-border);
        padding-top: 1rem;
        margin-top: auto;
      }

      .reporter-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
      }

      .reporter-avatar {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        background: #3b82f6;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.75rem;
        flex-shrink: 0;
      }

      .reporter-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .report-date {
        font-size: 0.82rem;
        color: var(--text-color-secondary);
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .empty-state {
        text-align: center;
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 12px;
        padding: 3rem 1.5rem;
      }

      .empty-icon {
        font-size: 3rem;
        color: var(--text-color-secondary);
        opacity: 0.5;
        margin-bottom: 1rem;
      }

      /* Skeleton Cards */
      .skeleton-card {
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid var(--surface-border);
        background: var(--surface-card);
      }

      .skeleton-badge {
        width: 80px;
        height: 20px;
        border-radius: 6px;
        background: var(--surface-200);
        animation: pulse 1.5s infinite ease-in-out;
      }

      .skeleton-actions {
        width: 50px;
        height: 20px;
        border-radius: 6px;
        background: var(--surface-200);
        animation: pulse 1.5s infinite ease-in-out;
      }

      .skeleton-text-title {
        height: 1.2rem;
        border-radius: 4px;
        background: var(--surface-200);
        animation: pulse 1.5s infinite ease-in-out;
      }

      .skeleton-text {
        height: 0.75rem;
        width: 60px;
        border-radius: 4px;
        background: var(--surface-200);
        animation: pulse 1.5s infinite ease-in-out;
      }

      .skeleton-desc {
        height: 0.85rem;
        border-radius: 4px;
        background: var(--surface-200);
        animation: pulse 1.5s infinite ease-in-out;
      }

      .skeleton-footer {
        border-top: 1px solid var(--surface-border);
        height: 1.5rem;
        background: var(--surface-card);
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }
    `,
  ],
})
export class IncidentManagementComponent implements OnInit {
  private service = inject(IncidentService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private unitsService = inject(UnitsService);
  private exportService = inject(ExportService);
  private pdfService = inject(PdfDownloadService);
  config = inject(APP_CONFIG);

  incidents = signal<Incident[]>([]);
  loading = signal(false);

  canReport = signal(false);
  isAdminOrMgmt = signal(false);
  isReviewer = signal(false);
  userRole = signal('');
  userId = 0;

  searchQuery = signal('');
  selectedUnitId = signal<number | null>(null);
  unitOptions = signal<any[]>([]);

  selectedUnitName = computed(() => {
    const id = this.selectedUnitId();
    if (id === null) return 'All Audit Units';
    const opt = this.unitOptions().find((u) => u.id === id);
    return opt ? opt.name : 'All Audit Units';
  });

  // Dialog State Signals
  displayFormDialog = signal(false);
  displayDetailsDialog = signal(false);
  dialogHeader = signal('Report Incident');

  // Form Signals
  formAuditUnitId = signal<number | null>(null);
  formIncidentType = signal<string>('');
  formDescription = signal<string>('');
  formSaving = signal(false);
  selectedIncident = signal<Incident | null>(null);

  isEdit = false;
  editId: number | null = null;

  incidentTypeOptions = [
    { label: 'Light Issue', value: 'light issue' },
    { label: 'Network Issue', value: 'network issue' },
    { label: 'Staff Issues', value: 'staff issue' },
    { label: 'Other Issues', value: 'other issue' },
  ];

  unitFilterOptions = computed(() => {
    const list = this.unitOptions();
    const opts = list.map((u) => ({
      label: u.name,
      value: u.id,
    }));
    return [{ label: 'All Audit Units', value: null }, ...opts];
  });

  filteredIncidents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filterUnitId = this.selectedUnitId();
    let list = this.incidents();

    if (filterUnitId !== null) {
      list = list.filter((inc) => Number(inc.audit_unit_id) === filterUnitId);
    }

    if (!query) return list;
    return list.filter((inc) => {
      return (
        String(inc.id).toLowerCase().includes(query) ||
        String(inc.audit_unit_name || '')
          .toLowerCase()
          .includes(query) ||
        String(inc.audit_unit_code || '')
          .toLowerCase()
          .includes(query) ||
        String(inc.incident_type || '')
          .toLowerCase()
          .includes(query) ||
        String(inc.description || '')
          .toLowerCase()
          .includes(query) ||
        String(inc.reported_by_name || '')
          .toLowerCase()
          .includes(query)
      );
    });
  });

  stats = computed(() => {
    const list = this.incidents();
    const total = list.length;
    const network = list.filter(
      (i) => String(i.incident_type).toLowerCase() === 'network issue',
    ).length;
    const fighting = list.filter(
      (i) => String(i.incident_type).toLowerCase() === 'fighting with staff',
    ).length;
    const utility = list.filter(
      (i) => String(i.incident_type).toLowerCase() === 'light issue',
    ).length;
    return { total, network, fighting, utility };
  });

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = String(user.user_type_id || '');
    this.userId = Number(user.id || 0);
    this.userRole.set(roleId);

    this.canReport.set(roleId === '2' || roleId === '3');
    this.isAdminOrMgmt.set(roleId === '1' || roleId === '5' || roleId === '9');
    this.isReviewer.set(roleId === '4');

    this.loadFilterUnits();
    this.load();
  }

  loadFilterUnits() {
    this.unitsService.getUnits().subscribe({
      next: (unitsList) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const roleId = String(user.user_type_id || '');
        const authorityStr = user.audit_unit_authority || '';

        if (roleId === '2' || roleId === '3' || roleId === '4') {
          const authIds = authorityStr
            .split(',')
            .map((id: string) => parseInt(id, 10))
            .filter((id: number) => !isNaN(id));

          this.unitOptions.set(unitsList.filter((u) => authIds.includes(u.id)));
        } else {
          this.unitOptions.set(unitsList);
        }
      },
      error: (err) => {
        console.error('Failed to load filter units', err);
      },
    });
  }

  load() {
    this.loading.set(true);
    this.service.findAll(this.userId).subscribe({
      next: (res: any) => {
        let rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        this.incidents.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load incidents', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load incidents',
        });
      },
    });
  }

  openForm(row?: any) {
    if (row && row.id) {
      this.isEdit = true;
      this.editId = row.id;
      this.dialogHeader.set('Update Incident');
      this.formAuditUnitId.set(Number(row.audit_unit_id));
      this.formIncidentType.set(row.incident_type || '');
      this.formDescription.set(row.description || '');
    } else {
      this.isEdit = false;
      this.editId = null;
      this.dialogHeader.set('Report Incident');
      this.formIncidentType.set('');
      this.formDescription.set('');

      if (this.userRole() === '3' && this.unitOptions().length > 0) {
        this.formAuditUnitId.set(this.unitOptions()[0].id);
      } else {
        this.formAuditUnitId.set(null);
      }
    }
    this.displayFormDialog.set(true);
  }

  openDetails(row: any) {
    this.selectedIncident.set(row);
    this.displayDetailsDialog.set(true);
  }

  onDescriptionInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.formDescription.set(val);
  }

  isFormValid(): boolean {
    const hasUnit = this.formAuditUnitId() !== null;
    const hasType = !!this.formIncidentType();
    const hasDesc = !!this.formDescription().trim();
    return hasUnit && hasType && hasDesc;
  }

  saveIncident() {
    if (!this.isFormValid()) return;

    this.formSaving.set(true);

    const payload = {
      audit_unit_id: this.formAuditUnitId(),
      incident_type: this.formIncidentType(),
      description: this.formDescription().trim(),
    };

    const obs =
      this.isEdit && this.editId
        ? this.service.update(this.editId, payload)
        : this.service.create(payload, this.userId);

    obs.subscribe({
      next: (res) => {
        this.formSaving.set(false);
        this.displayFormDialog.set(false);
        this.load();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Incident report ${this.isEdit ? 'updated' : 'submitted'} successfully`,
        });
      },
      error: (err) => {
        console.error('Failed to save incident', err);
        this.formSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save incident report',
        });
      },
    });
  }

  onEditClick(event: Event, row: any) {
    event.stopPropagation();
    this.openForm(row);
  }

  onDeleteClick(event: Event, row: any) {
    event.stopPropagation();
    this.confirmDelete(row);
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  confirmDelete(row: any) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this incident report?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.confirmationService.close();
        this.service.remove(row.id).subscribe({
          next: () => {
            this.load();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Incident report deleted successfully',
            });
          },
          error: (err) => {
            console.error('Failed to delete incident', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete incident report',
            });
          },
        });
      },
    });
  }

  getCardClass(type?: string): string {
    const val = String(type || '').toLowerCase();
    if (val === 'light issue') return 'light-issue';
    if (val === 'network issue') return 'network-issue';
    if (val === 'fighting with staff') return 'fighting-with-staff';
    return 'other';
  }

  getIconClass(type?: string): string {
    const val = String(type || '').toLowerCase();
    if (val === 'light issue') return 'pi pi-sun';
    if (val === 'network issue') return 'pi pi-wifi';
    if (val === 'fighting with staff') return 'pi pi-users';
    return 'pi pi-info-circle';
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(dateStr?: any): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  }

  todayDate(): string {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  reportRunDate(): string {
    return this.todayDate();
  }

  formatIncidentTypeLabel(type?: string): string {
    const val = String(type || '').toLowerCase();
    if (val === 'light issue') return 'Light Issue';
    if (val === 'network issue') return 'Network Issue';
    if (val === 'staff issue' || val === 'fighting with staff' || val === 'staff issues')
      return 'Staff Issue';
    if (val === 'other issue' || val === 'other issues') return 'Other Issue';
    return type || 'N/A';
  }

  exportExcel() {
    const columns = [
      { field: 'id', header: 'Incident ID' },
      { field: 'audit_unit_name', header: 'Audit Unit' },
      { field: 'audit_unit_code', header: 'Unit Code' },
      { field: 'incident_type', header: 'Incident Type' },
      { field: 'description', header: 'Description' },
      { field: 'reported_by_name', header: 'Reported By' },
      { field: 'reported_date', header: 'Reported Date' },
    ];

    const data = this.filteredIncidents().map((inc) => ({
      id: inc.id ? `#${inc.id}` : 'N/A',
      audit_unit_name: inc.audit_unit_name || 'N/A',
      audit_unit_code: inc.audit_unit_code || 'N/A',
      incident_type: this.formatIncidentTypeLabel(inc.incident_type),
      description: inc.description || '',
      reported_by_name: inc.reported_by_name || 'System',
      reported_date: this.formatDate(inc.reported_date),
    }));

    this.exportService.exportToExcel(data, columns, 'Incident_Reports', [
      'Incident Reports Logs',
      `Generated on: ${this.todayDate()}`,
    ]);

    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'Excel file downloaded successfully',
    });
  }

  exportPdf() {
    this.pdfService.printElement('incident-print-section');
    this.messageService.add({
      severity: 'success',
      summary: 'Export PDF',
      detail: 'Print / Download dialog opened',
    });
  }

  logoUrl(): string {
    return window.location.origin + '/assets/images/logos/auditpro-logo.png';
  }
}
