<template>
  <div 
    :id="`chart-${chartId}`"
    :class="[
      'chart-card', 
      { 'dark': isDark },
      { 'highlighted': isHighlighted },
      { 'is-loading': isRefreshing },
      { 'chart-enter': isNew }
    ]" 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300"
  >
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ title }}</h3>
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
      </div>
      <div class="flex gap-2">
        <button 
          @click="handleRefresh" 
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
          @click="showDeleteConfirm = true" 
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
        :option="chartOption"
        :theme="isDark ? 'dark' : ''"
        autoresize
        style="height: 100%; width: 100%;"
      />
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showDeleteConfirm = false"></div>
          <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">确认删除</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">确定要删除图表「{{ title }}」吗？此操作无法撤销。</p>
            <div class="flex justify-end gap-3">
              <button 
                @click="showDeleteConfirm = false"
                class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                取消
              </button>
              <button 
                @click="confirmDelete"
                class="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
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
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, VisualMapComponent
} from 'echarts/components';

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
}>();

const emit = defineEmits(['refresh', 'remove', 'animationEnd']);

const chartReady = ref(false);
const isRefreshing = ref(false);
const showDeleteConfirm = ref(false);
const refreshText = ref('正在刷新数据...');

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let _animationTimer: ReturnType<typeof setTimeout> | null = null;

const refreshMessages = [
  '正在刷新数据...',
  '正在获取最新指标...',
  '正在更新可视化...',
  '数据加载中...'
];

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
</style>
