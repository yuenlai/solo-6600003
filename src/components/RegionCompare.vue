<template>
  <div v-if="comparisonData && comparisonData.summary && comparisonData.summary.metrics" class="region-compare space-y-6">
    <div class="compare-header bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-xl p-6 text-white shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold">A</span>
              <span class="text-2xl font-bold">{{ comparisonData.summary.regionA }}</span>
              <span v-if="comparisonData.summary.overallLeader === 'A'" class="ml-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full animate-pulse">
                🏆 综合领先
              </span>
            </div>
            <div class="text-blue-100 text-sm">
              {{ comparisonData.summary.totalWinsA }} 项指标领先
            </div>
          </div>
          <div class="text-4xl font-bold text-white/80">VS</div>
          <div class="text-center">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center font-bold">B</span>
              <span class="text-2xl font-bold">{{ comparisonData.summary.regionB }}</span>
              <span v-if="comparisonData.summary.overallLeader === 'B'" class="ml-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full animate-pulse">
                🏆 综合领先
              </span>
            </div>
            <div class="text-green-100 text-sm">
              {{ comparisonData.summary.totalWinsB }} 项指标领先
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="text-white/80 text-sm">数据更新于 {{ updateTime }}</p>
          <button 
            @click="$emit('refresh')"
            class="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>🔄</span> 刷新数据
          </button>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span>📊</span> 对比摘要
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="metric in comparisonData.summary.metrics" 
          :key="metric.metric"
          class="metric-compare-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border-2 transition-all duration-300 hover:shadow-lg"
          :class="getMetricCardClass(metric.leader)"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl">{{ metric.icon }}</span>
            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ metric.label }}</span>
            <span 
              v-if="metric.leader !== 'tie'"
              class="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
              :class="metric.leader === 'A' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'"
            >
              {{ metric.leader === 'A' ? comparisonData.summary.regionA : comparisonData.summary.regionB }} 领先
            </span>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-blue-500"></span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ comparisonData.summary.regionA }}</span>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-gray-800 dark:text-white">{{ formatValue(metric.valueA, metric.metric) }}</div>
                <div 
                  class="text-xs font-medium flex items-center justify-end gap-0.5"
                  :class="metric.growthA >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  <span>{{ metric.growthA >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ formatGrowth(metric.growthA) }}</span>
                </div>
              </div>
            </div>

            <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                class="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                :style="{ width: getBarWidth(metric.valueA, metric.valueB) + '%' }"
              ></div>
              <div 
                class="absolute right-0 top-0 h-full bg-gradient-to-l from-green-400 to-green-600 rounded-full transition-all duration-500"
                :style="{ width: getBarWidth(metric.valueB, metric.valueA) + '%' }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-green-500"></span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ comparisonData.summary.regionB }}</span>
              </div>
              <div class="text-right">
                <div class="text-xl font-bold text-gray-800 dark:text-white">{{ formatValue(metric.valueB, metric.metric) }}</div>
                <div 
                  class="text-xs font-medium flex items-center justify-end gap-0.5"
                  :class="metric.growthB >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  <span>{{ metric.growthB >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ formatGrowth(metric.growthB) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">差异：</span>
              <span 
                class="font-bold text-lg"
                :class="metric.diff >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'"
              >
                {{ metric.diff >= 0 ? '+' : '' }}{{ formatDiff(metric.diff, metric.metric) }}
              </span>
              <span 
                class="text-sm font-medium px-2 py-0.5 rounded"
                :class="metric.diffPercent >= 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'"
              >
                {{ metric.diffPercent >= 0 ? '+' : '' }}{{ (metric.diffPercent * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span>📈</span> 趋势差异
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">销售额趋势对比</h4>
          <div class="chart-container" style="height: 300px; min-height: 300px;">
            <v-chart
              :key="'sales-' + chartKey"
              :option="salesTrendOption"
              :theme="isDark ? 'dark' : ''"
              autoresize
              manual-update
              style="height: 100%; width: 100%; min-height: 300px;"
            />
          </div>
          <div class="mt-4 space-y-2">
            <div 
              v-for="(diff, index) in comparisonData.trendDifference.salesDiff" 
              :key="index"
              class="flex items-center justify-between text-sm py-1 px-3 rounded-lg"
              :class="diff >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'"
            >
              <span class="text-gray-600 dark:text-gray-400">{{ comparisonData.trendDifference.months[index] }}</span>
              <span 
                class="font-medium"
                :class="diff >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'"
              >
                {{ diff >= 0 ? comparisonData.summary.regionA : comparisonData.summary.regionB }} 
                领先 {{ formatLargeNumber(Math.abs(diff)) }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">订单量趋势对比</h4>
          <div class="chart-container" style="height: 300px; min-height: 300px;">
            <v-chart
              :key="'orders-' + chartKey"
              :option="ordersTrendOption"
              :theme="isDark ? 'dark' : ''"
              autoresize
              manual-update
              style="height: 100%; width: 100%; min-height: 300px;"
            />
          </div>
          <div class="mt-4 space-y-2">
            <div 
              v-for="(diff, index) in comparisonData.trendDifference.ordersDiff" 
              :key="index"
              class="flex items-center justify-between text-sm py-1 px-3 rounded-lg"
              :class="diff >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'"
            >
              <span class="text-gray-600 dark:text-gray-400">{{ comparisonData.trendDifference.months[index] }}</span>
              <span 
                class="font-medium"
                :class="diff >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'"
              >
                {{ diff >= 0 ? comparisonData.summary.regionA : comparisonData.summary.regionB }} 
                领先 {{ formatLargeNumber(Math.abs(diff)) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span>🏷️</span> 分类差异
      </h3>
      <div v-if="comparisonData.categoryDifference?.items?.length > 0" class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b-2 border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">品类</th>
              <th class="text-right py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                <span class="flex items-center justify-end gap-2">
                  <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                  {{ comparisonData.summary.regionA }}
                </span>
              </th>
              <th class="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                <span class="flex items-center justify-end gap-2">
                  <span class="w-3 h-3 rounded-full bg-green-500"></span>
                  {{ comparisonData.summary.regionB }}
                </span>
              </th>
              <th class="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">差异</th>
              <th class="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">领先方</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in comparisonData.categoryDifference.items" 
              :key="item.category"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">{{ item.category }}</td>
              <td class="py-4 px-4 text-right">
                <div class="font-bold text-gray-800 dark:text-white">¥{{ formatLargeNumber(item.salesA) }}</div>
                <div 
                  class="text-xs mt-0.5"
                  :class="item.growthA >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ item.growthA >= 0 ? '↑' : '↓' }} {{ formatGrowth(item.growthA) }}
                </div>
              </td>
              <td class="py-4 px-4 text-right">
                <div class="font-bold text-gray-800 dark:text-white">¥{{ formatLargeNumber(item.salesB) }}</div>
                <div 
                  class="text-xs mt-0.5"
                  :class="item.growthB >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ item.growthB >= 0 ? '↑' : '↓' }} {{ formatGrowth(item.growthB) }}
                </div>
              </td>
              <td class="py-4 px-4 text-center">
                <div 
                  class="font-semibold"
                  :class="item.diff >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'"
                >
                  {{ item.diff >= 0 ? '+' : '' }}¥{{ formatLargeNumber(Math.abs(item.diff)) }}
                </div>
                <div 
                  class="text-xs mt-0.5 inline-block px-2 py-0.5 rounded"
                  :class="item.diffPercent >= 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'"
                >
                  {{ item.diffPercent >= 0 ? '+' : '' }}{{ (item.diffPercent * 100).toFixed(1) }}%
                </div>
              </td>
              <td class="py-4 px-4 text-center">
                <span 
                  v-if="item.leader !== 'tie'"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold"
                  :class="item.leader === 'A' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'"
                >
                  <span>👑</span>
                  {{ item.leader === 'A' ? comparisonData.summary.regionA : comparisonData.summary.regionB }}
                </span>
                <span v-else class="text-gray-500 dark:text-gray-400 text-sm">持平</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">品类销售额对比</h4>
          <div class="chart-container" style="height: 280px; min-height: 280px;">
            <v-chart
              :key="'category-sales-' + chartKey"
              :option="categoryCompareOption"
              :theme="isDark ? 'dark' : ''"
              autoresize
              manual-update
              style="height: 100%; width: 100%; min-height: 280px;"
            />
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <h4 class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">品类增长率对比</h4>
          <div class="chart-container" style="height: 280px; min-height: 280px;">
            <v-chart
              :key="'category-growth-' + chartKey"
              :option="categoryGrowthOption"
              :theme="isDark ? 'dark' : ''"
              autoresize
              manual-update
              style="height: 100%; width: 100%; min-height: 280px;"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import type { RegionComparisonData, MetricName } from '../types';

use([
  CanvasRenderer, LineChart, BarChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent
]);

const props = defineProps<{
  comparisonData: RegionComparisonData;
  isDark: boolean;
}>();

defineEmits(['refresh']);

const chartKey = computed(() => {
  const data = props.comparisonData;
  return `${data.summary.regionA}-${data.summary.regionB}-${data.summary.totalWinsA}-${data.summary.totalWinsB}-${Date.now()}`;
});

const updateTime = computed(() => {
  const now = new Date();
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
});

function getEmptyChartOption(message: string) {
  return {
    title: {
      text: message,
      left: 'center',
      top: 'center',
      textStyle: {
        color: '#9ca3af',
        fontSize: 14
      }
    },
    xAxis: { show: false },
    yAxis: { show: false },
    series: []
  };
}

const salesTrendOption = computed(() => {
  if (!props.comparisonData?.trendDifference || !props.comparisonData?.summary) {
    return getEmptyChartOption('暂无数据');
  }
  const { months, salesA, salesB } = props.comparisonData.trendDifference;
  const regionA = props.comparisonData.summary.regionA;
  const regionB = props.comparisonData.summary.regionB;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `<div class="font-semibold mb-2">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          result += `<div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" style="background-color:${p.color}"></span>
            <span>${p.seriesName}: ¥${formatLargeNumber(p.value)}</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: [regionA, regionB],
      bottom: 0
    },
    grid: {
      bottom: 40,
      top: 10,
      left: 50,
      right: 20
    },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '销售额',
      axisLabel: {
        formatter: (value: number) => formatLargeNumber(value)
      }
    },
    series: [
      {
        name: regionA,
        type: 'line',
        data: salesA,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#3b82f6'
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: regionB,
        type: 'line',
        data: salesB,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#22c55e'
        },
        itemStyle: {
          color: '#22c55e'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
            ]
          }
        }
      }
    ]
  };
});

const ordersTrendOption = computed(() => {
  if (!props.comparisonData?.trendDifference || !props.comparisonData?.summary) {
    return getEmptyChartOption('暂无数据');
  }
  const { months, ordersA, ordersB } = props.comparisonData.trendDifference;
  const regionA = props.comparisonData.summary.regionA;
  const regionB = props.comparisonData.summary.regionB;

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `<div class="font-semibold mb-2">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          result += `<div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" style="background-color:${p.color}"></span>
            <span>${p.seriesName}: ${formatLargeNumber(p.value)} 单</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: [regionA, regionB],
      bottom: 0
    },
    grid: {
      bottom: 40,
      top: 10,
      left: 50,
      right: 20
    },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '订单量',
      axisLabel: {
        formatter: (value: number) => formatLargeNumber(value)
      }
    },
    series: [
      {
        name: regionA,
        type: 'line',
        data: ordersA,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#3b82f6'
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        }
      },
      {
        name: regionB,
        type: 'line',
        data: ordersB,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#22c55e'
        },
        itemStyle: {
          color: '#22c55e'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
            ]
          }
        }
      }
    ]
  };
});

const categoryCompareOption = computed(() => {
  if (!props.comparisonData?.categoryDifference?.items || !props.comparisonData?.summary) {
    return getEmptyChartOption('暂无数据');
  }
  const { items } = props.comparisonData.categoryDifference;
  const regionA = props.comparisonData.summary.regionA;
  const regionB = props.comparisonData.summary.regionB;
  const categories = items.map(i => i.category);
  const salesA = items.map(i => i.salesA / 10000);
  const salesB = items.map(i => i.salesB / 10000);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `<div class="font-semibold mb-2">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          result += `<div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" style="background-color:${p.color}"></span>
            <span>${p.seriesName}: ¥${p.value.toFixed(1)} 万</span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: [regionA, regionB],
      bottom: 0
    },
    grid: {
      bottom: 40,
      top: 10,
      left: 60,
      right: 20
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: '销售额(万)',
      axisLabel: {
        formatter: '{value}万'
      }
    },
    series: [
      {
        name: regionA,
        type: 'bar',
        data: salesA,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      },
      {
        name: regionB,
        type: 'bar',
        data: salesB,
        itemStyle: {
          color: '#22c55e',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      }
    ]
  };
});

const categoryGrowthOption = computed(() => {
  if (!props.comparisonData?.categoryDifference?.items || !props.comparisonData?.summary) {
    return getEmptyChartOption('暂无数据');
  }
  const { items } = props.comparisonData.categoryDifference;
  const regionA = props.comparisonData.summary.regionA;
  const regionB = props.comparisonData.summary.regionB;
  const categories = items.map(i => i.category);
  const growthA = items.map(i => (i.growthA * 100).toFixed(1));
  const growthB = items.map(i => (i.growthB * 100).toFixed(1));

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `<div class="font-semibold mb-2">${params[0].axisValue}</div>`;
        params.forEach((p: any) => {
          const value = Number(p.value);
          const color = value >= 0 ? '#22c55e' : '#ef4444';
          result += `<div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" style="background-color:${p.color}"></span>
            <span>${p.seriesName}: <span style="color:${color}">${value >= 0 ? '+' : ''}${value}%</span></span>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: [regionA, regionB],
      bottom: 0
    },
    grid: {
      bottom: 40,
      top: 10,
      left: 60,
      right: 20
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: '增长率(%)',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: regionA,
        type: 'bar',
        data: growthA,
        itemStyle: {
          color: (params: any) => {
            return Number(params.value) >= 0 ? '#3b82f6' : '#93c5fd';
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      },
      {
        name: regionB,
        type: 'bar',
        data: growthB,
        itemStyle: {
          color: (params: any) => {
            return Number(params.value) >= 0 ? '#22c55e' : '#86efac';
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      }
    ]
  };
});

function getMetricCardClass(leader: 'A' | 'B' | 'tie') {
  switch (leader) {
    case 'A':
      return 'border-blue-300 dark:border-blue-700';
    case 'B':
      return 'border-green-300 dark:border-green-700';
    default:
      return 'border-gray-200 dark:border-gray-700';
  }
}

function getBarWidth(value: number, otherValue: number): number {
  const total = value + otherValue;
  if (total === 0) return 50;
  return (value / total) * 100;
}

function formatValue(value: number, metric: MetricName): string {
  if (metric === 'avgOrderValue') {
    return '¥' + value.toLocaleString();
  } else if (metric === 'totalSales') {
    return '¥' + formatLargeNumber(value);
  } else {
    return formatLargeNumber(value);
  }
}

function formatDiff(value: number, metric: MetricName): string {
  if (metric === 'avgOrderValue') {
    return '¥' + Math.abs(value).toLocaleString();
  } else if (metric === 'totalSales') {
    return '¥' + formatLargeNumber(Math.abs(value));
  } else {
    return formatLargeNumber(Math.abs(value));
  }
}

function formatLargeNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatGrowth(growth: number): string {
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${(growth * 100).toFixed(1)}%`;
}
</script>

<style scoped>
.metric-compare-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-compare-card:hover {
  transform: translateY(-3px);
}

:deep(.echarts) {
  width: 100% !important;
  height: 100% !important;
}
</style>
