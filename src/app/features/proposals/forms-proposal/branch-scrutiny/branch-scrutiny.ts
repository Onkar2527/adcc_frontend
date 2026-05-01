import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ProposalsService } from '../../proposals.service';
import { FormDrawerRef } from '../../../../core/services/drawer';
import { CommonModule } from '@angular/common';
import { PdfDownloadService } from '../../../../core/services/pdf/pdf-download.service';
import { ButtonModule } from 'primeng/button';


@Component({
  selector: 'app-branch-scrutiny',
  templateUrl: './branch-scrutiny.html',
  styleUrls: ['./branch-scrutiny.scss'],
  standalone: true,
  imports: [CommonModule, ButtonModule]
})
export class branchscrutiny implements OnInit {
  loanInfo: any;

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  private proposalsService = inject(ProposalsService);
  private drawerRef = inject(FormDrawerRef);
  private cd = inject(ChangeDetectorRef);
  private pdfService = inject(PdfDownloadService);

  gurantordata: any[] = [];
  allGuarantees: any[] = [];
  guarantorLoans: any[] = [];
  guaranteeList: any[] = [];
  branchscrutinydata: any;
  loading = false;
  data: any;

  ngOnInit() {
    this.data = this.drawerRef.data;

    if (!this.data) {
      console.error("No data received from drawer");
      return;
    }

    this.loadData();
    this.loadgurantordata();
  }

  loadData() {
    this.loading = true;

    this.proposalsService.getLoanscrutinyData(this.data.id)
      .subscribe({
        next: (res) => {
          this.branchscrutinydata = res.data;
          this.loanInfo = this.branchscrutinydata?.loan_info?.[0] || {};
          this.allGuarantees = [...(this.branchscrutinydata?.credit_guarantees_this_bank || []),...(this.branchscrutinydata?.credit_guarantees_other_banks || [])];

  this.guarantorLoans = [
    ...(this.branchscrutinydata?.credit_loans_this_bank_guarantor || []),
    ...(this.branchscrutinydata?.credit_loans_other_bank_guarantor || [])
  ];

  this.guaranteeList = [
    ...(this.branchscrutinydata?.credit_guarantees_this_bank_guarantor || []),
    ...(this.branchscrutinydata?.credit_guarantees_other_banks_guarantor || [])
  ];


          this.cd.detectChanges();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
  }

  getIncomeTypes(): string {
    return this.branchscrutinydata?.income_details
      ?.map((item: any, i: number) => `${i + 1}) ${item.type}`)
      .join('  ') || '';
  }

  getIncomeAddresses(): string {
    return this.branchscrutinydata?.income_details
      ?.map((item: any, i: number) => `${i + 1}) ${item.org_address || item.address || item.remark}`)
      .join('  ') || '';
  }
  parseAccountType(type: string): string {
    try {
      return JSON.parse(type)?.label || '-';
    } catch {
      return type || '-';
    }
  }
  loadgurantordata() {
    this.proposalsService.getLoangurantorData(this.data.id)
      .subscribe({
        next: (res) => {
          const data = res.data;

          if (Array.isArray(data)) {
            this.gurantordata = data;
          } else if (data) {
            this.gurantordata = [data];
          } else {
            this.gurantordata = [];
          }

          this.cd.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.gurantordata = [];
        }
      });
  }
  print() {
    this.pdfService.printElement('branch-scrutiny-print-area');
  }
}