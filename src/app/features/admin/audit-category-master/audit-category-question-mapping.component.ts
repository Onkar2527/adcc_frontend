import {
    Component,
    OnInit,
    inject,
    signal,
} from '@angular/core';

import { RouterModule } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { FormDrawerService } from '../../../core/services/drawer/form-drawer.service';

import { AuditCategoryMasterService } from '../services/masters.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FormDrawerRef } from '../../../core/services/drawer';

@Component({
    selector: 'app-category-question-mapping',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CheckboxModule,
        InputTextModule,
        ButtonModule,
        ToastModule,
    ],
    template: `
        <div class="card border-none shadow-none p-0">
        <div class="mb-3 text-sm text-600">

            Category:

            <span class="font-semibold">
                {{ categoryName() }}
            </span>

        </div>

        <div class="mb-3">

            <div class="relative">

                <i
                    class="pi pi-search absolute"
                    style="
                        left: 0.75rem;
                        top: 50%;
                        transform: translateY(-50%);
                        z-index: 1;
                    "
                ></i>

                <input
                    pInputText
                    type="text"
                    [(ngModel)]="search"
                    placeholder="Search Question Sets"
                    class="w-full pl-5"
                />

            </div>

        </div>

        <p-table
            [value]="filteredQuestionSets()"
            responsiveLayout="scroll"
            [scrollable]="true"
            scrollHeight="420px"
        >

            <ng-template pTemplate="header">

                <tr>

                    <th style="width: 80px">
                        Select
                    </th>

                    <th>
                        Question Set
                    </th>

                </tr>

            </ng-template>

            <ng-template
                pTemplate="body"
                let-row
            >

                <tr>

                    <td>

                        <p-checkbox
                            [binary]="true"
                            [ngModel]="
                                isSelected(
                                    row.value
                                )
                            "
                            (onChange)="
                                toggleSelection(
                                    row.value
                                )
                            "
                        ></p-checkbox>

                    </td>

                    <td>
                        {{ row.label }}
                    </td>

                </tr>

            </ng-template>

        </p-table>

        <div
            class="flex justify-content-end gap-2 mt-4"
        >

            <button
                pButton
                type="button"
                label="Cancel"
                class="p-button-text"
                (click)="close()"
            ></button>

            <button
                pButton
                type="button"
                label="Save Mapping"
                [loading]="saving()"
                (click)="save()"
            ></button>

        </div>
        </div>

        <p-toast></p-toast>
    `,
})
export class AuditCategoryQuestionMappingComponent {
    private service = inject(AuditCategoryMasterService);
    private messageService = inject(MessageService);
    private ref = inject(FormDrawerRef)

    categoryId = 0;

    categoryName =
        signal('');

    questionSets =
        signal<any[]>([]);

    selectedIds =
        signal<number[]>([]);

    saving =
        signal(false);

    search = '';

    ngOnInit() {

        const data =
            this.ref.data;

        this.categoryId =
            Number(data.id);

        this.categoryName.set(
            data.name ?? '',
        );

        this.load();
    }

    load() {

        this.service
            .getQuestionMapping(
                this.categoryId,
            )
            .subscribe({

                next: (res) => {

                    this.questionSets.set(
                        res?.questionSets ?? [],
                    );

                    const selected =
                        (
                            res?.category
                                ?.question_set_ids ??
                            ''
                        )
                            .split(',')

                            .map(
                                (x: string) =>
                                    Number(x),
                            )

                            .filter(Boolean);

                    this.selectedIds.set(
                        selected,
                    );
                },
            });
    }

    filteredQuestionSets() {

        const term =
            this.search
                .trim()
                .toLowerCase();

        if (!term) {
            return this.questionSets();
        }

        return this.questionSets()
            .filter((x) =>
                x.label
                    .toLowerCase()
                    .includes(term),
            );
    }

    isSelected(id: number) {

        return this.selectedIds()
            .includes(id);
    }

    toggleSelection(id: number) {

        const current = [
            ...this.selectedIds(),
        ];

        const exists =
            current.includes(id);

        const updated =
            exists
                ? current.filter(
                    (x) => x !== id,
                )
                : [
                    ...current,
                    id,
                ];

        this.selectedIds.set(
            updated,
        );
    }

    save() {

        this.saving.set(true);

        const csv =
            this.selectedIds()
                .join(',');

        this.service
            .updateQuestionMapping(
                this.categoryId,
                csv,
            )
            .subscribe({

                next: () => {

                    this.saving.set(false);

                    this.ref.close({
                        saved: true,
                    });
                },

                error: () => {

                    this.saving.set(false);

                    this.messageService.add({
                        severity: 'error',

                        summary: 'Error',

                        detail:
                            'Unable to save mapping',
                    });
                },
            });
    }

    close() {
        this.ref.close();
    }
}