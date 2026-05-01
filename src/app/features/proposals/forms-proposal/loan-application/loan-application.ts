import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ProposalsService } from '../../proposals.service';
import { FormDrawerRef } from '../../../../core/services/drawer';
import { CommonModule } from '@angular/common';
import { PdfDownloadService } from '../../../../core/services/pdf/pdf-download.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './loan-application.html',
  styleUrls: ['./loan-application.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoanApplicationComponent implements OnInit {

  private proposalsService = inject(ProposalsService);
  private drawerRef = inject(FormDrawerRef);
  private cd = inject(ChangeDetectorRef);
  private pdfService = inject(PdfDownloadService);

  loandata: any;
  gurantordata: any[] = [];
  loading = false;
  data: any;
  businessInfo: any = {};
  jobInfo: any = {};
  ngOnInit() {
    this.data = this.drawerRef.data;

    if (!this.data) {
      console.error("No data received from drawer");
      return;
    }

    this.loadData();
    this.loadgurantordata();
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  loadData() {
    this.proposalsService.getLoanApplicationData(this.data.id)
      .subscribe({
        next: (res) => {
          this.loandata = res.data;
          this.cd.markForCheck();
        },
        error: (err) => {
          console.error(err);
        }
      });
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

          this.jobInfo = data?.job_details?.[0] || {};
          this.businessInfo = data?.business_details?.[0] || {};

          // console.log("JOB INFO:", this.jobInfo); 

          this.cd.markForCheck();
        },
        error: (err) => {
          console.error(err);
          this.gurantordata = [];
        }
      });
  }

  parseAccountType(type: string): string {
    try {
      return JSON.parse(type)?.label || '';
    } catch {
      return type;
    }
  }

  print() {
    this.pdfService.printElement('loan-application-print-area');
  }

}
