<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
          <div class="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">创建新图表</h2>
            <button @click="handleClose" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">
              &times;
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                图表标题
              </label>
              <input
                v-model="form.title"
                type="text"
                placeholder="请输入图表标题"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                图表类型
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="chartType in chartTypes"
                  :key="chartType.value"
                  @click="form.type = chartType.value"
                  :class="[
                    'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                    form.type === chartType.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  ]"
                >
                  <span class="text-2xl mb-1">{{ chartType.icon }}</span>
                  <span class="text-xs text-gray-600 dark:text-gray-300">{{ chartType.label }}</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                数据维度
              </label>
              <div class="space-y-2">
                <button
                  v-for="dim in dimensions"
                  :key="dim.value"
                  @click="form.dimension = dim.value"
                  :class="[
                    'w-full flex items-center p-3 rounded-lg border-2 transition-all text-left',
                    form.dimension === dim.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  ]"
                >
                  <span class="text-xl mr-3">{{ dim.icon }}</span>
                  <div>
                    <div class="text-sm font-medium text-gray-800 dark:text-white">{{ dim.label }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ dim.description }}</div>
                  </div>
                </button>
              </div>
            </div>

            <div v-if="previewOption" class="pt-4 border-t dark:border-gray-700">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                预览
              </label>
              <div class="h-40 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                <v-chart
                  :option="previewOption"
                  :theme="isDark ? 'dark' : ''"
                  autoresize
                  style="height: 100%; width: 100%;"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
            <button
              @click="handleClose"
              class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              取消
            </button>
            <button
              @click="handleCreate"
              :disabled="!isFormValid"
              :class="[
                'px-4 py-2 text-sm rounded-lg transition-colors',
                isFormValid
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              ]"
            >
              创建图表
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, VisualMapComponent
} from 'echarts/components';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import type { ChartConfig, DataDimension } from '../types';

use([
  CanvasRenderer, LineChart, BarChart, PieChart, ScatterChart, HeatmapChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, VisualMapComponent
]);

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', chart: ChartConfig): void;
}>();

const store = useDashboardStore();
const { isDark, currentRegionData } = storeToRefs(store);

const form = ref({
  title: '',
  type: 'bar' as ChartConfig['type'],
  dimension: 'salesTrend' as DataDimension
});

const chartTypes = [
  { value: 'line' as const, label: '折线图', icon: '📈' },
  { value: 'bar' as const, label: '柱状图', icon: '📊' },
  { value: 'pie' as const, label: '饼图', icon: '🥧' },
  { value: 'scatter' as const, label: '散点图', icon: '✨' },
  { value: 'heatmap' as const, label: '热力图', icon: '🔥' }
];

const dimensions = [
  { value: 'salesTrend' as const, label: '销售趋势', icon: '💰', description: '各月份销售额数据' },
  { value: 'ordersTrend' as const, label: '订单趋势', icon: '📦', description: '各月份订单量数据' },
  { value: 'categorySales' as const, label: '品类销售', icon: '🏷️', description: '各品类销售额及增长率' },
  { value: 'marketShare' as const, label: '市场份额', icon: '🎯', description: '各渠道市场占比' },
  { value: 'customerGrowth' as const, label: '客户增长', icon: '👥', description: '客户数量增长趋势' }
];

const isFormValid = computed(() => form.value.title.trim().length > 0);

const previewOption = computed(() => {
  return store.generateChartOption(form.value.type, form.value.dimension, currentRegionData.value);
});

watch(() => props.visible, (val) => {
  if (val) {
    form.value = {
      title: '',
      type: 'bar',
      dimension: 'salesTrend'
    };
  }
});

function handleClose() {
  emit('close');
}

function handleCreate() {
  if (!isFormValid.value) return;
  
  const chart = store.addCustomChart(form.value.type, form.value.title.trim(), form.value.dimension);
  emit('create', chart);
  emit('close');
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
