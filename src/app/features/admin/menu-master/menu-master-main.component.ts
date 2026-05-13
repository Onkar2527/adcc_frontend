import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDrawerRef } from '../../../core/services/drawer/form-drawer.ref';

import {
  TextFieldComponent,
  FormActionsComponent,
  SelectFieldComponent,
  CheckboxFieldComponent
} from '../../../shared/components/form';

import {
  AuditSectionService,
  MenuMasterService
} from '../services/masters.service';

@Component({
  selector: 'app-menu-master-form',
  standalone: true,
  imports: [
    CommonModule,
    TextFieldComponent,
    SelectFieldComponent,
    CheckboxFieldComponent,
    FormActionsComponent
  ],
  template: `
    <div class="h-full flex flex-column p-4">

  <!-- Panel -->
  <div class="border-1 border-gray-300 border-round-lg p-4 shadow-1 bg-white flex-1">

    <div class="grid">

      <!-- Section Type -->
      <div class="col-12 md:col-6">
        <app-select-field
          label="Section Type"
          [field]="section_type_id"
          [options]="sectionTypeOptions()"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [virtualScroll]="false"
          scrollHeight="90px"
        ></app-select-field>
      </div>

      <!-- Section Name -->
      <div class="col-12 md:col-6">
        <app-text-field
          label="Section Name"
          [field]="name"
          placeholder="Enter section name"
        ></app-text-field>
      </div>

     

    </div>

  </div>
  <div class="border-1 border-gray-300 border-round-lg p-4 shadow-1 bg-white flex-1 mt-4">

    <div class="grid">

      <!-- Linked Table -->
      <div class="col-12">
        <app-select-field
          label="Linked Table"
          [field]="linked_table_id"
          [options]="tableDropdownOptions"
          optionLabel="label"
          optionValue="value"
          [required]="true"
          [virtualScroll]="false"
          scrollHeight="90px"
        ></app-select-field>
      </div>

      <!-- Active -->
      <div class="col-12">
        <app-checkbox-field
          label="Is Active"
          [field]="is_active"
        ></app-checkbox-field>
      </div>

    </div>

  </div>

  <!-- Footer -->
  <div class="mt-auto pt-4 border-top-1 border-gray-200">
    <app-form-actions
      [loading]="saving()"
      (save)="save()"
      (cancel)="cancel()"
    ></app-form-actions>
  </div>

</div>
  `
})
export class MenuMasterFormComponent {

  private ref = inject(FormDrawerRef);
  private menuService = inject(MenuMasterService);
  private sectionTypeService = inject(AuditSectionService);

  section_type_id = signal<number | null>(0);
  name = signal('');
  linked_table_id = signal<number | null>(0);
  is_active = signal<boolean>(true);

  saving = signal(false);
  isEdit = false;

  sectionTypeOptions = signal<any[]>([]);

  constructor() {
    this.getsectionTypeOptions();

    const data = this.ref.data;

   if (data) {
  this.isEdit = true;

  this.section_type_id.set(Number(data.section_type_id) || 0);
  this.name.set(data.name || '');
  this.linked_table_id.set(Number(data.linked_table_id) || 0);
  this.is_active.set(data.is_active === 1);
}
  }

  save() {

    const sectionName = this.name().trim().toUpperCase();

    if (!sectionName) return;

    this.saving.set(true);

    const payload = {
      name: sectionName,
      section_type_id: Number(this.section_type_id()) ?? 0,
      linked_table_id: Number(this.linked_table_id()) ?? 0,
      is_active: this.is_active() ? 1 : 0
    };

    const obs = this.isEdit
      ? this.menuService.updateMenuMaster(this.ref.data.id, payload)
      : this.menuService.createMenuMaster(payload);

    obs.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.ref.close({ saved: true, data: res });
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
  tableDropdownOptions = [
    { label: 'None', value: 0 },
    { label: 'Branch Master', value: 1 },
    { label: 'Menu Master', value: 2 },
    { label: 'User Master', value: 3 }
  ];

  getsectionTypeOptions() {
    this.sectionTypeService.findAll().subscribe({
      next: (res: any) => {

        const rows = Array.isArray(res)
          ? res
          : res?.rows || [];

        this.sectionTypeOptions.set(
          rows.map((item: any) => ({
            label: item.name,
            value: Number(item.id)
          }))
        );
      }
    });
  }

  cancel() {
    this.ref.close();
  }
}