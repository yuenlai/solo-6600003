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
