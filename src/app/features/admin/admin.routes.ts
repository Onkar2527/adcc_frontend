import { Routes } from '@angular/router';
import { BranchMasterComponent } from './branch-master/branch-master.component';
import { RoleMasterComponent } from './role-master/role-master.component';
import { UserMasterComponent } from './user-master/user-master.component';
import { LoanMasterComponent } from './loan-master/loan-master.component';
import { AuditSectionMasterComponent } from './audit-section-master/audit-section-master.component';
import { EmployeeMasterComponent } from './employee-master/employee-master.component';
import { AuditUnitMasterComponent } from './audit-unit-master/audit-unit-master.component';
import { PasswordPolicyMasterComponent } from './password-policy-master/password-policy-master.component';
import { AuditTargetMasterComponent } from './audit-unit-master/audit-target-master.component';
import { AuditSchemeMasterComponent } from './audit-scheme-master/audit-scheme-master.component';

export const ADMIN_ROUTES: Routes = [
    { path: 'branch-master', component: BranchMasterComponent },
    { path: 'role-master', component: RoleMasterComponent },
    { path: 'user-master', component: UserMasterComponent },
    { path: 'loan-type-master', component: LoanMasterComponent },
    { path: 'audit-section-master', component: AuditSectionMasterComponent },
    { path: 'employee-master', component: EmployeeMasterComponent },
    { path: 'audit-unit-master', component: AuditUnitMasterComponent },
    { path: 'password-policy-master', component: PasswordPolicyMasterComponent },
    { path: 'audit-unit-target-master/:auditUnitId', component: AuditTargetMasterComponent },
    { path: 'audit-scheme-master', component: AuditSchemeMasterComponent },
];
