// Mock data generator for the dashboard
import type { DataPoint, RealTimeData, RegionData, RegionOverview, Alert, AlertType, AlertLevel } from '../types';

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

function detectAbnormalFluctuation(values: number[], threshold: number = 0.3): { isAlert: boolean; changePercent: number; index: number } {
  if (values.length < 2) return { isAlert: false, changePercent: 0, index: -1 };
  
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev === 0) continue;
    const changePercent = Math.abs((curr - prev) / prev);
    if (changePercent > threshold) {
      return { isAlert: true, changePercent: (curr - prev) / prev, index: i };
    }
  }
  return { isAlert: false, changePercent: 0, index: -1 };
}

function detectContinuousDecline(values: number[], periods: number = 3): { isAlert: boolean; declineCount: number; changePercent: number } {
  if (values.length < periods) return { isAlert: false, declineCount: 0, changePercent: 0 };
  
  let declineCount = 0;
  let maxDecline = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      declineCount++;
      const decline = (values[i - 1] - values[i]) / values[i - 1];
      maxDecline = Math.max(maxDecline, decline);
    } else {
      declineCount = 0;
    }
    
    if (declineCount >= periods - 1) {
      const totalDecline = (values[i - periods + 1] - values[i]) / values[i - periods + 1];
      return { isAlert: true, declineCount: periods, changePercent: -totalDecline };
    }
  }
  
  return { isAlert: false, declineCount, changePercent: -maxDecline };
}

function detectSurge(values: number[], threshold: number = 0.5): { isAlert: boolean; changePercent: number; index: number } {
  if (values.length < 2) return { isAlert: false, changePercent: 0, index: -1 };
  
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev === 0) continue;
    const changePercent = (curr - prev) / prev;
    if (changePercent > threshold) {
      return { isAlert: true, changePercent, index: i };
    }
  }
  return { isAlert: false, changePercent: 0, index: -1 };
}

function determineLevel(changePercent: number, type: AlertType): AlertLevel {
  const absChange = Math.abs(changePercent);
  if (type === 'continuous_decline') {
    if (absChange >= 0.3) return 'high';
    if (absChange >= 0.15) return 'medium';
    return 'low';
  }
  if (absChange >= 0.5) return 'high';
  if (absChange >= 0.3) return 'medium';
  return 'low';
}

function createAlert(
  type: AlertType,
  chartId: string,
  metricName: string,
  value: number,
  threshold: number,
  changePercent: number,
  timestamp: string,
  months: string[],
  index: number,
  dataPoints: number[]
): Alert {
  const level = determineLevel(changePercent, type);
  const typeConfig: Record<AlertType, { title: string; description: string }> = {
    abnormal_fluctuation: {
      title: `${metricName}异常波动`,
      description: `${months[index]}较${months[index - 1]}${changePercent >= 0 ? '增长' : '下降'}${Math.abs(changePercent * 100).toFixed(1)}%，超出正常波动范围`
    },
    continuous_decline: {
      title: `${metricName}连续下滑`,
      description: `${metricName}已连续下滑，累计下降${Math.abs(changePercent * 100).toFixed(1)}%，请关注`
    },
    surge: {
      title: `${metricName}访问激增`,
      description: `${months[index]}较${months[index - 1]}激增${(changePercent * 100).toFixed(1)}%，请关注业务变化`
    }
  };
  
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    level,
    title: typeConfig[type].title,
    description: typeConfig[type].description,
    chartId,
    metricName,
    value,
    threshold,
    changePercent,
    timestamp,
    isRead: false,
    dataPoints: dataPoints.map((v, i) => ({
      timestamp: months[i] || `第${i + 1}期`,
      value: v
    }))
  };
}

export function generateAlerts(regionData: RegionData): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  const { salesTrend, categorySales, marketShare } = regionData;
  
  const fluctuationResult = detectAbnormalFluctuation(salesTrend.sales, 0.25);
  if (fluctuationResult.isAlert) {
    alerts.push(createAlert(
      'abnormal_fluctuation',
      'chart-1',
      '销售额',
      salesTrend.sales[fluctuationResult.index],
      0.25,
      fluctuationResult.changePercent,
      now,
      salesTrend.months,
      fluctuationResult.index,
      salesTrend.sales
    ));
  }
  
  const orderFluctuation = detectAbnormalFluctuation(salesTrend.orders, 0.25);
  if (orderFluctuation.isAlert) {
    alerts.push(createAlert(
      'abnormal_fluctuation',
      'chart-1',
      '订单量',
      salesTrend.orders[orderFluctuation.index],
      0.25,
      orderFluctuation.changePercent,
      now,
      salesTrend.months,
      orderFluctuation.index,
      salesTrend.orders
    ));
  }
  
  const salesDecline = detectContinuousDecline(salesTrend.sales, 3);
  if (salesDecline.isAlert) {
    alerts.push(createAlert(
      'continuous_decline',
      'chart-1',
      '销售额',
      salesTrend.sales[salesTrend.sales.length - 1],
      3,
      salesDecline.changePercent,
      now,
      salesTrend.months,
      salesTrend.sales.length - 1,
      salesTrend.sales
    ));
  }
  
  const orderDecline = detectContinuousDecline(salesTrend.orders, 3);
  if (orderDecline.isAlert) {
    alerts.push(createAlert(
      'continuous_decline',
      'chart-1',
      '订单量',
      salesTrend.orders[salesTrend.orders.length - 1],
      3,
      orderDecline.changePercent,
      now,
      salesTrend.months,
      salesTrend.orders.length - 1,
      salesTrend.orders
    ));
  }
  
  const categorySurge = detectSurge(categorySales.sales, 0.4);
  if (categorySurge.isAlert) {
    alerts.push(createAlert(
      'surge',
      'chart-2',
      `${categorySales.categories[categorySurge.index]}销售额`,
      categorySales.sales[categorySurge.index],
      0.4,
      categorySurge.changePercent,
      now,
      categorySales.categories,
      categorySurge.index,
      categorySales.sales
    ));
  }
  
  const channelValues = marketShare.channels.map(c => c.value);
  const channelNames = marketShare.channels.map(c => c.name);
  const channelSurge = detectSurge(channelValues, 0.4);
  if (channelSurge.isAlert) {
    alerts.push(createAlert(
      'surge',
      'chart-3',
      `${channelNames[channelSurge.index]}访问量`,
      channelValues[channelSurge.index],
      0.4,
      channelSurge.changePercent,
      now,
      channelNames,
      channelSurge.index,
      channelValues
    ));
  }
  
  return alerts.sort((a, b) => {
    const levelOrder: Record<AlertLevel, number> = { high: 0, medium: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });
}

export function generateMockAlerts(): Alert[] {
  const now = new Date();
  const mockAlerts: Alert[] = [
    {
      id: 'alert-mock-1',
      type: 'abnormal_fluctuation',
      level: 'high',
      title: '销售额异常波动',
      description: '6月较5月下降32.5%，超出正常波动范围，请立即关注',
      chartId: 'chart-1',
      metricName: '销售额',
      value: 850000,
      threshold: 0.25,
      changePercent: -0.325,
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      isRead: false
    },
    {
      id: 'alert-mock-2',
      type: 'continuous_decline',
      level: 'high',
      title: '订单量连续下滑',
      description: '订单量已连续3期下滑，累计下降28.3%，请关注业务变化',
      chartId: 'chart-1',
      metricName: '订单量',
      value: 12500,
      threshold: 3,
      changePercent: -0.283,
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      isRead: false
    },
    {
      id: 'alert-mock-3',
      type: 'surge',
      level: 'medium',
      title: '电子产品销售额激增',
      description: '电子产品销售额较上期激增52.1%，可能存在异常流量',
      chartId: 'chart-2',
      metricName: '电子产品销售额',
      value: 2800000,
      threshold: 0.4,
      changePercent: 0.521,
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      isRead: false
    },
    {
      id: 'alert-mock-4',
      type: 'abnormal_fluctuation',
      level: 'medium',
      title: '视频广告访问异常波动',
      description: '视频广告渠道访问量较上期增长45.2%，请核查投放效果',
      chartId: 'chart-3',
      metricName: '视频广告访问量',
      value: 950000,
      threshold: 0.25,
      changePercent: 0.452,
      timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
      isRead: true
    },
    {
      id: 'alert-mock-5',
      type: 'continuous_decline',
      level: 'low',
      title: '家居品类连续下滑',
      description: '家居品类销售额已连续2期下滑，累计下降12.5%',
      chartId: 'chart-2',
      metricName: '家居销售额',
      value: 980000,
      threshold: 3,
      changePercent: -0.125,
      timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
      isRead: true
    }
  ];
  
  return mockAlerts;
}
