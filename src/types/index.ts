export type DataDimension = 'salesTrend' | 'categorySales' | 'marketShare' | 'ordersTrend' | 'customerGrowth';

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  option: Record<string, any>;
  gridArea: { x: number; y: number; w: number; h: number };
  isCustom?: boolean;
  dataDimension?: DataDimension;
}

export interface Dashboard {
  id: string;
  name: string;
  charts: ChartConfig[];
  theme: 'light' | 'dark';
  filters: FilterConfig[];
}

export interface FilterConfig {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'date-range' | 'text';
  value: any;
  options?: string[];
}

export interface DataPoint {
  timestamp: string;
  value: number;
  category?: string;
  dimension?: string;
}

export interface RealTimeData {
  series: string;
  points: DataPoint[];
}

export interface RegionOverview {
  region: string;
  totalSales: number;
  salesGrowth: number;
  orderCount: number;
  orderGrowth: number;
  avgOrderValue: number;
  avgOrderGrowth: number;
  customerCount: number;
  customerGrowth: number;
}

export interface RegionSalesTrend {
  months: string[];
  sales: number[];
  orders: number[];
}

export interface RegionCategorySales {
  categories: string[];
  sales: number[];
  growth: number[];
}

export interface RegionMarketShare {
  channels: { name: string; value: number }[];
}

export interface RegionData {
  overview: RegionOverview;
  salesTrend: RegionSalesTrend;
  categorySales: RegionCategorySales;
  marketShare: RegionMarketShare;
}

export type AlertType = 'abnormal_fluctuation' | 'continuous_decline' | 'surge';
export type AlertLevel = 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  description: string;
  chartId: string;
  metricName: string;
  value: number;
  threshold: number;
  changePercent: number;
  timestamp: string;
  isRead: boolean;
  dataPoints?: { timestamp: string; value: number }[];
}

export interface AlertDetectionConfig {
  abnormalFluctuationThreshold: number;
  continuousDeclinePeriods: number;
  surgeThreshold: number;
}

export type MetricName = 'totalSales' | 'orderCount' | 'avgOrderValue' | 'customerCount';

export interface MetricComparison {
  metric: MetricName;
  label: string;
  icon: string;
  valueA: number;
  valueB: number;
  growthA: number;
  growthB: number;
  diff: number;
  diffPercent: number;
  leader: 'A' | 'B' | 'tie';
}

export interface ComparisonSummary {
  regionA: string;
  regionB: string;
  metrics: MetricComparison[];
  totalWinsA: number;
  totalWinsB: number;
  overallLeader: 'A' | 'B' | 'tie';
}

export interface TrendDifference {
  months: string[];
  salesA: number[];
  salesB: number[];
  ordersA: number[];
  ordersB: number[];
  salesDiff: number[];
  ordersDiff: number[];
}

export interface CategoryDifferenceItem {
  category: string;
  salesA: number;
  salesB: number;
  growthA: number;
  growthB: number;
  diff: number;
  diffPercent: number;
  leader: 'A' | 'B' | 'tie';
}

export interface CategoryDifference {
  items: CategoryDifferenceItem[];
}

export interface RegionComparisonData {
  summary: ComparisonSummary;
  trendDifference: TrendDifference;
  categoryDifference: CategoryDifference;
  dataA: RegionData;
  dataB: RegionData;
}

export interface CompareModeState {
  enabled: boolean;
  regionA: string;
  regionB: string;
}

export interface DashboardScheme {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  filters: FilterConfig[];
  charts: ChartConfig[];
  chartOrder: string[];
  compareMode: CompareModeState;
}
