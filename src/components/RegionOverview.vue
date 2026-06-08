<template>
  <div class="region-overview bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 rounded-xl p-6 text-white shadow-lg">
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold mb-1">{{ overview.region }} · 经营概览</h2>
        <p class="text-primary-100 text-sm">数据更新于 {{ updateTime }}</p>
      </div>
      <button @click="$emit('refresh')" 
        class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
        <span>🔄</span> 刷新数据
      </button>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div 
        :class="[
          'metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all duration-300',
          { 'metric-highlighted': isMetricMatched('总销售额') },
          { 'metric-dimmed': shouldDimMetric('总销售额') }
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💰</span>
          <span :class="['text-primary-100 text-sm transition-all', isMetricMatched('总销售额') ? 'font-bold text-yellow-200' : '']">
            总销售额
            <span v-if="isMetricMatched('总销售额')" class="ml-1">🔍</span>
          </span>
        </div>
        <div class="text-2xl font-bold mb-1">¥{{ formatLargeNumber(overview.totalSales) }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.salesGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.salesGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.salesGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div 
        :class="[
          'metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all duration-300',
          { 'metric-highlighted': isMetricMatched('订单量') },
          { 'metric-dimmed': shouldDimMetric('订单量') }
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📦</span>
          <span :class="['text-primary-100 text-sm transition-all', isMetricMatched('订单量') ? 'font-bold text-yellow-200' : '']">
            订单量
            <span v-if="isMetricMatched('订单量')" class="ml-1">🔍</span>
          </span>
        </div>
        <div class="text-2xl font-bold mb-1">{{ formatLargeNumber(overview.orderCount) }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.orderGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.orderGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.orderGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div 
        :class="[
          'metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all duration-300',
          { 'metric-highlighted': isMetricMatched('客单价') },
          { 'metric-dimmed': shouldDimMetric('客单价') }
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💎</span>
          <span :class="['text-primary-100 text-sm transition-all', isMetricMatched('客单价') ? 'font-bold text-yellow-200' : '']">
            客单价
            <span v-if="isMetricMatched('客单价')" class="ml-1">🔍</span>
          </span>
        </div>
        <div class="text-2xl font-bold mb-1">¥{{ overview.avgOrderValue.toLocaleString() }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.avgOrderGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.avgOrderGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.avgOrderGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div 
        :class="[
          'metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all duration-300',
          { 'metric-highlighted': isMetricMatched('客户数') },
          { 'metric-dimmed': shouldDimMetric('客户数') }
        ]"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">👥</span>
          <span :class="['text-primary-100 text-sm transition-all', isMetricMatched('客户数') ? 'font-bold text-yellow-200' : '']">
            客户数
            <span v-if="isMetricMatched('客户数')" class="ml-1">🔍</span>
          </span>
        </div>
        <div class="text-2xl font-bold mb-1">{{ formatLargeNumber(overview.customerCount) }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.customerGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.customerGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.customerGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RegionOverview } from '../types';

const props = defineProps<{
  overview: RegionOverview;
  keywordMatches?: { metricName: string; matched: boolean }[];
  keywordActive?: boolean;
  hasAnyKeywordMatch?: boolean;
}>();

defineEmits(['refresh']);

function isMetricMatched(metricName: string): boolean {
  if (!props.keywordActive || !props.keywordMatches) return false;
  const match = props.keywordMatches.find(m => m.metricName === metricName);
  return match?.matched || false;
}

function shouldDimMetric(metricName: string): boolean {
  if (!props.keywordActive || !props.hasAnyKeywordMatch) return false;
  return !isMetricMatched(metricName);
}

const updateTime = computed(() => {
  const now = new Date();
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
});

function formatLargeNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function formatGrowth(growth: number): string {
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${(growth * 100).toFixed(1)}%`;
}
</script>

<style scoped>
.metric-card {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card.metric-highlighted {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.3), rgba(245, 158, 11, 0.3));
  border: 2px solid rgba(250, 204, 21, 0.6);
  box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
  transform: scale(1.02);
  animation: metric-pulse 2s ease-in-out infinite;
}

.metric-card.metric-dimmed {
  opacity: 0.4;
  filter: grayscale(0.8);
  transform: scale(0.98);
}

@keyframes metric-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(250, 204, 21, 0.6);
  }
}
</style>