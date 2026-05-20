import { Component, NgZone, signal, WritableSignal, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '../service/layout.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { SearchService } from '../../../core/services/search.service';
import { AutoCompleteModule, AutoCompleteSelectEvent, AutoComplete } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/services/keyboard-shortcut';

interface SearchItem {
    label: string;
    icon: string;
    route: string;
    keywords: string[];
}

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, ButtonModule, TooltipModule, ChipModule, AutoCompleteModule, SelectModule, InputGroupModule, InputGroupAddonModule, IconFieldModule, InputIconModule, FormsModule],
    template: `
<div class="layout-topbar">

    <div class="layout-topbar-left">
        <button pTooltip="Menu" tooltipPosition="bottom"
                class="layout-menu-button layout-topbar-action"
                (click)="layoutService.onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>
        <a class="layout-topbar-logo" routerLink="/">
            <!-- <img src="assets/images/logos/kredpool_logo.png" class="topbar-logo-img"> -->
            <span class="bank-name">Kredpool Solution Pvt Ltd</span>
        </a>
    </div>

    <div class="layout-topbar-actions">
        <div class="topbar-search-wrapper">
            <p-iconField iconPosition="left">
                <p-inputIcon class="pi pi-search" />
                <p-autoComplete 
                    #searchInput
                    [(ngModel)]="selectedItem" 
                    [suggestions]="suggestions" 
                    (completeMethod)="search($event)" 
                    (onSelect)="onSelect($event)"
                    (onClear)="onClear()"
                    placeholder="Search (Ctrl+K)"
                    appendTo="body"
                    [minLength]="0"
                    [completeOnFocus]="true"
                    [delay]="0"
                    [style]="{'width':'100%'}"
                    [inputStyle]="{'width':'100%'}"
                    field="label"
                    styleClass="topbar-search-autocomplete"
                    [forceSelection]="false">
                    
                    <ng-template let-item pTemplate="item">
                        <div class="search-item">
                            <i [class]="item.icon" class="item-icon"></i>
                            <div class="item-details">
                                <span class="item-label">{{ item.label }}</span>
                                <span class="item-route">{{ item.route }}</span>
                            </div>
                        </div>
                    </ng-template>
                </p-autoComplete>
            </p-iconField>
        </div>

        <p-select 
            [options]="languages" 
            [(ngModel)]="selectedLanguage" 
            optionLabel="label" 
            optionValue="value"
            appendTo="body">
            <ng-template pTemplate="selectedItem">
                <div class="flex align-items-center gap-2" *ngIf="selectedLanguage">
                    <i class="pi pi-language"></i>
                    <span>{{ selectedLanguage === 'en' ? 'English' : selectedLanguage }}</span>
                </div>
            </ng-template>
        </p-select>

        <p-button class="layout-topbar-action hide-on-small"
                  [icon]="layoutService.layoutConfig().darkTheme ? 'pi pi-moon' : 'pi pi-sun'"
                  [rounded]="true"
                  severity="secondary"
                  (click)="toggleTheme()"></p-button>

        <p-button icon="pi pi-bell" pTooltip="Notification"
                  tooltipPosition="bottom" [rounded]="true" styleClass="hide-on-small"
                  severity="secondary" (click)="logout()"></p-button>
                  
        <p-button icon="pi pi-user" pTooltip="User Profile"
                  tooltipPosition="bottom" [rounded]="true" styleClass="hide-on-small"
                  severity="secondary" (click)="logout()"></p-button>

        <div class="window-controls">
            <p-button icon="pi pi-power-off" pTooltip="Logout"
                  tooltipPosition="bottom" [rounded]="true" styleClass="hide-on-small"
                  severity="danger" (click)="logout()"></p-button>
        </div>
       


         
    </div>
</div>
`,
    styles: [`
        .topbar-search-wrapper {
            margin-right: 1.5rem;
            width: 250px;
            flex: none;
        }

        :host ::ng-deep {
            // .topbar-search-autocomplete {
            //     width: 100%;
            // }

            .topbar-search-autocomplete .p-autocomplete-input {
                // width: 100%;
                background-color: var(--surface-card) !important; 
                color: var(--text-color) !important;
                border: 1px solid var(--surface-border);
                border-radius: 8px; /* Restore radius */
                padding-left: 2.5rem !important; /* Make room for icon */
                height: 3rem; 
            }
            
            /* Remove the complex focus/border logic since IconField handles it */

            .topbar-search-autocomplete .p-autocomplete-panel {
                background: white;
                color: #333;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-top: 0.5rem;
            }
            
            .topbar-search-autocomplete .p-autocomplete-item {
                padding: 0.75rem 1rem;
                color: #333;
            }

             .topbar-search-autocomplete .p-autocomplete-item:hover {
                background: #f0f0f0;
             }
        }

        /* Search Item Styles */
        .search-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .item-icon {
            font-size: 1.1rem;
            color: var(--primary-color);
        }

        .item-details {
            display: flex;
            flex-direction: column;
        }

        .item-label {
            font-weight: 600;
            font-size: 0.9rem;
        }

        .item-route {
            font-size: 0.75rem;
            color: #777;
        }

        /* Windows-style Controls */
        .window-controls {
            display: flex;
            align-items: center;
            height: 100%;
            -webkit-app-region: no-drag;
        }
        /* ... rest of existing styles ... */
        .win-btn {
            background: transparent;
            border: none;
            color: white;
            width: 46px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
            outline: none;
        }

        .win-btn i {
            font-size: 14px;
        }

        .win-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .win-btn.win-close:hover {
            background-color: #e81123;
        }

        .win-btn:active {
            background-color: rgba(255, 255, 255, 0.15);
        }

        /* Separator */
        .controls-separator {
            display: inline-block;
            width: 1px;
            height: 2.5rem;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 8px;
            align-self: center;
        }

    `]
})
export class AppTopbar implements OnInit, OnDestroy {
    searchService = inject(SearchService);
    router = inject(Router);

    @ViewChild('searchInput') searchInput!: AutoComplete;
    private searchSubscription?: Subscription;

    // Role and Language Data
    languages = [
        { label: 'English', value: 'en' }
    ];

    selectedLanguage = 'en';

    suggestions: SearchItem[] = [];
    selectedItem: any;
    private items: SearchItem[] = [];

    constructor(public layoutService: LayoutService, private zone: NgZone) {


    }


    ngOnInit() {
        // Subscribe to search focus requests
        this.searchSubscription = this.searchService.searchFocus$.subscribe(() => {
            if (this.searchInput) {
                const input = this.searchInput.el.nativeElement.querySelector('input');
                if (input) {
                    input.focus();
                }
            }
        });


    }

    ngOnDestroy(): void {
        // Unsubscribe from search
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
    }

    // Search Methods
    search(event: any) {
        const query = event.query.toLowerCase();

        // If query is empty, show all items
        if (!query || query.trim() === '') {
            this.suggestions = [...this.items];
            return;
        }

        // Helper to check if any word in text starts with query
        const matchesRequest = (text: string) => {
            if (!text) return false;
            return text.toLowerCase().split(' ').some(word => word.startsWith(query));
        };

        const filtered = this.items.filter(item => {
            return matchesRequest(item.label) ||
                matchesRequest(item.route) ||
                item.keywords.some(k => matchesRequest(k));
        });

        this.suggestions = filtered.sort((a, b) => {
            const aLabel = a.label.toLowerCase();
            const bLabel = b.label.toLowerCase();

            // Priority 1: Exact match
            if (aLabel === query && bLabel !== query) return -1;
            if (bLabel === query && aLabel !== query) return 1;

            // Priority 2: Label Starts with
            const aStarts = aLabel.startsWith(query);
            const bStarts = bLabel.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (bStarts && !aStarts) return 1;

            // Priority 3: Alphanumeric Sort
            return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
        });
    }

    onSelect(event: AutoCompleteSelectEvent) {
        const item = event.value as SearchItem;
        this.router.navigate([item.route]);
        this.selectedItem = null; // Clear selection
    }

    onClear() {
        this.selectedItem = null;
        this.suggestions = [];
    }

    toggleTheme() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        this.router.navigate(['/login']);
    }
}
