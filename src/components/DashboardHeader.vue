<template>
  <header class="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-900 shadow-sm">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-bold text-primary-600 dark:text-primary-400">DataViz</h1>
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ dashboard.name }}</span>
    </div>
    <div class="flex items-center gap-4">
      <button 
        @click="scrollToAlerts"
        class="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300 transition-colors"
      >
        <span :class="['relative', { 'animate-bounce': unreadHighRiskCount > 0 }]">🔔</span>
        <span class="hidden sm:inline">告警中心</span>
        <span 
          v-if="unreadAlertsCount > 0"
          :class="[
            'absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full text-white',
            unreadHighRiskCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
          ]"
        >
          {{ unreadAlertsCount > 99 ? '99+' : unreadAlertsCount }}
        </span>
      </button>
      <span class="text-xs text-gray-400">图表数量: {{ dashboard.charts.length }}</span>
      <button @click="store.toggleTheme()"
        class="px-3 py-1 rounded text-xs border hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
        {{ isDark ? '☀️ 亮色' : '🌙 暗色' }}
      </button>
      <button @click="showModal = true"
        class="px-3 py-1 rounded text-xs bg-primary-500 text-white hover:bg-primary-600">
        + 添加图表
      </button>
    </div>
  </header>

  <CreateChartModal 
    :visible="showModal" 
    @close="showModal = false"
    @create="handleChartCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import CreateChartModal from './CreateChartModal.vue';
import type { ChartConfig } from '../types';

const store = useDashboardStore();
const { dashboard, isDark, alerts, unreadHighRiskCount } = storeToRefs(store);

const showModal = ref(false);

const unreadAlertsCount = computed(() => alerts.value.filter(a => !a.isRead).length);

function scrollToAlerts() {
  const alertPanel = document.querySelector('.alert-panel');
  if (alertPanel) {
    alertPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleChartCreated(chart: ChartConfig) {
  setTimeout(() => {
    const elementId = `chart-${chart.id}`;
    const chartElement = document.getElementById(elementId);
    if (chartElement) {
      chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}
</script>
