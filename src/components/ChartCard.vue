<template>
  <div 
    :id="`chart-${chartId}`"
    :class="[
      'chart-card', 
      { 'dark': isDark },
      { 'highlighted': isHighlighted }
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
      </div>
      <div class="flex gap-2">
        <button @click="$emit('refresh')" class="text-gray-400 hover:text-primary-500 text-xs">刷新</button>
        <button @click="$emit('remove')" class="text-gray-400 hover:text-red-500 text-xs">删除</button>
      </div>
    </div>
    <div class="chart-container" style="height: 280px; width: 100%; position: relative;">
      <div v-if="!chartReady" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
        <span class="text-gray-400 text-sm">加载中...</span>
      </div>
      <v-chart
        v-if="chartReady"
        :option="chartOption"
        :theme="isDark ? 'dark' : ''"
        autoresize
        style="height: 100%; width: 100%;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
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

defineProps<{
  chartId: string;
  title: string;
  chartOption: Record<string, any>;
  isDark: boolean;
  isHighlighted?: boolean;
  alertCount?: number;
}>();

defineEmits(['refresh', 'remove']);

const chartReady = ref(false);

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      chartReady.value = true;
    }, 100);
  });
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
</style>
