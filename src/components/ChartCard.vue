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
            'text-xs flex items-center gap-1 transition-colors',
            isRefreshing ? 'text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-primary-500'
          ]"
        >
          <span :class="{ 'animate-spin': isRefreshing }">🔄</span>
          {{ isRefreshing ? '刷新中...' : '刷新' }}
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
        class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded z-10"
      >
        <div v-if="isRefreshing" class="flex flex-col items-center gap-2">
          <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-gray-500 dark:text-gray-400 text-sm">{{ refreshText }}</span>
        </div>
        <span v-else class="text-gray-400 text-sm">加载中...</span>
      </div>
      <v-chart
        v-if="chartReady"
        :option="currentChartOption"
        :theme="isDark ? 'dark' : ''"
        autoresize
        style="height: 100%; width: 100%;"
      />
    </div>

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
}>();

const emit = defineEmits(['refresh', 'remove', 'animationEnd', 'click']);

const chartReady = ref(false);
const isRefreshing = ref(false);
const showDeleteConfirm = ref(false);
const refreshText = ref('正在刷新数据...');
const showReplayPanel = ref(false);
const activeChartOption = ref<Record<string, any> | null>(null);
const isReplaying = ref(false);
const trendReplayRef = ref<InstanceType<typeof TrendReplay> | null>(null);

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
</style>
