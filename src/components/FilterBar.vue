<template>
  <div class="filter-bar bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
    <div v-if="regionFilter" class="region-selector">
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
const { dashboard } = storeToRefs(store);

const regionFilter = computed(() => 
  dashboard.value.filters.find(f => f.field === 'region')
);

const otherFilters = computed(() => 
  dashboard.value.filters.filter(f => f.field !== 'region')
);

function handleRegionChange(value: string) {
  if (regionFilter.value) {
    store.updateFilter(regionFilter.value.id, value);
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
</style>
