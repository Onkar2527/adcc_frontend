import { Routes } from '@angular/router';
import { AuditDashboardComponent } from './audit-dashboard/audit-dashboard.component';
import { AssessmentWorkspaceComponent } from './internal-audit/assessment-workspace/assessment-workspace.component';
import { AuditUnitDashboardComponent } from './internal-audit/audit-unit-dashboard/audit-unit-dashboard.component';
import { CategoryAssessmentComponent } from './internal-audit/category-assessment/category-assessment.component';
import { StartAssessmentComponent } from './internal-audit/start-assessment/start-assessment.component';
import { ExecutiveSummaryComponent } from './internal-audit/executive-summary/executive-summary.component';
import { ReviewerWorkspaceComponent } from './reviewer-workspace/reviewer-workspace.component';
import { ComplianceWorkspaceComponent } from './compliance-workspace/compliance-workspace.component';

export const AUDITOR_ROUTES: Routes = [
    { path: 'audit-dashboard', component: AuditDashboardComponent },
    { path: 'reviewer', component: ReviewerWorkspaceComponent },
    { path: 'compliance', component: ComplianceWorkspaceComponent },
    { path: 'internal-audit/unit/:auditUnitId/start/:yearId', component: StartAssessmentComponent },
    { path: 'internal-audit/unit/:auditUnitId', component: AuditUnitDashboardComponent },
    { path: 'internal-audit/:assessmentId/category/:categoryId', component: CategoryAssessmentComponent },
    { path: 'internal-audit/:assessmentId', component: AssessmentWorkspaceComponent },
    {path:'internal-audit/executive-summary/:assessmentId', component: ExecutiveSummaryComponent },

];
