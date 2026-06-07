<template>
  <div :class="{ 'dark': isDark }" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <DashboardHeader />
    <main class="p-6 space-y-4 max-w-7xl mx-auto">
      <RegionOverview 
        :overview="regionOverview" 
        @refresh="handleRefreshOverview" 
      />
      
      <AlertPanel @locate="handleLocateToChart" />
      
      <FilterBar />
      
      <div class="charts-container" ref="chartsContainer">
        <div class="chart-row">
          <div class="chart-item">
            <ChartCard
              v-if="salesTrendChart"
              :chart-id="salesTrendChart.id"
              :title="salesTrendChart.title"
              :chart-option="salesTrendChart.option"
              :is-dark="isDark"
              :is-highlighted="highlightedChartId === salesTrendChart.id"
              :alert-count="getChartAlertCount(salesTrendChart.id)"
              @refresh="refreshChart(salesTrendChart.id)"
              @remove="store.removeChart(salesTrendChart.id)"
            />
          </div>
          <div class="chart-item">
            <ChartCard
              v-if="categoryChart"
              :chart-id="categoryChart.id"
              :title="categoryChart.title"
              :chart-option="categoryChart.option"
              :is-dark="isDark"
              :is-highlighted="highlightedChartId === categoryChart.id"
              :alert-count="getChartAlertCount(categoryChart.id)"
              @refresh="refreshChart(categoryChart.id)"
              @remove="store.removeChart(categoryChart.id)"
            />
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-item-full">
            <ChartCard
              v-if="marketShareChart"
              :chart-id="marketShareChart.id"
              :title="marketShareChart.title"
              :chart-option="marketShareChart.option"
              :is-dark="isDark"
              :is-highlighted="highlightedChartId === marketShareChart.id"
              :alert-count="getChartAlertCount(marketShareChart.id)"
              @refresh="refreshChart(marketShareChart.id)"
              @remove="store.removeChart(marketShareChart.id)"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useDashboardStore } from './stores/dashboard';
import { storeToRefs } from 'pinia';
import DashboardHeader from './components/DashboardHeader.vue';
import FilterBar from './components/FilterBar.vue';
import ChartCard from './components/ChartCard.vue';
import RegionOverview from './components/RegionOverview.vue';
import AlertPanel from './components/AlertPanel.vue';

const store = useDashboardStore();
const { dashboard, isDark, regionOverview, alerts, highlightedChartId } = storeToRefs(store);

const chartsContainer = ref<HTMLElement | null>(null);

const salesTrendChart = computed(() => dashboard.value.charts.find(c => c.id === 'chart-1'));
const categoryChart = computed(() => dashboard.value.charts.find(c => c.id === 'chart-2'));
const marketShareChart = computed(() => dashboard.value.charts.find(c => c.id === 'chart-3'));

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function refreshChart(_chartId: string) {
  store.refreshRegionData();
}

function handleRefreshOverview() {
  store.refreshRegionData();
}

function getChartAlertCount(chartId: string): number {
  return alerts.value.filter(a => a.chartId === chartId && !a.isRead).length;
}

function handleLocateToChart(chartId: string) {
  const elementId = `chart-${chartId}`;
  const chartElement = document.getElementById(elementId);
  
  if (chartElement) {
    chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    chartElement.classList.add('locate-highlight');
    setTimeout(() => {
      chartElement.classList.remove('locate-highlight');
    }, 3000);
  } else {
    setTimeout(() => {
      const retryElement = document.getElementById(elementId);
      if (retryElement) {
        retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        retryElement.classList.add('locate-highlight');
        setTimeout(() => {
          retryElement.classList.remove('locate-highlight');
        }, 3000);
      }
    }, 100);
  }
}

onMounted(() => {
  refreshInterval = setInterval(() => {
    store.refreshRegionData();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.chart-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.chart-item {
  flex: 1;
  min-width: 0;
  max-width: calc(50% - 8px);
}

.chart-item-full {
  flex: 1;
  min-width: 0;
  width: 100%;
}

:deep(.locate-highlight) {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4) !important;
  transform: scale(1.02);
  z-index: 100;
  animation: locate-pulse 1s ease-in-out infinite;
}

@keyframes locate-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 50px rgba(59, 130, 246, 0.6);
  }
}
</style>
