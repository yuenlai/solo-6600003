import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Dashboard, ChartConfig, FilterConfig } from '../types';

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboard = ref<Dashboard>({
    id: 'dashboard-1',
    name: '数据分析仪表盘',
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
          yAxis: { type: 'value' },
          series: [{ data: [820, 932, 901, 934, 1290, 1330], type: 'line', smooth: true }],
          tooltip: { trigger: 'axis' }
        }
      },
      {
        id: 'chart-2', type: 'bar', title: '分类销量',
        gridArea: { x: 6, y: 0, w: 6, h: 4 },
        option: {
          xAxis: { type: 'category', data: ['电子产品', '服装', '食品', '家居', '运动'] },
          yAxis: { type: 'value' },
          series: [{ data: [120, 200, 150, 80, 70], type: 'bar' }],
          tooltip: { trigger: 'axis' }
        }
      },
      {
        id: 'chart-3', type: 'pie', title: '市场份额',
        gridArea: { x: 0, y: 4, w: 4, h: 4 },
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
          tooltip: { trigger: 'item' }
        }
      },
      {
        id: 'chart-4', type: 'scatter', title: '数据分布',
        gridArea: { x: 4, y: 4, w: 4, h: 4 },
        option: {
          xAxis: { type: 'value' }, yAxis: { type: 'value' },
          series: [{ type: 'scatter', data: Array.from({ length: 50 }, () => [Math.random() * 100, Math.random() * 100]), symbolSize: 8 }],
          tooltip: { trigger: 'item' }
        }
      },
      {
        id: 'chart-5', type: 'heatmap', title: '访问热力图',
        gridArea: { x: 8, y: 4, w: 4, h: 4 },
        option: {
          xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
          yAxis: { type: 'category', data: ['0-6', '6-12', '12-18', '18-24'] },
          visualMap: { min: 0, max: 100, calculable: true },
          series: [{
            type: 'heatmap',
            data: Array.from({ length: 28 }, (_, i) => [Math.floor(i / 4), i % 4, Math.floor(Math.random() * 100)])
          }]
        }
      }
    ]
  });

  const isDark = computed(() => dashboard.value.theme === 'dark');

  function toggleTheme() {
    dashboard.value.theme = dashboard.value.theme === 'light' ? 'dark' : 'light';
  }

  function updateFilter(filterId: string, value: any) {
    const filter = dashboard.value.filters.find(f => f.id === filterId);
    if (filter) filter.value = value;
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

  return {
    dashboard, isDark,
    toggleTheme, updateFilter, updateChartGrid, addChart, removeChart, updateChartData
  };
});
