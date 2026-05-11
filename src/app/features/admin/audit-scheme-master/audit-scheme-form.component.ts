import {
    Component,
    effect,
    inject,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
    CheckboxFieldComponent,
    FormActionsComponent,
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

import {
    CreateSchemeDto,
    AuditSchemeMasterService,
} from '../services/masters.service';

@Component({
    selector: 'app-scheme-form',
    standalone: true,

    imports: [
        CommonModule,

        TextFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent,
    ],

    template: `
    <div class="flex flex-column gap-3 p-1">

      <app-select-field
        label="Scheme Type"
        [field]="schemeTypeId"
        [options]="schemeTypes"
        optionLabel="label"
        optionValue="value"
        [required]="true"
        scrollHeight="90px"
      ></app-select-field>

      <app-select-field
        label="Category"
        [field]="categoryId"
        [options]="categories()"
        optionLabel="label"
        optionValue="value"
        [required]="true"
      ></app-select-field>

      <app-text-field
        label="Scheme Code"
        [field]="schemeCode"
        placeholder="Enter scheme code"
        [required]="true"
      ></app-text-field>

      <app-text-field
        label="Scheme Name"
        [field]="name"
        placeholder="Enter scheme name"
        [required]="true"
      ></app-text-field>

      <app-checkbox-field
        label="Is Active"
        [field]="isActive"
      ></app-checkbox-field>

    </div>

    <app-form-actions
      class="mt-4"
      [loading]="saving()"
      (save)="save()"
      (cancel)="cancel()"
    ></app-form-actions>
  `,
})
export class AuditSchemeFormComponent {
    private ref = inject(FormDrawerRef);

    private schemeService = inject(
        AuditSchemeMasterService,
    );

    private messageService =
        inject(MessageService);

    schemeTypeId = signal<number | null>(1);

    categoryId = signal<number | null>(null);

    schemeCode = signal('');

    name = signal('');

    isActive = signal(true);

    saving = signal(false);

    categories = signal<
        { label: string; value: number }[]
    >([]);

    schemeTypes = [
        {
            label: 'Deposit',
            value: 1,
        },

        {
            label: 'Advances',
            value: 2,
        },
    ];

    constructor() {
        const data = this.ref.data;

        if (data) {
            this.schemeTypeId.set(
                data.scheme_type_id ?? null,
            );

            this.categoryId.set(
                data.category_id ?? null,
            );

            this.schemeCode.set(
                data.scheme_code ?? '',
            );

            this.name.set(data.name ?? '');

            this.isActive.set(
                Number(data.is_active) !== 0,
            );
        }

        effect(() => {
            const schemeTypeId =
                this.schemeTypeId();

            if (schemeTypeId) {
                this.loadCategories(
                    schemeTypeId,
                );
            }
        });
    }

    private loadCategories(
        schemeTypeId: number,
    ) {
        this.schemeService
            .getCategories(schemeTypeId)
            .subscribe({
                next: (res: any) => {
                    const rows = Array.isArray(res)
                        ? res
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res?.rows)
                                ? res.rows
                                : [];

                    this.categories.set(
                        rows.map((item: any) => ({
                            label:
                                item.name ??
                                item.category_name ??
                                '-',

                            value: Number(item.id),
                        })),
                    );
                },

                error: () => {
                    this.categories.set([]);

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail:
                            'Unable to load categories',
                    });
                },
            });
    }

    save() {
        const scheme_type_id =
            Number(this.schemeTypeId());

        const category_id = Number(
            this.categoryId(),
        );

        const scheme_code =
            this.schemeCode()
                .trim()
                .toUpperCase();

        const name = this.name().trim();

        const is_active = this.isActive()
            ? 1
            : 0;

        if (
            !scheme_type_id ||
            !category_id ||
            !scheme_code ||
            !name
        ) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail:
                    'Please fill required fields',
            });

            return;
        }

        const payload: CreateSchemeDto = {
            scheme_type_id,

            category_id,

            scheme_code,

            name,

            is_active,
        };

        this.saving.set(true);

        const obs = this.ref.data?.id
            ? this.schemeService.update(
                this.ref.data.id,
                payload,
            )
            : this.schemeService.create(
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