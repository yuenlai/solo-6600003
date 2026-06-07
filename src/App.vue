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

        <template v-for="(row, _index) in customChartRows" :key="_index">
          <div class="chart-row">
            <template v-for="chart in row" :key="chart.id">
              <div :class="row.length === 1 ? 'chart-item-full' : 'chart-item'">
                <ChartCard
                  :chart-id="chart.id"
                  :title="chart.title"
                  :chart-option="chart.option"
                  :is-dark="isDark"
                  :is-highlighted="highlightedChartId === chart.id"
                  :alert-count="getChartAlertCount(chart.id)"
                  @refresh="refreshChart(chart.id)"
                  @remove="handleRemoveChart(chart.id)"
                />
              </div>
            </template>
          </div>
        </template>
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

const customCharts = computed(() => dashboard.value.charts.filter(c => c.isCustom));

const customChartRows = computed(() => {
  const rows: typeof customCharts.value[] = [];
  for (let i = 0; i < customCharts.value.length; i += 2) {
    rows.push(customCharts.value.slice(i, i + 2));
  }
  return rows;
});

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function refreshChart(chartId: string) {
  const chart = dashboard.value.charts.find(c => c.id === chartId);
  if (chart && chart.isCustom) {
    store.refreshCustomChart(chartId);
  } else {
    store.refreshRegionData();
  }
}

function handleRefreshOverview() {
  store.refreshRegionData();
}

function handleRemoveChart(chartId: string) {
  store.removeChart(chartId);
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
    }, 5000);
  } else {
    setTimeout(() => {
      const retryElement = document.getElementById(elementId);
      if (retryElement) {
        retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        retryElement.classList.add('locate-highlight');
        setTimeout(() => {
          retryElement.classList.remove('locate-highlight');
        }, 5000);
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
  box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.6), 0 20px 60px rgba(0, 0, 0, 0.4) !important;
  transform: scale(1.08) !important;
  z-index: 1000 !important;
  position: relative !important;
  animation: locate-pulse 0.8s ease-in-out infinite !important;
}

:deep(.locate-highlight::before) {
  content: '📍 告警定位到此图表' !important;
  position: absolute !important;
  top: -16px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: linear-gradient(90deg, #ef4444, #f97316) !important;
  color: white !important;
  padding: 6px 20px !important;
  border-radius: 20px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  z-index: 1001 !important;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5) !important;
  white-space: nowrap !important;
}

@keyframes locate-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.6), 0 20px 60px rgba(0, 0, 0, 0.4);
    transform: scale(1.08);
  }
  50% { 
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.8), 0 20px 60px rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
}
</style>
