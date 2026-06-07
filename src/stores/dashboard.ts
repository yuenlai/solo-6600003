import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Dashboard, ChartConfig, RegionData } from '../types';
import { generateRegionData } from '../mock/data';

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

  const isDark = computed(() => dashboard.value.theme === 'dark');

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
  }

  function updateFilter(filterId: string, value: any) {
    const filter = dashboard.value.filters.find(f => f.id === filterId);
    if (filter) {
      filter.value = value;
      if (filter.field === 'region') {
        regionUpdateFlag.value++;
        updateChartsForRegion(value);
      }
    }
  }

  function updateChartGrid(chartId: string, gridArea: ChartConfig['gridArea']) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (chart) chart.gridArea = gridArea;
  }

  function addChart(chart: ChartConfig) {
    dashboard.value.charts.push(chart);
  }

  function removeChart(chartId: string) {
    dashboard.value.charts = dashboard.value.charts.filter(c => c.id !== chartId);
  }

  function updateChartData(chartId: string, option: Record<string, any>) {
    const chart = dashboard.value.charts.find(c => c.id === chartId);
    if (chart) chart.option = { ...chart.option, ...option };
  }

  function refreshRegionData() {
    const region = currentRegion.value;
    regionDataCache.value[region] = generateRegionData(region);
    regionUpdateFlag.value++;
    updateChartsForRegion(region);
  }

  updateChartsForRegion('all');

  return {
    dashboard, isDark,
    currentRegion, currentRegionData, regionOverview,
    toggleTheme, updateFilter, updateChartGrid, addChart, removeChart, updateChartData,
    refreshRegionData, updateChartsForRegion
  };
});
