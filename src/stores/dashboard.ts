import { defineStore } from 'pinia';
import { ref, computed, nextTick, watch } from 'vue';
import type { Dashboard, ChartConfig, RegionData, Alert, AlertLevel, DataDimension, CompareModeState, RegionComparisonData, MetricComparison, MetricName, DashboardScheme, FilterConfig, ChartDetailData } from '../types';
import { generateRegionData, generateAlerts, generateMockAlerts, generateScatterData, generateHeatmapData, generateChartDetailData } from '../mock/data';

const SCHEMES_STORAGE_KEY = 'dashboard-schemes';
const CURRENT_SCHEME_KEY = 'dashboard-current-scheme-id';

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboard = ref<Dashboard>({
    id: 'dashboard-1',
    name: '地区经营总览',
    theme: 'light',
    filters: [
      { id: 'f1', field: 'region', label: '地区', type: 'select', value: 'all', options: ['all', '华东', '华南', '华北', '西南'] },
      { id: 'f2', field: 'dateRange', label: '时间范围', type: 'date-range', value: [] },
      { id: 'f3', field: 'keyword', label: '关键词', type: 'text', value: '' }
    ],
    charts: [
      {
        id: 'chart-1', type: 'line', title: '销售趋势',
        gridArea: { x: 0, y: 0, w: 6, h: 4 },
        option: {
          xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
          series: [
            { name: '销售额', data: [820, 932, 901, 934, 1290, 1330], type: 'line', smooth: true, yAxisIndex: 0 },
            { name: '订单量', data: [210, 240, 230, 245, 320, 340], type: 'line', smooth: true, yAxisIndex: 1 }
          ],
          tooltip: { trigger: 'axis' },
          legend: { data: ['销售额', '订单量'], bottom: 0 },
          grid: { bottom: 40 },
          yAxis: [
            { type: 'value', name: '销售额(万)' },
            { type: 'value', name: '订单数' }
          ]
        }
      },
      {
        id: 'chart-2', type: 'bar', title: '分类销量',
        gridArea: { x: 6, y: 0, w: 6, h: 4 },
        option: {
          xAxis: { type: 'category', data: ['电子产品', '服装', '食品', '家居', '运动'] },
          yAxis: { type: 'value', name: '销售额(万)' },
          series: [{ data: [120, 200, 150, 80, 70], type: 'bar' }],
          tooltip: { trigger: 'axis', formatter: (params: any) => {
            const data = params[0];
            const growth = data.data && typeof data.data === 'object' ? data.data.growth : 0;
            const growthText = growth >= 0 ? `+${(growth * 100).toFixed(1)}%` : `${(growth * 100).toFixed(1)}%`;
            const growthColor = growth >= 0 ? '#52c41a' : '#ff4d4f';
            return `${data.name}<br/>销售额: ${data.value} 万<br/>同比: <span style="color:${growthColor}">${growthText}</span>`;
          }}
        }
      },
      {
        id: 'chart-3', type: 'pie', title: '市场份额',
        gridArea: { x: 0, y: 4, w: 6, h: 4 },
        option: {
          series: [{
            type: 'pie', radius: ['40%', '70%'],
            data: [
              { value: 1048, name: '搜索引擎' },
              { value: 735, name: '直接访问' },
              { value: 580, name: '邮件营销' },
              { value: 484, name: '联盟广告' },
              { value: 300, name: '视频广告' }
            ]
          }],
          tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
          legend: { orient: 'vertical', right: 10, top: 'center' }
        }
      }
    ]
  });

  const regionDataCache = ref<Record<string, RegionData>>({});
  const regionUpdateFlag = ref(0);

  const compareMode = ref<CompareModeState>({
    enabled: false,
    regionA: '华东',
    regionB: '华南'
  });

  const compareModeLoading = ref(false);
  const comparisonVersion = ref(0);

  const schemes = ref<DashboardScheme[]>([]);
  const currentSchemeId = ref<string | null>(null);
  const schemeLoading = ref(false);

  function loadSchemesFromStorage() {
    try {
      const stored = localStorage.getItem(SCHEMES_STORAGE_KEY);
      if (stored) {
        schemes.value = JSON.parse(stored);
      }
      const currentId = localStorage.getItem(CURRENT_SCHEME_KEY);
      if (currentId) {
        currentSchemeId.value = currentId;
      }
    } catch (e) {
      console.error('Failed to load schemes from storage:', e);
    }
  }

  function saveSchemesToStorage() {
    try {
      localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(schemes.value));
      if (currentSchemeId.value) {
        localStorage.setItem(CURRENT_SCHEME_KEY, currentSchemeId.value);
      }
    } catch (e) {
      console.error('Failed to save schemes to storage:', e);
    }
  }

  watch(schemes, () => {
    saveSchemesToStorage();
  }, { deep: true });

  watch(currentSchemeId, () => {
    saveSchemesToStorage();
  });

  const currentScheme = computed(() => {
    return schemes.value.find(s => s.id === currentSchemeId.value) || null;
  });

  function generateSchemeId(): string {
    return `scheme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getCurrentChartOrder(): string[] {
    return dashboard.value.charts.map(c => c.id);
  }

  function saveScheme(name: string, overwriteExisting: boolean = false): DashboardScheme | null {
    const existingIndex = schemes.value.findIndex(s => s.name === name);
    
    if (existingIndex !== -1 && !overwriteExisting) {
      return null;
    }

    const schemeData: DashboardScheme = {
      id: existingIndex !== -1 ? schemes.value[existingIndex].id : generateSchemeId(),
      name,
      createdAt: existingIndex !== -1 ? schemes.value[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filters: JSON.parse(JSON.stringify(dashboard.value.filters)),
      charts: JSON.parse(JSON.stringify(dashboard.value.charts)),
      chartOrder: getCurrentChartOrder(),
      compareMode: JSON.parse(JSON.stringify(compareMode.value))
    };

    if (existingIndex !== -1) {
      schemes.value[existingIndex] = schemeData;
    } else {
      schemes.value.push(schemeData);
    }

    currentSchemeId.value = schemeData.id;
    return schemeData;
  }

  async function applyScheme(schemeId: string): Promise<boolean> {
    const scheme = schemes.value.find(s => s.id === schemeId);
    if (!scheme) return false;

    schemeLoading.value = true;
    try {
      const previousCompareEnabled = compareMode.value.enabled;
      const newCompareEnabled = scheme.compareMode.enabled;

      dashboard.value.filters = JSON.parse(JSON.stringify(scheme.filters));
      dashboard.value.charts = JSON.parse(JSON.stringify(scheme.charts));
      compareMode.value = JSON.parse(JSON.stringify(scheme.compareMode));

      const regionFilter = dashboard.value.filters.find((f: FilterConfig) => f.field === 'region');
      if (regionFilter && regionFilter.value) {
        regionUpdateFlag.value++;
        updateChartsForRegion(regionFilter.value);
        refreshAlerts(true);
      }

      if (newCompareEnabled) {
        ensureCompareDataLoaded();
        comparisonVersion.value++;
        regionUpdateFlag.value++;
      } else if (previousCompareEnabled && !newCompareEnabled) {
        regionUpdateFlag.value++;
      }

      comparisonVersion.value++;
      currentSchemeId.value = schemeId;
      await nextTick();
      return true;
    } finally {
      schemeLoading.value = false;
    }
  }

  function deleteScheme(schemeId: string): boolean {
    const index = schemes.value.findIndex(s => s.id === schemeId);
    if (index === -1) return false;

    schemes.value.splice(index, 1);
    if (currentSchemeId.value === schemeId) {
      currentSchemeId.value = null;
    }
    return true;
  }

  function renameScheme(schemeId: string, newName: string): boolean {
    const scheme = schemes.value.find(s => s.id === schemeId);
    if (!scheme) return false;

    const existing = schemes.value.find(s => s.name === newName && s.id !== schemeId);
    if (existing) return false;

    scheme.name = newName;
    scheme.updatedAt = new Date().toISOString();
    return true;
  }

  function checkSchemeNameExists(name: string): boolean {
    return schemes.value.some(s => s.name === name);
  }

  function clearCurrentScheme() {
    currentSchemeId.value = null;
  }
  
  const alerts = ref<Alert[]>([]);
  const highlightedChartId = ref<string | null>(null);
  const alertAutoRefresh = ref(true);
  const lastAlertUpdate = ref<string>('');
  const chartDetailDrawerVisible = ref(false);
  const selectedChartId = ref<string | null>(null);
  const chartDetailData = ref<ChartDetailData | null>(null);
  const chartDetailLoading = ref(false);

  const currentRegion = computed(() => {
    const regionFilter = dashboard.value.filters.find(f => f.field === 'region');
    return regionFilter ? regionFilter.value : 'all';
  });

  const currentRegionData = computed(() => {
    const region = currentRegion.value;
    regionUpdateFlag.value;
    if (!regionDataCache.value[region]) {
      regionDataCache.value[region] = generateRegionData(region);
    }
    return regionDataCache.value[region];
  });

  const regionOverview = computed(() => {
    regionUpdateFlag.value;
    return currentRegionData.value.overview;
  });

  const regionDataA = computed(() => {
    regionUpdateFlag.value;
    const region = compareMode.value.regionA;
    if (!regionDataCache.value[region]) {
      regionDataCache.value[region] = generateRegionData(region);
    }
    return regionDataCache.value[region];
  });

  const regionDataB = computed(() => {
    regionUpdateFlag.value;
    const region = compareMode.value.regionB;
    if (!regionDataCache.value[region]) {
      regionDataCache.value[region] = generateRegionData(region);
    }
    return regionDataCache.value[region];
  });

  const METRIC_CONFIGS: { metric: MetricName; label: string; icon: string }[] = [
    { metric: 'totalSales', label: '总销售额', icon: '💰' },
    { metric: 'orderCount', label: '订单量', icon: '📦' },
    { metric: 'avgOrderValue', label: '客单价', icon: '💎' },
    { metric: 'customerCount', label: '客户数', icon: '👥' }
  ];

  const GROWTH_MAP: Record<MetricName, keyof RegionData['overview']> = {
    totalSales: 'salesGrowth',
    orderCount: 'orderGrowth',
    avgOrderValue: 'avgOrderGrowth',
    customerCount: 'customerGrowth'
  };

  function createMetricComparison(
    metric: MetricName,
    label: string,
    icon: string,
    dataA: RegionData,
    dataB: RegionData
  ): MetricComparison {
    const valueA = dataA.overview[metric] as number;
    const valueB = dataB.overview[metric] as number;
    const growthA = dataA.overview[GROWTH_MAP[metric]] as number;
    const growthB = dataB.overview[GROWTH_MAP[metric]] as number;
    const diff = valueA - valueB;
    const diffPercent = valueB !== 0 ? diff / valueB : 0;
    const leader = (valueA > valueB ? 'A' : valueA < valueB ? 'B' : 'tie') as 'A' | 'B' | 'tie';

    return {
      metric,
      label,
      icon,
      valueA,
      valueB,
      growthA,
      growthB,
      diff,
      diffPercent,
      leader
    };
  }

  const comparisonData = computed<RegionComparisonData | null>(() => {
    comparisonVersion.value;
    regionUpdateFlag.value;
    if (!compareMode.value.enabled) return null;

    const dataA = regionDataA.value;
    const dataB = regionDataB.value;
    
    if (!dataA || !dataB) return null;

    const metrics = METRIC_CONFIGS.map(config =>
      createMetricComparison(config.metric, config.label, config.icon, dataA, dataB)
    );

    const totalWinsA = metrics.filter(m => m.leader === 'A').length;
    const totalWinsB = metrics.filter(m => m.leader === 'B').length;
    const overallLeader = totalWinsA > totalWinsB ? 'A' : totalWinsA < totalWinsB ? 'B' : 'tie';

    const salesDiff = dataA.salesTrend.sales.map((s, i) => s - dataB.salesTrend.sales[i]);
    const ordersDiff = dataA.salesTrend.orders.map((o, i) => o - dataB.salesTrend.orders[i]);

    const categoryItems = dataA.categorySales.categories.map((cat, i) => {
      const salesA = dataA.categorySales.sales[i];
      const salesB = dataB.categorySales.sales[i];
      const growthA = dataA.categorySales.growth[i];
      const growthB = dataB.categorySales.growth[i];
      const diff = salesA - salesB;
      const diffPercent = salesB !== 0 ? diff / salesB : 0;
      const leader = (salesA > salesB ? 'A' : salesA < salesB ? 'B' : 'tie') as 'A' | 'B' | 'tie';

      return {
        category: cat,
        salesA,
        salesB,
        growthA,
        growthB,
        diff,
        diffPercent,
        leader
      };
    });

    return {
      summary: {
        regionA: dataA.overview.region,
        regionB: dataB.overview.region,
        metrics,
        totalWinsA,
        totalWinsB,
        overallLeader
      },
      trendDifference: {
        months: dataA.salesTrend.months,
        salesA: dataA.salesTrend.sales,
        salesB: dataB.salesTrend.sales,
        ordersA: dataA.salesTrend.orders,
        ordersB: dataB.salesTrend.orders,
        salesDiff,
        ordersDiff
      },
      categoryDifference: {
        items: categoryItems
      },
      dataA,
      dataB
    };
  });

  const isDark = computed(() => dashboard.value.theme === 'dark');
  
  const unreadAlerts = computed(() => alerts.value.filter(a => !a.isRead));
  const highRiskAlerts = computed(() => alerts.value.filter(a => a.level === 'high'));
  const unreadHighRiskCount = computed(() => highRiskAlerts.value.filter(a => !a.isRead).length);
  
  const alertsByLevel = computed(() => ({
    high: alerts.value.filter(a => a.level === 'high'),
    medium: alerts.value.filter(a => a.level === 'medium'),
    low: alerts.value.filter(a => a.level === 'low')
  }));
  
  const alertsByType = computed(() => ({
    abnormal_fluctuation: alerts.value.filter(a => a.type === 'abnormal_fluctuation'),
    continuous_decline: alerts.value.filter(a => a.type === 'continuous_decline'),
    surge: alerts.value.filter(a => a.type === 'surge')
  }));

  function toWan(num: number): number {
    return Number((num / 10000).toFixed(1));
  }

  function updateChartsForRegion(region: string) {
    if (!regionDataCache.value[region]) {
      regionDataCache.value[region] = generateRegionData(region);
    }
    const data = regionDataCache.value[region];

    const salesTrendChart = dashboard.value.charts.find(c => c.id === 'chart-1');
    if (salesTrendChart) {
      const newOption = {
        ...salesTrendChart.option,
        xAxis: { ...salesTrendChart.option.xAxis, data: [...data.salesTrend.months] },
        series: [
          { ...salesTrendChart.option.series[0], data: data.salesTrend.sales.map(toWan) },
          { ...salesTrendChart.option.series[1], data: data.salesTrend.orders.map(toWan) }
        ]
      };
      salesTrendChart.option = newOption;
    }

    const categoryChart = dashboard.value.charts.find(c => c.id === 'chart-2');
    if (categoryChart) {
      const newOption = {
        ...categoryChart.option,
        xAxis: { ...categoryChart.option.xAxis, data: [...data.categorySales.categories] },
        series: [{
          ...categoryChart.option.series[0],
          data: data.categorySales.sales.map((s, i) => ({
            value: toWan(s),
            growth: data.categorySales.growth[i]
          }))
        }]
      };
      categoryChart.option = newOption;
    }

    const marketShareChart = dashboard.value.charts.find(c => c.id === 'chart-3');
    if (marketShareChart) {
      const newOption = {
        ...marketShareChart.option,
        series: [{
          ...marketShareChart.option.series[0],
          data: data.marketShare.channels.map(c => ({
            name: c.name,
            value: toWan(c.value)
          }))
        }]
      };
      marketShareChart.option = newOption;
    }
  }

  function toggleTheme() {
    dashboard.value.theme = dashboard.value.theme === 'light' ? 'dark' : 'light';
    clearCurrentScheme();
  }

  function updateFilter(filterId: string, value: any) {
    const filter = dashboard.value.filters.find(f => f.id === filterId);
    if (filter) {
      filter.value = value;
      clearCurrentScheme();
      if (filter.field === 'region') {
        regionUpdateFlag.value++;
        updateChartsForRegion(value);
        refreshAlerts(true);
      }
    }
  }

  function updateChartGrid(chartId: string, gridArea: ChartConfig['gridArea']) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (chart) {
      chart.gridArea = gridArea;
      clearCurrentScheme();
    }
  }

  function addChart(chart: ChartConfig) {
    dashboard.value.charts.push(chart);
    clearCurrentScheme();
  }

  function removeChart(chartId: string) {
    dashboard.value.charts = dashboard.value.charts.filter(c => c.id !== chartId);
    clearCurrentScheme();
  }

  function updateChartData(chartId: string, option: Record<string, any>) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (chart) chart.option = { ...chart.option, ...option };
  }

  function generateChartOption(type: ChartConfig['type'], dimension: DataDimension, regionData: RegionData): Record<string, any> {
    const months = regionData.salesTrend.months;
    const categories = regionData.categorySales.categories;
    const channels = regionData.marketShare.channels.map(c => c.name);

    const salesData = regionData.salesTrend.sales.map(toWan);
    const ordersData = regionData.salesTrend.orders.map(toWan);
    const categorySalesData = regionData.categorySales.sales.map((s, i) => ({
      value: toWan(s),
      growth: regionData.categorySales.growth[i]
    }));
    const channelData = regionData.marketShare.channels.map(c => ({
      name: c.name,
      value: toWan(c.value)
    }));

    const customerGrowthData = months.map((_, i) => 
      Math.floor((80 + Math.random() * 40) * (1 + i * 0.05))
    );

    switch (dimension) {
      case 'salesTrend':
        if (type === 'line') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{ name: '销售额', data: salesData, type: 'line', smooth: true }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['销售额'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'bar') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{ name: '销售额', data: salesData, type: 'bar' }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['销售额'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'pie') {
          return {
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: months.map((m, i) => ({ name: m, value: salesData[i] }))
            }],
            tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' }
          };
        } else if (type === 'scatter') {
          return {
            xAxis: { type: 'value', name: '月份' },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{
              type: 'scatter',
              data: generateScatterData(12).map(p => [p[0] / 10, p[1] * 10])
            }],
            tooltip: { trigger: 'item' }
          };
        } else if (type === 'heatmap') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'category', data: ['销售额', '订单量', '客户数'] },
            visualMap: { min: 0, max: 2000, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
            series: [{
              type: 'heatmap',
              data: generateHeatmapData(6, 3),
              label: { show: true }
            }],
            tooltip: { trigger: 'item' },
            grid: { bottom: 60 }
          };
        }
        break;

      case 'ordersTrend':
        if (type === 'line') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '订单数(万)' },
            series: [{ name: '订单量', data: ordersData, type: 'line', smooth: true, itemStyle: { color: '#52c41a' } }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['订单量'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'bar') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '订单数(万)' },
            series: [{ name: '订单量', data: ordersData, type: 'bar', itemStyle: { color: '#52c41a' } }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['订单量'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'pie') {
          return {
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: months.map((m, i) => ({ name: m, value: ordersData[i] }))
            }],
            tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' }
          };
        } else if (type === 'scatter') {
          return {
            xAxis: { type: 'value', name: '销售额(万)' },
            yAxis: { type: 'value', name: '订单数(万)' },
            series: [{
              type: 'scatter',
              data: salesData.map((s, i) => [s, ordersData[i]])
            }],
            tooltip: { trigger: 'item', formatter: (params: any) => `销售额: ${params.data[0]}万<br/>订单数: ${params.data[1]}万` }
          };
        } else if (type === 'heatmap') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'category', data: ['订单量', '增长率', '客单价'] },
            visualMap: { min: 0, max: 500, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
            series: [{
              type: 'heatmap',
              data: generateHeatmapData(6, 3),
              label: { show: true }
            }],
            tooltip: { trigger: 'item' },
            grid: { bottom: 60 }
          };
        }
        break;

      case 'categorySales':
        if (type === 'bar') {
          return {
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{
              name: '销售额',
              data: categorySalesData,
              type: 'bar',
              itemStyle: { color: '#1890ff' }
            }],
            tooltip: {
              trigger: 'axis',
              formatter: (params: any) => {
                const data = params[0];
                const growth = data.data && typeof data.data === 'object' ? data.data.growth : 0;
                const growthText = growth >= 0 ? `+${(growth * 100).toFixed(1)}%` : `${(growth * 100).toFixed(1)}%`;
                const growthColor = growth >= 0 ? '#52c41a' : '#ff4d4f';
                return `${data.name}<br/>销售额: ${data.value} 万<br/>同比: <span style="color:${growthColor}">${growthText}</span>`;
              }
            },
            legend: { data: ['销售额'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'line') {
          return {
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{ name: '销售额', data: categorySalesData.map(d => d.value), type: 'line', smooth: true }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['销售额'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'pie') {
          return {
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: categories.map((c, i) => ({ name: c, value: categorySalesData[i].value }))
            }],
            tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' }
          };
        } else if (type === 'scatter') {
          return {
            xAxis: { type: 'value', name: '销售额(万)' },
            yAxis: { type: 'value', name: '增长率(%)' },
            series: [{
              type: 'scatter',
              data: categorySalesData.map(d => [d.value, (d.growth * 100).toFixed(1)])
            }],
            tooltip: { trigger: 'item', formatter: (params: any) => `销售额: ${params.data[0]}万<br/>增长率: ${params.data[1]}%` }
          };
        } else if (type === 'heatmap') {
          return {
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'category', data: ['销售额', '增长率', '市场占比'] },
            visualMap: { min: 0, max: 300, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
            series: [{
              type: 'heatmap',
              data: generateHeatmapData(5, 3),
              label: { show: true }
            }],
            tooltip: { trigger: 'item' },
            grid: { bottom: 60 }
          };
        }
        break;

      case 'marketShare':
        if (type === 'pie') {
          return {
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: channelData
            }],
            tooltip: { trigger: 'item', formatter: '{b}: {c}万 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' }
          };
        } else if (type === 'bar') {
          return {
            xAxis: { type: 'category', data: channels },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{ name: '渠道', data: channelData.map(c => c.value), type: 'bar', itemStyle: { color: '#722ed1' } }],
            tooltip: { trigger: 'axis', formatter: '{b}: {c}万' },
            legend: { data: ['渠道'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'line') {
          return {
            xAxis: { type: 'category', data: channels },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{ name: '渠道', data: channelData.map(c => c.value), type: 'line', smooth: true }],
            tooltip: { trigger: 'axis', formatter: '{b}: {c}万' },
            legend: { data: ['渠道'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'scatter') {
          return {
            xAxis: { type: 'value', name: '渠道指数' },
            yAxis: { type: 'value', name: '销售额(万)' },
            series: [{
              type: 'scatter',
              data: channelData.map((c, i) => [i + 1, c.value])
            }],
            tooltip: { trigger: 'item', formatter: (params: any) => `${channels[params.data[0] - 1]}: ${params.data[1]}万` }
          };
        } else if (type === 'heatmap') {
          return {
            xAxis: { type: 'category', data: channels },
            yAxis: { type: 'category', data: ['访问量', '转化率', '客单价'] },
            visualMap: { min: 0, max: 200, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
            series: [{
              type: 'heatmap',
              data: generateHeatmapData(5, 3),
              label: { show: true }
            }],
            tooltip: { trigger: 'item' },
            grid: { bottom: 60 }
          };
        }
        break;

      case 'customerGrowth':
        if (type === 'line') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '客户数(百)' },
            series: [{ name: '客户增长', data: customerGrowthData, type: 'line', smooth: true, itemStyle: { color: '#eb2f96' } }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['客户增长'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'bar') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'value', name: '客户数(百)' },
            series: [{ name: '客户增长', data: customerGrowthData, type: 'bar', itemStyle: { color: '#eb2f96' } }],
            tooltip: { trigger: 'axis' },
            legend: { data: ['客户增长'], bottom: 0 },
            grid: { bottom: 40 }
          };
        } else if (type === 'pie') {
          return {
            series: [{
              type: 'pie', radius: ['40%', '70%'],
              data: months.map((m, i) => ({ name: m, value: customerGrowthData[i] }))
            }],
            tooltip: { trigger: 'item', formatter: '{b}: {c}百 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' }
          };
        } else if (type === 'scatter') {
          return {
            xAxis: { type: 'value', name: '订单数(万)' },
            yAxis: { type: 'value', name: '客户数(百)' },
            series: [{
              type: 'scatter',
              data: ordersData.map((o, i) => [o, customerGrowthData[i]])
            }],
            tooltip: { trigger: 'item', formatter: (params: any) => `订单数: ${params.data[0]}万<br/>客户数: ${params.data[1]}百` }
          };
        } else if (type === 'heatmap') {
          return {
            xAxis: { type: 'category', data: months },
            yAxis: { type: 'category', data: ['新客户', '复购客户', '活跃度'] },
            visualMap: { min: 0, max: 150, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
            series: [{
              type: 'heatmap',
              data: generateHeatmapData(6, 3),
              label: { show: true }
            }],
            tooltip: { trigger: 'item' },
            grid: { bottom: 60 }
          };
        }
        break;
    }

    return {
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
      yAxis: { type: 'value' },
      series: [{ data: [100, 200, 150, 80], type: 'bar' }],
      tooltip: { trigger: 'axis' }
    };
  }

  function createCustomChart(type: ChartConfig['type'], title: string, dimension: DataDimension): ChartConfig {
    const id = `chart-custom-${Date.now()}`;
    const region = currentRegion.value;
    const data = regionDataCache.value[region] || generateRegionData(region);
    
    const chartsCount = dashboard.value.charts.length;
    const row = Math.floor(chartsCount / 2) * 4;
    const col = chartsCount % 2 === 0 ? 0 : 6;

    const chart: ChartConfig = {
      id,
      type,
      title,
      gridArea: { x: col, y: row + 8, w: 6, h: 4 },
      option: generateChartOption(type, dimension, data),
      isCustom: true,
      dataDimension: dimension
    };

    return chart;
  }

  function addCustomChart(type: ChartConfig['type'], title: string, dimension: DataDimension): ChartConfig {
    const chart = createCustomChart(type, title, dimension);
    dashboard.value.charts.push(chart);
    clearCurrentScheme();
    return chart;
  }

  function refreshCustomChart(chartId: string) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart || !chart.isCustom || !chart.dataDimension) return;

    const region = currentRegion.value;
    const data = generateRegionData(region);
    regionDataCache.value[region] = data;
    
    const newOption = generateChartOption(chart.type, chart.dataDimension, data);
    chart.option = { ...newOption };
  }

  function refreshRegionData() {
    const region = currentRegion.value;
    regionDataCache.value[region] = generateRegionData(region);
    regionUpdateFlag.value++;
    updateChartsForRegion(region);
    
    dashboard.value.charts.forEach(chart => {
      if (chart.isCustom) {
        refreshCustomChart(chart.id);
      }
    });
    
    if (alertAutoRefresh.value) {
      refreshAlerts();
    }
  }
  
  function refreshAlerts(forceRefresh: boolean = false) {
    const detectedAlerts = generateAlerts(currentRegionData.value);
    const mockAlerts = generateMockAlerts();
    
    if (alerts.value.length === 0 || forceRefresh) {
      const mockAlertKeys = new Set(mockAlerts.map(a => `${a.type}-${a.metricName}`));
      const existingMockAlerts = alerts.value.filter(a => mockAlertKeys.has(`${a.type}-${a.metricName}`));
      
      const newMockAlerts = mockAlerts.filter(mock => 
        !existingMockAlerts.some(existing => 
          existing.type === mock.type && existing.metricName === mock.metricName
        )
      );
      
      const allMockAlerts = [...existingMockAlerts, ...newMockAlerts];
      const allAlerts = [...detectedAlerts, ...allMockAlerts];
      
      alerts.value = allAlerts.sort((a, b) => {
        const levelOrder: Record<AlertLevel, number> = { high: 0, medium: 1, low: 2 };
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[a.level] - levelOrder[b.level];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    } else {
      const detectedKeys = new Set(detectedAlerts.map(a => `${a.type}-${a.metricName}`));
      const filteredExisting = alerts.value.filter(a => !detectedKeys.has(`${a.type}-${a.metricName}`));
      
      const allAlerts = [...detectedAlerts, ...filteredExisting];
      alerts.value = allAlerts.sort((a, b) => {
        const levelOrder: Record<AlertLevel, number> = { high: 0, medium: 1, low: 2 };
        if (levelOrder[a.level] !== levelOrder[b.level]) {
          return levelOrder[a.level] - levelOrder[b.level];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    }
    
    lastAlertUpdate.value = new Date().toISOString();
  }
  
  function markAlertAsRead(alertId: string) {
    const alert = alerts.value.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }
  
  function markAllAlertsAsRead() {
    alerts.value.forEach(alert => {
      alert.isRead = true;
    });
  }
  
  function dismissAlert(alertId: string) {
    alerts.value = alerts.value.filter(a => a.id !== alertId);
  }
  
  function clearAllAlerts() {
    alerts.value = [];
  }
  
  function setHighlightedChart(chartId: string | null) {
    highlightedChartId.value = chartId;
  }

  function getChartDimension(chartId: string): DataDimension {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart) return 'salesTrend';
    if (chart.dataDimension) return chart.dataDimension;
    if (chartId === 'chart-1') return 'salesTrend';
    if (chartId === 'chart-2') return 'categorySales';
    if (chartId === 'chart-3') return 'marketShare';
    return 'salesTrend';
  }

  async function openChartDetail(chartId: string) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart) return;

    chartDetailLoading.value = true;
    selectedChartId.value = chartId;
    chartDetailDrawerVisible.value = true;

    try {
      await nextTick();
      const dimension = getChartDimension(chartId);
      const region = currentRegion.value;
      const regionData = regionDataCache.value[region] || generateRegionData(region);
      chartDetailData.value = generateChartDetailData(
        chartId,
        chart.title,
        chart.type,
        dimension,
        regionData
      );
    } finally {
      chartDetailLoading.value = false;
    }
  }

  function closeChartDetail() {
    chartDetailDrawerVisible.value = false;
    setTimeout(() => {
      selectedChartId.value = null;
      chartDetailData.value = null;
    }, 300);
  }

  function refreshChartDetail() {
    if (selectedChartId.value) {
      openChartDetail(selectedChartId.value);
    }
  }
  
  function toggleAlertAutoRefresh() {
    alertAutoRefresh.value = !alertAutoRefresh.value;
  }

  function ensureCompareDataLoaded() {
    const regionA = compareMode.value.regionA;
    const regionB = compareMode.value.regionB;
    
    if (!regionDataCache.value[regionA]) {
      regionDataCache.value[regionA] = generateRegionData(regionA);
    }
    if (!regionDataCache.value[regionB]) {
      regionDataCache.value[regionB] = generateRegionData(regionB);
    }
  }

  async function toggleCompareMode() {
    const newEnabled = !compareMode.value.enabled;
    compareMode.value.enabled = newEnabled;
    comparisonVersion.value++;
    clearCurrentScheme();
    
    if (newEnabled) {
      compareModeLoading.value = true;
      try {
        ensureCompareDataLoaded();
        regionUpdateFlag.value++;
        comparisonVersion.value++;
        await nextTick();
      } finally {
        compareModeLoading.value = false;
      }
    }
  }

  async function setCompareRegion(side: 'A' | 'B', region: string) {
    if (side === 'A') {
      if (region === compareMode.value.regionB) {
        compareMode.value.regionB = compareMode.value.regionA;
      }
      compareMode.value.regionA = region;
    } else {
      if (region === compareMode.value.regionA) {
        compareMode.value.regionA = compareMode.value.regionB;
      }
      compareMode.value.regionB = region;
    }
    
    clearCurrentScheme();
    compareModeLoading.value = true;
    comparisonVersion.value++;
    try {
      ensureCompareDataLoaded();
      regionUpdateFlag.value++;
      comparisonVersion.value++;
      await nextTick();
    } finally {
      compareModeLoading.value = false;
    }
  }

  async function refreshComparisonData() {
    compareModeLoading.value = true;
    comparisonVersion.value++;
    try {
      const regionA = compareMode.value.regionA;
      const regionB = compareMode.value.regionB;
      regionDataCache.value[regionA] = generateRegionData(regionA);
      regionDataCache.value[regionB] = generateRegionData(regionB);
      regionUpdateFlag.value++;
      comparisonVersion.value++;
      await nextTick();
    } finally {
      compareModeLoading.value = false;
    }
  }

  updateChartsForRegion('all');
  refreshAlerts();
  loadSchemesFromStorage();

  return {
    dashboard, isDark,
    currentRegion, currentRegionData, regionOverview,
    alerts, unreadAlerts, highRiskAlerts, unreadHighRiskCount,
    alertsByLevel, alertsByType,
    highlightedChartId, alertAutoRefresh, lastAlertUpdate,
    chartDetailDrawerVisible, selectedChartId, chartDetailData, chartDetailLoading,
    compareMode, compareModeLoading, comparisonData, comparisonVersion, regionDataA, regionDataB,
    schemes, currentSchemeId, currentScheme, schemeLoading,
    saveScheme, applyScheme, deleteScheme, renameScheme, checkSchemeNameExists, clearCurrentScheme,
    toggleTheme, updateFilter, updateChartGrid, addChart, removeChart, updateChartData,
    refreshRegionData, updateChartsForRegion,
    refreshAlerts, markAlertAsRead, markAllAlertsAsRead,
    dismissAlert, clearAllAlerts, setHighlightedChart, toggleAlertAutoRefresh,
    openChartDetail, closeChartDetail, refreshChartDetail,
    addCustomChart, refreshCustomChart, generateChartOption,
    toggleCompareMode, setCompareRegion, refreshComparisonData, ensureCompareDataLoaded
  };
});
