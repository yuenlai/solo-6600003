<template>
  <div class="filter-bar bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-4">
    <Transition name="slide-down">
      <div v-if="allActiveFilters.length > 0" class="filter-status-bar bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">已选条件：</span>
          </div>
          <div class="flex flex-wrap gap-2 flex-1">
            <TransitionGroup name="tag">
              <div
                v-for="filter in allActiveFilters"
                :key="filter.id"
                class="filter-tag inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
              >
                <span class="text-xs opacity-75">{{ filter.label }}:</span>
                <span>{{ formatFilterValue(filter) }}</span>
                <button
                  @click="handleClearFilter(filter.id)"
                  class="ml-1 w-4 h-4 rounded-full bg-primary-200 dark:bg-primary-800 hover:bg-primary-300 dark:hover:bg-primary-700 flex items-center justify-center transition-colors"
                  title="清除此条件"
                >
                  <span class="text-xs text-primary-700 dark:text-primary-300 leading-none">×</span>
                </button>
              </div>
            </TransitionGroup>
          </div>
          <button
            @click="handleClearAllFilters"
            class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors whitespace-nowrap"
          >
            清除全部
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="slide-down">
      <div v-if="filterHitScope" class="hit-scope-bar bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-blue-600 dark:text-blue-400">🎯</span>
              <span class="text-sm text-gray-700 dark:text-gray-300">
                命中范围：<span class="font-semibold text-blue-600 dark:text-blue-400">{{ filterHitScope.hit }}</span>
                <span class="text-gray-500 dark:text-gray-400"> / {{ filterHitScope.total }} 条</span>
                <span class="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  {{ filterHitScope.percentage }}%
                </span>
              </span>
            </div>
            <div class="h-4 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>
            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <span class="text-gray-500 dark:text-gray-500">地区：</span>
                <span class="font-medium">{{ filterHitScope.region }}</span>
              </span>
              <span class="hidden sm:inline">
                <span class="text-gray-500 dark:text-gray-500">销售额：</span>
                <span class="font-medium">{{ formatNumber(filterHitScope.totalSales) }}</span>
              </span>
              <span class="hidden md:inline">
                <span class="text-gray-500 dark:text-gray-500">订单量：</span>
                <span class="font-medium">{{ formatNumber(filterHitScope.totalOrders) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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

    <div class="other-filters flex items-start gap-4 flex-wrap pt-3 border-t border-gray-200 dark:border-gray-700">
      <div v-for="filter in otherFilters" :key="filter.id" class="flex items-center gap-2">
        <label class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ filter.label }}:</label>
        <input v-if="filter.type === 'text'" :value="filter.value" type="text"
          @input="handleTextFilterInput(filter.id, $event)"
          :placeholder="filter.label"
          class="text-sm border rounded px-2 py-1 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        <div v-else-if="filter.type === 'date-range'" class="date-range-picker">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <input
                ref="startDateInput"
                type="date"
                :value="getDateRangeValue(filter.id, 0)"
                @input="handleStartDateInput(filter.id, $event)"
                @blur="handleStartDateBlur(filter.id, $event)"
                :max="getDateRangeValue(filter.id, 1) || ''"
                class="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <span class="text-gray-400 dark:text-gray-500">至</span>
              <input
                ref="endDateInput"
                type="date"
                :value="getDateRangeValue(filter.id, 1)"
                @input="handleEndDateInput(filter.id, $event)"
                @blur="handleEndDateBlur(filter.id, $event)"
                :min="getDateRangeValue(filter.id, 0) || ''"
                class="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                v-if="hasDateRangeValue(filter.id)"
                @click="handleClearDateRange(filter.id)"
                class="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="清除日期范围"
              >
                ✕
              </button>
            </div>
            <div class="flex items-center gap-1 flex-wrap">
              <button
                v-for="quick in quickDateOptions"
                :key="quick.label"
                @click="handleQuickDateSelect(filter.id, quick)"
                :class="[
                  'text-xs px-2 py-1 rounded transition-all duration-200',
                  isQuickDateActive(filter.id, quick)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                {{ quick.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import type { FilterConfig } from '../types';

const store = useDashboardStore();
const { 
  dashboard, 
  comparisonData, 
  compareMode, 
  compareModeLoading, 
  allActiveFilters, 
  filterHitScope 
} = storeToRefs(store);

interface QuickDateOption {
  label: string;
  days: number;
}

const quickDateOptions: QuickDateOption[] = [
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 },
  { label: '本月', days: 0 },
  { label: '上月', days: -1 }
];

const activeQuickDate = ref<{ [key: string]: string }>({});

const startDateInput = ref<HTMLInputElement | null>(null);
const endDateInput = ref<HTMLInputElement | null>(null);
const debounceTimer = ref<{ [key: string]: ReturnType<typeof setTimeout> }>({});
const pendingDateValues = ref<{ [key: string]: string[] }>({});

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return true;
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  if (!DATE_REGEX.test(start) || !DATE_REGEX.test(end)) return false;
  return start <= end;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeValue(filterId: string, index: number): string {
  const filter = dashboard.value.filters.find(f => f.id === filterId);
  if (filter && Array.isArray(filter.value) && filter.value[index]) {
    return filter.value[index];
  }
  return '';
}

function hasDateRangeValue(filterId: string): boolean {
  const filter = dashboard.value.filters.find(f => f.id === filterId);
  return !!(filter && Array.isArray(filter.value) && filter.value.length > 0 && filter.value.some((v: string) => v));
}

function getDateRangeArray(filterId: string): string[] {
  const filter = dashboard.value.filters.find(f => f.id === filterId);
  if (filter && Array.isArray(filter.value)) {
    return [...filter.value];
  }
  return ['', ''];
}

function debounceUpdateFilter(filterId: string, value: string[], delay: number = 300) {
  if (debounceTimer.value[filterId]) {
    clearTimeout(debounceTimer.value[filterId]);
  }
  
  debounceTimer.value[filterId] = setTimeout(() => {
    store.updateFilter(filterId, value);
  }, delay);
}

function buildValidDateRange(
  _filterId: string, 
  startValue: string, 
  endValue: string
): { newRange: string[]; shouldUpdate: boolean; isCompletelyEmpty: boolean; isPartialInput: boolean } {
  const isStartValid = isValidDateString(startValue);
  const isEndValid = isValidDateString(endValue);
  
  const isCompletelyEmpty = !startValue && !endValue;
  const isPartialInput: boolean = !!(startValue && !isStartValid) || !!(endValue && !isEndValid);
  
  if (isPartialInput) {
    return { newRange: [startValue, endValue], shouldUpdate: false, isCompletelyEmpty, isPartialInput };
  }
  
  let newStart = startValue;
  let newEnd = endValue;
  
  if (startValue && !endValue) {
    const start = new Date(startValue);
    const defaultEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    newEnd = formatDate(defaultEnd > today ? today : defaultEnd);
  } else if (!startValue && endValue) {
    const end = new Date(endValue);
    const defaultStart = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    newStart = formatDate(defaultStart);
  }
  
  if (newStart && newEnd && newStart > newEnd) {
    newEnd = newStart;
  }
  
  const shouldUpdate = isCompletelyEmpty || (isValidDateRange(newStart, newEnd));
  
  return { newRange: [newStart, newEnd], shouldUpdate, isCompletelyEmpty, isPartialInput };
}

function handleStartDateInput(filterId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const currentRange = getDateRangeArray(filterId);
  const endDate = currentRange[1];
  
  const { newRange, shouldUpdate, isCompletelyEmpty, isPartialInput } = buildValidDateRange(
    filterId,
    target.value,
    endDate
  );
  
  activeQuickDate.value[filterId] = '';
  
  if (isCompletelyEmpty) {
    if (debounceTimer.value[filterId]) {
      clearTimeout(debounceTimer.value[filterId]);
      delete debounceTimer.value[filterId];
    }
    store.updateFilter(filterId, newRange);
    return;
  }
  
  if (isPartialInput) {
    pendingDateValues.value[filterId] = newRange;
    return;
  }
  
  if (shouldUpdate) {
    if (newRange[1] && newRange[1] !== endDate) {
      target.value = newRange[0];
      if (endDateInput.value) {
        endDateInput.value.value = newRange[1];
      }
    }
    debounceUpdateFilter(filterId, newRange, 100);
  } else {
    pendingDateValues.value[filterId] = newRange;
  }
}

function handleStartDateBlur(filterId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const currentRange = getDateRangeArray(filterId);
  const endDate = currentRange[1];
  
  if (debounceTimer.value[filterId]) {
    clearTimeout(debounceTimer.value[filterId]);
    delete debounceTimer.value[filterId];
  }
  
  const pending = pendingDateValues.value[filterId];
  const inputValue = pending ? pending[0] : target.value;
  
  const { newRange, shouldUpdate, isCompletelyEmpty, isPartialInput } = buildValidDateRange(
    filterId,
    inputValue,
    endDate
  );
  
  activeQuickDate.value[filterId] = '';
  
  if (isPartialInput) {
    target.value = currentRange[0] || '';
    delete pendingDateValues.value[filterId];
    return;
  }
  
  if (shouldUpdate || isCompletelyEmpty) {
    if (newRange[0] && newRange[1] && newRange[0] <= newRange[1]) {
      target.value = newRange[0];
      if (endDateInput.value) {
        endDateInput.value.value = newRange[1];
      }
    }
    store.updateFilter(filterId, newRange);
    delete pendingDateValues.value[filterId];
  } else {
    target.value = currentRange[0] || '';
    delete pendingDateValues.value[filterId];
  }
}

function handleEndDateInput(filterId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const currentRange = getDateRangeArray(filterId);
  const startDate = currentRange[0];
  
  const { newRange, shouldUpdate, isCompletelyEmpty, isPartialInput } = buildValidDateRange(
    filterId,
    startDate,
    target.value
  );
  
  activeQuickDate.value[filterId] = '';
  
  if (isCompletelyEmpty) {
    if (debounceTimer.value[filterId]) {
      clearTimeout(debounceTimer.value[filterId]);
      delete debounceTimer.value[filterId];
    }
    store.updateFilter(filterId, newRange);
    return;
  }
  
  if (isPartialInput) {
    pendingDateValues.value[filterId] = newRange;
    return;
  }
  
  if (shouldUpdate) {
    if (newRange[0] && newRange[0] !== startDate) {
      target.value = newRange[1];
      if (startDateInput.value) {
        startDateInput.value.value = newRange[0];
      }
    }
    debounceUpdateFilter(filterId, newRange, 100);
  } else {
    pendingDateValues.value[filterId] = newRange;
  }
}

function handleEndDateBlur(filterId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const currentRange = getDateRangeArray(filterId);
  const startDate = currentRange[0];
  
  if (debounceTimer.value[filterId]) {
    clearTimeout(debounceTimer.value[filterId]);
    delete debounceTimer.value[filterId];
  }
  
  const pending = pendingDateValues.value[filterId];
  const inputValue = pending ? pending[1] : target.value;
  
  const { newRange, shouldUpdate, isCompletelyEmpty, isPartialInput } = buildValidDateRange(
    filterId,
    startDate,
    inputValue
  );
  
  activeQuickDate.value[filterId] = '';
  
  if (isPartialInput) {
    target.value = currentRange[1] || '';
    delete pendingDateValues.value[filterId];
    return;
  }
  
  if (shouldUpdate || isCompletelyEmpty) {
    if (newRange[0] && newRange[1] && newRange[0] <= newRange[1]) {
      target.value = newRange[1];
      if (startDateInput.value) {
        startDateInput.value.value = newRange[0];
      }
    }
    store.updateFilter(filterId, newRange);
    delete pendingDateValues.value[filterId];
  } else {
    target.value = currentRange[1] || '';
    delete pendingDateValues.value[filterId];
  }
}

function handleClearDateRange(filterId: string) {
  activeQuickDate.value[filterId] = '';
  
  if (debounceTimer.value[filterId]) {
    clearTimeout(debounceTimer.value[filterId]);
    delete debounceTimer.value[filterId];
  }
  delete pendingDateValues.value[filterId];
  
  if (startDateInput.value) {
    startDateInput.value.value = '';
  }
  if (endDateInput.value) {
    endDateInput.value.value = '';
  }
  
  store.clearFilter(filterId);
}

function handleQuickDateSelect(filterId: string, option: QuickDateOption) {
  if (debounceTimer.value[filterId]) {
    clearTimeout(debounceTimer.value[filterId]);
    delete debounceTimer.value[filterId];
  }
  delete pendingDateValues.value[filterId];
  
  const today = new Date();
  let startDate: Date;
  let endDate: Date;
  
  if (option.days === 0) {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = today;
  } else if (option.days === -1) {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
  } else {
    endDate = today;
    startDate = new Date(today.getTime() - (option.days - 1) * 24 * 60 * 60 * 1000);
  }
  
  const newRange = [formatDate(startDate), formatDate(endDate)];
  activeQuickDate.value[filterId] = option.label;
  
  if (startDateInput.value) {
    startDateInput.value.value = newRange[0];
  }
  if (endDateInput.value) {
    endDateInput.value.value = newRange[1];
  }
  
  store.updateFilter(filterId, newRange);
}

function isQuickDateActive(filterId: string, option: QuickDateOption): boolean {
  return activeQuickDate.value[filterId] === option.label;
}

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

function formatFilterValue(filter: FilterConfig & { field: string }): string {
  if (filter.field === 'compareRegionA' || filter.field === 'compareRegionB') {
    const icon = getRegionIcon(filter.value);
    const name = filter.value === 'all' ? '全国' : filter.value;
    return `${icon} ${name}`;
  }
  if (filter.field === 'region') {
    const icon = getRegionIcon(filter.value);
    const name = filter.value === 'all' ? '全国' : filter.value;
    return `${icon} ${name}`;
  }
  if (filter.type === 'date-range' && Array.isArray(filter.value)) {
    const isValid = filter.value.length === 2 
      && filter.value[0] 
      && filter.value[1] 
      && filter.value[0] <= filter.value[1];
    return isValid ? filter.value.join(' ~ ') : '未设置';
  }
  return String(filter.value) || '未设置';
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + ' 万';
  }
  return num.toLocaleString();
}

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

function handleClearFilter(filterId: string) {
  store.clearFilter(filterId);
}

function handleClearAllFilters() {
  store.clearAllFilters();
}

function handleTextFilterInput(filterId: string, event: Event) {
  const target = event.target as HTMLInputElement;
  store.updateFilter(filterId, target.value);
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

watch(() => dashboard.value.filters, (newFilters) => {
  newFilters.forEach(filter => {
    if (filter.type === 'date-range') {
      if (!Array.isArray(filter.value) || filter.value.length === 0 || !filter.value.some((v: string) => v)) {
        if (activeQuickDate.value[filter.id]) {
          activeQuickDate.value[filter.id] = '';
        }
      }
    }
  });
}, { deep: true });
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

.filter-tag {
  animation: tagPulse 0.3s ease-out;
}

@keyframes tagPulse {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 200px;
}

.tag-enter-active,
.tag-leave-active {
  transition: all 0.3s ease;
}

.tag-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
  margin: 0 -10px;
}

.tag-move {
  transition: transform 0.3s ease;
}
</style>
