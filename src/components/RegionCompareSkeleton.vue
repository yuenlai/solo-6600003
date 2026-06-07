<template>
  <div class="region-compare-skeleton space-y-6">
    <div class="compare-header bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-xl p-6 text-white shadow-lg animate-pulse">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-white/30"></div>
              <div class="w-24 h-7 bg-white/30 rounded"></div>
            </div>
            <div class="w-20 h-4 bg-white/20 rounded mt-2"></div>
          </div>
          <div class="w-10 h-10 bg-white/30 rounded"></div>
          <div class="text-center">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-8 h-8 rounded-full bg-white/30"></div>
              <div class="w-24 h-7 bg-white/30 rounded"></div>
            </div>
            <div class="w-20 h-4 bg-white/20 rounded mt-2"></div>
          </div>
        </div>
        <div class="text-right">
          <div class="w-32 h-4 bg-white/20 rounded"></div>
          <div class="w-24 h-8 bg-white/30 rounded mt-2"></div>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div class="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="i in 4" 
          :key="i"
          class="metric-compare-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border-2 border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div class="w-20 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                <div class="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div class="w-20 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>

            <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full"></div>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                <div class="w-16 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div class="w-20 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-center gap-2">
              <div class="w-12 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div class="w-24 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div class="w-16 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div class="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <div class="w-32 h-5 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
          <div class="w-32 h-5 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
          <div class="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>

    <div class="compare-section">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div class="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md overflow-hidden">
        <div class="space-y-3">
          <div class="flex items-center gap-4 py-2">
            <div class="flex-1 h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-24 h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-24 h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-32 h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-20 h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-24 h-8 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-24 h-8 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-32 h-8 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div class="w-20 h-8 bg-gray-100 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
