import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AuditCalendarService } from '../services/masters.service';

export interface CalendarEvent {
  type: string;
  label: string;
  unitName: string;
  frequency: string;
  class: string;
  periodFrom?: string;
  periodTo?: string;
}

export interface CalendarDay {
  dayNumber: number | null;
  dateStr: string;
  formattedDate?: string;
  statusClass: string;
  statusLabel?: string;
  isSunday: boolean;
  events: CalendarEvent[];
  hasEvents: boolean;
}

@Component({
  selector: 'app-audit-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    ButtonModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="grid p-fluid">
      <!-- Main Panel Header -->
      <div class="col-12">
        <div class="card shadow-2 p-4 apcard mb-4">
          <div class="flex align-items-center justify-content-between">
            <h5 class="m-0 text-2xl font-bold text-gray-900 flex align-items-center">
              <i class="pi pi-calendar-plus text-primary text-3xl mr-2"></i>
              Audit Calendar & Scheduling Dashboard
            </h5>
          </div>
        </div>
      </div>

      <!-- Modern Tabs Navigation Bar -->
      <div class="col-12 mb-3">
        <div class="card shadow-2 p-2 apcard flex gap-2" style="flex-direction: row;">
          <button
            type="button"
            class="tab-btn p-3 font-semibold text-base border-round cursor-pointer flex align-items-center gap-2"
            [class.active-tab]="activeTab() === 'calendar'"
            (click)="activeTab.set('calendar')"
          >
            <i class="pi pi-calendar text-lg"></i>
            Monthly Audit Calendar
          </button>
          <button
            type="button"
            class="tab-btn p-3 font-semibold text-base border-round cursor-pointer flex align-items-center gap-2"
            [class.active-tab]="activeTab() === 'overrides'"
            (click)="activeTab.set('overrides')"
          >
            <i class="pi pi-sliders-h text-lg"></i>
            Audit Units & Frequency Overrides
          </button>
        </div>
      </div>

      <!-- Filters Block -->
      <div class="col-12" *ngIf="activeTab() === 'calendar'">
        <div class="card shadow-2 p-4 apcard mb-4">
          <div class="flex flex-wrap gap-3 align-items-end">
            <div class="flex-1 min-width-200">
              <label class="block font-medium text-sm mb-2 text-gray-700">Calendar Month</label>
              <select
                [(ngModel)]="selectedMonthVal"
                (ngModelChange)="onMonthChange($event)"
                class="w-full p-2 border-1 border-round surface-border text-base bg-white"
                style="height: 42px;"
              >
                <option value="">Jump to scheduled month</option>
                <option *ngFor="let m of scheduledMonths()" [value]="m">
                  {{ formatMonthLabel(m) }}
                </option>
              </select>
            </div>

            <div class="flex-1 min-width-200">
              <label class="block font-medium text-sm mb-2 text-gray-700">Final Risk</label>
              <select
                [(ngModel)]="selectedRiskVal"
                (ngModelChange)="onRiskChange($event)"
                class="w-full p-2 border-1 border-round surface-border text-base bg-white"
                style="height: 42px;"
              >
                <option value="">ALL RISKS</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div class="flex gap-2">
              <button
                pButton
                type="button"
                label="Reset"
                icon="pi pi-refresh"
                class="p-button-outlined p-button-secondary"
                style="height: 42px;"
                (click)="resetFilters()"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Matrix Panel -->
      <div class="col-12" *ngIf="activeTab() === 'overrides'">
        <div class="card shadow-2 p-4 apcard mb-4">
          <div class="flex align-items-center justify-content-between mb-3">
            <h6 class="text-lg font-semibold text-gray-800 m-0 flex align-items-center">
              <i class="pi pi-info-circle text-info mr-2"></i>
              Risk Classification Matrix
            </h6>
            <button
              pButton
              type="button"
              label="Configure Frequencies"
              icon="pi pi-cog"
              class="p-button-outlined p-button-sm text-sm"
              style="width: auto; height: 32px;"
              routerLink="/admin/audit-frequency-master"
            ></button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-center risk-matrix-table border-round">
              <thead>
                <tr>
                  <th class="p-3 text-left">Final Risk Classification</th>
                  <th class="p-3 text-center">Calculated Average Score Range</th>
                  <th class="p-3 text-right">Standard Audit Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-top-1 surface-border">
                  <td class="p-3 text-left font-semibold text-red-600">HIGH RISK</td>
                  <td class="p-3 text-center text-gray-600">&ge; 2.5</td>
                  <td class="p-3 text-right text-gray-800 font-medium">
                    {{ riskFrequencies()[1] || 6 }} Months
                  </td>
                </tr>
                <tr class="border-top-1 surface-border">
                  <td class="p-3 text-left font-semibold text-orange-500">MEDIUM RISK</td>
                  <td class="p-3 text-center text-gray-600">&ge; 1.5 and &lt; 2.5</td>
                  <td class="p-3 text-right text-gray-800 font-medium">
                    {{ riskFrequencies()[2] || 12 }} Months
                  </td>
                </tr>
                <tr class="border-top-1 surface-border border-bottom-1">
                  <td class="p-3 text-left font-semibold text-green-600">LOW RISK</td>
                  <td class="p-3 text-center text-gray-600">&lt; 1.5</td>
                  <td class="p-3 text-right text-gray-800 font-medium">
                    {{ riskFrequencies()[3] || 18 }} Months
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Audit Units Frequency Overrides Grid -->
      <div class="col-12" *ngIf="activeTab() === 'overrides'">
        <div class="card shadow-2 p-4 apcard mb-4">
          <div class="flex align-items-center justify-content-between mb-3">
            <h6 class="text-lg font-semibold text-gray-800 m-0">
              Audit Units & Frequency Overrides
            </h6>
            <button
              pButton
              type="button"
              label="Set for All Audit Units"
              icon="pi pi-check-circle"
              class="p-button-success w-auto px-4"
              [disabled]="!hasChanges()"
              (click)="saveFrequencies()"
            ></button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full v-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th class="text-left">Audit Unit</th>
                  <th>Total Assessments</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Risk Avg</th>
                  <th>Final Risk</th>
                  <th>Recommended Frequency</th>
                  <th>Set Audit Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let row of filteredSchedules(); let idx = index"
                  class="hover:surface-50 border-bottom-1 surface-border"
                >
                  <td class="text-center p-3 font-semibold text-gray-500">{{ idx + 1 }}</td>
                  <td class="p-3 text-left font-semibold text-gray-800">
                    {{ row.audit_unit_name | uppercase }}
                    <span class="text-xs text-gray-500 block font-normal">{{
                      row.audit_unit_code
                    }}</span>
                  </td>
                  <td class="text-center p-3">{{ row.total_assessments }}</td>
                  <td class="text-center p-3">
                    <span *ngIf="row.high_count > 0" class="badge-count bg-red-100 text-red-700">{{
                      row.high_count
                    }}</span>
                    <span *ngIf="row.high_count === 0" class="text-gray-400">-</span>
                  </td>
                  <td class="text-center p-3">
                    <span
                      *ngIf="row.medium_count > 0"
                      class="badge-count bg-orange-100 text-orange-700"
                      >{{ row.medium_count }}</span
                    >
                    <span *ngIf="row.medium_count === 0" class="text-gray-400">-</span>
                  </td>
                  <td class="text-center p-3">
                    <span
                      *ngIf="row.low_count > 0"
                      class="badge-count bg-green-100 text-green-700"
                      >{{ row.low_count }}</span
                    >
                    <span *ngIf="row.low_count === 0" class="text-gray-400">-</span>
                  </td>
                  <td class="text-center p-3 font-medium text-gray-700">{{ row.risk_average }}</td>
                  <td class="text-center p-3">
                    <span
                      class="font-bold text-xs px-2 py-1 border-round"
                      [ngClass]="{
                        'bg-red-100 text-red-700': row.final_risk === 'HIGH',
                        'bg-orange-100 text-orange-700': row.final_risk === 'MEDIUM',
                        'bg-green-100 text-green-700': row.final_risk === 'LOW',
                      }"
                      >{{ row.final_risk }}</span
                    >
                  </td>
                  <td class="text-center p-3 text-gray-700 font-medium">
                    {{
                      riskFrequencies()[row.recommended_frequency]
                        ? riskFrequencies()[row.recommended_frequency] + ' Months'
                        : 'N/A'
                    }}
                  </td>
                  <td class="text-center p-3">
                    <select
                      [(ngModel)]="row.frequency"
                      (change)="onFrequencySelect(row.audit_unit_id, row.frequency)"
                      class="frequency-select"
                    >
                      <option [ngValue]="null">-- Select --</option>
                      <option *ngFor="let freq of frequencyOptions()" [ngValue]="freq">
                        {{ freq }} Months
                      </option>
                    </select>
                  </td>
                </tr>
                <tr *ngIf="filteredSchedules().length === 0">
                  <td colspan="10" class="text-center p-5 text-gray-500 font-semibold surface-50">
                    NO AUDIT UNITS FOUND
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Monthly Interactive Calendar Grid -->
      <div class="col-12" id="auditScheduleCalendar" *ngIf="activeTab() === 'calendar'">
        <div class="card shadow-2 p-4 apcard">
          <div
            class="flex flex-column md:flex-row md:align-items-center justify-content-between mb-4 border-bottom-1 surface-border pb-3"
          >
            <h5 class="text-xl font-bold text-red-600 m-0 mb-3 md:mb-0 flex align-items-center">
              <i class="pi pi-calendar mr-2 text-2xl"></i>
              Audit Schedule Calendar: {{ calendarTitle() }}
            </h5>

            <div class="flex gap-2 justify-content-center">
              <button
                pButton
                type="button"
                label="Previous Month"
                icon="pi pi-chevron-left"
                class="p-button-sm p-button-secondary"
                (click)="navigateMonth(-1)"
              ></button>
              <button
                pButton
                type="button"
                label="Current Month"
                icon="pi pi-calendar-minus"
                class="p-button-sm p-button-outlined p-button-primary"
                (click)="goToCurrentMonth()"
              ></button>
              <button
                pButton
                type="button"
                label="Next Month"
                icon="pi pi-chevron-right"
                iconPos="right"
                class="p-button-sm p-button-primary"
                (click)="navigateMonth(1)"
              ></button>
            </div>
          </div>

          <!-- Inner Branch Selection & Jumps -->
          <div
            class="flex flex-column lg:flex-row gap-4 align-items-stretch lg:align-items-center mb-4 p-3 border-round bg-bluegray-50/50 border-1 border-bluegray-100/60 shadow-sm"
            style="backdrop-filter: blur(4px);"
          >
            <div class="flex flex-column sm:flex-row gap-3 w-full lg:w-auto">
              <div class="flex align-items-center gap-3">
                <div
                  class="flex align-items-center justify-content-center bg-primary text-white border-round"
                  style="width: 42px; height: 42px; min-width: 42px;"
                >
                  <i class="pi pi-filter text-lg"></i>
                </div>
                <div style="min-width: 250px;">
                  <label
                    class="block font-bold text-xs text-gray-600 uppercase mb-1"
                    style="letter-spacing: 0.5px;"
                    >Filter by Audit Unit / Branch</label
                  >
                  <select
                    [(ngModel)]="selectedBranchIdVal"
                    (ngModelChange)="onBranchChange($event)"
                    class="w-full p-2 border-1 border-round surface-border text-sm bg-white font-medium text-gray-800 focus:border-primary focus:shadow-none"
                    style="height: 38px;"
                  >
                    <option value="">ALL BRANCHES</option>
                    <option *ngFor="let s of schedules()" [value]="s.audit_unit_id">
                      {{ s.audit_unit_name | uppercase }} ({{ s.audit_unit_code }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Period Dropdown -->
              <div style="min-width: 280px;" *ngIf="selectedBranchIdVal">
                <label
                  class="block font-bold text-xs text-gray-600 uppercase mb-1"
                  style="letter-spacing: 0.5px;"
                  >Select Audit Period (Cycle)</label
                >
                <select
                  [ngModel]="selectedPeriod()"
                  (ngModelChange)="onPeriodChange($event)"
                  class="w-full p-2 border-1 border-round surface-border text-sm bg-white font-medium text-gray-800 focus:border-primary focus:shadow-none"
                  style="height: 38px;"
                >
                  <option *ngFor="let p of branchPeriods(); let i = index" [ngValue]="p">
                    Cycle {{ i + 1 }}: {{ formatDateLabel(p.assessment_period_from) }} to
                    {{ formatDateLabel(p.assessment_period_to) }}
                  </option>
                </select>
              </div>
            </div>

            <div
              class="flex flex-wrap gap-2 flex-1 justify-content-start lg:justify-content-end align-items-center border-top-1 lg:border-top-none border-bluegray-100 pt-3 lg:pt-0"
              *ngIf="selectedBranchIdVal"
            >
              <button
                pButton
                type="button"
                [label]="
                  'Assessment Start (' +
                  formatDateLabel(getNextDay(selectedPeriod()?.assessment_period_to)) +
                  ')'
                "
                icon="pi pi-play"
                class="p-button-outlined p-button-info p-button-sm border-round-md"
                style="height: 38px; width: auto;"
                (click)="jumpToBranchStart()"
              ></button>
              <button
                pButton
                type="button"
                [label]="'Due (' + formatDateLabel(selectedPeriod()?.audit_due_date) + ')'"
                icon="pi pi-bell"
                class="p-button-outlined p-button-warning p-button-sm border-round-md"
                style="height: 38px; width: auto;"
                (click)="jumpToBranchDue()"
              ></button>
              <button
                pButton
                type="button"
                [label]="
                  'Compliance (' + formatDateLabel(selectedPeriod()?.compliance_due_date) + ')'
                "
                icon="pi pi-check-circle"
                class="p-button-outlined p-button-success p-button-sm border-round-md"
                style="height: 38px; width: auto;"
                (click)="jumpToBranchCompliance()"
              ></button>
            </div>
          </div>

          <div class="calendar-legend">
            <span class="legend-item"><span class="dot bg-gray-300"></span> Past</span>
            <span class="legend-item"><span class="dot bg-green-500"></span> Today</span>
            <span class="legend-item"><span class="dot bg-blue-500"></span> Future</span>
            <span
              class="legend-item"
              style="background: rgba(255, 193, 7, 0.1); border-color: rgba(255, 193, 7, 0.65)"
            >
              <span class="dot bg-amber-500"></span> Data Available
            </span>
            <span class="legend-item font-semibold text-primary"
              ><i class="pi pi-info-circle text-xs"></i> Click a date to view details</span
            >
          </div>

          <div class="calendar-legend mt-2 flex justify-content-center gap-2 flex-wrap">
            <span class="event-badge event-as-start" style="display: inline-block;"
              >Assessment Start</span
            >
            <span class="event-badge event-a" style="display: inline-block;">Due: Audit Due</span>
            <span class="event-badge event-c" style="display: inline-block;"
              >Compliance: Compliance Due</span
            >
          </div>

          <div class="overflow-x-auto">
            <table class="w-full calendar-grid">
              <thead>
                <tr>
                  <th class="text-red-600 bg-red-50 text-center">Sun</th>
                  <th class="surface-100 text-center">Mon</th>
                  <th class="surface-100 text-center">Tue</th>
                  <th class="surface-100 text-center">Wed</th>
                  <th class="surface-100 text-center">Thu</th>
                  <th class="surface-100 text-center">Fri</th>
                  <th class="surface-100 text-center">Sat</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let week of calendarWeeks()">
                  <td
                    *ngFor="let day of week"
                    class="calendar-cell"
                    [ngClass]="day.statusClass"
                    [class.has-events]="day.hasEvents"
                    [style.box-shadow]="
                      day.isSunday ? 'inset 0 0 0 999px rgba(220,53,69,0.03)' : ''
                    "
                    (click)="day.dayNumber ? onCellClick(day) : null"
                  >
                    <div
                      *ngIf="day.dayNumber"
                      class="flex flex-column h-full justify-content-between"
                    >
                      <div class="calendar-date-num" [class.text-red-500]="day.isSunday">
                        {{ day.dayNumber }}
                      </div>

                      <!-- Event Tags Preview (Max 2 tags) -->
                      <div class="flex flex-column gap-1 overflow-hidden" style="max-height: 52px;">
                        <div
                          *ngFor="let ev of day.events | slice: 0 : 2"
                          class="event-badge"
                          [ngClass]="ev.class"
                          [title]="ev.unitName + ' - ' + ev.label"
                        >
                          {{
                            ev.type === 'AST'
                              ? 'Assessment Start'
                              : ev.type === 'A'
                                ? 'Due'
                                : 'Compliance'
                          }}: {{ ev.unitName }}
                        </div>
                        <span
                          *ngIf="day.events.length > 2"
                          class="text-xs text-gray-500 font-semibold pl-1"
                        >
                          +{{ day.events.length - 2 }} more
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar Details Dialog -->
    <p-dialog
      [(visible)]="showDetailsDialog"
      [header]="selectedDateDetails()?.formattedDate + ' Schedule Details'"
      [modal]="true"
      [style]="{ width: 'min(480px, 100vw)' }"
      [draggable]="false"
      [resizable]="false"
    >
      <div class="p-3" *ngIf="selectedDateDetails() as details">
        <p class="mb-3 font-medium">
          <strong>Date Status:</strong>
          <span
            class="ml-1 px-2 py-1 border-round text-xs font-bold"
            [ngClass]="{
              'bg-gray-100 text-gray-700': details.statusLabel === 'Past',
              'bg-green-100 text-green-700': details.statusLabel === 'Today',
              'bg-blue-100 text-blue-700': details.statusLabel === 'Future',
            }"
            >{{ details.statusLabel }}</span
          >
        </p>

        <div *ngIf="details.events && details.events.length > 0; else noEvents">
          <div
            *ngFor="let event of details.events"
            class="calendar-popup-event"
            [ngStyle]="{
              'border-left-color':
                event.type === 'AST' ? '#6f42c1' : event.type === 'A' ? '#ffc107' : '#198754',
            }"
          >
            <strong class="block text-gray-800 text-sm mb-1">
              {{ event.label }} ({{ event.type }})
            </strong>
            <span class="text-xs text-gray-600">
              Unit: {{ event.unitName | uppercase }}
              <span class="block text-gray-500 mt-1">Audit Frequency: {{ event.frequency }}</span>
              <span class="block text-gray-500 mt-1" *ngIf="event.periodFrom && event.periodTo">
                {{
                  event.type === 'AST'
                    ? 'Assessment Period'
                    : event.type === 'A'
                      ? 'Audit Period'
                      : 'Compliance Period'
                }}: {{ formatDateLabel(event.periodFrom) }} to {{ formatDateLabel(event.periodTo) }}
              </span>
            </span>
          </div>
        </div>

        <ng-template #noEvents>
          <div
            class="p-3 border-round bg-gray-50 border-1 surface-border text-center text-gray-500 font-medium"
          >
            No scheduled audit events for this date.
          </div>
        </ng-template>
      </div>
      <ng-template pTemplate="footer">
        <button
          pButton
          type="button"
          label="Close"
          class="p-button-outlined p-button-secondary"
          (click)="showDetailsDialog = false"
        ></button>
      </ng-template>
    </p-dialog>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [
    `
      .apcard {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(220, 224, 230, 0.6);
        border-radius: 12px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
        backdrop-filter: blur(4px);
      }
      .risk-matrix-table {
        width: 100%;
        border-collapse: collapse;
      }
      .risk-matrix-table th {
        background-color: #f8f9fa;
        color: #495057;
        font-weight: 600;
      }
      .v-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #dee2e6;
      }
      .v-table th {
        background-color: #f8f9fa;
        color: #495057;
        font-weight: 600;
        padding: 12px;
        border: 1px solid #dee2e6;
        text-align: center;
      }
      .v-table td {
        padding: 12px;
        border: 1px solid #dee2e6;
        vertical-align: middle;
      }
      .badge-count {
        display: inline-block;
        padding: 3px 8px;
        font-weight: 700;
        font-size: 0.75rem;
        border-radius: 10px;
      }
      .frequency-select {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid #ced4da;
        background-color: #fff;
        color: #495057;
        font-size: 0.875rem;
        width: 125px;
        height: 34px;
        transition: border-color 0.15s ease-in-out;
      }
      .frequency-select:focus {
        border-color: #007bff;
        outline: 0;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
      }
      .calendar-grid {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #dee2e6;
      }
      .calendar-grid th {
        padding: 12px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 0.5px;
        border: 1px solid #dee2e6;
      }
      .calendar-cell {
        height: 95px;
        width: 14.28%;
        vertical-align: top;
        padding: 8px;
        border: 1px solid #dee2e6;
        position: relative;
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .calendar-cell:hover {
        box-shadow: inset 0 0 0 2px #0d6efd;
        background-color: #f8f9fa;
      }
      .calendar-date-num {
        font-weight: 700;
        font-size: 0.95rem;
        color: #495057;
      }
      .calendar-status-past {
        background-color: rgba(108, 117, 125, 0.04);
      }
      .calendar-status-today {
        background-color: rgba(40, 167, 69, 0.04);
        box-shadow: inset 0 0 0 2px rgba(40, 167, 69, 0.65) !important;
      }
      .calendar-status-future {
        background-color: rgba(13, 110, 253, 0.02);
      }
      .has-events {
        background-color: rgba(255, 193, 7, 0.12);
      }
      .has-events::after {
        content: '';
        position: absolute;
        top: 8px;
        right: 8px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: #dc3545;
      }
      .event-badge {
        display: block;
        padding: 2px 5px;
        font-size: 0.7rem;
        font-weight: 700;
        border-radius: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
        border-left: 3px solid transparent;
      }
      .event-as-start {
        background-color: rgba(111, 66, 193, 0.1);
        color: #6f42c1;
        border-left-color: #6f42c1;
      }
      .event-as-end {
        background-color: rgba(13, 110, 253, 0.1);
        color: #0b5ed7;
        border-left-color: #0b5ed7;
      }
      .event-a {
        background-color: rgba(255, 193, 7, 0.15);
        color: #856404;
        border-left-color: #ffc107;
      }
      .event-c {
        background-color: rgba(25, 135, 84, 0.1);
        color: #0f5132;
        border-left-color: #198754;
      }
      .calendar-legend {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .legend-item {
        font-size: 0.8rem;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .calendar-popup-event {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-left: 4px solid #007bff;
        border-radius: 3px;
        background: #f8f9fa;
      }
      .min-width-200 {
        min-width: 200px;
      }
      .tab-btn {
        border: 1px solid transparent;
        background: transparent;
        color: #495057;
        transition: all 0.2s ease;
        outline: none;
      }
      .tab-btn:hover {
        background: #f8f9fa;
        color: #212529;
      }
      .tab-btn.active-tab {
        background: #3b82f6;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
      }
    `,
  ],
})
export class AuditCalendarComponent implements OnInit {
  private service = inject(AuditCalendarService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  schedules = signal<any[]>([]);
  filteredSchedules = signal<any[]>([]);
  projectedSchedules = signal<any[]>([]);
  filteredProjectedSchedules = signal<any[]>([]);
  loading = signal(false);

  // Filter properties
  selectedMonthVal = '';
  selectedRiskVal = '';
  selectedBranchIdVal = '';
  scheduledMonths = signal<string[]>([]);

  selectedPeriod = signal<any>(null);
  branchPeriods = signal<any[]>([]);

  activeTab = signal<'calendar' | 'overrides'>('calendar');

  // Calendar properties
  calendarWeeks = signal<CalendarDay[][]>([]);
  calendarTitle = signal<string>('');
  selectedMonthYear = ''; // current month in YYYY-MM

  // Dialog state
  showDetailsDialog = false;
  selectedDateDetails = signal<CalendarDay | null>(null);

  // Track overrides locally
  frequencyChanges: Record<number, number> = {};
  riskFrequencies = signal<Record<number, number>>({ 1: 6, 2: 12, 3: 18 });
  frequencyOptions = computed(() => {
    const freqs = Object.values(this.riskFrequencies());
    return Array.from(new Set(freqs)).sort((a, b) => a - b);
  });

  hasChanges(): boolean {
    return Object.keys(this.frequencyChanges).length > 0;
  }

  ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonthYear = `${year}-${month}`;
    this.load();
  }

  load() {
    this.loading.set(true);
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user ? (user.id || user.employee_id || user.emp_id) : undefined;
    const userTypeId = user ? user.user_type_id : undefined;
    const auditUnitAuthority = user ? user.audit_unit_authority : undefined;

    this.service.getSchedulingData(userId, userTypeId, auditUnitAuthority).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res?.risk_summary_data) ? res.risk_summary_data : [];
        this.schedules.set(rows);

        const projected = Array.isArray(res?.projected_schedules) ? res.projected_schedules : [];
        this.projectedSchedules.set(projected);

        if (Array.isArray(res?.risk_frequencies)) {
          const freqMap: Record<number, number> = {};
          res.risk_frequencies.forEach((f: any) => {
            freqMap[Number(f.risk_type_id)] = Number(f.frequency);
          });
          this.riskFrequencies.set(freqMap);
        }

        // Reset frequencyChanges tracker on fresh load
        this.frequencyChanges = {};

        // Determine scheduled months dynamically
        this.extractScheduledMonths(projected);

        // Filter and render
        this.filterData();

        // Initialize branch periods if a branch is selected
        const bId = Number(this.selectedBranchIdVal);
        if (bId) {
          const periods = projected.filter((p: any) => p.audit_unit_id === bId);
          this.branchPeriods.set(periods);
          if (periods.length > 0) {
            this.selectedPeriod.set(periods[0]);
          }
        } else {
          this.branchPeriods.set([]);
          this.selectedPeriod.set(null);
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load audit scheduling data',
        });
      },
    });
  }

  extractScheduledMonths(rows: any[]) {
    const monthsSet = new Set<string>();
    rows.forEach((row) => {
      [
        'assessment_period_from',
        'assessment_period_to',
        'audit_due_date',
        'compliance_due_date',
      ].forEach((dateField) => {
        const dateVal = row[dateField];
        if (dateVal && typeof dateVal === 'string' && dateVal.length >= 7) {
          monthsSet.add(dateVal.substring(0, 7)); // e.g. "2026-06"
        }
      });
    });
    const months = Array.from(monthsSet);
    months.sort();
    this.scheduledMonths.set(months);
  }

  formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  filterData() {
    let rows = this.schedules();

    // Apply Final Risk filter
    if (this.selectedRiskVal) {
      rows = rows.filter((r) => r.final_risk === this.selectedRiskVal);
    }

    this.filteredSchedules.set(rows);

    // Filter projected schedules
    let projected = this.projectedSchedules();
    if (this.selectedRiskVal) {
      projected = projected.filter((p) => p.final_risk === this.selectedRiskVal);
    }
    if (this.selectedBranchIdVal) {
      projected = projected.filter((p) => p.audit_unit_id === Number(this.selectedBranchIdVal));
    }
    this.filteredProjectedSchedules.set(projected);

    // Generate Month Grid Calendar
    this.generateCalendar();
  }

  onMonthChange(month: string) {
    if (month) {
      this.selectedMonthYear = month;
      this.generateCalendar();
    }
  }

  onRiskChange(risk: string) {
    this.filterData();
  }

  onBranchChange(branchId: string) {
    this.filterData();
    const bId = Number(branchId);
    if (bId) {
      const periods = this.projectedSchedules().filter((p) => p.audit_unit_id === bId);
      this.branchPeriods.set(periods);
      if (periods.length > 0) {
        this.selectedPeriod.set(periods[0]);
      } else {
        this.selectedPeriod.set(null);
      }
    } else {
      this.branchPeriods.set([]);
      this.selectedPeriod.set(null);
    }
  }

  onPeriodChange(period: any) {
    this.selectedPeriod.set(period);
  }

  jumpToBranchStart() {
    const period = this.selectedPeriod();
    if (period && period.assessment_period_to) {
      const nextDayStr = this.getNextDay(period.assessment_period_to);
      const yyyyMm = nextDayStr.substring(0, 7);
      this.selectedMonthYear = yyyyMm;
      this.selectedMonthVal = yyyyMm;
      this.generateCalendar();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Date Info',
        detail: 'No assessment start date found for the selected period.',
      });
    }
  }

  jumpToBranchEnd() {
    const period = this.selectedPeriod();
    if (period && period.assessment_period_to) {
      const yyyyMm = period.assessment_period_to.substring(0, 7);
      this.selectedMonthYear = yyyyMm;
      this.selectedMonthVal = yyyyMm;
      this.generateCalendar();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Date Info',
        detail: 'No assessment end date found for the selected period.',
      });
    }
  }

  jumpToBranchDue() {
    const period = this.selectedPeriod();
    if (period && period.audit_due_date) {
      const yyyyMm = period.audit_due_date.substring(0, 7);
      this.selectedMonthYear = yyyyMm;
      this.selectedMonthVal = yyyyMm;
      this.generateCalendar();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Date Info',
        detail: 'No audit due date found for the selected period.',
      });
    }
  }

  jumpToBranchCompliance() {
    const period = this.selectedPeriod();
    if (period && period.compliance_due_date) {
      const yyyyMm = period.compliance_due_date.substring(0, 7);
      this.selectedMonthYear = yyyyMm;
      this.selectedMonthVal = yyyyMm;
      this.generateCalendar();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Date Info',
        detail: 'No compliance due date found for the selected period.',
      });
    }
  }

  getSelectedBranch() {
    return this.schedules().find((s) => s.audit_unit_id === Number(this.selectedBranchIdVal));
  }

  formatDateLabel(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  getNextDay(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const date = new Date(Date.UTC(year, month, day));
      date.setUTCDate(date.getUTCDate() + 1);
      const nextYear = date.getUTCFullYear();
      const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
      const nextDay = String(date.getUTCDate()).padStart(2, '0');
      return `${nextYear}-${nextMonth}-${nextDay}`;
    }
    return dateStr;
  }

  resetFilters() {
    this.selectedRiskVal = '';
    this.selectedMonthVal = '';
    this.selectedBranchIdVal = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonthYear = `${year}-${month}`;
    this.filterData();
    this.branchPeriods.set([]);
    this.selectedPeriod.set(null);
  }

  onFrequencySelect(unitId: number, freq: number) {
    this.frequencyChanges[unitId] = Number(freq);
  }

  saveFrequencies() {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to set these audit frequencies? This will update the schedule dynamically.',
      header: 'Confirm Overrides',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.service.setFrequencies(this.frequencyChanges).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Audit frequencies updated successfully',
            });
            this.load();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message || 'Failed to update audit frequencies',
            });
          },
        });
      },
    });
  }

  generateCalendar() {
    const [year, monthStr] = this.selectedMonthYear.split('-');
    const currentYear = parseInt(year);
    const currentMonth = parseInt(monthStr) - 1; // 0-indexed Month

    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Format calendar title (e.g. "Jun, 2026")
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    this.calendarTitle.set(`${monthNames[currentMonth]}, ${currentYear}`);

    const cells = [];

    // Blank cells before first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({
        dayNumber: null,
        dateStr: '',
        statusClass: '',
        events: [],
        hasEvents: false,
        isSunday: false,
      });
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSunday = currentDate.getDay() === 0;

      let statusClass = 'calendar-status-future';
      let statusLabel = 'Future';
      if (dateStr === todayStr) {
        statusClass = 'calendar-status-today';
        statusLabel = 'Today';
      } else if (dateStr < todayStr) {
        statusClass = 'calendar-status-past';
        statusLabel = 'Past';
      }

      // Calculate events for this date based on all schedules
      const events: any[] = [];
      this.filteredProjectedSchedules().forEach((unit) => {
        if (unit.assessment_period_from === dateStr) {
          events.push({
            type: 'AST',
            label: 'Assessment Start',
            class: 'event-as-start',
            unitName: unit.audit_unit_name,
            frequency: unit.frequency ? `${unit.frequency} Months` : 'N/A',
            periodFrom: unit.assessment_period_from,
            periodTo: unit.assessment_period_to,
          });
        }

        if (unit.audit_due_date === dateStr) {
          events.push({
            type: 'A',
            label: 'Audit Due',
            class: 'event-a',
            unitName: unit.audit_unit_name,
            frequency: unit.frequency ? `${unit.frequency} Months` : 'N/A',
            periodFrom: unit.assessment_period_to,
            periodTo: unit.audit_due_date,
          });
        }
        if (unit.compliance_due_date === dateStr) {
          events.push({
            type: 'C',
            label: 'Compliance Due',
            class: 'event-c',
            unitName: unit.audit_unit_name,
            frequency: unit.frequency ? `${unit.frequency} Months` : 'N/A',
            periodFrom: unit.audit_due_date,
            periodTo: unit.compliance_due_date,
          });
        }
      });

      cells.push({
        dayNumber: day,
        dateStr,
        formattedDate: `${day} ${monthNames[currentMonth]} ${currentYear}`,
        statusClass,
        statusLabel,
        isSunday,
        events,
        hasEvents: events.length > 0,
      });
    }

    // Pad end of calendar if not ending on Saturday
    const totalCells = cells.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        cells.push({
          dayNumber: null,
          dateStr: '',
          statusClass: '',
          events: [],
          hasEvents: false,
          isSunday: false,
        });
      }
    }

    // Chunk cells into weeks of 7 days
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    this.calendarWeeks.set(weeks);
  }

  navigateMonth(delta: number) {
    const [year, monthStr] = this.selectedMonthYear.split('-');
    let currentYear = parseInt(year);
    let currentMonth = parseInt(monthStr) - 1 + delta;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    const newMonthStr = String(currentMonth + 1).padStart(2, '0');
    this.selectedMonthYear = `${currentYear}-${newMonthStr}`;
    this.generateCalendar();
  }

  goToCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonthYear = `${year}-${month}`;
    this.generateCalendar();
  }

  onCellClick(day: CalendarDay) {
    this.selectedDateDetails.set(day);
    this.showDetailsDialog = true;
  }
}
