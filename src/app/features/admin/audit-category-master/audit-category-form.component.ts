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
        <div class="max-h-[90vh] p-4 overflow-y-auto">

  <!-- Main Panel -->
  <div class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4">

    <div class="grid">

      <!-- Menu -->
      <div class="col-12 md:col-6">
        <app-select-field
          label="Menu"
          [field]="menuId"
          [options]="menus()"
          optionLabel="label"
          optionValue="value"
          [required]="true"
        ></app-select-field>
      </div>

      <!-- Category -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Category"
          [field]="name"
          [required]="true"
        ></app-text-field>
      </div>

      <!-- CC Account Category -->
      <div class="col-12 md:col-6 flex align-items-center pt-3">
        <app-checkbox-field
          label="Is CC Account Category"
          [field]="isCcAccCategory"
        ></app-checkbox-field>
      </div>

      <!-- Is Active -->
      <div class="col-12 md:col-6 flex align-items-center pt-3">
        <app-checkbox-field
          label="Is Active"
          [field]="isActive"
        ></app-checkbox-field>
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

  <p-toast></p-toast>

</div>
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