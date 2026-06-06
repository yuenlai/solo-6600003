<template>
  <div :class="{ 'dark': isDark }" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <DashboardHeader />
    <main class="p-6 space-y-4">
      <FilterBar />
      <div class="grid grid-cols-12 gap-4">
        <div v-for="chart in dashboard.charts" :key="chart.id"
          :class="`col-span-${Math.min(chart.gridArea.w, 12)}`">
          <ChartCard
            :title="chart.title"
            :chart-option="chart.option"
            :is-dark="isDark"
            @refresh="refreshChart(chart.id)"
            @remove="store.removeChart(chart.id)"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import DashboardHeader from './components/DashboardHeader.vue';
import FilterBar from './components/FilterBar.vue';
import ChartCard from './components/ChartCard.vue';
import { generateTimeSeriesData } from './mock/data';

const store = useDashboardStore();
const { dashboard, isDark } = storeToRefs(store);

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function refreshChart(chartId: string) {
  const newData = generateTimeSeriesData(6).map(d => d.value);
  const chart = dashboard.value.charts.find(c => c.id === chartId);
  if (chart && chart.option.series) {
    chart.option.series[0].data = newData;
    store.updateChartData(chartId, { series: chart.option.series });
  }
}

onMounted(() => {
  // Simulate real-time data refresh every 5 seconds
  refreshInterval = setInterval(() => {
    dashboard.value.charts.forEach(chart => {
      if (chart.type === 'line') {
        refreshChart(chart.id);
      }
    });
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>
