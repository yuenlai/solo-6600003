<template>
  <div 
    class="trend-replay-container"
    :class="{ 'dark': isDark }"
    @click.stop
  >
    <div class="replay-header">
      <div class="replay-status">
        <span 
          class="status-indicator"
          :class="{ 
            'playing': replayState.isPlaying && !replayState.isPaused,
            'paused': replayState.isPaused,
            'idle': !replayState.isPlaying
          }"
        ></span>
        <span class="status-text">
          {{ statusText }}
        </span>
      </div>
      <div class="replay-current-time">
        <span class="time-label">当前时间:</span>
        <span class="time-value">{{ replayState.currentTimeLabel }}</span>
      </div>
    </div>

    <div class="replay-values" v-if="replayState.currentValues.length > 0">
      <div 
        v-for="(item, index) in replayState.currentValues" 
        :key="item.seriesName"
        class="value-item"
      >
        <span 
          class="value-dot"
          :style="{ backgroundColor: getSeriesColor(index) }"
        ></span>
        <span class="value-name">{{ item.seriesName }}:</span>
        <span class="value-number">{{ formatValue(item.value) }}</span>
      </div>
    </div>

    <div class="replay-progress-container">
      <span class="progress-label">
        {{ replayState.currentIndex + 1 }} / {{ replayState.totalPoints }}
      </span>
      <div class="progress-bar-wrapper">
        <div 
            class="progress-bar-track"
            @click.stop="handleProgressClick"
            ref="progressTrack"
          >
          <div 
            class="progress-bar-fill"
            :style="{ width: `${progressPercent}%` }"
          ></div>
          <div 
            class="progress-bar-thumb"
            :style="{ left: `${progressPercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="replay-controls">
      <button 
        class="control-btn speed-btn"
        @click.stop="cycleSpeed"
        :title="`播放速度: ${replayState.speed}x`"
      >
        {{ replayState.speed }}x
      </button>

      <button 
        class="control-btn"
        @click.stop="handleRestart"
        title="重新开始"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <button 
        class="control-btn play-btn"
        @click.stop="togglePlayPause"
        :title="playPauseTitle"
      >
        <svg v-if="!replayState.isPlaying || replayState.isPaused" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <button 
        class="control-btn"
        @click.stop="handleStepBackward"
        :disabled="replayState.currentIndex <= 0"
        title="上一帧"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button 
        class="control-btn"
        @click.stop="handleStepForward"
        :disabled="replayState.currentIndex >= replayState.totalPoints - 1"
        title="下一帧"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button 
        class="control-btn stop-btn"
        @click.stop="handleStop"
        title="结束回放"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, nextTick } from 'vue';
import type { TrendReplayState, TrendReplayData, TrendReplaySeriesData } from '../types';

const props = defineProps<{
  originalOption: Record<string, any>;
  chartType: 'line' | 'bar';
  isDark?: boolean;
  formatValue?: (value: number) => string;
}>();

const emit = defineEmits(['update:option', 'stateChange']);

const progressTrack = ref<HTMLElement | null>(null);
let playInterval: ReturnType<typeof setInterval> | null = null;

const seriesColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
];

const replayData = ref<TrendReplayData>({ labels: [], series: [] });

const replayState = reactive<TrendReplayState>({
  isPlaying: false,
  isPaused: false,
  currentIndex: 0,
  totalPoints: 0,
  currentTimeLabel: '',
  currentValues: [],
  speed: 1
});

const speedOptions = [0.5, 1, 2, 4];

const statusText = computed(() => {
  if (!replayState.isPlaying) return '准备回放';
  if (replayState.isPaused) return '已暂停';
  return '正在回放';
});

const playPauseTitle = computed(() => {
  if (!replayState.isPlaying || replayState.isPaused) return '播放';
  return '暂停';
});

const progressPercent = computed(() => {
  if (replayState.totalPoints <= 1) return 100;
  return (replayState.currentIndex / (replayState.totalPoints - 1)) * 100;
});

function getSeriesColor(index: number): string {
  return seriesColors[index % seriesColors.length];
}

function defaultFormatValue(value: number): string {
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万';
  }
  return value.toLocaleString();
}

function formatValue(value: number): string {
  if (props.formatValue) {
    return props.formatValue(value);
  }
  return defaultFormatValue(value);
}

function extractTrendData(): TrendReplayData {
  const option = props.originalOption;
  const labels: string[] = [];
  const series: TrendReplaySeriesData[] = [];

  if (option.xAxis && option.xAxis.data) {
    labels.push(...option.xAxis.data);
  }

  if (option.series && Array.isArray(option.series)) {
    option.series.forEach((s: any) => {
      if (s.data && Array.isArray(s.data)) {
        const data = s.data.map((d: any) => {
          if (typeof d === 'object' && d.value !== undefined) {
            return d.value;
          }
          return d;
        }).filter((d: any) => typeof d === 'number');
        series.push({
          name: s.name || '系列',
          data
        });
      }
    });
  }

  return { labels, series };
}

function generateReplayOption(index: number): Record<string, any> {
  const option = JSON.parse(JSON.stringify(props.originalOption));
  const endIndex = index + 1;
  const currentLabels = replayData.value.labels.slice(0, endIndex);

  if (option.xAxis && option.xAxis.data) {
    option.xAxis.data = currentLabels;
  }

  if (option.series && Array.isArray(option.series)) {
    option.series = option.series.map((s: any, si: number) => {
      const seriesData = replayData.value.series[si];
      if (seriesData) {
        const currentData = seriesData.data.slice(0, endIndex);
        if (s.data && Array.isArray(s.data) && s.data[0] && typeof s.data[0] === 'object') {
          s.data = s.data.slice(0, endIndex);
        } else {
          s.data = currentData;
        }
      }
      return s;
    });
  }

  if (option.tooltip && option.tooltip.trigger === 'axis') {
    option.tooltip.alwaysShowContent = true;
    option.tooltip.displayMode = 'single';
    option.tooltip.position = (point: [number, number]) => [point[0], '10%'];
  }

  return option;
}

function updateCurrentValues(index: number) {
  replayState.currentValues = replayData.value.series.map(s => ({
    seriesName: s.name,
    value: s.data[index] || 0
  }));
  replayState.currentTimeLabel = replayData.value.labels[index] || '';
}

function startPlayback() {
  if (playInterval) clearInterval(playInterval);

  const intervalMs = 1000 / replayState.speed;
  playInterval = setInterval(() => {
    if (replayState.currentIndex < replayState.totalPoints - 1) {
      const newIndex = replayState.currentIndex + 1;
      moveToIndex(newIndex);
    } else {
      handleStop();
    }
  }, intervalMs);
}

function stopPlayback() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function moveToIndex(index: number) {
  replayState.currentIndex = index;
  updateCurrentValues(index);
  const newOption = generateReplayOption(index);
  emit('update:option', newOption);
  emit('stateChange', { ...replayState });
}

function togglePlayPause() {
  if (!replayState.isPlaying) {
    replayState.isPlaying = true;
    replayState.isPaused = false;
    if (replayState.currentIndex >= replayState.totalPoints - 1) {
      replayState.currentIndex = 0;
    }
    moveToIndex(replayState.currentIndex);
    startPlayback();
  } else if (replayState.isPaused) {
    replayState.isPaused = false;
    startPlayback();
  } else {
    replayState.isPaused = true;
    stopPlayback();
  }
  emit('stateChange', { ...replayState });
}

function handleRestart() {
  stopPlayback();
  replayState.isPlaying = true;
  replayState.isPaused = false;
  replayState.currentIndex = 0;
  moveToIndex(0);
  startPlayback();
  emit('stateChange', { ...replayState });
}

function handleStop() {
  stopPlayback();
  replayState.isPlaying = false;
  replayState.isPaused = false;
  emit('update:option', props.originalOption);
  emit('stateChange', { ...replayState, stopped: true });
}

function handleStepForward() {
  if (replayState.currentIndex < replayState.totalPoints - 1) {
    if (!replayState.isPlaying) {
      replayState.isPlaying = true;
      replayState.isPaused = true;
    }
    moveToIndex(replayState.currentIndex + 1);
  }
}

function handleStepBackward() {
  if (replayState.currentIndex > 0) {
    if (!replayState.isPlaying) {
      replayState.isPlaying = true;
      replayState.isPaused = true;
    }
    moveToIndex(replayState.currentIndex - 1);
  }
}

function cycleSpeed() {
  const currentIdx = speedOptions.indexOf(replayState.speed);
  const nextIdx = (currentIdx + 1) % speedOptions.length;
  replayState.speed = speedOptions[nextIdx];
  
  if (replayState.isPlaying && !replayState.isPaused) {
    stopPlayback();
    startPlayback();
  }
  emit('stateChange', { ...replayState });
}

function handleProgressClick(event: MouseEvent) {
  if (!progressTrack.value || replayState.totalPoints <= 1) return;
  
  const rect = progressTrack.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  const targetIndex = Math.round(percent * (replayState.totalPoints - 1));
  
  if (!replayState.isPlaying) {
    replayState.isPlaying = true;
    replayState.isPaused = true;
  }
  
  moveToIndex(targetIndex);
}

function initializeReplay() {
  replayData.value = extractTrendData();
  replayState.totalPoints = Math.min(
    replayData.value.labels.length,
    ...replayData.value.series.map(s => s.data.length)
  );
  replayState.currentIndex = replayState.totalPoints - 1;
  
  if (replayState.totalPoints > 0) {
    updateCurrentValues(replayState.currentIndex);
  }
}

watch(() => props.originalOption, () => {
  if (!replayState.isPlaying) {
    initializeReplay();
  }
}, { deep: true });

nextTick(() => {
  initializeReplay();
});

onUnmounted(() => {
  stopPlayback();
});

defineExpose({
  isPlaying: computed(() => replayState.isPlaying),
  start: togglePlayPause,
  stop: handleStop,
  restart: handleRestart
});
</script>

<style scoped>
.trend-replay-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 8px;
}

.trend-replay-container.dark {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-color: #475569;
}

.replay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.replay-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  transition: all 0.3s ease;
}

.status-indicator.playing {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator.paused {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.status-indicator.idle {
  background: #64748b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.dark .status-text {
  color: #cbd5e1;
}

.replay-current-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.time-label {
  color: #64748b;
}

.dark .time-label {
  color: #94a3b8;
}

.time-value {
  font-weight: 600;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.dark .time-value {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.replay-values {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.dark .replay-values {
  background: rgba(0, 0, 0, 0.2);
}

.value-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.value-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.value-name {
  color: #475569;
  font-weight: 500;
}

.dark .value-name {
  color: #cbd5e1;
}

.value-number {
  font-weight: 700;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}

.dark .value-number {
  color: #f1f5f9;
}

.replay-progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 50px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.dark .progress-label {
  color: #94a3b8;
}

.progress-bar-wrapper {
  flex: 1;
}

.progress-bar-track {
  position: relative;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  transition: height 0.2s ease;
}

.dark .progress-bar-track {
  background: #475569;
}

.progress-bar-track:hover {
  height: 10px;
}

.progress-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.progress-bar-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: transform 0.2s ease;
  pointer-events: none;
}

.dark .progress-bar-thumb {
  border-color: #1e293b;
}

.progress-bar-track:hover .progress-bar-thumb {
  transform: translate(-50%, -50%) scale(1.2);
}

.replay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .control-btn {
  background: #475569;
  color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.control-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.dark .control-btn:hover:not(:disabled) {
  background: #64748b;
  color: #60a5fa;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn.play-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
}

.control-btn.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.control-btn.speed-btn {
  width: auto;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  min-width: 44px;
}

.control-btn.stop-btn:hover:not(:disabled) {
  color: #ef4444;
}

.dark .control-btn.stop-btn:hover:not(:disabled) {
  color: #f87171;
}
</style>
