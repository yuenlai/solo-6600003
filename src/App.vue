<template>
  <div :class="{ 'dark': isDark }" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <DashboardHeader />
    <main class="p-6 space-y-4 max-w-7xl mx-auto">
      <RegionOverview 
        :overview="regionOverview" 
        @refresh="handleRefreshOverview" 
      />
      
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
import RegionOverview from './components/RegionOverview.vue';

const store = useDashboardStore();
const { dashboard, isDark, regionOverview } = storeToRefs(store);

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function refreshChart(chartId: string) {
  store.refreshRegionData();
}

function handleRefreshOverview() {
  store.refreshRegionData();
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
