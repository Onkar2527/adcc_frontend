import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import { ButtonModule } from 'primeng/button';

import { CheckboxModule } from 'primeng/checkbox';

import { DividerModule } from 'primeng/divider';

import { ChipModule } from 'primeng/chip';

import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';

import {
  AuditCategoryMasterService,
  AuditSchemeMasterService,
  MenuMasterService,
  PeriodwiseQuestionsMasterService
} from '../services/masters.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../core/services/notification/notification.service';

@Component({
  selector: 'app-periodwise-questions-master-view',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DividerModule,
    ChipModule,
    ScrollPanelModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService, NotificationService],
  templateUrl: './periodwise-question-manage-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .periodwise-section-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .periodwise-section {
      scroll-margin-top: 5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Premium Header Card */
    .periodwise-header-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      border: none;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .periodwise-header-card .text-primary {
      color: #38bdf8 !important;
    }

    .periodwise-header-card .text-700 {
      color: #cbd5e1 !important;
    }

    .periodwise-header-card .text-500 {
      color: #94a3b8 !important;
    }

    /* Scaling down big fonts to make dialog look modern & clean */
    .periodwise-header-card .text-3xl {
      font-size: 1.5rem !important; /* 24px instead of 30px */
    }

    .periodwise-header-card .text-lg {
      font-size: 0.95rem !important; /* 15px instead of 18px */
    }

    .periodwise-section .text-2xl {
      font-size: 1.2rem !important; /* 19.2px instead of 24px */
    }

    .periodwise-card .text-lg {
      font-size: 0.95rem !important; /* 15.2px instead of 18px */
      font-weight: 600 !important;
    }

    .periodwise-header-block .font-semibold.text-lg {
      font-size: 0.95rem !important;
    }

    .periodwise-header-card .p-button-outlined.p-button-primary {
      color: #38bdf8 !important;
      border-color: rgba(56, 189, 248, 0.4) !important;
      background: transparent !important;
    }
    .periodwise-header-card .p-button-outlined.p-button-primary:hover:not([disabled]) {
      background: rgba(56, 189, 248, 0.1) !important;
      border-color: #38bdf8 !important;
    }

    .periodwise-header-card .p-button-outlined.p-button-success {
      color: #4ade80 !important;
      border-color: rgba(74, 222, 128, 0.4) !important;
      background: transparent !important;
    }
    .periodwise-header-card .p-button-outlined.p-button-success:hover:not([disabled]) {
      background: rgba(74, 222, 128, 0.1) !important;
      border-color: #4ade80 !important;
    }

    .periodwise-header-card button:disabled {
      opacity: 0.45 !important;
      color: #94a3b8 !important;
      border-color: #334155 !important;
      background: transparent !important;
      cursor: not-allowed !important;
    }

    /* Modern Schemes / Cards */
    .periodwise-card {
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e2e8f0);
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .periodwise-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      border-color: var(--primary-color, #cbd5e1);
    }

    .mapped-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 9999px;
      gap: 0.375rem;
    }

    .mapped-badge-blue {
      background-color: var(--p-primary-50, #eff6ff);
      color: var(--p-primary-700, #1d4ed8);
      border: 1px solid var(--p-primary-200, #dbeafe);
    }

    .mapped-badge-purple {
      background-color: var(--p-purple-50, #faf5ff);
      color: var(--p-purple-700, #6b21a8);
      border: 1px solid var(--p-purple-200, #f3e8ff);
    }

    :host-context(.app-dark) .mapped-badge-blue {
      background-color: rgba(37, 99, 235, 0.15) !important;
      color: #93c5fd !important;
      border: 1px solid rgba(37, 99, 235, 0.3) !important;
    }

    :host-context(.app-dark) .mapped-badge-purple {
      background-color: rgba(147, 51, 234, 0.15) !important;
      color: #d8b4fe !important;
      border: 1px solid rgba(147, 51, 234, 0.3) !important;
    }

    /* Section navigation styling */
    .periodwise-nav-btn {
      color: var(--text-color, #475569) !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      padding: 0.6rem 1rem !important;
      border-radius: 0 !important;
      border-bottom: 3px solid transparent !important;
      transition: all 0.2s;
    }

    .periodwise-nav-btn:hover {
      background: var(--surface-hover, #f1f5f9) !important;
      color: var(--text-color, #0f172a) !important;
    }

    .active-nav-btn {
      background: var(--surface-hover, #f0f7ff) !important;
      color: var(--primary-color, #2563eb) !important;
      border-bottom-color: var(--primary-color, #2563eb) !important;
    }

    /* Question rows and sections */
    .periodwise-menu-header {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-color, #1e293b);
      letter-spacing: -0.025em;
      border-bottom: 2px solid var(--surface-border, #e2e8f0);
      padding-bottom: 0.5rem;
      margin-top: 2rem;
    }

    .periodwise-cat-header {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-color-secondary, #334155);
      margin-top: 1.5rem;
    }

    .periodwise-header-block {
      background: var(--surface-hover, #f8fafc);
      border: 1px solid var(--surface-border, #e2e8f0);
      border-left: 4px solid var(--primary-color, #3b82f6);
      border-radius: 0.5rem;
      padding: 1rem 1.25rem;
      transition: all 0.2s;
    }

    .periodwise-header-block:hover {
      background: var(--surface-card, #f1f5f9);
      border-color: var(--primary-color, #cbd5e1);
    }

    .periodwise-question-row {
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e2e8f0);
      border-radius: 0.5rem;
      padding: 1rem;
      transition: all 0.15s ease;
    }

    .periodwise-question-row:hover {
      background: var(--surface-hover, #f8fafc);
      border-color: var(--primary-color, #cbd5e1);
    }

    /* Premium active chip */
    .premium-chip-active {
      background: #dcfce7 !important;
      color: #166534 !important;
      font-weight: 700 !important;
      font-size: 0.75rem !important;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.75rem !important;
      border-radius: 9999px !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .periodwise-grid-5 {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
    }
    @media (min-width: 576px) {
      .periodwise-grid-5 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 768px) {
      .periodwise-grid-5 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 992px) {
      .periodwise-grid-5 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @media (min-width: 1200px) {
      .periodwise-grid-5 {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
    }
  `],

})
export class PeriodwiseQuestionsMasterViewComponent
  implements OnInit {

  private ref =
    inject(FormDrawerRef);

  private schemeService =
    inject(AuditSchemeMasterService);

  private periodwiseQuestionsService =
    inject(PeriodwiseQuestionsMasterService);

  private menuService =
    inject(MenuMasterService);

  private categoryService =
    inject(AuditCategoryMasterService);

  private messageService =
    inject(MessageService);
  private confirmationService =
    inject(ConfirmationService);
  private cdr =
    inject(ChangeDetectorRef);
  data = this.ref.data;

  activeSection = signal('advance-schemes');

  selectSection(sectionId: string) {
    this.activeSection.set(sectionId);
  }

  getSectionIcon(id: string): string {
    switch (id) {
      case 'advance-schemes': return 'pi pi-arrow-up-right text-blue-500';
      case 'deposit-schemes': return 'pi pi-arrow-down-left text-green-500';
      case 'menus': return 'pi pi-bars text-orange-500';
      case 'categories': return 'pi pi-tags text-cyan-500';
      case 'auditor': return 'pi pi-user text-purple-500';
      case 'questions': return 'pi pi-question-circle text-red-500';
      default: return 'pi pi-circle';
    }
  }

  showUpdateSection =
    signal(false);

  showDepositSection =
    signal(false);

  allSchemes =
    signal<any[]>([]);

  allDepositSchemes =
    signal<any[]>([]);

  selectedSchemes =
    signal<any[]>([]);

  depositSchemes =
    signal<any[]>([]);

  selectAll = false;

  depositSelectAll = false;
  allMenus =
    signal<any[]>([]);

  selectedMenus =
    signal<any[]>([]);

  showMenuSection =
    signal(false);

  menuSelectAll = false;
  allCategories =
    signal<any[]>([]);

  selectedCategories =
    signal<any[]>([]);

  showCategorySection =
    signal(false);

  categorySelectAll = false;
  groupedQuestions: any[] = [];

  totalQuestions = 0;

  selectedQuestionIds: number[] = [];

  selectedHeaderIds: number[] = [];

  selectedPreviewLimit = 12;

  expandedHeaders = new Set<number>();

  eligibleAuditors = signal<any[]>([]);

  categoryAssignments = signal<any[]>([]);

  selectedAuditorId = signal<number | null>(null);

  // ── Dirty-state tracking ──────────────────────────────────────
  dirtySchemes          = signal(false);
  dirtyDepositSchemes   = signal(false);
  dirtyMenus            = signal(false);
  dirtyCategories       = signal(false);
  dirtyQuestions        = signal(false);
  dirtyAuditorAssign    = signal(false);

  /** True only AFTER the initial data load — prevents marking dirty during init */
  private _dataLoaded = false;

  dirtySectionLabels = computed(() => {
    const labels: string[] = [];
    if (this.dirtySchemes())        labels.push('Advance Schemes');
    if (this.dirtyDepositSchemes()) labels.push('Deposit Schemes');
    if (this.dirtyMenus())          labels.push('Menus');
    if (this.dirtyCategories())     labels.push('Categories');
    if (this.dirtyQuestions())      labels.push('Questions');
    if (this.dirtyAuditorAssign())  labels.push('Auditor');
    return labels;
  });

  hasUnsavedChanges = computed(() => this.dirtySectionLabels().length > 0);

  sectionLinks = [
    { id: 'advance-schemes', label: 'Advance Schemes',  dirtyFn: () => this.dirtySchemes() },
    { id: 'deposit-schemes', label: 'Deposit Schemes',  dirtyFn: () => this.dirtyDepositSchemes() },
    { id: 'menus',           label: 'Menus',            dirtyFn: () => this.dirtyMenus() },
    { id: 'categories',      label: 'Categories',       dirtyFn: () => this.dirtyCategories() },
    { id: 'auditor',         label: 'Auditor',          dirtyFn: () => this.dirtyAuditorAssign() },
    { id: 'questions',       label: 'Questions',        dirtyFn: () => this.dirtyQuestions() }
  ];

  ngOnInit() {

    this.loadSchemes();
    this.loadDepositSchemes();
    this.loadMenus();
    this.loadCategories();
    this.loadQuestionData(this.data.id);
    this.loadEligibleAuditors();
    this.loadCategoryAssignments();

    // Allow dirty tracking after all loads have been dispatched
    setTimeout(() => { this._dataLoaded = true; }, 300);

  }

  syncAllBranches() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to sync this question setup configuration (Category, Scheme, Menu, Questions, and Audit Types) to all other branch master records for this period?',
      header: 'Confirm Sync to All Branches',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.periodwiseQuestionsService.syncAllBranches(this.data.id).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sync Success',
              detail: res.message || 'Question setup synced to all branches successfully'
            });
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Sync Error',
              detail: err?.error?.message || 'Unable to sync question setup to all branches'
            });
          }
        });
      }
    });
  }

  syncAllBranchesCurrentAssessment() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to sync this question setup configuration (Category, Scheme, Menu, Questions, and Audit Types) to all branch active assessments for this period?',
      header: 'Confirm Sync to All Branches Current Assessment',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.periodwiseQuestionsService.syncAllBranchesCurrentAssessment(this.data.id).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sync Success',
              detail: res.message || 'Question setup synced to all branch current assessments successfully'
            });
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Sync Error',
              detail: err?.error?.message || 'Unable to sync question setup to branch current assessments'
            });
          }
        });
      }
    });
  }


  parseRows(res: any): any[] {

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res?.data)) {
      return res.data;
    }

    if (Array.isArray(res?.rows)) {
      return res.rows;
    }

    if (Array.isArray(res?.data?.rows)) {
      return res.data.rows;
    }

    return [];

  }

  toggleSchemeSection() {

    this.showUpdateSection.set(
      !this.showUpdateSection()
    );

  }

  toggleDepositSection() {

    this.showDepositSection.set(
      !this.showDepositSection()
    );

  }
  toggleMenuSection() {

    this.showMenuSection.set(
      !this.showMenuSection()
    );

  }
  toggleCategorySection() {

    this.showCategorySection.set(
      !this.showCategorySection()
    );

  }

  /* CATEGORIES */

  loadCategories() {

    this.categoryService.findAll()
      .subscribe({

        next: (result: any) => {

          const rows =
            this.parseRows(result);

          // SELECTED CATEGORY IDS
          const mappedIds =

            this.data?.cat_ids
              ?.split(',')
              ?.map(Number) || [];

          // SELECTED MENU IDS
          const selectedMenuIds =

            this.data?.menu_ids
              ?.split(',')
              ?.map(Number) || [];


          const filteredRows = rows.filter(
            (x: any) =>

              selectedMenuIds.includes(
                Number(x.menu_id)
              )
          );

          const categories =
            filteredRows.map(
              (item: any) => ({

                ...item,

                checked:
                  mappedIds.includes(
                    Number(item.id)
                  )

              }));

          this.allCategories.set(
            categories
          );

          this.selectedCategories.set(

            categories.filter(
              (x: any) => x.checked
            )

          );

          this.categorySelectAll =

            categories.every(
              (x: any) => x.checked
            );

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable to load categories'
          });
        }

      });

  }

  toggleCategorySelectAll() {

    const updatedCategories =

      this.allCategories().map(
        (item: any) => ({

          ...item,

          checked:
            this.categorySelectAll

        }));

    this.allCategories.set(
      updatedCategories
    );

    if (this._dataLoaded) this.dirtyCategories.set(true);

  }

  updateCategorySelectAllStatus() {

    this.categorySelectAll =

      this.allCategories().every(
        (x: any) => x.checked
      );

    if (this._dataLoaded) this.dirtyCategories.set(true);

  }

  getCategorySelectedCount() {

    return this.allCategories()
      .filter((x: any) => x.checked)
      .length;

  }

  updateCategories() {

    const selected =

      this.allCategories()
        .filter((x: any) => x.checked);

    const ids = selected
      .map((x: any) => x.id)
      .join(',');

    this.periodwiseQuestionsService
      .updateCategories(

        this.data.id,

        ids

      )
      .subscribe({

        next: () => {

          this.selectedCategories.set(
            selected
          );

          this.showCategorySection.set(
            false
          );

          this.dirtyCategories.set(false);

          this.data.cat_ids =
            ids;

          this.loadQuestionData(
            this.data.id
          );
          this.messageService.add({

            severity: 'success',

            summary: 'Success',

            detail:
              'Categories Updated Successfully'

          });

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable To Update Categories'
          });
        }

      });

  }
  /* MENUS */

  loadMenus() {

    this.menuService.getMenuMasters()
      .subscribe({

        next: (result: any) => {

          const rows =
            this.parseRows(result);

          const mappedIds =

            this.data?.menu_ids
              ?.split(',')
              ?.map(Number) || [];

          const selectedAuditTypeIds =
            (Array.isArray(this.data?.audit_type_ids)
              ? this.data.audit_type_ids
              : String(this.data?.audit_type_ids || '')
                  .replace(/[{}]/g, '')
                  .split(',')
            )
              .map((id: any) => Number(String(id).trim()))
              .filter(Boolean);

          const currentSectionTypeId = this.data?.section_type_id ? Number(this.data.section_type_id) : null;

          const menus =
            rows
              .filter((item: any) => {
                if (currentSectionTypeId && Number(item.section_type_id) !== currentSectionTypeId) {
                  return false;
                }

                const sectionAuditTypeIds =
                  String(item?.section_audit_type_ids || '')
                    .split(',')
                    .map((id) => Number(id.trim()))
                    .filter(Boolean);

                const belongsToAuditType =
                  !selectedAuditTypeIds.length
                  || !sectionAuditTypeIds.length
                  || selectedAuditTypeIds.some((auditTypeId: number) =>
                    sectionAuditTypeIds.includes(auditTypeId),
                  );

                return belongsToAuditType;
              })
              .map((item: any) => ({

              ...item,

              checked:
                mappedIds.includes(
                  Number(item.id)
                )

              }));

          this.allMenus.set(
            menus
          );

          this.selectedMenus.set(

            menus.filter(
              (x: any) => x.checked
            )

          );

        }

      });

  }

  toggleMenuSelectAll() {

    const updated =
      this.allMenus().map(
        (item: any) => ({

          ...item,

          checked:
            this.menuSelectAll

        }));

    this.allMenus.set(updated);

    if (this._dataLoaded) this.dirtyMenus.set(true);

  }

  updateMenuSelectAllStatus() {

    this.menuSelectAll =

      this.allMenus().every(
        (x: any) => x.checked
      );

    if (this._dataLoaded) this.dirtyMenus.set(true);

  }

  getMenuSelectedCount() {

    return this.allMenus()
      .filter((x: any) => x.checked)
      .length;

  }

  updateMenus() {

    const selected =
      this.allMenus()
        .filter((x: any) => x.checked);

    const ids = selected
      .map((x: any) => x.id)
      .join(',');

    this.periodwiseQuestionsService
      .updateMenus(

        this.data.id,

        ids

      )
      .subscribe({

        next: () => {

          this.selectedMenus.set(
            selected
          );

          this.showMenuSection.set(
            false
          );

          this.dirtyMenus.set(false);

          this.data.menu_ids =
            ids;

          this.loadCategories();
          this.loadQuestionData(
            this.data.id
          );

          this.messageService.add({

            severity: 'success',

            summary: 'Success',

            detail:
              'Menus Updated Successfully'

          });

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable To Update Menus'
          });
        }

      });

  }

  /* ADVANCE */

  loadSchemes() {

    this.schemeService.findAll()
      .subscribe({

        next: (result: any) => {

          const rows =
            this.parseRows(result);

          const filteredRows =
            rows.filter(
              (x: any) =>
                x.scheme_type_id === 2 || x.scheme_type_id === '2'
            );

          const mappedIds =
            this.parseSchemeIds(
              this.data?.advances_scheme_ids,
              this.data?.deposits_scheme_ids,
            );

          const schemes =
            filteredRows.map(
              (item: any) => ({

                ...item,

                checked:
                  mappedIds.includes(
                    Number(item.id)
                  )

              }));

          this.allSchemes.set(
            schemes
          );

          this.selectedSchemes.set(

            schemes.filter(
              (x: any) => x.checked
            )

          );

        }

      });

  }

  updateSchemes() {

    const selected =
      this.allSchemes()
        .filter((x: any) => x.checked);

    const ids = selected
      .map((x: any) => x.id)
      .join(',');

    this.periodwiseQuestionsService
      .updateAdvancesSchemes(

        this.data.id,

        ids

      )
      .subscribe({

        next: () => {

          this.selectedSchemes.set(
            selected
          );

          this.showUpdateSection.set(
            false
          );

          this.dirtySchemes.set(false);

          this.data.advances_scheme_ids =
            ids;

          this.messageService.add({

            severity: 'success',

            summary: 'Success',

            detail:
              'Advance Schemes Updated Successfully'

          });

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable To Update Advance Schemes'
          });
        }

      });

  }

  toggleSelectAll() {

    const updated =
      this.allSchemes().map(
        (item: any) => ({

          ...item,

          checked: this.selectAll

        }));

    this.allSchemes.set(updated);

    if (this._dataLoaded) this.dirtySchemes.set(true);

  }

  updateSelectAllStatus() {

    this.selectAll =
      this.allSchemes().every(
        (x: any) => x.checked
      );

    if (this._dataLoaded) this.dirtySchemes.set(true);

  }

  getSelectedCount() {

    return this.allSchemes()
      .filter((x: any) => x.checked)
      .length;

  }

  private parseSchemeIds(...values: any[]) {
    return Array.from(
      new Set(
        values
          .flatMap((value) =>
            String(value || '')
              .split(',')
              .map((id) => Number(id.trim()))
              .filter(Boolean),
          ),
      ),
    );
  }

  /* DEPOSIT */

  loadDepositSchemes() {

    this.schemeService.findAll()
      .subscribe({

        next: (result: any) => {

          const rows =
            this.parseRows(result);

          const filteredRows =
            rows.filter(
              (x: any) =>
                x.scheme_type_id === 1 || x.scheme_type_id === '1'
            );

          const mappedIds =
            this.parseSchemeIds(
              this.data?.deposits_scheme_ids,
              this.data?.advances_scheme_ids,
            );

          const schemes =
            filteredRows.map(
              (item: any) => ({

                ...item,

                checked:
                  mappedIds.includes(
                    Number(item.id)
                  )

              }));

          this.allDepositSchemes.set(
            schemes
          );

          this.depositSchemes.set(

            schemes.filter(
              (x: any) => x.checked
            )

          );

        }

      });

  }

  updateDepositSchemes() {

    const selected =
      this.allDepositSchemes()
        .filter((x: any) => x.checked);

    const ids = selected
      .map((x: any) => x.id)
      .join(',');

    this.periodwiseQuestionsService
      .updateDepositsSchemes(

        this.data.id,

        ids

      )
      .subscribe({

        next: () => {

          this.depositSchemes.set(
            selected
          );

          this.showDepositSection.set(
            false
          );

          this.dirtyDepositSchemes.set(false);

          this.data.deposits_scheme_ids =
            ids;


          this.messageService.add({

            severity: 'success',

            summary: 'Success',

            detail:
              'Deposit Schemes Updated Successfully'

          });

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable To Update Deposit Schemes'
          });
        }

      });

  }

  toggleDepositSelectAll() {

    const updated =
      this.allDepositSchemes().map(
        (item: any) => ({

          ...item,

          checked:
            this.depositSelectAll

        }));

    this.allDepositSchemes.set(updated);

    if (this._dataLoaded) this.dirtyDepositSchemes.set(true);

  }

  updateDepositSelectAllStatus() {

    this.depositSelectAll =
      this.allDepositSchemes().every(
        (x: any) => x.checked
      );

    if (this._dataLoaded) this.dirtyDepositSchemes.set(true);

  }

  getDepositSelectedCount() {

    return this.allDepositSchemes()
      .filter((x: any) => x.checked)
      .length;

  }

  /* QUESTIONS */

  filterQuestionsLocally() {

    const selectedCategoryIds =

      this.selectedCategories()
        .map((x: any) =>
          Number(x.id)
        );

    const filteredMenus =

      this.groupedQuestions
        .map((menu: any) => ({

          ...menu,

          categories:

            menu.categories.filter(
              (category: any) =>

                selectedCategoryIds.includes(
                  Number(
                    category.category_id
                  )
                )

            )

        }))

        .filter(
          (menu: any) =>

            menu.categories.length > 0
        );

    this.groupedQuestions =
      filteredMenus;

    this.onQuestionChange();

  }
  loadQuestionData(id: number) {

    this.periodwiseQuestionsService
      .getQuestionData(id)
      .subscribe({

        next: (result: any) => {

          const rows =

            Array.isArray(result?.rows)
              ? result.rows
              : [];

          this.groupedQuestions =

            this.groupQuestions(
              rows
            );

          this.totalQuestions =

            rows.reduce(

              (sum: any, row: any) =>

                sum +
                (
                  row.questions?.length || 0
                ),

              0

            );

          this.onQuestionChange();

          this.cdr.detectChanges();

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable to load question data'
          });
        }

      });

  }

  groupQuestions(rows: any[]) {

    const grouped: any[] = [];
    const menuMap = new Map<number, any>();
    const categoryMap = new Map<string, any>();
    const headerMap = new Map<string, any>();
    const selectedQuestionIds = new Set(
      this.data?.question_ids
        ? this.data.question_ids
          .split(',')
          .map((x: any) => Number(x.trim()))
          .filter((x: number) => Number.isFinite(x))
        : []
    );

    rows.forEach((row: any) => {

      /* ================= MENU ================= */

      const menuId = Number(row.menu_id);
      let menu = menuMap.get(menuId);

      if (!menu) {

        menu = {

          menu_id:
            row.menu_id,

          menu_name:
            row.menu_name,

          categories: []

        };

        grouped.push(menu);
        menuMap.set(menuId, menu);

      }

      /* ================= CATEGORY ================= */

      const categoryId = Number(row.category_id);
      const categoryKey = `${menuId}:${categoryId}`;
      let category = categoryMap.get(categoryKey);

      if (!category) {

        category = {

          category_id:
            row.category_id,

          category_name:
            row.category_name,

          headers: []

        };

        menu.categories.push(
          category
        );
        categoryMap.set(categoryKey, category);

      }

      /* ================= HEADER ================= */

      const headerId = Number(row.header_id);
      const headerKey = `${categoryKey}:${headerId}`;
      let header = headerMap.get(headerKey);

      if (!header) {

        header = {

          header_id:
            row.header_id,

          header_name:
            row.header_name,

          questions:

            Array.isArray(
              row.questions
            )

              ? row.questions.map(
                (q: any) => {

                  return {

                    ...q,

                    checked:

                      selectedQuestionIds.has(
                        Number(
                          q.question_id
                        )
                      )

                  };

                })

              : []

        };

        category.headers.push(
          header
        );
        headerMap.set(headerKey, header);

      }

    });



    return grouped;

  }

  toggleHeader(headerId: any) {
    const id = Number(headerId);

    if (this.expandedHeaders.has(id)) {
      this.expandedHeaders.delete(id);
    } else {
      this.expandedHeaders.add(id);
    }
  }

  isHeaderExpanded(headerId: any) {
    return this.expandedHeaders.has(Number(headerId));
  }

  getHeaderSelectedCount(header: any) {
    return Array.isArray(header?.questions)
      ? header.questions.filter((question: any) => question.checked).length
      : 0;
  }

  toggleHeaderQuestions(header: any, checked: boolean) {
    if (!Array.isArray(header?.questions)) {
      return;
    }

    header.questions.forEach((question: any) => {
      question.checked = checked;
    });

    this.onQuestionChange(true);
  }

  toggleAllQuestions(checked: boolean) {
    this.groupedQuestions.forEach((menu: any) => {
      menu.categories?.forEach((category: any) => {
        category.headers?.forEach((header: any) => {
          header.questions?.forEach((question: any) => {
            question.checked = checked;
          });
        });
      });
    });

    this.onQuestionChange(true);
  }

  scrollToSection(sectionId: string) {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackById(index: number, item: any) {
    return item?.id ?? item?.question_id ?? item?.header_id ?? item?.category_id ?? item?.menu_id ?? index;
  }

  onQuestionChange(fromUserInteraction = false) {

    const questionIds: number[] = [];

    const headerIds: number[] = [];

    this.groupedQuestions.forEach(
      (menu: any) => {

        menu.categories.forEach(
          (category: any) => {

            category.headers.forEach(
              (header: any) => {

                let hasCheckedQuestion =
                  false;

                header.questions.forEach(
                  (question: any) => {

                    if (question.checked) {

                      hasCheckedQuestion =
                        true;

                      questionIds.push(
                        Number(
                          question.question_id
                        )
                      );

                    }

                  });

                if (hasCheckedQuestion) {

                  headerIds.push(
                    Number(
                      header.header_id
                    )
                  );

                }

              });

          });

      });

    this.selectedQuestionIds =
      questionIds;

    this.selectedHeaderIds =
      headerIds;

    if (fromUserInteraction && this._dataLoaded) {
      this.dirtyQuestions.set(true);
    }

  }

  updateQuestionHeaders() {

    this.periodwiseQuestionsService
      .updateQuestionHeaders(

        this.data.id,

        this.selectedHeaderIds.join(','),

        this.selectedQuestionIds.join(',')

      )
      .subscribe({

        next: () => {

          this.dirtyQuestions.set(false);

          this.data.question_ids =

            this.selectedQuestionIds.join(',');

          this.data.header_ids =

            this.selectedHeaderIds.join(',');



          this.loadQuestionData(
            this.data.id
          );


          this.messageService.add({

            severity: 'success',

            summary: 'Success',

            detail:
              'Questions Updated Successfully'

          });

        },

        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message || 'Unable To Update Questions'
          });
        }

      });

  }

  loadEligibleAuditors() {
    this.periodwiseQuestionsService.getEligibleAuditors(this.data.id).subscribe({
      next: (res: any) => {
        this.eligibleAuditors.set(this.parseRows(res));
        this.cdr.detectChanges();
      }
    });
  }

  loadCategoryAssignments() {
    this.periodwiseQuestionsService.getCategoryAssignments(this.data.id).subscribe({
      next: (res: any) => {
        const list = this.parseRows(res);
        this.categoryAssignments.set(list);

        const uniqueAuditors = Array.from(
          new Set(
            list
              .map((item: any) => Number(item.audit_emp_id))
              .filter((id: number) => Number.isFinite(id) && id > 0),
          ),
        );

        this.selectedAuditorId.set(
          uniqueAuditors.length === 1
            ? uniqueAuditors[0]
            : (uniqueAuditors[0] || null),
        );

        this.cdr.detectChanges();
      }
    });
  }

  onAuditorChange(value: any) {
    this.selectedAuditorId.set(value ? Number(value) : null);
    if (this._dataLoaded) {
      this.dirtyAuditorAssign.set(true);
    }
  }

  saveAuditorAssignment() {
    if (!this.selectedAuditorId()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Auditor',
        detail: 'Please select one auditor for this periodwise setup'
      });
      return;
    }

    if (this.selectedCategories().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Categories',
        detail: 'Please select categories before assigning an auditor'
      });
      return;
    }

    const assignments: { category_id: number; audit_emp_id: number }[] = [];
    this.selectedCategories().forEach((category: any) => {
      assignments.push({
        category_id: Number(category.id),
        audit_emp_id: Number(this.selectedAuditorId()),
      });
    });

    this.periodwiseQuestionsService
      .updateMultipleAuditors(this.data.id, false)
      .subscribe({
        next: () => {
          this.periodwiseQuestionsService.assignCategories(this.data.id, assignments).subscribe({
            next: () => {
              this.dirtyAuditorAssign.set(false);
              this.data.is_multiple_auditors = false;
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Auditor saved successfully'
              });
              this.loadCategoryAssignments();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Unable to save auditor'
              });
            }
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to update auditor mode'
          });
        }
      });
  }

  selectedAuditorLabel() {
    const selectedId = Number(this.selectedAuditorId() || 0);
    const selected = this.eligibleAuditors().find(
      (auditor: any) => Number(auditor.id) === selectedId,
    );
    return selected
      ? `${selected.name} (${selected.emp_code})`
      : '-';
  }

  // Temporary compatibility methods/properties while the old UI stays hidden.
  isMultipleAuditors() {
    return false;
  }

  toggleMultipleAuditors() {}

  isAuditorAssigned(categoryId: number, empId: number): boolean {
    return Number(this.selectedAuditorId() || 0) === Number(empId);
  }

  toggleAuditorAssignment(categoryId: number, empId: number) {
    this.onAuditorChange(empId);
  }

  saveCategoryAssignments() {
    this.saveAuditorAssignment();
  }
}
