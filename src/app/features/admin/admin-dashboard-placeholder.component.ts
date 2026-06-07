import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-admin-dashboard-placeholder',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
    ],
    template: `
        <section class="admin-dashboard">
            <header class="admin-dashboard__header">
                <div>
                    <span>Administration</span>
                    <h1>Admin Dashboard</h1>
                    <p>
                        The detailed admin dashboard is under development. Use the side menu to
                        manage masters, assessment setup, risk configuration, and account dump data.
                    </p>
                </div>
            </header>

            <div class="admin-dashboard__grid">
                <a class="admin-dashboard__card" routerLink="/admin/audit-unit-master">
                    <i class="pi pi-building"></i>
                    <strong>Audit Units</strong>
                    <small>Maintain branches, departments, targets, and frequencies.</small>
                </a>

                <a class="admin-dashboard__card" routerLink="/admin/periodwise-questions-master">
                    <i class="pi pi-list-check"></i>
                    <strong>Periodwise Questions</strong>
                    <small>Map questions, menus, categories, schemes, and periods.</small>
                </a>

                <a class="admin-dashboard__card" routerLink="/admin/manage-assessment-master">
                    <i class="pi pi-calendar-clock"></i>
                    <strong>Assessment Setup</strong>
                    <small>Create and manage audit assessment periods.</small>
                </a>

                <a class="admin-dashboard__card" routerLink="/admin/deposit-accounts">
                    <i class="pi pi-wallet"></i>
                    <strong>Account Dumps</strong>
                    <small>Upload and validate deposit or advance account data.</small>
                </a>
            </div>
        </section>
    `,
    styles: [`
        .admin-dashboard {
            display: grid;
            gap: 1rem;
        }

        .admin-dashboard__header,
        .admin-dashboard__card,
        .admin-dashboard__footer {
            border: 1px solid var(--surface-border);
            border-radius: .45rem;
            background: var(--surface-card);
        }

        .admin-dashboard__header {
            padding: 1.1rem 1.25rem;
            border-left: .25rem solid var(--primary-color);
        }

        .admin-dashboard__header span {
            color: var(--primary-color);
            font-size: .72rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .admin-dashboard__header h1 {
            margin: .25rem 0;
            color: var(--text-color);
            font-size: 1.35rem;
        }

        .admin-dashboard__header p {
            max-width: 56rem;
            margin: 0;
            color: var(--text-color-secondary);
            line-height: 1.45;
        }

        .admin-dashboard__grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
            gap: .85rem;
        }

        .admin-dashboard__card {
            display: grid;
            gap: .35rem;
            padding: 1rem;
            color: inherit;
            text-decoration: none;
            transition: border-color .15s ease, transform .15s ease;
        }

        .admin-dashboard__card:hover {
            border-color: var(--primary-color);
            transform: translateY(-1px);
        }

        .admin-dashboard__card i {
            color: var(--primary-color);
            font-size: 1.35rem;
        }

        .admin-dashboard__card strong {
            color: var(--text-color);
            font-size: .98rem;
        }

        .admin-dashboard__card small,
        .admin-dashboard__footer {
            color: var(--text-color-secondary);
            line-height: 1.4;
        }

        .admin-dashboard__footer {
            display: flex;
            align-items: center;
            gap: .5rem;
            padding: .85rem 1rem;
            font-size: .88rem;
        }
    `],
})
export class AdminDashboardPlaceholderComponent { }
