import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';

import { TextareaModule } from 'primeng/textarea';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
  FormActionsComponent,
  SelectFieldComponent,
  TextFieldComponent,
} from '../../../shared/components/form';

import {
  AuditAnnexureMasterService,
  CreateAnnexureColumnDto,
} from '../services/masters.service';

@Component({
  selector:
    'app-audit-annexure-column-form',

  standalone: true,

  imports: [
    CommonModule,
    ButtonModule,
    TextareaModule,
    TextFieldComponent,
    SelectFieldComponent,
    FormActionsComponent,
  ],

  template: `
  <div class="max-h-[90vh] p-4 overflow-y-auto">

    <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

      <div class="flex flex-column gap-3">

        <!-- Column Name -->

        <div>
          <app-text-field
            label="Column Name"
            [field]="name"
            placeholder="Enter column name"
            [required]="true"
          ></app-text-field>
        </div>

        <!-- Column Type -->

        <div>
          <app-select-field
            label="Column Type"
            [field]="columnTypeId"
            [options]="columnTypes"
            optionLabel="label"
            optionValue="value"
            [required]="true"
            [virtualScroll]= "false"
          ></app-select-field>
        </div>

        <!-- Dropdown Options -->

        <div *ngIf="isDropdown()">

          <div
            class="flex align-items-center justify-content-between mb-3"
          >

            <div class="font-semibold text-lg">
              Dropdown Options
            </div>

            <button
              pButton
              type="button"
              icon="pi pi-plus"
              label="Add Option"
              class="p-button-sm"
              (click)="addOption()"
            ></button>

          </div>

          <div
            *ngFor="
              let option of options();
              let i = index;
              trackBy: trackByIndex
            "
            class="mb-3"
          >

            <div class="flex gap-2 align-items-start">

              <div class="w-full">

                <label
                  class="block mb-2 text-sm font-medium text-600"
                >
                  Option {{ i + 1 }}
                </label>

                <textarea
                  pInputTextarea
                  rows="3"
                  class="w-full"
                  [value]="option"
                  (input)="updateOption(
                    i,
                    $any($event.target).value
                  )"
                  placeholder="Enter dropdown option"
                ></textarea>

              </div>

              <button
                pButton
                type="button"
                icon="pi pi-trash"
                severity="danger"
                class="p-button-text mt-4"
                (click)="removeOption(i)"
              ></button>

            </div>

          </div>

        </div>

      </div>

      <!-- Footer -->

      <div class="flex justify-content-end gap-2 pt-4 mt-4 border-top-1 border-gray-200">

        <app-form-actions
          [loading]="saving()"
          (save)="save()"
          (cancel)="cancel()"
        ></app-form-actions>

      </div>

    </div>

  </div>
`,
})
export class AuditAnnexureColumnFormComponent {

  private ref = inject(FormDrawerRef);

  private annexureService = inject(
    AuditAnnexureMasterService,
  );

  private messageService = inject(
    MessageService,
  );

  name = signal('');

  columnTypeId = signal<number | null>(
    null,
  );

  options = signal<string[]>([]);

  saving = signal(false);

  annexureId = 0;

  columnTypes = [
    {
      label: 'TextBox',
      value: 1,
    },

    {
      label: 'TextArea',
      value: 2,
    },

    {
      label: 'Dropdown',
      value: 3,
    },
  ];

  isDropdown = computed(
    () => this.columnTypeId() === 3,
  );

  constructor() {

    const data = this.ref.data;

    this.annexureId =
      data.annexureId;

    if (data?.row) {

      const row = data.row;

      this.name.set(
        row.name ?? '',
      );

      this.columnTypeId.set(
        row.column_type_id
          ? Number(
            row.column_type_id,
          )
          : null,
      );

      if (
        Array.isArray(row.options)
      ) {
        this.options.set(
          row.options.map(
            (x: any) =>
              x.option_label,
          ),
        );
      }
    }

    if (
      this.options().length === 0 &&
      this.isDropdown()
    ) {
      this.options.set(['']);
    }
  }

  addOption() {
    this.options.update(
      (v) => [...v, ''],
    );
  }

  trackByIndex(index: number) {
    return index;
  }

  removeOption(index: number) {

    this.options.update((v) =>
      v.filter(
        (_, i) => i !== index,
      ),
    );
  }

  updateOption(
    index: number,
    value: string,
  ) {
    this.options.update((v) =>
      v.map((x, i) =>
        i === index ? value : x,
      ),
    );
  }

  save() {

    const name =
      this.name().trim();

    const column_type_id =
      this.columnTypeId();

    if (
      !name ||
      !column_type_id
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail:
          'Please fill required fields',
      });

      return;
    }

    const cleanedOptions =
      this.options()
        .map((x) => x.trim())
        .filter(Boolean);

    if (
      column_type_id === 3 &&
      !cleanedOptions.length
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail:
          'Please add dropdown options',
      });

      return;
    }

    this.saving.set(true);

    const payload: CreateAnnexureColumnDto =
    {
      annexure_id:
        this.annexureId,

      name,

      column_type_id,

      options:
        column_type_id === 3
          ? cleanedOptions
          : [],
    };

    const obs =
      this.ref.data?.row
        ? this.annexureService.updateColumn(
          this.ref.data.row.id,
          payload,
        )
        : this.annexureService.createColumn(
          payload,
        );

    obs.subscribe({
      next: (res) => {

        this.saving.set(false);

        this.ref.close({
          saved: true,
          data: res,
        });
      },

      error: () => {
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.ref.close();
  }
}