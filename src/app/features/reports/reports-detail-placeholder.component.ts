import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-reports-detail-placeholder',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="reports-detail-container card">
      <div class="reports-header flex align-items-center justify-content-between">
        <div class="header-left">
          <h1 class="page-title">{{ reportName() }}</h1>
        </div>
        <div class="header-right">
          <button
            pButton
            pRipple
            icon="pi pi-chevron-left"
            class="p-button-rounded p-button-outlined p-button-secondary back-btn"
            (click)="goBack()"
            title="Back to Reports"
          ></button>
        </div>
      </div>

      <div class="placeholder-content flex flex-column align-items-center justify-content-center py-8">
        <div class="illustration-box mb-4">
          <i class="pi pi-cog spin-animation text-primary" style="font-size: 5rem; color: var(--primary-color);"></i>
        </div>
        <h2 class="text-2xl font-bold mb-2">Working on it...</h2>
        <p class="text-color-secondary text-center mb-5 max-w-20rem">
          This report view is currently under development. We are building the visualization and data fetching for this page.
        </p>
        <button
          pButton
          pRipple
          label="Back to Reports"
          icon="pi pi-arrow-left"
          class="p-button-primary"
          (click)="goBack()"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    .reports-detail-container {
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e9ecef);
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      min-height: calc(100vh - 5.5rem);
      display: flex;
      flex-direction: column;
      

      .reports-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--surface-border, #e9ecef);
        padding: 0 1.5rem 1rem 1.5rem;
        margin-bottom: 0.5rem;

        .header-left {
          .breadcrumbs {
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--text-color-secondary, #8e95a5);
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
            text-transform: uppercase;
          }

          .page-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-color, #1a202c);
            margin: 0;
          }
        }

        .header-right {
          .back-btn {
            transition: transform 0.2s ease-in-out !important;

            &:hover {
              transform: translateX(-2px) !important;
            }
          }
        }
      }

      .placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1.5rem;

        .illustration-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 50%;
          margin-bottom: 1.5rem;
        }

        .spin-animation {
          animation: fa-spin 4s linear infinite;
        }

        @keyframes fa-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        h2 {
          color: var(--text-color, #1e293b);
        }

        p {
          color: var(--text-color-secondary, #64748b);
          max-width: 350px;
          line-height: 1.5;
        }
      }
    }
  `]
})
export class ReportsDetailPlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  reportName = signal<string>('Report Detail');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['name']) {
        this.reportName.set(params['name']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/reports']);
  }
}
