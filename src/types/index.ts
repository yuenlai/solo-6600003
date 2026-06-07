export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  title: string;
  option: Record<string, any>;
  gridArea: { x: number; y: number; w: number; h: number };
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
