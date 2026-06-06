<template>
  <div class="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex-wrap">
    <div v-for="filter in dashboard.filters" :key="filter.id" class="flex items-center gap-2">
      <label class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ filter.label }}:</label>
      <select v-if="filter.type === 'select'" v-model="filter.value"
        @change="store.updateFilter(filter.id, filter.value)"
        class="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        <option v-for="opt in filter.options" :key="opt" :value="opt">{{ opt === 'all' ? '全部' : opt }}</option>
      </select>
      <input v-else-if="filter.type === 'text'" v-model="filter.value" type="text"
        @input="store.updateFilter(filter.id, filter.value)"
        :placeholder="filter.label"
        class="text-sm border rounded px-2 py-1 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      <input v-else-if="filter.type === 'date-range'" type="date"
        @change="store.updateFilter(filter.id, filter.value)"
        class="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';

const store = useDashboardStore();
const { dashboard } = storeToRefs(store);
</script>
