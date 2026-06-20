import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Dashboard } from '../dashboard/dashboard';

@Component({
    selector: 'app-admin-dashboard-placeholder',
    standalone: true,
    imports: [
        CommonModule,
        Dashboard
    ],
    template: `
        <pos-dashboard></pos-dashboard>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }
    `],
})
export class AdminDashboardPlaceholderComponent { }
