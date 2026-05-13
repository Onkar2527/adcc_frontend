import {
    Component,
    effect,
    inject,
    OnInit,
    signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MessageService } from 'primeng/api';

import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
    CheckboxFieldComponent,
    FormActionsComponent,
    NumberFieldComponent,
    SelectFieldComponent,
    TextFieldComponent,
} from '../../../shared/components/form';

import {
    AuditCategoryMasterService,
    CreateCategoryDto,
} from '../services/masters.service';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-scheme-form',
    standalone: true,

    imports: [
        CommonModule,
        ToastModule,
        ButtonModule,
        SelectFieldComponent,
        TextFieldComponent,
        CheckboxFieldComponent,
        FormActionsComponent, NumberFieldComponent
    ],

    template: `
        <div class="grid">

            <div class="col-12">

                <app-select-field
                    label="Menu"
                    [field]="menuId"
                    [options]="menus()"
                    optionLabel="label"
                    optionValue="value"
                    [required]="true"
                ></app-select-field>

            </div>

            <div class="col-12">

                <app-text-field
                    label="Category"
                    [field]="name"
                    [required]="true"
                ></app-text-field>

            </div>

            <div class="col-12">

                <app-checkbox-field
                    label="Is CC Account Category"
                    [field]="isCcAccCategory"
                ></app-checkbox-field>

            </div>

            <div class="col-12">

                <app-checkbox-field
                    label="Is Active"
                    [field]="isActive"
                ></app-checkbox-field>

            </div>

        </div>

        <app-form-actions
      class="mt-4"
      [loading]="saving()"
      (save)="save()"
      (cancel)="cancel()"
    ></app-form-actions>

        <p-toast></p-toast>
    `,
})
export class AuditCategoryFormComponent implements OnInit {
    private ref = inject(FormDrawerRef);

    private service = inject(
        AuditCategoryMasterService,
    );

    private messageService =
        inject(MessageService);

    menuId =
        signal<number | null>(null);

    name =
        signal('');

    isCcAccCategory =
        signal(false);

    isActive =
        signal(true);

    menus =
        signal<any[]>([]);

    saving =
        signal(false);

    ngOnInit() {

        this.loadLookups();

        const data =
            this.ref.data;

        if (data?.id) {

            this.menuId.set(
                Number(data.menu_id),
            );

            this.name.set(
                data.name ?? '',
            );

            this.isCcAccCategory.set(
                Number(
                    data.is_cc_acc_category,
                ) === 1,
            );

            this.isActive.set(
                Number(
                    data.is_active,
                ) === 1,
            );
        }
    }

    loadLookups() {

        this.service
            .getLookups()
            .subscribe({

                next: (res) => {

                    this.menus.set(
                        res?.menus ?? [],
                    );
                },
            });
    }

    save() {

        const payload:
            CreateCategoryDto = {

            menu_id: Number(
                this.menuId(),
            ),

            name:
                this.name()
                    .trim(),

            is_cc_acc_category:
                this.isCcAccCategory()
                    ? 1
                    : 0,

            is_active:
                this.isActive()
                    ? 1
                    : 0,
        };

        if (!payload.menu_id) {

            this.messageService.add({

                severity: 'warn',

                summary: 'Validation',

                detail:
                    'Please select menu',
            });

            return;
        }

        if (!payload.name) {

            this.messageService.add({

                severity: 'warn',

                summary: 'Validation',

                detail:
                    'Please enter category name',
            });

            return;
        }

        this.saving.set(true);

        const obs =
            this.ref.data?.id
                ? this.service.update(
                    this.ref.data.id,
                    payload,
                )
                : this.service.create(
                    payload,
                );

        obs.subscribe({

            next: () => {

                this.saving.set(false);

                this.ref.close({
                    saved: true,
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