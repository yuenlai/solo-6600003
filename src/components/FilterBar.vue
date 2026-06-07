<template>
  <div class="filter-bar bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">查看模式：</span>
        <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <button
            @click="handleSwitchMode(false)"
            :class="[
              'px-4 py-2 text-sm font-medium transition-all duration-200',
              !compareMode.enabled
                ? 'bg-primary-500 text-white'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            ]"
          >
            <span class="flex items-center gap-1">
              <span>📊</span>
              <span>单地区</span>
            </span>
          </button>
          <button
            @click="handleSwitchMode(true)"
            :class="[
              'px-4 py-2 text-sm font-medium transition-all duration-200',
              compareMode.enabled
                ? 'bg-primary-500 text-white'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            ]"
          >
            <span class="flex items-center gap-1">
              <span>⚖️</span>
              <span>地区对比</span>
            </span>
          </button>
        </div>
      </div>

      <Transition name="fade">
        <button
          v-if="compareMode.enabled"
          @click="handleRefreshCompare"
          :disabled="compareModeLoading"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            compareModeLoading
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          ]"
        >
          <span :class="{ 'animate-spin': compareModeLoading }">🔄</span> 
          {{ compareModeLoading ? '加载中...' : '刷新对比数据' }}
        </button>
      </Transition>
    </div>

    <div v-if="!compareMode.enabled && regionFilter" class="region-selector">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">经营视角：</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="opt in regionFilter.options"
          :key="opt"
          @click="handleRegionChange(opt)"
          :class="[
            'region-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            regionFilter.value === opt
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <span class="flex items-center gap-1">
            <span v-if="opt === 'all'">🌍</span>
            <span v-else-if="opt === '华东'">🏙️</span>
            <span v-else-if="opt === '华南'">🌴</span>
            <span v-else-if="opt === '华北'">🏛️</span>
            <span v-else-if="opt === '西南'">⛰️</span>
            <span>{{ opt === 'all' ? '全国' : opt }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="compareMode.enabled" class="compare-region-selector space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">A</span>
            <label class="text-sm font-medium text-blue-700 dark:text-blue-300">对比对象 A</label>
            <span v-if="overallLeader === 'A'" class="ml-auto px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">🏆 领先</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in compareRegions"
              :key="opt"
              @click="handleCompareRegionChange('A', opt)"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                compareMode.regionA === opt
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-gray-200 dark:border-gray-600'
              ]"
            >
              <span class="flex items-center gap-1">
                <span>{{ getRegionIcon(opt) }}</span>
                <span>{{ opt === 'all' ? '全国' : opt }}</span>
              </span>
            </button>
          </div>
        </div>

        <div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">B</span>
            <label class="text-sm font-medium text-green-700 dark:text-green-300">对比对象 B</label>
            <span v-if="overallLeader === 'B'" class="ml-auto px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">🏆 领先</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in compareRegions"
              :key="opt"
              @click="handleCompareRegionChange('B', opt)"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                compareMode.regionB === opt
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/50 border border-gray-200 dark:border-gray-600'
              ]"
            >
              <span class="flex items-center gap-1">
                <span>{{ getRegionIcon(opt) }}</span>
                <span>{{ opt === 'all' ? '全国' : opt }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="comparisonData" class="flex items-center justify-center gap-4 py-2 text-sm">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-500"></span>
          <span class="text-gray-600 dark:text-gray-400">{{ comparisonData.summary.regionA }}</span>
          <span class="font-bold text-blue-600 dark:text-blue-400">{{ comparisonData.summary.totalWinsA }} 胜</span>
        </div>
        <span class="text-2xl font-bold text-gray-300 dark:text-gray-600">VS</span>
        <div class="flex items-center gap-2">
          <span class="font-bold text-green-600 dark:text-green-400">{{ comparisonData.summary.totalWinsB }} 胜</span>
          <span class="text-gray-600 dark:text-gray-400">{{ comparisonData.summary.regionB }}</span>
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
      </div>
    </div>

    <div class="other-filters flex items-center gap-4 flex-wrap pt-3 border-t border-gray-200 dark:border-gray-700">
      <div v-for="filter in otherFilters" :key="filter.id" class="flex items-center gap-2">
        <label class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ filter.label }}:</label>
        <input v-if="filter.type === 'text'" v-model="filter.value" type="text"
          @input="store.updateFilter(filter.id, filter.value)"
          :placeholder="filter.label"
          class="text-sm border rounded px-2 py-1 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        <input v-else-if="filter.type === 'date-range'" type="date"
          @change="store.updateFilter(filter.id, filter.value)"
          class="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';

const store = useDashboardStore();
const { dashboard, comparisonData, compareMode, compareModeLoading } = storeToRefs(store);

const regionFilter = computed(() => 
  dashboard.value.filters.find(f => f.field === 'region')
);

const otherFilters = computed(() => 
  dashboard.value.filters.filter(f => f.field !== 'region')
);

const compareRegions = computed(() => {
  const filter = dashboard.value.filters.find(f => f.field === 'region');
  return filter?.options?.filter(o => o !== 'all') || ['华东', '华南', '华北', '西南'];
});

const overallLeader = computed(() => {
  return comparisonData.value?.summary.overallLeader || null;
});

function handleRegionChange(value: string) {
  if (regionFilter.value) {
    store.updateFilter(regionFilter.value.id, value);
  }
}

function handleSwitchMode(enableCompare: boolean) {
  if (enableCompare !== compareMode.value.enabled) {
    store.toggleCompareMode();
  }
}

function handleCompareRegionChange(side: 'A' | 'B', region: string) {
  store.setCompareRegion(side, region);
}

function handleRefreshCompare() {
  store.refreshComparisonData();
}

function getRegionIcon(region: string): string {
  switch (region) {
    case 'all': return '🌍';
    case '华东': return '🏙️';
    case '华南': return '🌴';
    case '华北': return '🏛️';
    case '西南': return '⛰️';
    default: return '📍';
  }
}
</script>

<style scoped>
.region-tab {
  position: relative;
  overflow: hidden;
}

.region-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: white;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.region-tab.active::after {
  width: 80%;
}

.region-tab:hover:not(.bg-primary-500) {
  transform: translateY(-1px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
