import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { CommonModule }
  from '@angular/common';


import { TableModule }
  from 'primeng/table';

import { ManageAccountsDataService }
  from '../../services/masters.service';

@Component({
  selector:
    'app-deposit-upload-dumps',

  standalone: true,

  imports: [

    CommonModule,

    TableModule
  ],

  template: `

<div class="max-h-[90vh] p-4 overflow-y-auto">

  <div
    class="border-1 border-gray-300 border-round-lg shadow-1 bg-white p-4"
  >

    <p-table

      [value]="dumps()"

      [loading]="loading()"

      responsiveLayout="scroll"

      styleClass="p-datatable-sm"

    >

      <ng-template pTemplate="header">

        <tr>

          <th>
            Upload Period
          </th>

          <th>
            Upload Date
          </th>

        </tr>

      </ng-template>

      <ng-template
        pTemplate="body"
        let-row
      >

        <tr>

          <td>
          {{ row.upload_period }}
        </td>

          <td>
            {{ row.upload_date }}
          </td>

        </tr>

      </ng-template>

    </p-table>

  </div>

</div>
`
})
export class DepositUploadDumpsComponent
  implements OnInit {

  private service =
    inject(
      ManageAccountsDataService,
    );

  loading =
    signal(false);

  columns = [

    {
      field:
        'upload_period',

      header:
        'Upload Period',
    },

    {
      field:
        'upload_date',

      header:
        'Upload Date',
    },
  ];

  dumps =
    signal<any[]>([]);

  ngOnInit() {

    this.load();
  }

  load() {

    this.loading.set(true);

    this.service
      .getUploadDumps()
      .subscribe({

        next: (res) => {

          this.dumps.set(
            Array.isArray(res)
              ? res
              : [],
          );

          this.loading.set(false);
        },

        error: () => {

          this.loading.set(false);
        },
      });
  }

  formatDate(date: any): string {

    const d = new Date(date);

    if (isNaN(d.getTime())) {
      return '-';
    }

    const day = String(
      d.getDate(),
    ).padStart(2, '0');

    const month = String(
      d.getMonth() + 1,
    ).padStart(2, '0');

    const year =
      d.getFullYear();

    return `${day}-${month}-${year}`;
  }
}