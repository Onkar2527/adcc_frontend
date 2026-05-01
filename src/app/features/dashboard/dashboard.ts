import { Component, inject, effect, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LayoutService } from "../../shell/layout/service/layout.service";
import { ChartModule } from 'primeng/chart';

export interface DashboardCard {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'pos-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports: [CommonModule, ChartModule],
})
export class Dashboard implements OnInit {
  private layoutService = inject(LayoutService);

  cards: DashboardCard[] = [];
  charts: any[] = [];

  chartOptions: any = {
    plugins: {
      legend: {
        labels: { color: '#495057' }
      }
    },
    scales: {
      x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
      y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }
    }
  };

  constructor() {

  }

  ngOnInit() {

  }

}