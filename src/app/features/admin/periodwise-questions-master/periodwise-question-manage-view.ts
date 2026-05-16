import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import { ButtonModule } from 'primeng/button';

import { CheckboxModule } from 'primeng/checkbox';

import { DividerModule } from 'primeng/divider';

import { ChipModule } from 'primeng/chip';

import { ScrollPanelModule } from 'primeng/scrollpanel';

import {
  AuditSchemeMasterService,
  PeriodwiseQuestionsMasterService
} from '../services/masters.service';

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
    ScrollPanelModule
  ],

  template: `

  <div class="p-4">

    <!-- HEADER -->

    <div
      class="border-round-xl p-4 mb-4 surface-card shadow-2"
    >

      <div
        class="flex justify-content-between align-items-start"
      >

        <div>

          <div
            class="text-3xl font-bold text-primary mb-2"
          >

            {{ data?.audit_unit_name }}

          </div>

          <div class="text-700 text-lg">

            Period:

            {{ data?.start_month_year }}

            -

            {{ data?.end_month_year }}

            ( F.Y. {{ data?.year }} )

          </div>

          <div class="text-500 mt-2">

            Created:
            {{ data?.created_at }}

          </div>

        </div>

        <p-chip
          label="ACTIVE"
          styleClass="bg-green-100 text-green-700"
        ></p-chip>

      </div>

    </div>

    <!-- ACTIVE SCHEMES -->

    <div
      class="border-round-xl p-4 surface-card shadow-1"
    >

      <div
        class="flex justify-content-between align-items-center mb-4"
      >

        <div>

          <div class="text-2xl font-semibold">
            Active Advances Schemes
          </div>

          <div class="text-500 mt-1">

            Total Schemes:
            {{ selectedSchemes().length }}

          </div>

        </div>

        <button
          pButton
          type="button"
          label="Update Schemes"
          icon="pi pi-pencil"
          class="p-button-primary"
          (click)="toggleSchemeSection()"
        ></button>

      </div>

      <!-- SELECTED SCHEMES -->

      <div class="grid">

        <div
          *ngFor="
            let item of selectedSchemes()
          "
          class="col-12 md:col-6"
        >

          <div
            class="border-1 surface-border border-round-xl p-3 h-full"
          >

            <div
              class="font-semibold text-primary text-lg line-height-3"
            >

              {{ item.name }}
              ({{ item.scheme_code }})

            </div>

            <div
              class="mt-3 px-2 py-1 inline-block border-round bg-blue-50 text-700 text-sm"
            >

              Mapped Category :

              {{ item.category_name }}

            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- UPDATE SECTION -->

    <div
      *ngIf="showUpdateSection()"
      class="border-round-xl p-4 surface-card shadow-2 mt-4 border-1 border-primary"
    >

      <!-- TOP -->

      <div
        class="flex justify-content-between align-items-center mb-4"
      >

        <div>

          <div class="text-2xl font-semibold">
            Select Schemes
          </div>

          <div class="text-500 mt-1">
            Choose schemes to map
          </div>

        </div>

        <button
          pButton
          type="button"
          label="Save Changes"
          icon="pi pi-check"
          class="p-button-success"
          (click)="updateSchemes()"
        ></button>

      </div>

      <p-divider></p-divider>

      <!-- SELECT ALL -->

      <div
        class="flex align-items-center justify-content-between mb-4"
      >

        <div class="flex align-items-center">

          <p-checkbox
            [binary]="true"
            [(ngModel)]="selectAll"
            (onChange)="toggleSelectAll()"
          ></p-checkbox>

          <label
            class="ml-3 font-semibold text-lg"
          >

            Select All Schemes

          </label>

        </div>

        <div class="text-600">

          Selected:

          {{ getSelectedCount() }}

          /

          {{ allSchemes().length }}

        </div>

      </div>

      <!-- SCROLL -->

      <p-scrollPanel
        [style]="{
          width: '100%',
          height: '450px'
        }"
      >

        <!-- GRID -->

        <div class="grid">

          <div
            *ngFor="
              let item of allSchemes()
            "
            class="col-12 md:col-6"
          >

            <div
              class="border-1 surface-border border-round-xl p-3 h-full hover:surface-100 transition-duration-200"
            >

              <div
                class="flex align-items-start"
              >

                <!-- CHECKBOX -->

                <p-checkbox
                  [binary]="true"
                  [(ngModel)]="item.checked"
                  (onChange)="updateSelectAllStatus()"
                ></p-checkbox>

                <!-- CONTENT -->

                <div class="ml-3 w-full">

                  <div
                    class="font-semibold text-primary text-lg line-height-3"
                  >

                    {{ item.name }}

                    ({{ item.scheme_code }})

                  </div>

                  <div
                    class="mt-3 px-2 py-1 inline-block border-round bg-blue-50 text-700 text-sm"
                  >

                    Mapped Category :

                    {{ item.category_name }}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </p-scrollPanel>

    </div>

  </div>

  `
})
export class PeriodwiseQuestionsMasterViewComponent
implements OnInit {
 constructor() {

        const data = this.ref.data;
        
        }
  private ref =
    inject(FormDrawerRef);

  private schemeService =
    inject(AuditSchemeMasterService);
    private periodwiseQuestionsService =
  inject(PeriodwiseQuestionsMasterService);

  data = this.ref.data;

  showUpdateSection =
    signal(false);

  allSchemes =
    signal<any[]>([]);

  selectedSchemes =
    signal<any[]>([]);

  loading =
    signal(false);

  selectAll = false;

  ngOnInit() {

    this.loadSchemes();

  }

  toggleSchemeSection() {

    this.showUpdateSection.set(
      !this.showUpdateSection()
    );

  }
loadSchemes() {

  this.loading.set(true);

  this.schemeService.findAll()
    .subscribe({

    next: (result:any) => {

      const rows =
        this.parseRows(result);

      
      const filteredRows = rows.filter(
        (x:any) =>
          (x.scheme_type_id) === '1'
      );

      const mappedIds =

        this.data?.advances_scheme_ids
          ?.split(',')
          ?.map(Number) || [];

      const schemes = filteredRows.map(
        (item:any) => ({

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
          (x:any) => x.checked
        )

      );

      this.selectAll =

        schemes.every(
          (x:any) => x.checked
        );

      this.loading.set(false);

    },

    error: () => {

      this.loading.set(false);

    }

  });

}

  parseRows(res:any): any[] {

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

  toggleSelectAll() {

    const updatedSchemes =

      this.allSchemes().map(
        (item:any) => ({

        ...item,

        checked: this.selectAll

      }));

    this.allSchemes.set(
      updatedSchemes
    );

  }

  updateSelectAllStatus() {

    this.selectAll =

      this.allSchemes().every(
        (x:any) => x.checked
      );

  }

  getSelectedCount() {

    return this.allSchemes()
      .filter((x:any) => x.checked)
      .length;

  }

 updateSchemes() {

  const selected =

    this.allSchemes().filter(
      (x:any) => x.checked
    );

  // Convert to comma separated ids
  const ids = selected
    .map((x:any) => x.id)
    .join(',');

  console.log(
    'ADVANCE IDS => ',
    ids
  );

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

        console.log(
          'Advances Schemes Updated Successfully'
        );

      },

      error: (err) => {

        console.log(
          'UPDATE ERROR => ',
          err
        );

      }

    });

}

}