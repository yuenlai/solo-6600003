// Mock data generator for the dashboard
import type { DataPoint, RealTimeData, RegionData, RegionOverview } from '../types';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月'];
const CATEGORIES = ['电子产品', '服装', '食品', '家居', '运动'];
const CHANNELS = ['搜索引擎', '直接访问', '邮件营销', '联盟广告', '视频广告'];

const REGION_BASELINES: Record<string, { sales: number; growth: number }> = {
  'all': { sales: 1.0, growth: 0.08 },
  '华东': { sales: 1.35, growth: 0.12 },
  '华南': { sales: 1.15, growth: 0.09 },
  '华北': { sales: 1.0, growth: 0.06 },
  '西南': { sales: 0.75, growth: 0.15 }
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function regionSeed(region: string): number {
  return region.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function generateTimeSeriesData(count: number = 24): DataPoint[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now.getTime() - (count - i) * 3600000).toISOString(),
    value: Math.floor(Math.random() * 1000) + 200
  }));
}

export function generateRealTimeStream(): RealTimeData {
  return {
    series: '实时数据',
    points: generateTimeSeriesData(30)
  };
}

export function generateCategoryData(categories: string[]): { name: string; value: number }[] {
  return categories.map(name => ({
    name,
    value: Math.floor(Math.random() * 500) + 100
  }));
}

export function generateScatterData(count: number = 50): number[][] {
  return Array.from({ length: count }, () => [
    Math.random() * 100,
    Math.random() * 100
  ]);
}

export function generateHeatmapData(xLen: number, yLen: number): [number, number, number][] {
  const data: [number, number, number][] = [];
  for (let x = 0; x < xLen; x++) {
    for (let y = 0; y < yLen; y++) {
      data.push([x, y, Math.floor(Math.random() * 100)]);
    }
  }
  return data;
}

export function generateRegionOverview(region: string): RegionOverview {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  const rand = seededRandom(regionSeed(region));
  const baseSales = Math.floor(5000000 * baseline.sales * (0.9 + rand() * 0.2));
  const baseOrders = Math.floor(120000 * baseline.sales * (0.9 + rand() * 0.2));
  
  return {
    region: region === 'all' ? '全国' : region,
    totalSales: baseSales,
    salesGrowth: baseline.growth + (rand() - 0.5) * 0.04,
    orderCount: baseOrders,
    orderGrowth: baseline.growth * 0.8 + (rand() - 0.5) * 0.03,
    avgOrderValue: Math.floor(baseSales / baseOrders),
    avgOrderGrowth: baseline.growth * 0.3 + (rand() - 0.5) * 0.02,
    customerCount: Math.floor(85000 * baseline.sales * (0.9 + rand() * 0.2)),
    customerGrowth: baseline.growth * 1.1 + (rand() - 0.5) * 0.03
  };
}

export function generateRegionSalesTrend(region: string): { months: string[]; sales: number[]; orders: number[] } {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  const rand = seededRandom(regionSeed(region) + 100);
  
  const sales = MONTHS.map((_, i) => {
    const base = 600000 + i * 50000;
    const variation = 0.85 + rand() * 0.3;
    return Math.floor(base * baseline.sales * variation);
  });
  
  const orders = MONTHS.map((_, i) => {
    const base = 15000 + i * 1200;
    const variation = 0.85 + rand() * 0.3;
    return Math.floor(base * baseline.sales * variation);
  });
  
  return { months: MONTHS, sales, orders };
}

export function generateRegionCategorySales(region: string): { categories: string[]; sales: number[]; growth: number[] } {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  const rand = seededRandom(regionSeed(region) + 200);
  
  const categoryWeights: Record<string, number> = {
    '电子产品': region === '华东' ? 1.4 : region === '华南' ? 1.2 : 1.0,
    '服装': region === '华南' ? 1.3 : region === '华东' ? 1.1 : 1.0,
    '食品': region === '西南' ? 1.35 : region === '华北' ? 1.15 : 1.0,
    '家居': region === '华北' ? 1.3 : region === '华东' ? 1.1 : 1.0,
    '运动': region === '华东' ? 1.25 : region === '西南' ? 1.15 : 1.0
  };
  
  const sales = CATEGORIES.map(cat => {
    const base = 1500000 + rand() * 500000;
    return Math.floor(base * baseline.sales * (categoryWeights[cat] || 1.0));
  });
  
  const growth = CATEGORIES.map(() => {
    return baseline.growth + (rand() - 0.5) * 0.1;
  });
  
  return { categories: CATEGORIES, sales, growth };
}

export function generateRegionMarketShare(region: string): { channels: { name: string; value: number }[] } {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  const rand = seededRandom(regionSeed(region) + 300);
  
  const channelWeights: Record<string, Record<string, number>> = {
    '华东': { '搜索引擎': 1.1, '直接访问': 1.0, '邮件营销': 1.2, '联盟广告': 0.9, '视频广告': 1.15 },
    '华南': { '搜索引擎': 1.0, '直接访问': 1.2, '邮件营销': 0.9, '联盟广告': 1.1, '视频广告': 1.0 },
    '华北': { '搜索引擎': 1.15, '直接访问': 1.1, '邮件营销': 0.85, '联盟广告': 1.0, '视频广告': 0.9 },
    '西南': { '搜索引擎': 0.9, '直接访问': 0.95, '邮件营销': 1.3, '联盟广告': 1.15, '视频广告': 1.2 },
    'all': { '搜索引擎': 1.0, '直接访问': 1.0, '邮件营销': 1.0, '联盟广告': 1.0, '视频广告': 1.0 }
  };
  
  const weights = channelWeights[region] || channelWeights['all'];
  
  const channels = CHANNELS.map(name => {
    const base = 800000 + rand() * 300000;
    return {
      name,
      value: Math.floor(base * baseline.sales * (weights[name] || 1.0))
    };
  });
  
  return { channels };
}

export function generateRegionData(region: string): RegionData {
  return {
    overview: generateRegionOverview(region),
    salesTrend: generateRegionSalesTrend(region),
    categorySales: generateRegionCategorySales(region),
    marketShare: generateRegionMarketShare(region)
  };
}
