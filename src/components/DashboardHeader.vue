<template>
  <header class="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-900 shadow-sm">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-bold text-primary-600 dark:text-primary-400">DataViz</h1>
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ dashboard.name }}</span>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-xs text-gray-400">图表数量: {{ dashboard.charts.length }}</span>
      <button @click="store.toggleTheme()"
        class="px-3 py-1 rounded text-xs border hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
        {{ isDark ? '☀️ 亮色' : '🌙 暗色' }}
      </button>
      <button @click="handleAddChart"
        class="px-3 py-1 rounded text-xs bg-primary-500 text-white hover:bg-primary-600">
        + 添加图表
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';

const store = useDashboardStore();
const { dashboard, isDark } = storeToRefs(store);

function handleAddChart() {
  const id = `chart-${Date.now()}`;
  store.addChart({
    id,
    type: 'bar',
    title: '新图表',
    gridArea: { x: 0, y: 8, w: 6, h: 4 },
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150, 80], type: 'bar' }],
      tooltip: { trigger: 'axis' }
    }
  });
}
</script>
