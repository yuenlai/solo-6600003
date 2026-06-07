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
      <div class="metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-colors">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💰</span>
          <span class="text-primary-100 text-sm">总销售额</span>
        </div>
        <div class="text-2xl font-bold mb-1">¥{{ formatLargeNumber(overview.totalSales) }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.salesGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.salesGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.salesGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div class="metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-colors">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📦</span>
          <span class="text-primary-100 text-sm">订单量</span>
        </div>
        <div class="text-2xl font-bold mb-1">{{ formatLargeNumber(overview.orderCount) }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.orderGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.orderGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.orderGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div class="metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-colors">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">💎</span>
          <span class="text-primary-100 text-sm">客单价</span>
        </div>
        <div class="text-2xl font-bold mb-1">¥{{ overview.avgOrderValue.toLocaleString() }}</div>
        <div :class="['text-sm font-medium flex items-center gap-1', overview.avgOrderGrowth >= 0 ? 'text-green-300' : 'text-red-300']">
          <span>{{ overview.avgOrderGrowth >= 0 ? '↑' : '↓' }}</span>
          <span>{{ formatGrowth(overview.avgOrderGrowth) }}</span>
          <span class="text-primary-200 text-xs">同比</span>
        </div>
      </div>

      <div class="metric-card bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-colors">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">👥</span>
          <span class="text-primary-100 text-sm">客户数</span>
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
}>();

defineEmits(['refresh']);

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
</style>