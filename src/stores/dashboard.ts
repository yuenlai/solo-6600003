import { defineStore } from 'pinia';
import { ref, computed, nextTick, watch } from 'vue';
import type { Dashboard, ChartConfig, RegionData, Alert, AlertLevel, DataDimension, CompareModeState, RegionComparisonData, MetricComparison, MetricName, DashboardScheme, FilterConfig, ChartDetailData, KeywordMatchResult, ChartKeywordMatch, KeywordMatchItem, OverviewKeywordMatch, ChartRefreshResult, ChartDataChange } from '../types';
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
  const dateRangeUpdateFlag = ref(0);

  function getRegionCacheKey(region: string, dateRangeStr?: string): string {
    const dr = dateRangeStr ?? getCurrentDateRangeString();
    return `${region}${dr ? `_${dr}` : ''}`;
  }

  function getCurrentDateRangeString(): string {
    const dateFilter = dashboard.value.filters.find(f => f.field === 'dateRange');
    if (dateFilter && Array.isArray(dateFilter.value) && dateFilter.value.length === 2 && dateFilter.value[0] && dateFilter.value[1]) {
      return `${dateFilter.value[0]}_${dateFilter.value[1]}`;
    }
    return '';
  }

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
        dateRangeUpdateFlag.value++;
        updateChartsForRegion(regionFilter.value);
        refreshAlerts(true);
      }

      if (newCompareEnabled) {
        ensureCompareDataLoaded();
        comparisonVersion.value++;
        regionUpdateFlag.value++;
        dateRangeUpdateFlag.value++;
      } else if (previousCompareEnabled && !newCompareEnabled) {
        regionUpdateFlag.value++;
        dateRangeUpdateFlag.value++;
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

  const currentDateRange = computed(() => {
    const dateFilter = dashboard.value.filters.find(f => f.field === 'dateRange');
    if (dateFilter && Array.isArray(dateFilter.value) && dateFilter.value.length === 2) {
      return {
        startDate: dateFilter.value[0] || null,
        endDate: dateFilter.value[1] || null
      };
    }
    return { startDate: null, endDate: null };
  });

  const hasDateRangeFilter = computed(() => {
    return currentDateRange.value.startDate 
      && currentDateRange.value.endDate
      && currentDateRange.value.startDate <= currentDateRange.value.endDate;
  });

  const activeFilters = computed(() => {
    return dashboard.value.filters.filter(filter => {
      if (filter.type === 'select') {
        return filter.value && filter.value !== 'all';
      }
      if (filter.type === 'text') {
        return filter.value && filter.value.trim() !== '';
      }
      if (filter.type === 'date-range') {
        return Array.isArray(filter.value) 
          && filter.value.length === 2 
          && filter.value[0] 
          && filter.value[1]
          && filter.value[0] <= filter.value[1];
      }
      return false;
    });
  });

  const activeFiltersCount = computed(() => activeFilters.value.length);

  const compareModeActiveFilters = computed((): (FilterConfig & { field: string })[] => {
    if (!compareMode.value.enabled) return [];
    return [
      { id: 'compare-A', field: 'compareRegionA', label: '对比地区A', type: 'select' as const, value: compareMode.value.regionA },
      { id: 'compare-B', field: 'compareRegionB', label: '对比地区B', type: 'select' as const, value: compareMode.value.regionB }
    ];
  });

  const allActiveFilters = computed(() => {
    return [...activeFilters.value, ...compareModeActiveFilters.value];
  });

  const filterHitScope = computed(() => {
    const region = currentRegion.value;
    const overview = currentRegionData.value.overview;
    dateRangeUpdateFlag.value;
    
    const totalRecords = 1000;
    const keywordFilter = dashboard.value.filters.find(f => f.field === 'keyword');
    const dateFilter = dashboard.value.filters.find(f => f.field === 'dateRange');
    
    let hitRate = 1.0;
    if (keywordFilter && keywordFilter.value && keywordFilter.value.trim() !== '') {
      hitRate *= 0.3;
    }
    const dateRangeValid = dateFilter 
      && Array.isArray(dateFilter.value) 
      && dateFilter.value.length === 2 
      && dateFilter.value[0] 
      && dateFilter.value[1]
      && dateFilter.value[0] <= dateFilter.value[1];
    
    if (dateRangeValid) {
      const start = new Date(dateFilter.value[0]);
      const end = new Date(dateFilter.value[1]);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      hitRate *= Math.max(0.1, Math.min(0.8, diffDays / 180));
    }
    if (region !== 'all') {
      hitRate *= 0.4;
    }
    if (compareMode.value.enabled) {
      hitRate *= 0.8;
    }
    
    const hitRecords = Math.floor(totalRecords * hitRate);
    
    return {
      total: totalRecords,
      hit: hitRecords,
      percentage: ((hitRecords / totalRecords) * 100).toFixed(1),
      region: region === 'all' ? '全国' : region,
      totalSales: overview.totalSales,
      totalOrders: overview.orderCount,
      totalCustomers: overview.customerCount
    };
  });

  function normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  function isTextMatch(text: string, keyword: string): boolean {
    if (!keyword || !keyword.trim()) return false;
    const normalizedText = normalizeText(text);
    const normalizedKeyword = normalizeText(keyword);
    return normalizedText.includes(normalizedKeyword);
  }

  function createMatchItem(name: string, keyword: string, highlightColor?: string): KeywordMatchItem {
    return {
      name,
      matched: isTextMatch(name, keyword),
      highlightColor
    };
  }

  const currentKeyword = computed(() => {
    const filter = dashboard.value.filters.find(f => f.field === 'keyword');
    return filter ? (filter.value as string) || '' : '';
  });

  const OVERVIEW_METRICS = [
    { metricName: '总销售额', icon: '💰' },
    { metricName: '订单量', icon: '📦' },
    { metricName: '客单价', icon: '💎' },
    { metricName: '客户数', icon: '👥' }
  ];

  const keywordMatchResult = computed<KeywordMatchResult>(() => {
    const keyword = currentKeyword.value;
    const hasActiveFilter = !!keyword && keyword.trim() !== '';

    if (!hasActiveFilter) {
      return {
        hasActiveFilter: false,
        hasAnyMatch: true,
        totalMatches: 0,
        totalItems: 0,
        chartMatches: [],
        overviewMatches: [],
        matchedChartIds: []
      };
    }

    let totalMatches = 0;
    let totalItems = 0;
    const matchedChartIds: string[] = [];

    const overviewMatches: OverviewKeywordMatch[] = OVERVIEW_METRICS.map(m => {
      const matched = isTextMatch(m.metricName, keyword);
      totalItems++;
      if (matched) totalMatches++;
      return { metricName: m.metricName, matched };
    });

    const chartMatches: ChartKeywordMatch[] = dashboard.value.charts.map(chart => {
      const titleMatched = isTextMatch(chart.title, keyword);
      totalItems++;
      if (titleMatched) totalMatches++;

      const legendData = chart.option.legend?.data || [];
      const legendMatches: KeywordMatchItem[] = legendData.map((name: string) => {
        const match = createMatchItem(name, keyword);
        totalItems++;
        if (match.matched) totalMatches++;
        return match;
      });

      let categoryMatches: KeywordMatchItem[] = [];
      const xAxisData = chart.option.xAxis?.data;
      if (xAxisData && Array.isArray(xAxisData)) {
        categoryMatches = xAxisData.map((name: string) => {
          const match = createMatchItem(name, keyword);
          totalItems++;
          if (match.matched) totalMatches++;
          return match;
        });
      }

      let seriesMatches: KeywordMatchItem[] = [];
      const series = chart.option.series;
      if (series && Array.isArray(series)) {
        series.forEach((s: any) => {
          if (s.data && Array.isArray(s.data)) {
            s.data.forEach((item: any) => {
              let name = '';
              if (typeof item === 'object' && item !== null && item.name) {
                name = item.name;
              }
              if (name) {
                const match = createMatchItem(name, keyword);
                totalItems++;
                if (match.matched) totalMatches++;
                seriesMatches.push(match);
              }
            });
          }
        });
      }

      const hasAnyMatch = titleMatched 
        || legendMatches.some(m => m.matched)
        || categoryMatches.some(m => m.matched)
        || seriesMatches.some(m => m.matched);

      if (hasAnyMatch) {
        matchedChartIds.push(chart.id);
      }

      return {
        chartId: chart.id,
        titleMatched,
        legendMatches,
        categoryMatches,
        seriesMatches,
        hasAnyMatch
      };
    });

    const hasAnyMatch = totalMatches > 0;

    return {
      hasActiveFilter: true,
      hasAnyMatch,
      totalMatches,
      totalItems,
      chartMatches,
      overviewMatches,
      matchedChartIds,
      noMatchReason: hasAnyMatch ? undefined : `未找到包含"${keyword}"的匹配结果`
    };
  });

  function getChartMatch(chartId: string): ChartKeywordMatch | undefined {
    return keywordMatchResult.value.chartMatches.find(m => m.chartId === chartId);
  }

  function getHighlightedChartOption(chartId: string, baseOption: Record<string, any>): Record<string, any> {
    const match = getChartMatch(chartId);
    if (!match || !keywordMatchResult.value.hasActiveFilter) {
      return baseOption;
    }

    const option = JSON.parse(JSON.stringify(baseOption));
    const keyword = currentKeyword.value;

    if (option.legend && option.legend.data) {
      option.legend.selected = option.legend.selected || {};
      option.legend.data.forEach((name: string) => {
        const itemMatch = match.legendMatches.find(m => m.name === name);
        const matched = itemMatch?.matched || match.titleMatched;
        option.legend.selected[name] = matched || !keywordMatchResult.value.hasAnyMatch;
      });
    }

    if (option.series && Array.isArray(option.series)) {
      option.series = option.series.map((series: any) => {
        const seriesName = series.name || '';
        const seriesMatched = isTextMatch(seriesName, keyword) || match.titleMatched;

        if (series.data && Array.isArray(series.data)) {
          series.data = series.data.map((item: any, dataIndex: number) => {
            let itemName = '';

            if (typeof item === 'object' && item !== null) {
              itemName = item.name || '';
            } else if (option.xAxis?.data && option.xAxis.data[dataIndex]) {
              itemName = option.xAxis.data[dataIndex];
            }

            const categoryMatch = match.categoryMatches.find(m => m.name === itemName);
            const seriesItemMatch = match.seriesMatches.find(m => m.name === itemName);
            const itemMatched = categoryMatch?.matched || seriesItemMatch?.matched || seriesMatched;

            const shouldHighlight = keywordMatchResult.value.hasAnyMatch 
              ? itemMatched 
              : true;

            if (typeof item === 'object' && item !== null) {
              return {
                ...item,
                itemStyle: shouldHighlight ? {
                  ...item.itemStyle,
                  opacity: 1,
                  shadowBlur: 10,
                  shadowColor: 'rgba(59, 130, 246, 0.8)'
                } : {
                  ...item.itemStyle,
                  opacity: 0.2
                },
                label: item.label && shouldHighlight ? {
                  ...item.label,
                  fontWeight: 'bold',
                  color: '#3b82f6'
                } : item.label
              };
            } else {
              return {
                value: item,
                itemStyle: shouldHighlight ? {
                  opacity: 1,
                  shadowBlur: 10,
                  shadowColor: 'rgba(59, 130, 246, 0.8)'
                } : {
                  opacity: 0.2
                }
              };
            }
          });
        }

        if (series.type === 'pie') {
          const shouldHighlight = keywordMatchResult.value.hasAnyMatch 
            ? seriesMatched 
            : true;
          series.itemStyle = shouldHighlight ? {
            ...series.itemStyle,
            opacity: 1,
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.8)'
          } : {
            ...series.itemStyle,
            opacity: 0.2
          };
        }

        return series;
      });
    }

    return option;
  }

  const currentRegionData = computed(() => {
    const region = currentRegion.value;
    regionUpdateFlag.value;
    dateRangeUpdateFlag.value;
    const cacheKey = getRegionCacheKey(region);
    if (!regionDataCache.value[cacheKey]) {
      regionDataCache.value[cacheKey] = generateRegionData(region, currentDateRange.value);
    }
    return regionDataCache.value[cacheKey];
  });

  const regionOverview = computed(() => {
    regionUpdateFlag.value;
    dateRangeUpdateFlag.value;
    return currentRegionData.value.overview;
  });

  const regionDataA = computed(() => {
    regionUpdateFlag.value;
    dateRangeUpdateFlag.value;
    const region = compareMode.value.regionA;
    const cacheKey = getRegionCacheKey(region);
    if (!regionDataCache.value[cacheKey]) {
      regionDataCache.value[cacheKey] = generateRegionData(region, currentDateRange.value);
    }
    return regionDataCache.value[cacheKey];
  });

  const regionDataB = computed(() => {
    regionUpdateFlag.value;
    dateRangeUpdateFlag.value;
    const region = compareMode.value.regionB;
    const cacheKey = getRegionCacheKey(region);
    if (!regionDataCache.value[cacheKey]) {
      regionDataCache.value[cacheKey] = generateRegionData(region, currentDateRange.value);
    }
    return regionDataCache.value[cacheKey];
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
    const cacheKey = getRegionCacheKey(region);
    if (!regionDataCache.value[cacheKey]) {
      regionDataCache.value[cacheKey] = generateRegionData(region, currentDateRange.value);
    }
    const data = regionDataCache.value[cacheKey];

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
      } else if (filter.field === 'dateRange') {
        dateRangeUpdateFlag.value++;
        const region = currentRegion.value;
        updateChartsForRegion(region);
        refreshAlerts(true);
        if (compareMode.value.enabled) {
          comparisonVersion.value++;
          ensureCompareDataLoaded();
        }
      }
    }
  }

  function clearFilter(filterId: string) {
    if (filterId === 'compare-A' || filterId === 'compare-B') {
      if (compareMode.value.enabled) {
        toggleCompareMode();
      }
      return;
    }
    const filter = dashboard.value.filters.find(f => f.id === filterId);
    if (filter) {
      if (filter.type === 'select') {
        filter.value = 'all';
      } else if (filter.type === 'text') {
        filter.value = '';
      } else if (filter.type === 'date-range') {
        filter.value = [];
      }
      clearCurrentScheme();
      if (filter.field === 'region') {
        regionUpdateFlag.value++;
        updateChartsForRegion(filter.value);
        refreshAlerts(true);
      } else if (filter.field === 'dateRange') {
        dateRangeUpdateFlag.value++;
        const region = currentRegion.value;
        updateChartsForRegion(region);
        refreshAlerts(true);
        if (compareMode.value.enabled) {
          comparisonVersion.value++;
          ensureCompareDataLoaded();
        }
      }
    }
  }

  function clearAllFilters() {
    dashboard.value.filters.forEach(filter => {
      if (filter.type === 'select') {
        filter.value = 'all';
      } else if (filter.type === 'text') {
        filter.value = '';
      } else if (filter.type === 'date-range') {
        filter.value = [];
      }
    });
    if (compareMode.value.enabled) {
      compareMode.value.enabled = false;
    }
    clearCurrentScheme();
    regionUpdateFlag.value++;
    dateRangeUpdateFlag.value++;
    updateChartsForRegion('all');
    refreshAlerts(true);
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
    const cacheKey = getRegionCacheKey(region);
    const data = regionDataCache.value[cacheKey] || generateRegionData(region, currentDateRange.value);
    
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

  function extractSeriesValues(option: Record<string, any>): { name: string; value: number }[] {
    const result: { name: string; value: number }[] = [];
    if (!option.series || !Array.isArray(option.series)) return result;

    option.series.forEach((series: any) => {
      const seriesName = series.name || '未命名';
      if (series.data && Array.isArray(series.data)) {
        let total = 0;
        let count = 0;
        series.data.forEach((item: any) => {
          let value = 0;
          if (typeof item === 'number') {
            value = item;
          } else if (typeof item === 'object' && item !== null) {
            value = typeof item.value === 'number' ? item.value : 0;
          }
          total += value;
          count++;
        });
        if (count > 0) {
          result.push({ name: seriesName, value: total });
        }
      }
    });
    return result;
  }

  function calculateDataChanges(
    oldOption: Record<string, any>,
    newOption: Record<string, any>
  ): ChartDataChange[] {
    const oldValues = extractSeriesValues(oldOption);
    const newValues = extractSeriesValues(newOption);
    const changes: ChartDataChange[] = [];

    oldValues.forEach((oldItem, index) => {
      const newItem = newValues[index] || { name: oldItem.name, value: oldItem.value };
      const oldValue = oldItem.value;
      const newValue = newItem.value;
      const changeValue = newValue - oldValue;
      const changePercent = oldValue !== 0 ? changeValue / oldValue : 0;

      changes.push({
        seriesName: oldItem.name,
        oldValue,
        newValue,
        changeValue,
        changePercent
      });
    });

    return changes;
  }

  function formatRefreshResult(
    chartId: string,
    chartTitle: string,
    startTime: number,
    dataChanges: ChartDataChange[]
  ): ChartRefreshResult {
    const totalChangeCount = dataChanges.filter(c => Math.abs(c.changeValue) > 0.001).length;
    const maxChange = dataChanges.length > 0
      ? dataChanges.reduce((max, curr) => 
          Math.abs(curr.changePercent) > Math.abs(max.changePercent) ? curr : max
        , dataChanges[0])
      : null;

    return {
      chartId,
      chartTitle,
      refreshedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      dataChanges,
      totalChangeCount,
      hasChanges: totalChangeCount > 0,
      maxChange
    };
  }

  function refreshCustomChart(chartId: string): ChartRefreshResult | null {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart || !chart.isCustom || !chart.dataDimension) return null;

    const startTime = Date.now();
    const oldOption = JSON.parse(JSON.stringify(chart.option));

    const region = currentRegion.value;
    const cacheKey = getRegionCacheKey(region);
    const data = generateRegionData(region, currentDateRange.value);
    regionDataCache.value[cacheKey] = data;
    
    const newOption = generateChartOption(chart.type, chart.dataDimension, data);
    chart.option = { ...newOption };

    const dataChanges = calculateDataChanges(oldOption, newOption);
    return formatRefreshResult(chartId, chart.title, startTime, dataChanges);
  }

  function refreshBuiltinChart(chartId: string): ChartRefreshResult | null {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart || chart.isCustom) return null;

    const startTime = Date.now();
    const oldOption = JSON.parse(JSON.stringify(chart.option));

    const region = currentRegion.value;
    const cacheKey = getRegionCacheKey(region);
    const data = generateRegionData(region, currentDateRange.value);
    regionDataCache.value[cacheKey] = data;
    regionUpdateFlag.value++;
    dateRangeUpdateFlag.value++;

    if (chartId === 'chart-1') {
      const newOption = {
        ...chart.option,
        xAxis: { ...chart.option.xAxis, data: [...data.salesTrend.months] },
        series: [
          { ...chart.option.series[0], data: data.salesTrend.sales.map(toWan) },
          { ...chart.option.series[1], data: data.salesTrend.orders.map(toWan) }
        ]
      };
      chart.option = newOption;
    } else if (chartId === 'chart-2') {
      const newOption = {
        ...chart.option,
        xAxis: { ...chart.option.xAxis, data: [...data.categorySales.categories] },
        series: [{
          ...chart.option.series[0],
          data: data.categorySales.sales.map((s, i) => ({
            value: toWan(s),
            growth: data.categorySales.growth[i]
          }))
        }]
      };
      chart.option = newOption;
    } else if (chartId === 'chart-3') {
      const newOption = {
        ...chart.option,
        series: [{
          ...chart.option.series[0],
          data: data.marketShare.channels.map(c => ({
            name: c.name,
            value: toWan(c.value)
          }))
        }]
      };
      chart.option = newOption;
    }

    const dataChanges = calculateDataChanges(oldOption, chart.option);
    return formatRefreshResult(chartId, chart.title, startTime, dataChanges);
  }

  function refreshSingleChart(chartId: string): ChartRefreshResult | null {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (!chart) return null;

    if (chart.isCustom) {
      return refreshCustomChart(chartId);
    } else {
      return refreshBuiltinChart(chartId);
    }
  }

  function refreshRegionData() {
    const region = currentRegion.value;
    const cacheKey = getRegionCacheKey(region);
    regionDataCache.value[cacheKey] = generateRegionData(region, currentDateRange.value);
    regionUpdateFlag.value++;
    dateRangeUpdateFlag.value++;
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
      const cacheKey = getRegionCacheKey(region);
      const regionData = regionDataCache.value[cacheKey] || generateRegionData(region, currentDateRange.value);
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
    
    const cacheKeyA = getRegionCacheKey(regionA);
    const cacheKeyB = getRegionCacheKey(regionB);
    
    if (!regionDataCache.value[cacheKeyA]) {
      regionDataCache.value[cacheKeyA] = generateRegionData(regionA, currentDateRange.value);
    }
    if (!regionDataCache.value[cacheKeyB]) {
      regionDataCache.value[cacheKeyB] = generateRegionData(regionB, currentDateRange.value);
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
      const cacheKeyA = getRegionCacheKey(regionA);
      const cacheKeyB = getRegionCacheKey(regionB);
      regionDataCache.value[cacheKeyA] = generateRegionData(regionA, currentDateRange.value);
      regionDataCache.value[cacheKeyB] = generateRegionData(regionB, currentDateRange.value);
      regionUpdateFlag.value++;
      dateRangeUpdateFlag.value++;
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
    currentDateRange, hasDateRangeFilter,
    alerts, unreadAlerts, highRiskAlerts, unreadHighRiskCount,
    alertsByLevel, alertsByType,
    highlightedChartId, alertAutoRefresh, lastAlertUpdate,
    chartDetailDrawerVisible, selectedChartId, chartDetailData, chartDetailLoading,
    compareMode, compareModeLoading, comparisonData, comparisonVersion, regionDataA, regionDataB,
    schemes, currentSchemeId, currentScheme, schemeLoading,
    activeFilters, activeFiltersCount, compareModeActiveFilters, allActiveFilters, filterHitScope,
    currentKeyword, keywordMatchResult,
    saveScheme, applyScheme, deleteScheme, renameScheme, checkSchemeNameExists, clearCurrentScheme,
    toggleTheme, updateFilter, clearFilter, clearAllFilters, updateChartGrid, addChart, removeChart, updateChartData,
    refreshRegionData, updateChartsForRegion,
    refreshAlerts, markAlertAsRead, markAllAlertsAsRead,
    dismissAlert, clearAllAlerts, setHighlightedChart, toggleAlertAutoRefresh,
    openChartDetail, closeChartDetail, refreshChartDetail,
    addCustomChart, refreshCustomChart, refreshBuiltinChart, refreshSingleChart, generateChartOption,
    toggleCompareMode, setCompareRegion, refreshComparisonData, ensureCompareDataLoaded,
    getChartMatch, getHighlightedChartOption, isTextMatch
  };
});
