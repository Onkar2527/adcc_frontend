import {
  ChangeDetectorRef,
  Component,
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

import {
  AuditCategoryMasterService,
  AuditSchemeMasterService,
  MenuMasterService,
  PeriodwiseQuestionsMasterService
} from '../services/masters.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
    ToastModule
  ],
  templateUrl: './periodwise-question-manage-view.html',

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

  ngOnInit() {

    this.loadSchemes();
    this.loadDepositSchemes();
    this.loadMenus();
    this.loadCategories();
    this.loadQuestionData(this.data.id);

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

  }

  updateCategorySelectAllStatus() {

    this.categorySelectAll =

      this.allCategories().every(
        (x: any) => x.checked
      );

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


          this.data.cat_ids =
            ids;

          this.filterQuestionsLocally();
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

          const menus =
            rows.map((item: any) => ({

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

  }

  updateMenuSelectAllStatus() {

    this.menuSelectAll =

      this.allMenus().every(
        (x: any) => x.checked
      );

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



          this.data.menu_ids =
            ids;

          this.loadCategories();
          this.filterQuestionsLocally();

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
                x.scheme_type_id === '1'
            );

          const mappedIds =
            this.data?.advances_scheme_ids
              ?.split(',')
              ?.map(Number) || [];

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

  }

  updateSelectAllStatus() {

    this.selectAll =
      this.allSchemes().every(
        (x: any) => x.checked
      );

  }

  getSelectedCount() {

    return this.allSchemes()
      .filter((x: any) => x.checked)
      .length;

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
                x.scheme_type_id === '2'
            );

          const mappedIds =
            this.data?.deposits_scheme_ids
              ?.split(',')
              ?.map(Number) || [];

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

  }

  updateDepositSelectAllStatus() {

    this.depositSelectAll =
      this.allDepositSchemes().every(
        (x: any) => x.checked
      );

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
  loadQuestionData(id:number) {

  this.periodwiseQuestionsService
    .getQuestionData(id)
    .subscribe({

      next: (result:any) => {

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

            (sum:any, row:any) =>

              sum +
              (
                row.questions?.length || 0
              ),

            0

          );

        this.onQuestionChange();

        this.cdr.detectChanges();

      },

      error: (err:any) => {

      }

    });

}

  groupQuestions(rows: any[]) {

    const grouped: any[] = [];

    rows.forEach((row: any) => {

      /* ================= MENU ================= */

      let menu = grouped.find(

        (m: any) =>

          m.menu_id ==
          row.menu_id

      );

      if (!menu) {

        menu = {

          menu_id:
            row.menu_id,

          menu_name:
            row.menu_name,

          categories: []

        };

        grouped.push(menu);

      }

      /* ================= CATEGORY ================= */

      let category =

        menu.categories.find(

          (c: any) =>

            c.category_id ==
            row.category_id

        );

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

      }

      /* ================= HEADER ================= */

      let header =

        category.headers.find(

          (h: any) =>

            h.header_id ==
            row.header_id

        );

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

                  const selectedQuestionIds =

                    this.data?.question_ids
                      ? this.data.question_ids
                        .split(',')
                        .map(
                          (x: any) =>
                            Number(
                              x.trim()
                            )
                        )
                      : [];

                  return {

                    ...q,

                    checked:

                      selectedQuestionIds.includes(
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

      }

    });



    return grouped;

  }

  onQuestionChange() {

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
}