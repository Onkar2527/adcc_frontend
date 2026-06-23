import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

@Component({
  selector: 'app-incident-details',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="flex flex-column h-full p-4" style="max-height: 90vh; overflow-y: auto;">
      <div class="flex-grow-1 overflow-y-auto pr-2">
        
        <!-- Incident Header Details -->
        <div class="flex align-items-center justify-content-between mb-4 border-bottom-1 border-gray-200 pb-3">
          <span class="type-badge" [ngClass]="getCardClass(incident.incident_type)">
            <i [ngClass]="getIconClass(incident.incident_type)" class="mr-1"></i>
            {{ incident.incident_type }}
          </span>
          <span class="incident-id-badge">ID: #{{ incident.id }}</span>
        </div>

        <div class="grid">
          <!-- Audit Unit -->
          <div class="col-12 mb-3">
            <div class="detail-label"><i class="pi pi-building mr-2"></i>Audit Unit</div>
            <div class="detail-value text-xl font-semibold mt-1">
              {{ incident.audit_unit_name }}
            </div>
            <div class="detail-subvalue text-sm text-color-secondary mt-1">
              Unit Code: {{ incident.audit_unit_code || 'N/A' }}
            </div>
          </div>

          <!-- Reporter & Date Grid -->
          <div class="col-12 md:col-6 mb-3">
            <div class="detail-label"><i class="pi pi-user mr-2"></i>Reported By</div>
            <div class="detail-value font-medium mt-1">
              {{ incident.reported_by_name || 'System' }}
            </div>
          </div>

          <div class="col-12 md:col-6 mb-3">
            <div class="detail-label"><i class="pi pi-calendar mr-2"></i>Reported Date</div>
            <div class="detail-value font-medium mt-1">
              {{ formatDate(incident.reported_date) }}
            </div>
          </div>

          <!-- Description -->
          <div class="col-12 mb-3">
            <div class="detail-label"><i class="pi pi-align-left mr-2"></i>Incident Description</div>
            <div class="detail-desc-box mt-2 p-3 border-round-lg">
              {{ incident.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer action -->
      <div class="mt-4 pt-4 border-top-1 border-gray-200 flex justify-content-end">
        <button
          pButton
          type="button"
          label="Close Details"
          class="p-button-outlined p-button-secondary border-round-lg px-4"
          (click)="close()"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .type-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-flex;
      align-items: center;
    }
    .light-issue { background: rgba(245, 158, 11, 0.1); color: #b45309; }
    .network-issue { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
    .fighting-with-staff { background: rgba(239, 68, 68, 0.1); color: #b91c1c; }
    .other { background: rgba(139, 92, 246, 0.1); color: #6d28d9; }

    .incident-id-badge {
      font-weight: 600;
      color: var(--text-color-secondary);
      font-size: 0.9rem;
      background: var(--surface-ground);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .detail-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
    }

    .detail-value {
      color: var(--text-900);
    }

    .detail-desc-box {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-900);
      white-space: pre-wrap;
      min-height: 120px;
    }
  `]
})
export class IncidentDetailsComponent {
  private ref = inject(FormDrawerRef);
  incident: any;

  constructor() {
    this.incident = this.ref.data || {};
  }

  close() {
    this.ref.close();
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
}
