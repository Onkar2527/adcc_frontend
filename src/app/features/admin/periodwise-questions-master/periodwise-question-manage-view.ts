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
      z-index: 5;
    }

    .periodwise-section {
      scroll-margin-top: 4.5rem;
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

            detail:
              'Unable To Update Categories'

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

            detail:
              'Unable To Update Menus'

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

            detail:
              'Unable To Update Advance Schemes'

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

            detail:
              'Unable To Update Deposit Schemes'

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

            detail:
              'Unable To Update Questions'

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
