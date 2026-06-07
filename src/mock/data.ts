// Mock data generator for the dashboard
import type { DataPoint, RealTimeData, RegionData, RegionOverview, Alert, AlertType, AlertLevel, ChartDetailData, DataDimension } from '../types';

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

export function generateRegionOverview(region: string, forceRandom: boolean = false): RegionOverview {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  const rand = forceRandom ? () => Math.random() : seededRandom(regionSeed(region));
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
  
  const baseSales = 600000;
  const sales: number[] = [];
  
  for (let i = 0; i < MONTHS.length; i++) {
    let value = baseSales + i * 50000;
    let isAnomaly = false;
    
    if (i === 2) {
      value = value * 1.5;
      isAnomaly = true;
    } else if (i === 3) {
      value = value * 0.6;
      isAnomaly = true;
    } else if (i >= 4) {
      value = baseSales + 4 * 50000 - (i - 3) * 100000;
      isAnomaly = true;
    }
    
    if (isAnomaly) {
      value = value * baseline.sales;
    } else {
      value = value * baseline.sales * (0.95 + Math.random() * 0.1);
    }
    sales.push(Math.floor(Math.max(100000, value)));
  }
  
  const baseOrders = 15000;
  const orders: number[] = [];
  
  for (let i = 0; i < MONTHS.length; i++) {
    let value = baseOrders + i * 1200;
    let isAnomaly = false;
    
    if (i === 2) {
      value = value * 1.45;
      isAnomaly = true;
    } else if (i === 3) {
      value = value * 0.55;
      isAnomaly = true;
    } else if (i >= 4) {
      value = baseOrders + 4 * 1200 - (i - 3) * 25000;
      isAnomaly = true;
    }
    
    if (isAnomaly) {
      value = value * baseline.sales;
    } else {
      value = value * baseline.sales * (0.95 + Math.random() * 0.1);
    }
    orders.push(Math.floor(Math.max(5000, value)));
  }
  
  return { months: MONTHS, sales, orders };
}

export function generateRegionCategorySales(region: string): { categories: string[]; sales: number[]; growth: number[] } {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  
  const categoryWeights: Record<string, number> = {
    '电子产品': region === '华东' ? 1.4 : region === '华南' ? 1.2 : 1.0,
    '服装': region === '华南' ? 1.3 : region === '华东' ? 1.1 : 1.0,
    '食品': region === '西南' ? 1.35 : region === '华北' ? 1.15 : 1.0,
    '家居': region === '华北' ? 1.3 : region === '华东' ? 1.1 : 1.0,
    '运动': region === '华东' ? 1.25 : region === '西南' ? 1.15 : 1.0
  };
  
  const baseValues = [1500000, 1200000, 1000000, 800000, 600000];
  const sales = CATEGORIES.map((cat, i) => {
    let value = baseValues[i] * baseline.sales * (categoryWeights[cat] || 1.0);
    let isAnomaly = false;
    
    if (cat === '电子产品') {
      value = value * 1.8;
      isAnomaly = true;
    } else if (cat === '服装') {
      value = value * 0.85;
    }
    
    if (isAnomaly) {
      value = value;
    } else {
      value = value * (0.95 + Math.random() * 0.1);
    }
    return Math.floor(value);
  });
  
  const growth = CATEGORIES.map((cat, _i) => {
    if (cat === '电子产品') {
      return 0.6 + Math.random() * 0.2;
    }
    return baseline.growth + (Math.random() - 0.5) * 0.1;
  });
  
  return { categories: CATEGORIES, sales, growth };
}

export function generateRegionMarketShare(region: string): { channels: { name: string; value: number }[] } {
  const baseline = REGION_BASELINES[region] || REGION_BASELINES['all'];
  
  const channelWeights: Record<string, Record<string, number>> = {
    '华东': { '搜索引擎': 1.1, '直接访问': 1.0, '邮件营销': 1.2, '联盟广告': 0.9, '视频广告': 1.15 },
    '华南': { '搜索引擎': 1.0, '直接访问': 1.2, '邮件营销': 0.9, '联盟广告': 1.1, '视频广告': 1.0 },
    '华北': { '搜索引擎': 1.15, '直接访问': 1.1, '邮件营销': 0.85, '联盟广告': 1.0, '视频广告': 0.9 },
    '西南': { '搜索引擎': 0.9, '直接访问': 0.95, '邮件营销': 1.3, '联盟广告': 1.15, '视频广告': 1.2 },
    'all': { '搜索引擎': 1.0, '直接访问': 1.0, '邮件营销': 1.0, '联盟广告': 1.0, '视频广告': 1.0 }
  };
  
  const weights = channelWeights[region] || channelWeights['all'];
  
  const baseValues = [1000000, 800000, 600000, 500000, 300000];
  const channels = CHANNELS.map((name, i) => {
    let value = baseValues[i] * baseline.sales * (weights[name] || 1.0);
    let isAnomaly = false;
    
    if (name === '视频广告') {
      value = value * 2.0;
      isAnomaly = true;
    } else if (name === '邮件营销') {
      value = value * 0.65;
    }
    
    if (isAnomaly) {
      value = value;
    } else {
      value = value * (0.95 + Math.random() * 0.1);
    }
    return {
      name,
      value: Math.floor(value)
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

function detectAbnormalFluctuation(values: number[], threshold: number = 0.2): { isAlert: boolean; changePercent: number; index: number } {
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
  labels: string[],
  index: number,
  dataPoints: number[],
  isTimeSeries: boolean = true
): Alert {
  const level = determineLevel(changePercent, type);
  
  let description = '';
  if (type === 'abnormal_fluctuation') {
    if (isTimeSeries && index > 0) {
      description = `${labels[index]}较${labels[index - 1]}${changePercent >= 0 ? '增长' : '下降'}${Math.abs(changePercent * 100).toFixed(1)}%，超出正常波动范围`;
    } else {
      description = `${metricName}${changePercent >= 0 ? '增长' : '下降'}${Math.abs(changePercent * 100).toFixed(1)}%，超出正常波动范围`;
    }
  } else if (type === 'continuous_decline') {
    description = `${metricName}已连续下滑，累计下降${Math.abs(changePercent * 100).toFixed(1)}%，请关注`;
  } else if (type === 'surge') {
    if (isTimeSeries && index > 0) {
      description = `${labels[index]}较${labels[index - 1]}激增${(changePercent * 100).toFixed(1)}%，请关注业务变化`;
    } else {
      description = `${labels[index]}较平均值激增${(changePercent * 100).toFixed(1)}%，请关注业务变化`;
    }
  }
  
  const typeConfig: Record<AlertType, { title: string; description: string }> = {
    abnormal_fluctuation: {
      title: `${metricName}异常波动`,
      description
    },
    continuous_decline: {
      title: `${metricName}连续下滑`,
      description
    },
    surge: {
      title: `${metricName}访问激增`,
      description
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
      timestamp: labels[i] || `第${i + 1}期`,
      value: v
    }))
  };
}

function detectCategorySurge(sales: number[], _categories: string[], growth: number[]): { isAlert: boolean; changePercent: number; index: number; dataPoints: number[] } {
  const avg = sales.reduce((a, b) => a + b, 0) / sales.length;
  
  for (let i = 0; i < sales.length; i++) {
    if (sales[i] > avg * 1.5) {
      const dataPoints = sales.map((s, idx) => {
        if (idx === i) return s;
        return Math.floor(avg * (0.8 + Math.random() * 0.4));
      });
      return {
        isAlert: true,
        changePercent: (sales[i] - avg) / avg,
        index: i,
        dataPoints
      };
    }
  }
  
  for (let i = 0; i < growth.length; i++) {
    if (growth[i] > 0.4) {
      const dataPoints = sales.map((s, idx) => {
        if (idx === i) return s;
        return Math.floor(s * (0.7 + Math.random() * 0.3));
      });
      return {
        isAlert: true,
        changePercent: growth[i],
        index: i,
        dataPoints
      };
    }
  }
  
  return { isAlert: false, changePercent: 0, index: -1, dataPoints: sales };
}

function detectChannelSurge(channels: { name: string; value: number }[]): { isAlert: boolean; changePercent: number; index: number; dataPoints: number[] } {
  const values = channels.map(c => c.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  for (let i = 0; i < values.length; i++) {
    if (values[i] > avg * 1.6) {
      const dataPoints = values.map((v, idx) => {
        if (idx === i) return v;
        return Math.floor(avg * (0.7 + Math.random() * 0.5));
      });
      return {
        isAlert: true,
        changePercent: (values[i] - avg) / avg,
        index: i,
        dataPoints
      };
    }
  }
  
  return { isAlert: false, changePercent: 0, index: -1, dataPoints: values };
}

export function generateAlerts(regionData: RegionData): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();
  const { salesTrend, categorySales, marketShare } = regionData;
  
  const fluctuationResult = detectAbnormalFluctuation(salesTrend.sales, 0.2);
  if (fluctuationResult.isAlert) {
    alerts.push(createAlert(
      'abnormal_fluctuation',
      'chart-1',
      '销售额',
      salesTrend.sales[fluctuationResult.index],
      0.2,
      fluctuationResult.changePercent,
      now,
      salesTrend.months,
      fluctuationResult.index,
      salesTrend.sales
    ));
  }
  
  const orderFluctuation = detectAbnormalFluctuation(salesTrend.orders, 0.2);
  if (orderFluctuation.isAlert) {
    alerts.push(createAlert(
      'abnormal_fluctuation',
      'chart-1',
      '订单量',
      salesTrend.orders[orderFluctuation.index],
      0.2,
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
  
  const categorySurgeResult = detectCategorySurge(categorySales.sales, categorySales.categories, categorySales.growth);
  if (categorySurgeResult.isAlert) {
    alerts.push(createAlert(
      'surge',
      'chart-2',
      `${categorySales.categories[categorySurgeResult.index]}销售额`,
      categorySales.sales[categorySurgeResult.index],
      0.4,
      categorySurgeResult.changePercent,
      now,
      categorySales.categories,
      categorySurgeResult.index,
      categorySurgeResult.dataPoints,
      false
    ));
  }
  
  const channelSurgeResult = detectChannelSurge(marketShare.channels);
  if (channelSurgeResult.isAlert) {
    const channelNames = marketShare.channels.map(c => c.name);
    alerts.push(createAlert(
      'surge',
      'chart-3',
      `${channelNames[channelSurgeResult.index]}访问量`,
      marketShare.channels[channelSurgeResult.index].value,
      0.4,
      channelSurgeResult.changePercent,
      now,
      channelNames,
      channelSurgeResult.index,
      channelSurgeResult.dataPoints,
      false
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

const METRIC_DETAIL_CONFIGS: Record<DataDimension, Omit<ChartDetailData['metric'], 'name'>> = {
  salesTrend: {
    description: '反映企业在一定时期内的销售业绩变化情况，是衡量业务增长的核心指标',
    unit: '万元',
    calculationMethod: '当期销售金额 = 订单金额 - 退款金额',
    dataSource: '交易系统、订单管理系统',
    updateFrequency: '每日更新',
    businessMeaning: '销售额直接反映企业经营规模和市场表现，是评估业务健康度的首要指标'
  },
  categorySales: {
    description: '按产品分类统计的销售金额，用于分析不同品类的贡献度和市场表现',
    unit: '万元',
    calculationMethod: '分类销售额 = 该分类下所有商品销售金额之和',
    dataSource: '商品管理系统、交易系统',
    updateFrequency: '每日更新',
    businessMeaning: '分类销售分析帮助识别核心品类和潜力品类，指导库存和营销策略'
  },
  marketShare: {
    description: '各渠道带来的销售额占比，反映不同获客渠道的贡献度和效率',
    unit: '万元',
    calculationMethod: '渠道占比 = 该渠道销售额 / 总销售额 × 100%',
    dataSource: '营销系统、渠道归因系统',
    updateFrequency: '每日更新',
    businessMeaning: '渠道分析指导营销预算分配，优化获客策略，提升ROI'
  },
  ordersTrend: {
    description: '反映企业在一定时期内的订单数量变化情况，是衡量业务活跃度的重要指标',
    unit: '万单',
    calculationMethod: '当期订单数 = 有效订单数 - 取消订单数',
    dataSource: '订单管理系统',
    updateFrequency: '实时更新',
    businessMeaning: '订单量反映用户购买意愿和平台活跃度，结合客单价可分析用户消费行为'
  },
  customerGrowth: {
    description: '反映企业客户规模的增长情况，是衡量用户获取能力的核心指标',
    unit: '百人',
    calculationMethod: '新增客户数 = 当期首次下单用户数',
    dataSource: 'CRM系统、用户中心',
    updateFrequency: '每日更新',
    businessMeaning: '客户增长反映企业获客能力和市场扩张速度，是评估长期增长潜力的关键'
  }
};

const CHART_TYPE_NAMES: Record<string, string> = {
  line: '折线图',
  bar: '柱状图',
  pie: '饼图',
  scatter: '散点图',
  heatmap: '热力图'
};

export function generateChartDetailData(
  chartId: string,
  chartTitle: string,
  chartType: string,
  dimension: DataDimension,
  regionData: RegionData
): ChartDetailData {
  const metricConfig = METRIC_DETAIL_CONFIGS[dimension];
  const rand = seededRandom(regionSeed(regionData.overview.region) + chartId.split('').reduce((a, b) => a + b.charCodeAt(0), 0));

  let overviewData: ChartDetailData['overview'];
  let segmentData: ChartDetailData['segmentData'];
  let recentChange: ChartDetailData['recentChange'];

  if (dimension === 'salesTrend') {
    const sales = regionData.salesTrend.sales;
    const months = regionData.salesTrend.months;
    const maxIndex = sales.indexOf(Math.max(...sales));
    const minIndex = sales.indexOf(Math.min(...sales));

    overviewData = {
      totalValue: sales.reduce((a, b) => a + b, 0),
      avgValue: Math.floor(sales.reduce((a, b) => a + b, 0) / sales.length),
      maxValue: Math.max(...sales),
      minValue: Math.min(...sales),
      peakPeriod: months[maxIndex],
      valleyPeriod: months[minIndex]
    };

    const items = months.map((month, i) => {
      const value = sales[i];
      const percentage = (value / overviewData.totalValue) * 100;
      const prevValue = i > 0 ? sales[i - 1] : value;
      const growth = prevValue !== 0 ? (value - prevValue) / prevValue : 0;
      return {
        name: month,
        value,
        percentage: Number(percentage.toFixed(1)),
        growth: Number(growth.toFixed(3)),
        trend: (growth > 0.05 ? 'up' : growth < -0.05 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    });

    segmentData = {
      title: '月度销售分布',
      dimension: '时间',
      items
    };

    const recentSales = sales.slice(-2);
    const changeValue = recentSales[1] - recentSales[0];
    const changePercent = recentSales[0] !== 0 ? changeValue / recentSales[0] : 0;

    recentChange = {
      period: '近2个月',
      currentValue: recentSales[1],
      previousValue: recentSales[0],
      changeValue,
      changePercent: Number(changePercent.toFixed(3)),
      trend: (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      dataPoints: months.map((m, i) => ({ label: m, value: sales[i] })),
      analysis: changePercent > 0.1
        ? '近期销售额增长强劲，主要得益于促销活动和旺季效应，建议持续加大市场投入'
        : changePercent > 0
        ? '销售额保持平稳增长，业务发展健康，建议关注竞品动态以保持增长势头'
        : changePercent > -0.1
        ? '销售额略有下滑，可能受季节性因素影响，建议优化产品组合和定价策略'
        : '销售额出现明显下滑，需要深入分析原因，可能涉及市场竞争加剧或用户流失问题'
    };
  } else if (dimension === 'categorySales') {
    const categories = regionData.categorySales.categories;
    const sales = regionData.categorySales.sales;
    const growth = regionData.categorySales.growth;
    const maxIndex = sales.indexOf(Math.max(...sales));
    const minIndex = sales.indexOf(Math.min(...sales));

    overviewData = {
      totalValue: sales.reduce((a, b) => a + b, 0),
      avgValue: Math.floor(sales.reduce((a, b) => a + b, 0) / sales.length),
      maxValue: Math.max(...sales),
      minValue: Math.min(...sales),
      peakPeriod: categories[maxIndex],
      valleyPeriod: categories[minIndex]
    };

    const items = categories.map((cat, i) => {
      const value = sales[i];
      const percentage = (value / overviewData.totalValue) * 100;
      return {
        name: cat,
        value,
        percentage: Number(percentage.toFixed(1)),
        growth: Number(growth[i].toFixed(3)),
        trend: (growth[i] > 0.05 ? 'up' : growth[i] < -0.05 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    }).sort((a, b) => b.value - a.value);

    segmentData = {
      title: '品类销售分布',
      dimension: '品类',
      items
    };

    const avgGrowth = growth.reduce((a, b) => a + b, 0) / growth.length;
    const topCategory = items[0];

    recentChange = {
      period: '同比上期',
      currentValue: overviewData.totalValue,
      previousValue: Math.floor(overviewData.totalValue / (1 + avgGrowth)),
      changeValue: Math.floor(overviewData.totalValue * avgGrowth),
      changePercent: Number(avgGrowth.toFixed(3)),
      trend: (avgGrowth > 0 ? 'up' : avgGrowth < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      dataPoints: categories.map((c, i) => ({ label: c, value: sales[i] })),
      analysis: topCategory.percentage > 40
        ? `${topCategory.name}品类贡献超过40%，是绝对核心品类，建议继续强化优势，但需注意品类集中风险`
        : avgGrowth > 0.1
        ? `各品类整体增长势头良好，${categories[growth.indexOf(Math.max(...growth))]}增长最快，可作为潜力品类重点培养`
        : avgGrowth > 0
        ? '品类结构相对稳定，建议对增长较慢的品类进行策略调整'
        : '部分品类出现下滑，建议重新评估品类定位，考虑淘汰低效品类或进行转型升级'
    };
  } else if (dimension === 'marketShare') {
    const channels = regionData.marketShare.channels;
    const values = channels.map(c => c.value);
    const names = channels.map(c => c.name);
    const maxIndex = values.indexOf(Math.max(...values));
    const minIndex = values.indexOf(Math.min(...values));

    overviewData = {
      totalValue: values.reduce((a, b) => a + b, 0),
      avgValue: Math.floor(values.reduce((a, b) => a + b, 0) / values.length),
      maxValue: Math.max(...values),
      minValue: Math.min(...values),
      peakPeriod: names[maxIndex],
      valleyPeriod: names[minIndex]
    };

    const items = channels.map((channel, i) => {
      const value = channel.value;
      const percentage = (value / overviewData.totalValue) * 100;
      const baseGrowth = (rand() - 0.5) * 0.3;
      const growth = names[i] === '视频广告' ? 0.45 + rand() * 0.2 : names[i] === '邮件营销' ? -0.15 - rand() * 0.1 : baseGrowth;
      return {
        name: channel.name,
        value,
        percentage: Number(percentage.toFixed(1)),
        growth: Number(growth.toFixed(3)),
        trend: (growth > 0.05 ? 'up' : growth < -0.05 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    }).sort((a, b) => b.value - a.value);

    segmentData = {
      title: '渠道销售分布',
      dimension: '渠道',
      items
    };

    const avgGrowth = items.reduce((a, b) => a + b.growth, 0) / items.length;
    const topChannel = items[0];

    recentChange = {
      period: '同比上期',
      currentValue: overviewData.totalValue,
      previousValue: Math.floor(overviewData.totalValue / (1 + avgGrowth)),
      changeValue: Math.floor(overviewData.totalValue * avgGrowth),
      changePercent: Number(avgGrowth.toFixed(3)),
      trend: (avgGrowth > 0 ? 'up' : avgGrowth < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      dataPoints: names.map((n, i) => ({ label: n, value: values[i] })),
      analysis: topChannel.percentage > 35
        ? `${topChannel.name}是核心获客渠道，贡献超过35%的销售额，建议加大投入巩固优势，但需注意渠道单一风险`
        : items.filter(i => i.trend === 'up').length >= 3
        ? '多渠道齐头并进，渠道结构健康，视频广告等新兴渠道增长迅速，建议重点布局'
        : items.filter(i => i.trend === 'down').length >= 2
        ? '部分传统渠道增长乏力，建议重新评估渠道策略，考虑将预算向高效渠道转移'
        : '渠道分布相对均衡，各渠道表现稳定，建议持续监控渠道ROI，动态优化预算分配'
    };
  } else if (dimension === 'ordersTrend') {
    const orders = regionData.salesTrend.orders;
    const months = regionData.salesTrend.months;
    const maxIndex = orders.indexOf(Math.max(...orders));
    const minIndex = orders.indexOf(Math.min(...orders));

    overviewData = {
      totalValue: orders.reduce((a, b) => a + b, 0),
      avgValue: Math.floor(orders.reduce((a, b) => a + b, 0) / orders.length),
      maxValue: Math.max(...orders),
      minValue: Math.min(...orders),
      peakPeriod: months[maxIndex],
      valleyPeriod: months[minIndex]
    };

    const items = months.map((month, i) => {
      const value = orders[i];
      const percentage = (value / overviewData.totalValue) * 100;
      const prevValue = i > 0 ? orders[i - 1] : value;
      const growth = prevValue !== 0 ? (value - prevValue) / prevValue : 0;
      return {
        name: month,
        value,
        percentage: Number(percentage.toFixed(1)),
        growth: Number(growth.toFixed(3)),
        trend: (growth > 0.05 ? 'up' : growth < -0.05 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    });

    segmentData = {
      title: '月度订单分布',
      dimension: '时间',
      items
    };

    const recentOrders = orders.slice(-2);
    const changeValue = recentOrders[1] - recentOrders[0];
    const changePercent = recentOrders[0] !== 0 ? changeValue / recentOrders[0] : 0;

    recentChange = {
      period: '近2个月',
      currentValue: recentOrders[1],
      previousValue: recentOrders[0],
      changeValue,
      changePercent: Number(changePercent.toFixed(3)),
      trend: (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      dataPoints: months.map((m, i) => ({ label: m, value: orders[i] })),
      analysis: changePercent > 0.15
        ? '订单量增长迅猛，平台活跃度显著提升，建议关注服务器承载能力和物流配送能力'
        : changePercent > 0
        ? '订单量稳步增长，用户粘性良好，建议结合促销活动进一步提升转化'
        : changePercent > -0.1
        ? '订单量略有波动，属正常范围，建议关注用户留存和复购情况'
        : '订单量下滑明显，需要排查是否存在竞品促销、产品体验问题或营销投入不足'
    };
  } else {
    const customerGrowth = Array.from({ length: 6 }, (_, i) => Math.floor((80 + rand() * 40) * (1 + i * 0.05)));
    const months = regionData.salesTrend.months;
    const maxIndex = customerGrowth.indexOf(Math.max(...customerGrowth));
    const minIndex = customerGrowth.indexOf(Math.min(...customerGrowth));

    overviewData = {
      totalValue: customerGrowth.reduce((a, b) => a + b, 0),
      avgValue: Math.floor(customerGrowth.reduce((a, b) => a + b, 0) / customerGrowth.length),
      maxValue: Math.max(...customerGrowth),
      minValue: Math.min(...customerGrowth),
      peakPeriod: months[maxIndex],
      valleyPeriod: months[minIndex]
    };

    const items = months.map((month, i) => {
      const value = customerGrowth[i];
      const percentage = (value / overviewData.totalValue) * 100;
      const prevValue = i > 0 ? customerGrowth[i - 1] : value;
      const growth = prevValue !== 0 ? (value - prevValue) / prevValue : 0;
      return {
        name: month,
        value,
        percentage: Number(percentage.toFixed(1)),
        growth: Number(growth.toFixed(3)),
        trend: (growth > 0.05 ? 'up' : growth < -0.05 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    });

    segmentData = {
      title: '月度新增客户分布',
      dimension: '时间',
      items
    };

    const recent = customerGrowth.slice(-2);
    const changeValue = recent[1] - recent[0];
    const changePercent = recent[0] !== 0 ? changeValue / recent[0] : 0;

    recentChange = {
      period: '近2个月',
      currentValue: recent[1],
      previousValue: recent[0],
      changeValue,
      changePercent: Number(changePercent.toFixed(3)),
      trend: (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      dataPoints: months.map((m, i) => ({ label: m, value: customerGrowth[i] })),
      analysis: changePercent > 0.1
        ? '客户增长势头强劲，获客策略效果显著，建议持续优化获客渠道，同时关注新用户留存'
        : changePercent > 0
        ? '客户规模稳步扩大，业务发展健康，建议加强新用户引导和首单转化'
        : changePercent > -0.05
        ? '客户增长保持稳定，建议优化注册流程和用户体验以提升转化率'
        : '获客难度加大，可能是市场竞争加剧或渠道效果下降，建议重新评估获客策略'
    };
  }

  return {
    chartId,
    chartTitle,
    chartType: CHART_TYPE_NAMES[chartType] || chartType,
    dataDimension: dimension,
    metric: {
      name: chartTitle,
      ...metricConfig
    },
    segmentData,
    recentChange,
    overview: overviewData
  };
}
