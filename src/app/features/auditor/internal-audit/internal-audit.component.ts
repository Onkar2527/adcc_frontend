import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-internal-audit',
    standalone: true,
    imports: [
        RouterOutlet,
    ],
    templateUrl: './internal-audit.component.html',
    styleUrl: './internal-audit.component.css',
})
export class InternalAuditComponent {
}
