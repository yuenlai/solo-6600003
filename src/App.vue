<template>
  <div :class="{ 'dark': isDark }" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <DashboardHeader @chart-created="handleNewChartCreated" @show-toast="showToast" />
    <main class="p-6 space-y-4 max-w-7xl mx-auto">
      <FilterBar />

      <div class="main-content-wrapper relative">
        <Transition name="fade">
          <div 
            v-show="compareMode.enabled" 
            :key="'compare-view'"
            class="compare-view-container"
          >
            <RegionCompareSkeleton v-if="compareModeLoading || !comparisonData" :key="'skeleton-' + comparisonVersion" />
            <RegionCompare
              v-else
              :key="'compare-' + comparisonVersion"
              :comparison-data="comparisonData"
              :is-dark="isDark"
              @refresh="handleRefreshComparison"
            />
          </div>
        </Transition>

        <Transition name="fade">
          <div 
            v-show="!compareMode.enabled" 
            :key="'normal-view'"
            class="normal-view-container space-y-4"
          >
          <RegionOverview 
            :overview="regionOverview" 
            @refresh="handleRefreshOverview" 
          />
          
          <AlertPanel @locate="handleLocateToChart" />
          
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
                  @click="handleChartClick(salesTrendChart.id)"
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
                  @click="handleChartClick(categoryChart.id)"
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
                  @click="handleChartClick(marketShareChart.id)"
                />
              </div>
            </div>

            <TransitionGroup name="chart-list" tag="div" class="space-y-4">
              <template v-for="(row, _index) in customChartRows" :key="row.map(c => c.id).join('-')">
                <div class="chart-row">
                  <div 
                    v-for="chart in row" 
                    :key="chart.id"
                    :class="[
                      row.length === 1 ? 'chart-item-full' : 'chart-item',
                      { 'chart-leaving': deletingChartIds.has(chart.id) }
                    ]"
                  >
                    <ChartCard
                      :chart-id="chart.id"
                      :title="chart.title"
                      :chart-option="chart.option"
                      :is-dark="isDark"
                      :is-custom="chart.isCustom"
                      :is-new="newChartIds.has(chart.id)"
                      :is-highlighted="highlightedChartId === chart.id"
                      :alert-count="getChartAlertCount(chart.id)"
                      @refresh="refreshChart(chart.id)"
                      @remove="handleRemoveChart(chart.id)"
                      @animation-end="handleAnimationEnd(chart.id)"
                      @click="handleChartClick(chart.id)"
                    />
                  </div>
                </div>
              </template>
            </TransitionGroup>
          </div>
        </div>
        </Transition>
      </div>
    </main>

    <Teleport to="body">
      <Transition name="toast">
        <div 
          v-if="toastMessage" 
          class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          :class="toastType === 'success' ? 'bg-green-500' : 'bg-blue-500'"
        >
          <span class="text-white font-medium">{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>

    <ChartDetailDrawer
      :visible="chartDetailDrawerVisible"
      :detail-data="chartDetailData"
      :loading="chartDetailLoading"
      :is-dark="isDark"
      @close="store.closeChartDetail"
      @refresh="store.refreshChartDetail"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useDashboardStore } from './stores/dashboard';
import { storeToRefs } from 'pinia';
import DashboardHeader from './components/DashboardHeader.vue';
import FilterBar from './components/FilterBar.vue';
import ChartCard from './components/ChartCard.vue';
import RegionOverview from './components/RegionOverview.vue';
import AlertPanel from './components/AlertPanel.vue';
import RegionCompare from './components/RegionCompare.vue';
import RegionCompareSkeleton from './components/RegionCompareSkeleton.vue';
import ChartDetailDrawer from './components/ChartDetailDrawer.vue';

const store = useDashboardStore();
const { dashboard, isDark, regionOverview, alerts, highlightedChartId, compareMode, compareModeLoading, comparisonData, comparisonVersion, chartDetailDrawerVisible, chartDetailData, chartDetailLoading } = storeToRefs(store);

watch(() => compareMode.value.enabled, (newVal) => {
  if (newVal) {
    store.ensureCompareDataLoaded();
    showToast('⚖️ 已切换到地区对比模式', 'info');
  } else {
    showToast('📊 已切换到单地区模式', 'info');
  }
});

onMounted(() => {
  store.ensureCompareDataLoaded();
});

const chartsContainer = ref<HTMLElement | null>(null);
const newChartIds = ref<Set<string>>(new Set());
const deletingChartIds = ref<Set<string>>(new Set());
const toastMessage = ref('');
const toastType = ref<'success' | 'info'>('success');

let toastTimer: ReturnType<typeof setTimeout> | null = null;

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

function showToast(message: string, type: 'success' | 'info' = 'success') {
  if (toastTimer) clearTimeout(toastTimer);
  toastMessage.value = message;
  toastType.value = type;
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

function handleNewChartCreated(chartId: string) {
  newChartIds.value.add(chartId);
  showToast('✨ 图表创建成功！新卡片已添加到下方');
  
  setTimeout(() => {
    const elementId = `chart-${chartId}`;
    const chartElement = document.getElementById(elementId);
    if (chartElement) {
      chartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chartElement.classList.add('create-flash');
      setTimeout(() => {
        chartElement.classList.remove('create-flash');
      }, 1000);
    }
  }, 100);
}

function handleAnimationEnd(chartId: string) {
  newChartIds.value.delete(chartId);
}

function refreshChart(chartId: string) {
  const chart = dashboard.value.charts.find(c => c.id === chartId);
  if (chart && chart.isCustom) {
    store.refreshCustomChart(chartId);
    setTimeout(() => {
      showToast('🔄 数据已刷新，数值已更新', 'info');
      
      const elementId = `chart-${chartId}`;
      const chartElement = document.getElementById(elementId);
      if (chartElement) {
        chartElement.classList.add('refresh-flash');
        setTimeout(() => {
          chartElement.classList.remove('refresh-flash');
        }, 600);
      }
    }, 600);
  } else {
    store.refreshRegionData();
    showToast('🔄 全局数据已刷新', 'info');
  }
}

function handleRefreshOverview() {
  store.refreshRegionData();
}

function handleRefreshComparison() {
  store.refreshComparisonData();
  showToast('🔄 对比数据已刷新', 'info');
}

function handleRemoveChart(chartId: string) {
  deletingChartIds.value.add(chartId);
  showToast('🗑️ 图表已删除，从布局中移除', 'info');
  
  const elementId = `chart-${chartId}`;
  const chartElement = document.getElementById(elementId);
  if (chartElement) {
    chartElement.classList.add('delete-flash');
  }
  
  setTimeout(() => {
    store.removeChart(chartId);
    deletingChartIds.value.delete(chartId);
    newChartIds.value.delete(chartId);
  }, 400);
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

function handleChartClick(chartId: string) {
  store.openChartDetail(chartId);
}

onMounted(() => {
  refreshInterval = setInterval(() => {
    store.refreshRegionData();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

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

.chart-leaving {
  animation: chart-leave-animation 0.3s ease-out forwards;
}

@keyframes chart-leave-animation {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.9);
  }
}

.chart-list-enter-active {
  transition: all 0.3s ease;
}

.chart-list-leave-active {
  transition: all 0.3s ease;
}

.chart-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.chart-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
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

:deep(.create-flash) {
  animation: create-flash-animation 1s ease-out !important;
}

@keyframes create-flash-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.6);
    transform: scale(1.02);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(34, 197, 94, 0), 0 0 80px rgba(34, 197, 94, 0.3);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: scale(1);
  }
}

:deep(.delete-flash) {
  animation: delete-flash-animation 0.4s ease-in forwards !important;
}

@keyframes delete-flash-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8);
    opacity: 1;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.4);
    opacity: 0.8;
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 20px rgba(239, 68, 68, 0);
    opacity: 0;
    transform: scale(0.9);
  }
}

:deep(.refresh-flash) {
  animation: refresh-flash-animation 0.6s ease-out !important;
}

@keyframes refresh-flash-animation {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.5);
  }
  100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
}
</style>
