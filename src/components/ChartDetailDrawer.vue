<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="fixed inset-0 z-50 flex">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>
        <div class="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <button
                @click="handleClose"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ detailData?.chartTitle || '图表详情' }}</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ detailData?.chartType || '' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="handleRefresh"
                :disabled="loading"
                class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg :class="['w-4 h-4', { 'animate-spin': loading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ loading ? '刷新中...' : '刷新' }}
              </button>
            </div>
          </div>

          <div v-if="loading" class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3">
              <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-gray-500 dark:text-gray-400 text-sm">正在加载数据详情...</p>
            </div>
          </div>

          <div v-else-if="detailData" class="flex-1 overflow-y-auto p-4 space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg">
                <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">累计总值</p>
                <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ formatValue(detailData.overview.totalValue) }}</p>
                <p class="text-xs text-blue-500 dark:text-blue-400/70">{{ detailData.metric.unit }}</p>
              </div>
              <div class="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-lg">
                <p class="text-xs text-green-600 dark:text-green-400 mb-1">平均值</p>
                <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ formatValue(detailData.overview.avgValue) }}</p>
                <p class="text-xs text-green-500 dark:text-green-400/70">{{ detailData.metric.unit }}/期</p>
              </div>
              <div class="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg">
                <p class="text-xs text-amber-600 dark:text-amber-400 mb-1">峰值</p>
                <p class="text-xl font-bold text-amber-700 dark:text-amber-300">{{ formatValue(detailData.overview.maxValue) }}</p>
                <p class="text-xs text-amber-500 dark:text-amber-400/70">{{ detailData.overview.peakPeriod }}</p>
              </div>
              <div class="p-3 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 rounded-lg">
                <p class="text-xs text-rose-600 dark:text-rose-400 mb-1">谷值</p>
                <p class="text-xl font-bold text-rose-700 dark:text-rose-300">{{ formatValue(detailData.overview.minValue) }}</p>
                <p class="text-xs text-rose-500 dark:text-rose-400/70">{{ detailData.overview.valleyPeriod }}</p>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <span class="text-lg">📊</span>
                <h3 class="font-semibold text-gray-800 dark:text-white">指标说明</h3>
              </div>
              <div class="p-4 space-y-3">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">指标定义</p>
                  <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.metric.description }}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">计算方法</p>
                    <p class="text-sm text-gray-700 dark:text-gray-200 font-mono">{{ detailData.metric.calculationMethod }}</p>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">数据来源</p>
                    <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.metric.dataSource }}</p>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">更新频率</p>
                    <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.metric.updateFrequency }}</p>
                  </div>
                  <div class="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">计量单位</p>
                    <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.metric.unit }}</p>
                  </div>
                </div>
                <div class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                  <p class="text-xs text-primary-600 dark:text-primary-400 mb-1 flex items-center gap-1">
                    <span>💡</span> 业务意义
                  </p>
                  <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.metric.businessMeaning }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-lg">📈</span>
                  <h3 class="font-semibold text-gray-800 dark:text-white">{{ detailData.segmentData.title }}</h3>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  按{{ detailData.segmentData.dimension }}细分
                </span>
              </div>
              <div class="p-4">
                <div class="space-y-3">
                  <div
                    v-for="(item, index) in detailData.segmentData.items"
                    :key="item.name"
                    class="flex items-center gap-3"
                  >
                    <div class="w-6 text-center">
                      <span v-if="index < 3" class="text-lg">
                        {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                      </span>
                      <span v-else class="text-sm text-gray-400 dark:text-gray-500 font-medium">{{ index + 1 }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ item.name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-gray-600 dark:text-gray-300 font-semibold">{{ formatValue(item.value) }}</span>
                          <span
                            :class="[
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              item.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            ]"
                          >
                            {{ item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→' }} {{ (item.growth * 100).toFixed(1) }}%
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            :class="[
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                              index === 2 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                              'bg-gradient-to-r from-blue-400 to-blue-500'
                            ]"
                            :style="{ width: `${item.percentage}%` }"
                          ></div>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">{{ item.percentage.toFixed(1) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div class="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-lg">📉</span>
                  <h3 class="font-semibold text-gray-800 dark:text-white">最近变化</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                    {{ detailData.recentChange.period }}
                  </span>
                  <span
                    :class="[
                      'text-xs px-2 py-1 rounded font-medium',
                      detailData.recentChange.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      detailData.recentChange.trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    ]"
                  >
                    {{ detailData.recentChange.trend === 'up' ? '增长' : detailData.recentChange.trend === 'down' ? '下降' : '持平' }}
                  </span>
                  <button
                    @click="toggleDetailReplay"
                    :class="[
                      'text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors',
                      showDetailReplay ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                    ]"
                  >
                    <span>{{ showDetailReplay ? '⏸️' : '▶️' }}</span>
                    {{ showDetailReplay ? '关闭回放' : '趋势回放' }}
                  </button>
                </div>
              </div>
              <div class="p-4 space-y-4">
                <div class="grid grid-cols-3 gap-3">
                  <div class="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">上期值</p>
                    <p class="text-lg font-bold text-gray-700 dark:text-gray-200">{{ formatValue(detailData.recentChange.previousValue) }}</p>
                  </div>
                  <div class="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">当期值</p>
                    <p class="text-lg font-bold text-gray-700 dark:text-gray-200">{{ formatValue(detailData.recentChange.currentValue) }}</p>
                  </div>
                  <div
                    class="text-center p-2 rounded-lg"
                    :class="[
                      detailData.recentChange.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20' :
                      detailData.recentChange.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-gray-50 dark:bg-gray-800'
                    ]"
                  >
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">变化率</p>
                    <p
                      class="text-lg font-bold"
                      :class="[
                        detailData.recentChange.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                        detailData.recentChange.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-300'
                      ]"
                    >
                      {{ detailData.recentChange.trend === 'up' ? '+' : '' }}{{ (detailData.recentChange.changePercent * 100).toFixed(1) }}%
                    </p>
                  </div>
                </div>

                <div class="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <v-chart
                    :option="currentTrendOption"
                    :theme="isDark ? 'dark' : ''"
                    autoresize
                    style="height: 100%; width: 100%;"
                  />
                </div>

                <Transition name="replay-slide">
                  <TrendReplay
                    v-if="showDetailReplay"
                    ref="detailTrendReplayRef"
                    :original-option="trendChartOption"
                    chart-type="line"
                    :is-dark="isDark"
                    :format-value="formatValue"
                    @update:option="handleDetailReplayOptionUpdate"
                    @state-change="handleDetailReplayStateChange"
                  />
                </Transition>

                <div class="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <p class="text-xs text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                    <span>🔍</span> 智能分析
                  </p>
                  <p class="text-sm text-gray-700 dark:text-gray-200">{{ detailData.recentChange.analysis }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">暂无数据</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent } from 'echarts/components';
import type { ChartDetailData } from '../types';
import TrendReplay from './TrendReplay.vue';

use([
  CanvasRenderer, LineChart, BarChart,
  TitleComponent, TooltipComponent, GridComponent
]);

const props = defineProps<{
  visible: boolean;
  detailData: ChartDetailData | null;
  loading: boolean;
  isDark: boolean;
}>();

const emit = defineEmits(['close', 'refresh']);

const chartReady = ref(false);
const showDetailReplay = ref(false);
const activeTrendOption = ref<Record<string, any> | null>(null);
const detailTrendReplayRef = ref<InstanceType<typeof TrendReplay> | null>(null);
const isDetailReplaying = ref(false);

watch(() => props.visible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      chartReady.value = true;
    }, 100);
  } else {
    document.body.style.overflow = '';
    chartReady.value = false;
  }
});

function formatValue(value: number): string {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿';
  } else if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString();
}

const currentTrendOption = computed(() => {
  if (activeTrendOption.value) {
    return activeTrendOption.value;
  }
  return trendChartOption.value;
});

function toggleDetailReplay() {
  showDetailReplay.value = !showDetailReplay.value;
  if (showDetailReplay.value) {
    nextTick(() => {
      detailTrendReplayRef.value?.start();
    });
  } else {
    activeTrendOption.value = null;
    isDetailReplaying.value = false;
  }
}

function handleDetailReplayOptionUpdate(option: Record<string, any>) {
  activeTrendOption.value = option;
}

function handleDetailReplayStateChange(state: any) {
  isDetailReplaying.value = state.isPlaying;
  if (state.stopped) {
    activeTrendOption.value = null;
    showDetailReplay.value = false;
  }
}

const trendChartOption = computed(() => {
  if (!props.detailData) return {};

  const dataPoints = props.detailData.recentChange.dataPoints;
  const values = dataPoints.map(d => d.value);
  const labels = dataPoints.map(d => d.label);
  const isUp = props.detailData.recentChange.trend === 'up';

  const colors = isUp
    ? { line: '#10b981', area: 'rgba(16, 185, 129, 0.1)' }
    : { line: '#ef4444', area: 'rgba(239, 68, 68, 0.1)' };

  return {
    grid: {
      left: '10%',
      right: '5%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: props.isDark ? '#374151' : '#e5e7eb' } },
      axisLabel: { 
        color: props.isDark ? '#9ca3af' : '#6b7280',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: props.isDark ? '#374151' : '#f3f4f6' } },
      axisLabel: {
        color: props.isDark ? '#9ca3af' : '#6b7280',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(0) + '万';
          }
          return value.toString();
        }
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: props.isDark ? '#1f2937' : '#ffffff',
      borderColor: props.isDark ? '#374151' : '#e5e7eb',
      textStyle: { color: props.isDark ? '#e5e7eb' : '#1f2937' },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>数值: ${formatValue(data.value)}`;
      }
    },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: colors.line,
        width: 2
      },
      itemStyle: {
        color: colors.line,
        borderWidth: 2,
        borderColor: props.isDark ? '#1f2937' : '#ffffff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: colors.area },
            { offset: 1, color: 'rgba(255, 255, 255, 0)' }
          ]
        }
      }
    }]
  };
});

function handleClose() {
  emit('close');
}

function handleRefresh() {
  emit('refresh');
}
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}

.drawer-enter-from > div:first-child,
.drawer-leave-to > div:first-child {
  opacity: 0;
}

.replay-slide-enter-active,
.replay-slide-leave-active {
  transition: all 0.3s ease;
}

.replay-slide-enter-from,
.replay-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
