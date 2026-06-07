<template>
  <div :class="['alert-panel', { 'dark': isDark }]" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
    <div class="alert-header bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 text-white p-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span class="text-xl">🔔</span>
          </div>
          <div>
            <h2 class="text-lg font-bold">实时告警看板</h2>
            <p class="text-xs text-white/80">
              共 {{ alerts.length }} 条告警 · 
              <span v-if="unreadHighRiskCount > 0" class="font-bold animate-pulse">
                {{ unreadHighRiskCount }} 条高风险未处理
              </span>
              <span v-else>暂无高风险告警</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="unreadHighRiskCount > 0"
            @click="showHighRiskBanner = !showHighRiskBanner"
            class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <span class="w-2 h-2 bg-red-300 rounded-full animate-ping"></span>
            <span>高风险提示</span>
          </button>
          <button 
            @click="store.refreshAlerts(true)"
            class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <span>🔄</span>
            <span>刷新</span>
          </button>
          <button 
            @click="store.markAllAlertsAsRead()"
            class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            全部已读
          </button>
        </div>
      </div>
      
      <div v-if="showHighRiskBanner && unreadHighRiskCount > 0" class="mt-4 p-3 bg-red-600/50 rounded-lg border border-red-400/50">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div class="flex-1">
            <h4 class="font-bold mb-1">高风险告警提醒</h4>
            <p class="text-sm text-white/90 mb-2">检测到 {{ unreadHighRiskCount }} 条高风险告警需要立即处理：</p>
            <ul class="text-sm space-y-1">
              <li v-for="alert in highRiskAlerts.slice(0, 3)" :key="alert.id" class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 bg-red-300 rounded-full"></span>
                {{ alert.title }} - {{ alert.description.substring(0, 50) }}...
              </li>
            </ul>
            <button 
              @click="filterType = 'all'; filterLevel = 'high'"
              class="mt-2 text-sm underline hover:no-underline"
            >
              查看全部高风险告警 →
            </button>
          </div>
          <button @click="showHighRiskBanner = false" class="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
      </div>
    </div>
    
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex gap-2">
          <button 
            v-for="type in alertTypes" 
            :key="type.value"
            @click="filterType = type.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterType === type.value 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            <span class="mr-1">{{ type.icon }}</span>
            {{ type.label }}
            <span class="ml-1 text-xs opacity-70">({{ getTypeCount(type.value) }})</span>
          </button>
        </div>
        <div class="flex gap-2">
          <button 
            v-for="level in alertLevels" 
            :key="level.value"
            @click="filterLevel = level.value"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterLevel === level.value 
                ? level.activeClass 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            {{ level.label }}
            <span class="ml-1 text-xs opacity-70">({{ getLevelCount(level.value) }})</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="alert-list max-h-96 overflow-y-auto">
      <div v-if="filteredAlerts.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-500">
        <span class="text-4xl block mb-2">✅</span>
        <p>暂无符合条件的告警</p>
      </div>
      
      <div 
        v-for="alert in filteredAlerts" 
        :key="alert.id"
        :class="[
          'alert-item p-4 border-l-4 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50',
          getAlertBorderClass(alert.level),
          { 'opacity-60': alert.isRead },
          { 'bg-red-50 dark:bg-red-900/20': alert.level === 'high' && !alert.isRead },
          { 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800': highlightedChartId === alert.chartId }
        ]"
        @click="handleAlertClick(alert)"
      >
        <div class="flex items-start gap-3">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', getAlertIconBg(alert.level)]">
            <span class="text-lg">{{ getAlertIcon(alert.type) }}</span>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 :class="['font-semibold truncate', { 'text-gray-900 dark:text-gray-100': !alert.isRead, 'text-gray-500 dark:text-gray-400': alert.isRead }]">
                {{ alert.title }}
              </h4>
              <span :class="['px-2 py-0.5 rounded text-xs font-medium', getAlertBadgeClass(alert.level)]">
                {{ getLevelLabel(alert.level) }}
              </span>
              <span v-if="!alert.isRead" class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {{ alert.description }}
            </p>
            
            <div class="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span class="flex items-center gap-1">
                <span>📊</span>
                {{ getChartName(alert.chartId) }}
              </span>
              <span class="flex items-center gap-1">
                <span>📈</span>
                {{ alert.metricName }}
              </span>
              <span :class="[
                'flex items-center gap-1 font-medium',
                alert.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
              ]">
                <span>{{ alert.changePercent >= 0 ? '↑' : '↓' }}</span>
                {{ (Math.abs(alert.changePercent) * 100).toFixed(1) }}%
              </span>
              <span class="flex items-center gap-1">
                <span>⏰</span>
                {{ formatTime(alert.timestamp) }}
              </span>
            </div>
          </div>
          
          <div class="flex flex-col gap-2 flex-shrink-0">
            <button 
              @click.stop="locateToChart(alert)"
              class="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
              title="定位到图表"
            >
              🎯
            </button>
            <button 
              v-if="!alert.isRead"
              @click.stop="store.markAlertAsRead(alert.id)"
              class="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
              title="标记已读"
            >
              ✓
            </button>
            <button 
              @click.stop="store.dismissAlert(alert.id)"
              class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="忽略告警"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div v-if="alert.dataPoints && alert.dataPoints.length > 0" class="mt-3 ml-13 pl-13">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">最近数据趋势：</p>
            <div class="flex items-end gap-1 h-12">
              <div 
                v-for="(point, index) in alert.dataPoints" 
                :key="index"
                :class="[
                  'flex-1 rounded-t transition-all',
                  index === alert.dataPoints.length - 1 ? getAlertBarColor(alert.level) : 'bg-gray-300 dark:bg-gray-600'
                ]"
                :style="{ height: `${getBarHeight(point.value, alert.dataPoints)}%` }"
                :title="`${point.timestamp}: ${point.value.toLocaleString()}`"
              ></div>
            </div>
            <div class="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
              <span>{{ alert.dataPoints[0]?.timestamp }}</span>
              <span>{{ alert.dataPoints[alert.dataPoints.length - 1]?.timestamp }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
      <span>最后更新：{{ formatTime(lastAlertUpdate) }}</span>
      <div class="flex items-center gap-2">
        <span :class="['w-2 h-2 rounded-full', alertAutoRefresh ? 'bg-green-500' : 'bg-gray-400']"></span>
        <span>自动刷新{{ alertAutoRefresh ? '已开启' : '已关闭' }}</span>
        <button 
          @click="store.toggleAlertAutoRefresh()"
          class="text-primary-500 hover:underline"
        >
          {{ alertAutoRefresh ? '关闭' : '开启' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import type { Alert, AlertType, AlertLevel } from '../types';

const emit = defineEmits<{
  (e: 'locate', chartId: string): void;
}>();

const store = useDashboardStore();
const { 
  alerts, unreadHighRiskCount, highRiskAlerts, 
  alertsByLevel, alertsByType, 
  highlightedChartId, alertAutoRefresh, lastAlertUpdate,
  isDark 
} = storeToRefs(store);

const filterType = ref<AlertType | 'all'>('all');
const filterLevel = ref<AlertLevel | 'all'>('all');
const showHighRiskBanner = ref(true);

const alertTypes: { value: AlertType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'abnormal_fluctuation', label: '异常波动', icon: '📊' },
  { value: 'continuous_decline', label: '连续下滑', icon: '📉' },
  { value: 'surge', label: '访问激增', icon: '📈' }
];

const alertLevels: { value: AlertLevel | 'all'; label: string; activeClass: string }[] = [
  { value: 'all', label: '全部等级', activeClass: 'bg-primary-500 text-white' },
  { value: 'high', label: '高风险', activeClass: 'bg-red-500 text-white' },
  { value: 'medium', label: '中风险', activeClass: 'bg-yellow-500 text-white' },
  { value: 'low', label: '低风险', activeClass: 'bg-green-500 text-white' }
];

const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const typeMatch = filterType.value === 'all' || alert.type === filterType.value;
    const levelMatch = filterLevel.value === 'all' || alert.level === filterLevel.value;
    return typeMatch && levelMatch;
  });
});

function getTypeCount(type: AlertType | 'all'): number {
  if (type === 'all') return alerts.value.length;
  return alertsByType.value[type]?.length || 0;
}

function getLevelCount(level: AlertLevel | 'all'): number {
  if (level === 'all') return alerts.value.length;
  return alertsByLevel.value[level]?.length || 0;
}

function getAlertIcon(type: AlertType): string {
  const icons: Record<AlertType, string> = {
    abnormal_fluctuation: '⚠️',
    continuous_decline: '📉',
    surge: '🚀'
  };
  return icons[type];
}

function getAlertIconBg(level: AlertLevel): string {
  const bgs: Record<AlertLevel, string> = {
    high: 'bg-red-100 dark:bg-red-900/50 text-red-500',
    medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-500',
    low: 'bg-green-100 dark:bg-green-900/50 text-green-500'
  };
  return bgs[level];
}

function getAlertBadgeClass(level: AlertLevel): string {
  const classes: Record<AlertLevel, string> = {
    high: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400',
    low: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
  };
  return classes[level];
}

function getAlertBorderClass(level: AlertLevel): string {
  const classes: Record<AlertLevel, string> = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-green-500'
  };
  return classes[level];
}

function getAlertBarColor(level: AlertLevel): string {
  const colors: Record<AlertLevel, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  return colors[level];
}

function getLevelLabel(level: AlertLevel): string {
  const labels: Record<AlertLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return labels[level];
}

function getChartName(chartId: string): string {
  const names: Record<string, string> = {
    'chart-1': '销售趋势',
    'chart-2': '分类销量',
    'chart-3': '市场份额'
  };
  return names[chartId] || '未知图表';
}

function formatTime(timestamp: string): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getBarHeight(value: number, points: { value: number }[]): number {
  const max = Math.max(...points.map(p => p.value));
  const min = Math.min(...points.map(p => p.value));
  if (max === min) return 50;
  return Math.max(10, ((value - min) / (max - min)) * 100);
}

function handleAlertClick(alert: Alert) {
  if (!alert.isRead) {
    store.markAlertAsRead(alert.id);
  }
  locateToChart(alert);
}

function locateToChart(alert: Alert) {
  store.setHighlightedChart(alert.chartId);
  emit('locate', alert.chartId);
  
  setTimeout(() => {
    store.setHighlightedChart(null);
  }, 3000);
}
</script>

<style scoped>
.alert-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .alert-item {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-list::-webkit-scrollbar {
  width: 6px;
}

.alert-list::-webkit-scrollbar-track {
  background: transparent;
}

.alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dark .alert-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.alert-item.level-high-unread {
  animation: pulse-border 2s infinite;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
