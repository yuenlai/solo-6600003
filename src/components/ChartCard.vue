<template>
  <div :class="['chart-card', { 'dark': isDark }]" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ title }}</h3>
      <div class="flex gap-2">
        <button @click="$emit('refresh')" class="text-gray-400 hover:text-primary-500 text-xs">刷新</button>
        <button @click="$emit('remove')" class="text-gray-400 hover:text-red-500 text-xs">删除</button>
      </div>
    </div>
    <div class="chart-container" style="height: 280px; width: 100%;">
      <v-chart :option="chartOption" :theme="isDark ? 'dark' : ''" autoresize style="height: 100%; width: 100%;" />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  title: string;
  chartOption: Record<string, any>;
  isDark: boolean;
}>();

defineEmits(['refresh', 'remove']);
</script>
