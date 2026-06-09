<template>
  <div 
    :id="`chart-${chartId}`"
    :class="[
      'chart-card', 
      { 'dark': isDark },
      { 'highlighted': isHighlighted },
      { 'is-loading': isRefreshing },
      { 'chart-enter': isNew },
      { 'keyword-dimmed': shouldDimCard },
      { 'keyword-highlighted': isKeywordHighlighted }
    ]" 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
    @click="handleCardClick"
  >
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-2">
        <h3 
          :class="[
            'text-sm font-semibold transition-all duration-300',
            keywordMatch?.titleMatched ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200',
            keywordMatch?.titleMatched ? 'bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded' : ''
          ]"
        >
          {{ title }}
          <span v-if="keywordMatch?.titleMatched" class="ml-1 text-xs text-blue-500">🔍</span>
        </h3>
        <span 
          v-if="alertCount && alertCount > 0" 
          class="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium"
        >
          {{ alertCount }}
        </span>
        <span 
          v-if="isCustom" 
          class="px-1.5 py-0.5 bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 text-xs rounded-full font-medium"
        >
          自定义
        </span>
        <Transition name="fade">
          <span 
            v-if="isKeywordHighlighted && matchedItemsCount > 0" 
            class="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-full font-medium flex items-center gap-1"
          >
            <span>✨</span>
            <span>{{ matchedItemsCount }} 处匹配</span>
          </span>
        </Transition>
        <Transition name="fade">
          <span 
            v-if="shouldDimCard" 
            class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium"
          >
            无匹配
          </span>
        </Transition>
      </div>
      <div class="flex gap-2">
        <button 
          v-if="isTrendChart"
          @click.stop="toggleReplayPanel"
          :class="[
            'text-xs flex items-center gap-1 transition-colors',
            showReplayPanel ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded' : 'text-gray-400 hover:text-primary-500'
          ]"
          :title="showReplayPanel ? '关闭回放' : '趋势回放'"
        >
          <span>{{ showReplayPanel ? '⏸️' : '▶️' }}</span>
          {{ showReplayPanel ? '回放中' : '回放' }}
        </button>
        <button 
          @click.stop="handleRefresh" 
          :disabled="isRefreshing"
          :class="[
            'text-xs flex items-center gap-1 transition-all duration-300 px-2 py-1 rounded',
            isRefreshing 
              ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30 cursor-not-allowed' 
              : 'text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
          ]"
        >
          <span :class="[
            'transition-transform duration-300',
            isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
          ]">🔄</span>
          <span>{{ isRefreshing ? '刷新中...' : '刷新' }}</span>
        </button>
        <button 
          @click.stop="showDeleteConfirm = true" 
          class="text-gray-400 hover:text-red-500 text-xs"
        >
          删除
        </button>
      </div>
    </div>
    <div class="chart-container" style="height: 280px; width: 100%; position: relative;">
      <div 
        v-if="!chartReady || isRefreshing" 
        class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/95 dark:bg-gray-700/95 backdrop-blur-sm rounded z-10 transition-all duration-300"
      >
        <div v-if="isRefreshing" class="flex flex-col items-center gap-3">
          <div class="relative">
            <div class="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full"></div>
            <div class="absolute top-0 left-0 w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-500 text-xs font-bold">
              ↻
            </div>
          </div>
          <span class="text-gray-600 dark:text-gray-300 text-sm font-medium">{{ refreshText }}</span>
          <div class="w-32 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-progress"></div>
          </div>
        </div>
        <span v-else class="text-gray-400 text-sm">加载中...</span>
      </div>
      <v-chart
        v-if="chartReady"
        :key="chartVersion"
        :option="currentChartOption"
        :theme="isDark ? 'dark' : ''"
        autoresize
        style="height: 100%; width: 100%; transition: opacity 0.3s ease;"
      />
    </div>

    <Transition name="refresh-result-slide">
      <div 
        v-if="refreshResult && refreshSummary" 
        class="mt-3 p-3 rounded-lg border transition-all cursor-pointer group"
        :class="[
          refreshResult.hasChanges 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        ]"
        @click.stop="showRefreshDetail = !showRefreshDetail"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ refreshSummary.icon }}</span>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span 
                  class="text-sm font-semibold"
                  :class="refreshSummary.color"
                >
                  {{ refreshSummary.text }}
                </span>
                <span 
                  v-if="refreshSummary.detail" 
                  class="text-xs"
                  :class="refreshSummary.color"
                >
                  {{ refreshSummary.detail }}
                </span>
              </div>
              <span class="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <span>⏱️</span>
                <span>{{ formattedRefreshTime }} 刷新完成</span>
                <span v-if="refreshResult" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="refreshResult" class="text-gray-400 dark:text-gray-500">
                  耗时 {{ refreshResult.durationMs }}ms
                </span>
                <span v-if="refreshResult && refreshResult.totalChangeCount > 0" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="refreshResult && refreshResult.totalChangeCount > 0" class="text-gray-400 dark:text-gray-500">
                  {{ refreshResult.totalChangeCount }} 项指标变化
                </span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button 
              @click.stop="dismissRefreshResult"
              class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
              title="关闭"
            >
              ✕
            </button>
            <span class="text-gray-400 text-xs transition-transform" :class="{ 'rotate-180': showRefreshDetail }">
              ▼
            </span>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="showRefreshDetail && refreshResult && refreshResult.dataChanges.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">数据变化详情</h4>
            <div class="space-y-2">
              <div 
                v-for="(change, index) in refreshResult.dataChanges" 
                :key="index"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-600 dark:text-gray-300">{{ change.seriesName }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-gray-400 dark:text-gray-500 text-xs">
                    {{ change.oldValue.toFixed(1) }} → {{ change.newValue.toFixed(1) }}
                  </span>
                  <span 
                    class="text-xs font-medium px-2 py-0.5 rounded"
                    :class="[
                      change.changeValue > 0 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : change.changeValue < 0 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    ]"
                  >
                    <span v-if="change.changeValue > 0">↑</span>
                    <span v-else-if="change.changeValue < 0">↓</span>
                    <span v-else>→</span>
                    {{ (change.changePercent * 100).toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="replay-slide">
      <TrendReplay
        v-if="showReplayPanel && isTrendChart"
        ref="trendReplayRef"
        :original-option="chartOption"
        :chart-type="chartType as 'line' | 'bar'"
        :is-dark="isDark"
        @update:option="handleReplayOptionUpdate"
        @state-change="handleReplayStateChange"
      />
    </Transition>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
          <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md mx-4 transform transition-all">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">⚠️</span>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-1">确认删除图表</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">此操作将影响整个看板布局</p>
              </div>
            </div>
            
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <h4 class="font-semibold text-red-700 dark:text-red-400 text-sm mb-2 flex items-center gap-2">
                <span>🔴</span> 删除将产生以下影响：
              </h4>
              <ul class="space-y-2 text-sm text-red-600 dark:text-red-300">
                <li class="flex items-start gap-2">
                  <span class="text-red-400 mt-0.5">•</span>
                  <span>图表「{{ title }}」将从看板中永久移除</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-400 mt-0.5">•</span>
                  <span>相关的告警规则和数据关联将失效</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-red-400 mt-0.5">•</span>
                  <span>整体布局会重新排列，下方卡片将上移</span>
                </li>
                <li v-if="alertCount && alertCount > 0" class="flex items-start gap-2">
                  <span class="text-red-400 mt-0.5">•</span>
                  <span class="font-medium">{{ alertCount }} 条相关告警将无法定位到此图表</span>
                </li>
              </ul>
            </div>

            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
              <p class="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                <span class="text-yellow-500 mt-0.5">💡</span>
                <span>删除后 5 秒内可通过顶部提示撤销操作，超时后将无法恢复</span>
              </p>
            </div>
            
            <div class="flex justify-end gap-3">
              <button 
                @click.stop="showDeleteConfirm = false"
                class="px-5 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                取消
              </button>
              <button 
                @click.stop="confirmDelete"
                class="px-5 py-2.5 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/30"
              >
                <span>🗑️</span>
                确认删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, watch, computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, VisualMapComponent
} from 'echarts/components';
import TrendReplay from './TrendReplay.vue';
import type { ChartRefreshResult } from '../types';

use([
  CanvasRenderer, LineChart, BarChart, PieChart, ScatterChart, HeatmapChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, VisualMapComponent
]);

const props = defineProps<{
  chartId: string;
  title: string;
  chartOption: Record<string, any>;
  isDark: boolean;
  isHighlighted?: boolean;
  alertCount?: number;
  isCustom?: boolean;
  isNew?: boolean;
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';
  keywordMatch?: {
    hasAnyMatch: boolean;
    titleMatched: boolean;
    legendMatches: { name: string; matched: boolean }[];
    categoryMatches: { name: string; matched: boolean }[];
  } | null;
  keywordActive?: boolean;
  hasAnyKeywordMatch?: boolean;
  refreshResult?: ChartRefreshResult | null;
}>();

const emit = defineEmits(['refresh', 'remove', 'animationEnd', 'click', 'dismissRefreshResult']);

const chartReady = ref(false);
const isRefreshing = ref(false);
const showDeleteConfirm = ref(false);
const refreshText = ref('正在刷新数据...');
const showReplayPanel = ref(false);
const activeChartOption = ref<Record<string, any> | null>(null);
const isReplaying = ref(false);
const trendReplayRef = ref<InstanceType<typeof TrendReplay> | null>(null);
const showRefreshDetail = ref(false);
const chartVersion = ref(0);
let refreshResultTimer: ReturnType<typeof setTimeout> | null = null;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let _animationTimer: ReturnType<typeof setTimeout> | null = null;

const refreshMessages = [
  '正在刷新数据...',
  '正在获取最新指标...',
  '正在更新可视化...',
  '数据加载中...'
];

const isTrendChart = computed(() => {
  return props.chartType === 'line' || props.chartType === 'bar';
});

const shouldDimCard = computed(() => {
  return props.keywordActive && props.hasAnyKeywordMatch && props.keywordMatch && !props.keywordMatch.hasAnyMatch;
});

const isKeywordHighlighted = computed(() => {
  return props.keywordActive && props.keywordMatch?.hasAnyMatch;
});

const matchedItemsCount = computed(() => {
  if (!props.keywordMatch) return 0;
  let count = 0;
  if (props.keywordMatch.titleMatched) count++;
  count += props.keywordMatch.legendMatches.filter(m => m.matched).length;
  count += props.keywordMatch.categoryMatches.filter(m => m.matched).length;
  return count;
});

const formattedRefreshTime = computed(() => {
  if (!props.refreshResult) return '';
  const date = new Date(props.refreshResult.refreshedAt);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

const refreshSummary = computed(() => {
  if (!props.refreshResult) return null;
  const result = props.refreshResult;
  if (!result.hasChanges || result.dataChanges.length === 0) {
    return {
      text: '数据暂无变化',
      icon: '📊',
      color: 'text-gray-500 dark:text-gray-400'
    };
  }
  const maxChange = result.maxChange;
  if (!maxChange) return null;

  const isUp = maxChange.changeValue > 0;
  const percentText = (maxChange.changePercent * 100).toFixed(1);
  const valueText = maxChange.changeValue >= 0 ? `+${maxChange.changeValue.toFixed(1)}` : maxChange.changeValue.toFixed(1);

  return {
    text: `${maxChange.seriesName} ${isUp ? '↑' : '↓'} ${percentText}%`,
    detail: `(${valueText})`,
    icon: isUp ? '📈' : '📉',
    color: isUp ? 'text-green-500' : 'text-red-500'
  };
});

const currentChartOption = computed(() => {
  if (activeChartOption.value) {
    return activeChartOption.value;
  }
  
  if (props.keywordActive && props.keywordMatch) {
    const option = JSON.parse(JSON.stringify(props.chartOption));
    const match = props.keywordMatch;
    
    if (option.legend && option.legend.data) {
      option.legend.selected = option.legend.selected || {};
      option.legend.data.forEach((name: string) => {
        const itemMatch = match.legendMatches.find((m: any) => m.name === name);
        const matched = itemMatch?.matched || match.titleMatched;
        option.legend.selected[name] = matched || !props.hasAnyKeywordMatch;
      });
      
      option.legend.textStyle = option.legend.textStyle || {};
      option.legend.data = option.legend.data.map((name: string) => {
        const itemMatch = match.legendMatches.find((m: any) => m.name === name);
        const matched = itemMatch?.matched || match.titleMatched;
        const shouldHighlight = props.hasAnyKeywordMatch ? matched : true;
        
        return {
          name,
          textStyle: shouldHighlight ? {
            fontWeight: 'bold' as const,
            color: '#3b82f6'
          } : {
            color: '#9ca3af',
            textDecoration: 'line-through' as const
          }
        };
      });
    }
    
    if (option.series && Array.isArray(option.series)) {
      option.series = option.series.map((series: any) => {
        const seriesName = series.name || '';
        const seriesMatched = seriesName.toLowerCase().includes((match as any)._keyword?.toLowerCase() || '') || match.titleMatched;
        
        if (series.data && Array.isArray(series.data)) {
          series.data = series.data.map((item: any, dataIndex: number) => {
            let itemName = '';

            if (typeof item === 'object' && item !== null) {
              itemName = item.name || '';
            } else if (option.xAxis?.data && option.xAxis.data[dataIndex]) {
              itemName = option.xAxis.data[dataIndex];
            }

            const categoryMatch = match.categoryMatches.find((m: any) => m.name === itemName);
            const itemMatched = categoryMatch?.matched || seriesMatched;

            const shouldHighlight = props.hasAnyKeywordMatch 
              ? itemMatched 
              : true;

            if (typeof item === 'object' && item !== null) {
              return {
                ...item,
                itemStyle: shouldHighlight ? {
                  ...item.itemStyle,
                  opacity: 1,
                  shadowBlur: 15,
                  shadowColor: 'rgba(59, 130, 246, 0.8)'
                } : {
                  ...item.itemStyle,
                  opacity: 0.25
                },
                label: item.label && shouldHighlight ? {
                  ...item.label,
                  fontWeight: 'bold' as const,
                  color: '#3b82f6',
                  fontSize: 14
                } : item.label
              };
            } else {
              return {
                value: item,
                itemStyle: shouldHighlight ? {
                  opacity: 1,
                  shadowBlur: 15,
                  shadowColor: 'rgba(59, 130, 246, 0.8)'
                } : {
                  opacity: 0.25
                }
              };
            }
          });
        }

        if (series.type === 'pie') {
          const shouldHighlight = props.hasAnyKeywordMatch 
            ? seriesMatched 
            : true;
          series.itemStyle = shouldHighlight ? {
            ...series.itemStyle,
            opacity: 1,
            shadowBlur: 15,
            shadowColor: 'rgba(59, 130, 246, 0.8)'
          } : {
            ...series.itemStyle,
            opacity: 0.25
          };
          series.label = shouldHighlight ? {
            ...series.label,
            fontWeight: 'bold' as const,
            color: '#3b82f6'
          } : {
            ...series.label,
            opacity: 0.5
          };
        }

        return series;
      });
    }
    
    return option;
  }
  
  return props.chartOption;
});

function toggleReplayPanel() {
  showReplayPanel.value = !showReplayPanel.value;
  if (showReplayPanel.value) {
    nextTick(() => {
      trendReplayRef.value?.start();
    });
  } else {
    activeChartOption.value = null;
    isReplaying.value = false;
  }
}

function handleReplayOptionUpdate(option: Record<string, any>) {
  activeChartOption.value = option;
}

function handleReplayStateChange(state: any) {
  isReplaying.value = state.isPlaying;
  if (state.stopped) {
    activeChartOption.value = null;
    showReplayPanel.value = false;
  }
}

watch(() => props.chartOption, () => {
  if (!isReplaying.value) {
    activeChartOption.value = null;
  }
}, { deep: true });

watch(() => props.isNew, (val) => {
  if (val) {
    _animationTimer = setTimeout(() => {
      emit('animationEnd');
    }, 2000);
  }
});

function handleRefresh() {
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  refreshText.value = refreshMessages[Math.floor(Math.random() * refreshMessages.length)];
  
  refreshTimer = setTimeout(() => {
    emit('refresh');
    
    setTimeout(() => {
      isRefreshing.value = false;
      chartVersion.value++;
    }, 800);
  }, 500);
}

function confirmDelete() {
  showDeleteConfirm.value = false;
  emit('remove');
}

function handleCardClick() {
  if (showDeleteConfirm.value) return;
  emit('click');
}

function dismissRefreshResult() {
  if (refreshResultTimer) {
    clearTimeout(refreshResultTimer);
    refreshResultTimer = null;
  }
  emit('dismissRefreshResult');
}

watch(() => props.refreshResult, (newResult) => {
  if (newResult) {
    chartVersion.value++;
    if (refreshResultTimer) {
      clearTimeout(refreshResultTimer);
    }
    refreshResultTimer = setTimeout(() => {
      dismissRefreshResult();
    }, 8000);
  }
});

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      chartReady.value = true;
    }, 100);
  });
});

onUnmounted(() => {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (_animationTimer) clearTimeout(_animationTimer);
  if (refreshResultTimer) clearTimeout(refreshResultTimer);
});
</script>

<style scoped>
.chart-card.highlighted {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.5), 0 20px 60px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
  z-index: 100;
  position: relative;
}

.chart-card.highlighted::before {
  content: '📍 告警定位';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #ef4444, #f97316);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 101;
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
  white-space: nowrap;
}

@keyframes highlight-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.5), 0 20px 60px rgba(0, 0, 0, 0.3);
    transform: scale(1.05);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.4), 0 0 50px rgba(239, 68, 68, 0.7), 0 20px 60px rgba(0, 0, 0, 0.3);
    transform: scale(1.08);
  }
}

.chart-card.highlighted {
  animation: highlight-pulse 1s ease-in-out infinite;
}

.chart-card.is-loading .chart-container {
  filter: blur(2px);
}

.chart-card.chart-enter {
  animation: chart-enter-animation 0.6s ease-out;
}

@keyframes chart-enter-animation {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
    box-shadow: 0 0 0 rgba(59, 130, 246, 0);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
}

.chart-card.chart-enter::after {
  content: '✨ 新增成功';
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.4);
  white-space: nowrap;
  animation: success-badge 0.6s ease-out;
}

@keyframes success-badge {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
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

.chart-card.keyword-dimmed {
  opacity: 0.4;
  filter: grayscale(0.8);
  transform: scale(0.98);
  pointer-events: none;
}

.chart-card.keyword-highlighted {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 10px 40px rgba(59, 130, 246, 0.2);
  border: 2px solid rgba(59, 130, 246, 0.6);
  position: relative;
  z-index: 10;
}

.chart-card.keyword-highlighted::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
  z-index: -1;
  animation: keyword-glow 2s ease-in-out infinite;
}

@keyframes keyword-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
  }
}

.refresh-result-slide-enter-active,
.refresh-result-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-result-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.refresh-result-slide-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.95);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 300px;
}

@keyframes progress {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 70%;
    margin-left: 0%;
  }
  100% {
    width: 30%;
    margin-left: 100%;
  }
}

.animate-progress {
  animation: progress 1.5s ease-in-out infinite;
}

.refresh-result-slide-enter-active {
  animation: refresh-result-pulse 0.6s ease-out;
}

@keyframes refresh-result-pulse {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.chart-card.is-loading v-chart {
  opacity: 0.3;
  filter: blur(1px);
}
</style>
