import { Component, ElementRef, OnInit, OnDestroy, Renderer2, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMenu } from './app.menu';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, AppMenu],
    template: ` 
    <div class="layout-sidebar" [class.no-transition]="layoutService.isSidebarResizing()" [style.width.rem]="sidebarWidth">
        <app-menu></app-menu>
        <div class="sidebar-resize-handle" 
             (mousedown)="onResizeStart($event)"
             title="Drag to resize sidebar">
        </div>
    </div>`,
    styles: [`
        .layout-sidebar {
            position: fixed;
            height: calc(100vh - 3.5rem);
            top: 3.5rem; /* Below topbar */
            left: 0;
            background-color: var(--surface-card);
            border-right: 1px solid var(--surface-border);
            z-index: 999;
            transition: width 0.3s;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .layout-sidebar.no-transition {
            transition: none !important;
        }

        .sidebar-resize-handle {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            cursor: ew-resize;
            background: transparent;
            transition: background-color 0.2s;
            z-index: 1000;
        }
        
        .sidebar-resize-handle:hover {
            background-color: var(--primary-color);
            opacity: 0.5;
        }
        
        .sidebar-resize-handle:active {
            background-color: var(--primary-color);
            opacity: 0.8;
        }
    `]
})
export class AppSidebar implements OnInit, OnDestroy {
    sidebarWidth: number = 16; // Default 16rem
    private startX = 0;
    private startWidth = 0;
    private mouseMoveListener: (() => void) | null = null;
    private mouseUpListener: (() => void) | null = null;


    constructor(
        public el: ElementRef,
        private renderer: Renderer2,
        private cdr: ChangeDetectorRef,
        private zone: NgZone,
        public layoutService: LayoutService
    ) { }

    ngOnInit() {
        // Load saved width from localStorage
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            this.sidebarWidth = parseFloat(savedWidth);
        }

        // Always update CSS variable on init for breadcrumb positioning
        document.documentElement.style.setProperty('--sidebar-width', `${this.sidebarWidth}rem`);
    }

    ngOnDestroy() {
        this.cleanup();
    }

    onResizeStart(event: MouseEvent) {
        event.preventDefault();
        this.layoutService.isSidebarResizing.set(true);
        this.startX = event.clientX;
        this.startWidth = this.sidebarWidth;

        // Add global mouse listeners
        this.mouseMoveListener = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
            if (this.layoutService.isSidebarResizing()) {
                this.zone.run(() => {
                    this.onResize(e);
                });
            }
        });

        this.mouseUpListener = this.renderer.listen('document', 'mouseup', () => {
            this.zone.run(() => {
                this.onResizeEnd();
            });
        });

        // Prevent text selection during resize
        this.renderer.addClass(document.body, 'sidebar-resizing');
    }

    private onResize(event: MouseEvent) {
        const deltaX = event.clientX - this.startX;
        const deltaRem = deltaX / 16; // Convert pixels to rem (assuming 16px = 1rem)
        let newWidth = this.startWidth + deltaRem;

        // Constrain width between 12rem and 30rem
        newWidth = Math.max(12, Math.min(30, newWidth));

        this.sidebarWidth = newWidth;

        // Update CSS variable for main content margin
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}rem`);

        // Trigger change detection for real-time update
        this.cdr.detectChanges();
    }

    private onResizeEnd() {
        this.layoutService.isSidebarResizing.set(false);
        this.renderer.removeClass(document.body, 'sidebar-resizing');

        // Save width to localStorage
        localStorage.setItem('sidebarWidth', this.sidebarWidth.toString());

        this.cleanup();
    }

    private cleanup() {
        if (this.mouseMoveListener) {
            this.mouseMoveListener();
            this.mouseMoveListener = null;
        }
        if (this.mouseUpListener) {
            this.mouseUpListener();
            this.mouseUpListener = null;
        }
    }
}
