import { Routes } from '@angular/router';
import { BranchMasterComponent } from './branch-master/branch-master.component';
import { RoleMasterComponent } from './role-master/role-master.component';
import { UserMasterComponent } from './user-master/user-master.component';
import { LoanMasterComponent } from './loan-master/loan-master.component';

export const ADMIN_ROUTES: Routes = [
    { path: 'branch-master', component: BranchMasterComponent },
    { path: 'role-master', component: RoleMasterComponent },
    { path: 'user-master', component: UserMasterComponent },
    { path: 'loan-type-master', component: LoanMasterComponent },
];
