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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 10px 40px rgba(59, 130, 246, 0.3);
  transform: scale(1.02);
  z-index: 10;
}

@keyframes highlight-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 10px 40px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3), 0 10px 40px rgba(59, 130, 246, 0.5); }
}

.chart-card.highlighted {
  animation: highlight-pulse 1s ease-in-out 3;
}
</style>
