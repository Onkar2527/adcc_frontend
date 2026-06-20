import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

// PrimeNG Imports
import { ChartModule } from "primeng/chart";
import { SelectModule } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";

import { AuditDashboardService } from "../auditor/services/auditor-main.service";

@Component({
  selector: "pos-dashboard",
  standalone: true,
  templateUrl: "./dashboard.html",
  styleUrls: ["./dashboard.scss"],
  imports: [CommonModule, FormsModule, RouterModule, ChartModule, SelectModule, ButtonModule, TagModule],
})
export class Dashboard implements OnInit {
  private service = inject(AuditDashboardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Authentication Context
  userTypeId = 0;
  employeeId = 0;
  roleName = "";

  // Loading States
  loading = false;
  detailsLoading = false;
  chartsLoading = false;

  // 1. Admin Dashboard State
  adminMetrics: any = null;
  adminPieData: any = null;
  adminPieOptions: any = null;

  // 2. Auditor / Employee / Reviewer Dashboard State
  unitsList: any[] = [];
  selectedUnitId: number | null = null;
  selectedAssessmentPeriodId: string = "all";
  selectedYearId: number | null = null;
  yearFilterOptions: any[] = [];
  
  unitSummary: any = null;
  assessmentPeriods: any[] = [];
  assessmentListTable: any[] = [];
  unitHeatmap: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  unitPieData: any = null;
  unitBarData: any = null;
  unitStackedData: any = null;

  unitPieOptions: any = null;
  unitBarOptions: any = null;
  unitStackedOptions: any = null;

  // 3. Top-Level Management Dashboard State (Type 5)
  managementMetrics: any = null;
  selectedMgmtUnitId: number | null = null;
  mgmtUnitSelectorOptions: any[] = [];
  mgmtTableData: any[] = [];

  mgmtBranchesBarData: any = null;
  mgmtBranchesBarOptions: any = null;

  mgmtDaysChartData: any = null;
  mgmtDaysChartOptions: any = null;
  mgmtPieData: any = null;
  mgmtPieOptions: any = null;
  
  mgmtBranchTotalWeightedScore = "0.00";
  mgmtBranchAvgWeightedScore = "0.00";

  ngOnInit() {
    const userData = localStorage.getItem("user") || "{}";
    const user = JSON.parse(userData);
    this.userTypeId = Number(user.user_type_id || 0);
    this.employeeId = Number(user.id || user.employee_id || user.emp_id || 0);
    this.roleName = this.getUserRoleLabel(this.userTypeId);

    setTimeout(() => {
      if (this.userTypeId === 1 || this.userTypeId === 9) {
        this.loadAdminDashboard();
      } else if (this.userTypeId === 5) {
        this.loadManagementDashboard();
      } else if ([2, 3, 4].includes(this.userTypeId)) {
        this.loadAuthorizedUnits();
      } else {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Dynamic Routing Redirects ---
  getUserRoleLabel(typeId: number): string {
    switch (typeId) {
      case 1: return "Administrator";
      case 2: return "Internal Auditor";
      case 3: return "Compliance Officer / Employee";
      case 4: return "Audit Reviewer";
      case 5: return "Top Level Management";
      default: return "User";
    }
  }

  // --- 1. ADMIN DASHBOARD FLOW ---
  loadAdminDashboard() {
    this.loading = true;
    this.service.getAdminDashboardData().subscribe({
      next: (res) => {
        this.adminMetrics = res;
        this.prepareAdminPieChart(res.data_array_chart);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Admin dashboard load failed:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  prepareAdminPieChart(dataPoints: any[]) {
    const labels = dataPoints.map(d => d.name);
    const data = dataPoints.map(d => d.y);
    const colors = [
      "#6366F1", "#3B82F6", "#10B981", "#F59E0B",
      "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"
    ];

    this.adminPieData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors.map(c => c + "E0")
        }
      ]
    };

    this.adminPieOptions = {
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            font: { family: "Outfit", size: 12 }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  // --- 2. AUDITOR / EMPLOYEE / REVIEWER FLOW ---
  loadAuthorizedUnits() {
    this.loading = true;
    this.service.findAll({ employee_id: this.employeeId }).subscribe({
      next: (res: any) => {
        // Parse list of units
        const data = Array.isArray(res) ? res : (res?.data || res?.rows || []);
        this.unitsList = data.map((item: any) => ({
          label: `${item.audit_unit_name} (${item.audit_unit_code})`,
          value: item.audit_unit_id
        }));

        if (this.unitsList.length > 0) {
          this.selectedUnitId = this.unitsList[0].value;
          this.loadUnitDashboard(this.selectedUnitId!);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Failed to load units:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onUnitChange(unitId: number) {
    this.selectedUnitId = unitId;
    this.selectedAssessmentPeriodId = "all";
    this.selectedYearId = null;
    this.loadUnitDashboard(unitId);
  }

  loadUnitDashboard(unitId: number) {
    this.detailsLoading = true;
    this.service.getUnitDashboardDetails(unitId, this.employeeId, this.userTypeId).subscribe({
      next: (res) => {
        this.unitSummary = res;
        this.selectedYearId = null;
        this.yearFilterOptions = (res.yearWiseAssessments || []).map((yw: any) => ({
          label: yw.year_label,
          value: yw.year_id
        }));
        this.assessmentPeriods = [
          { label: "All Periods", value: "all" },
          ...(res.assessmentPeriods || [])
        ];
        this.assessmentListTable = res.assessmentList || [];
        
        this.prepareUnitStackedChart(res);
        this.loadUnitCharts(unitId, this.selectedAssessmentPeriodId);
        this.detailsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Unit details load failed:", err);
        this.detailsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPeriodChange(periodId: string) {
    this.selectedAssessmentPeriodId = periodId;
    if (this.selectedUnitId) {
      this.loadUnitCharts(this.selectedUnitId, periodId);
    }
  }

  onYearChange(yearId: number | null) {
    this.selectedYearId = yearId;
    this.selectedAssessmentPeriodId = "all";
    if (this.selectedUnitId) {
      this.loadUnitCharts(this.selectedUnitId, "all");
    }
    this.cdr.detectChanges();
  }

  get filteredYearWiseAssessments() {
    const list = this.unitSummary?.yearWiseAssessments || [];
    if (!this.selectedYearId) return list;
    return list.filter((y: any) => Number(y.year_id) === Number(this.selectedYearId));
  }

  get filteredAssessmentPeriods() {
    const periods = this.assessmentPeriods || [];
    if (!this.selectedYearId) {
      return periods;
    }

    const selectedYear = (this.unitSummary?.yearWiseAssessments || [])
      .find((y: any) => Number(y.year_id) === Number(this.selectedYearId));

    if (!selectedYear) {
      return periods;
    }

    const scheduledAssessmentIds = (selectedYear.assessments || [])
      .map((ass: any) => Number(ass.id));

    const allOption = periods.find(p => p.value === "all");
    const filteredRest = periods.filter(
      (p: any) =>
        p.value !== "all" &&
        scheduledAssessmentIds.includes(Number(p.value))
    );

    return allOption ? [allOption, ...filteredRest] : filteredRest;
  }

  loadUnitCharts(unitId: number, periodId: string) {
    this.chartsLoading = true;
    this.service.getUnitChartsData(unitId, periodId).subscribe({
      next: (res) => {
        this.prepareUnitPieChart(res.riskCategoryScore);
        this.prepareUnitBarChart(res.riskTypeWiseScore);

        // Heatmap processing
        const matrix = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        ];
        (res.heatmap || []).forEach((item: any) => {
          const br = Number(item.business_risk);
          const cr = Number(item.control_risk);
          const count = Number(item.count || 0);

          const rIdx = br - 1;
          const cIdx = 3 - cr;

          if (rIdx >= 0 && rIdx < 3 && cIdx >= 0 && cIdx < 3) {
            matrix[rIdx][cIdx] = count;
          }
        });
        this.unitHeatmap = matrix;

        this.chartsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Unit charts load failed:", err);
        this.chartsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  prepareUnitPieChart(riskCategoryScore: any[]) {
    const labels = riskCategoryScore.map(d => d.label);
    const data = riskCategoryScore.map(d => d.y);
    const colors = ["#EF4444", "#F59E0B", "#10B981"]; // Red (high), Orange (med), Green (low)

    this.unitPieData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors
        }
      ]
    };

    this.unitPieOptions = {
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12 }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  prepareUnitBarChart(riskTypeWiseScore: any[]) {
    const labels = riskTypeWiseScore.map(d => d.label);
    const data = riskTypeWiseScore.map(d => d.y);

    this.unitBarData = {
      labels,
      datasets: [
        {
          label: "Risk Score",
          data,
          backgroundColor: "#3B82F6",
          borderRadius: 4
        }
      ]
    };

    this.unitBarOptions = {
      indexAxis: "y",
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  prepareUnitStackedChart(summary: any) {
    const labels = (summary.highRiskTrend || []).map((h: any) => h.label);
    const highData = (summary.highRiskTrend || []).map((h: any) => h.y);
    const medData = (summary.mediumRiskTrend || []).map((h: any) => h.y);
    const lowData = (summary.lowRiskTrend || []).map((h: any) => h.y);

    this.unitStackedData = {
      labels,
      datasets: [
        {
          label: "High Risk",
          data: highData,
          backgroundColor: "rgba(220, 20, 60, 0.85)",
        },
        {
          label: "Medium Risk",
          data: medData,
          backgroundColor: "rgba(255, 165, 0, 0.85)",
        },
        {
          label: "Low Risk",
          data: lowData,
          backgroundColor: "rgba(34, 139, 34, 0.85)",
        }
      ]
    };

    this.unitStackedOptions = {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true }
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12 } }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  // --- 3. MANAGEMENT DASHBOARD FLOW ---
  loadManagementDashboard() {
    this.loading = true;
    this.service.getManagementDashboardData(this.employeeId).subscribe({
      next: (res) => {
        this.managementMetrics = res;
        this.mgmtUnitSelectorOptions = res.authorizedUnits || [];
        this.mgmtTableData = res.branchesTable || [];
        this.prepareMgmtBranchesBarChart(res.branchesRiskBarData);

        if (this.mgmtUnitSelectorOptions.length > 0) {
          this.selectedMgmtUnitId = this.mgmtUnitSelectorOptions[0].value;
          this.loadMgmtDaysChart(this.selectedMgmtUnitId!);
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error("Management dashboard load failed:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onMgmtUnitChange(unitId: number) {
    this.selectedMgmtUnitId = unitId;
    this.loadMgmtDaysChart(unitId);
  }

  loadMgmtDaysChart(unitId: number) {
    this.detailsLoading = true;
    this.service.getBranchDaysTakenData(unitId).subscribe({
      next: (res) => {
        this.mgmtBranchTotalWeightedScore = res.branchWisetotalWeightedScore;
        this.mgmtBranchAvgWeightedScore = res.branchWiseAvgWeightedScore;
        this.prepareMgmtDaysStackedChart(res);
        this.prepareMgmtPieChart(res.allRiskData);
        this.detailsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Days taken metrics load failed:", err);
        this.detailsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  prepareMgmtBranchesBarChart(barData: any[]) {
    const labels = barData.map(d => d.label);
    const data = barData.map(d => d.y);
    const colors = barData.map(d => d.color);

    this.mgmtBranchesBarData = {
      labels,
      datasets: [
        {
          label: "Risk Score",
          data,
          backgroundColor: colors,
          borderRadius: 4
        }
      ]
    };

    this.mgmtBranchesBarOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { ticks: { precision: 2 } },
        x: { grid: { display: false } }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  prepareMgmtDaysStackedChart(res: any) {
    const labels = (res.auditDays || []).map((h: any) => h.label);
    const auditData = (res.auditDays || []).map((h: any) => h.y);
    const auditReviewData = (res.auditReviewDays || []).map((h: any) => h.y);
    const complianceData = (res.complianceDays || []).map((h: any) => h.y);
    const complianceReviewData = (res.complianceReviewDays || []).map((h: any) => h.y);

    this.mgmtDaysChartData = {
      labels,
      datasets: [
        {
          label: "Audit Days",
          data: auditData,
          backgroundColor: "rgba(220,20,60,0.85)",
        },
        {
          label: "Audit Review Days",
          data: auditReviewData,
          backgroundColor: "rgba(255,165,0,0.85)",
        },
        {
          label: "Compliance Days",
          data: complianceData,
          backgroundColor: "rgba(34,139,34,0.85)",
        },
        {
          label: "Compliance Review Days",
          data: complianceReviewData,
          backgroundColor: "rgba(99, 102, 241, 0.85)",
        }
      ]
    };

    this.mgmtDaysChartOptions = {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true }
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12 } }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  prepareMgmtPieChart(riskCategoryScore: any[]) {
    const labels = riskCategoryScore.map(d => d.label);
    const data = riskCategoryScore.map(d => d.y);
    const colors = ["#EF4444", "#F59E0B", "#10B981"];

    this.mgmtPieData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          hoverBackgroundColor: colors
        }
      ]
    };

    this.mgmtPieOptions = {
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12 }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  // --- Actions & Helpers ---
  navigateToUnit(branchId: number) {
    // Navigate based on user role to their workflow
    if (this.userTypeId === 2) {
      this.router.navigate(["/auditor/internal-audit/unit", branchId]);
    } else if (this.userTypeId === 4 || this.userTypeId === 5) {
      this.router.navigate(["/auditor/reviewer/unit", branchId, "details"]);
    }
  }

  startNewAssessment(yearId: number) {
    if (this.selectedUnitId) {
      this.router.navigate(["/auditor/internal-audit/unit", this.selectedUnitId, "start", yearId]);
    }
  }

  openAssessmentWorkspace(assessmentId: number) {
    this.router.navigate(["/auditor/internal-audit", assessmentId]);
  }

  openReviewerWorkspace() {
    if (this.selectedUnitId) {
      this.router.navigate(["/auditor/reviewer/unit", this.selectedUnitId, "details"]);
    }
  }

  openComplianceWorkspace() {
    this.router.navigate(["/auditor/compliance"]);
  }

  getAuditStatusLabel(statusId: number): string {
    switch (statusId) {
      case 1: return 'AUDIT PENDING';
      case 2: return 'AUDIT REVIEW PENDING';
      case 3: return 'RE-EDIT REQUEST';
      case 4: return 'AUDIT COMPLETED';
      case 5: return 'AUDIT COMPLETED';
      case 6: return 'AUDIT COMPLETED';
      case 7: return 'AUDIT COMPLETED';
      default: return 'NOT STARTED';
    }
  }

  getComplianceStatusLabel(statusId: number): string {
    if (statusId < 4) return '-';
    switch (statusId) {
      case 4: return 'COMPLIANCE PENDING';
      case 5: return 'COMPLIANCE REVIEW PENDING';
      case 6: return 'COMPLIANCE RE-EDIT';
      case 7: return 'COMPLETED';
      default: return '-';
    }
  }

  getReviewerAuditStatusLabel(statusId: number): string {
    if (statusId === 2) return 'UNDER REVIEW';
    if (statusId > 2) return 'COMPLETED';
    return '-';
  }

  getReviewerComplianceStatusLabel(statusId: number): string {
    if (statusId === 5) return 'UNDER REVIEW';
    if (statusId > 5) return 'COMPLETED';
    return '-';
  }

  isPeriodExpired(ass: any): boolean {
    const today = new Date().toISOString().split('T')[0];
    if ([1, 3].includes(ass.audit_status_id)) {
      return ass.audit_due_date && ass.audit_due_date < today;
    }
    if ([4, 6].includes(ass.audit_status_id)) {
      return ass.compliance_due_date && ass.compliance_due_date < today;
    }
    return false;
  }
}