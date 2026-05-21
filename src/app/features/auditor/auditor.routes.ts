import { Routes } from '@angular/router';
import { AuditDashboardComponent } from './audit-dashboard/audit-dashboard.component';
import { InternalAuditComponent } from './internal-audit/internal-audit.component';
export const AUDITOR_ROUTES: Routes = [
    { path: 'audit-dashboard', component: AuditDashboardComponent },
    { path: 'internal-audit/unit/:auditUnitId/start/:yearId', component: InternalAuditComponent },
    { path: 'internal-audit/unit/:auditUnitId', component: InternalAuditComponent },
    { path: 'internal-audit/:assessmentId', component: InternalAuditComponent },

];
