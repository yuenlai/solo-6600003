<template>
  <div class="scheme-manager">
    <div class="flex items-center gap-2">
      <button
        @click="showSchemePanel = !showSchemePanel"
        class="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300 transition-colors"
      >
        <span>📋</span>
        <span class="hidden sm:inline">方案</span>
        <span
          v-if="schemes.length > 0"
          class="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full text-white bg-blue-500"
        >
          {{ schemes.length }}
        </span>
      </button>

      <button
        @click="openSaveModal"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        <span>💾</span>
        <span class="hidden sm:inline">保存方案</span>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showSchemePanel"
          class="fixed inset-0 z-40"
          @click.self="showSchemePanel = false"
        >
          <div class="absolute top-16 right-6 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden">
            <div class="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800 dark:text-white">仪表盘方案</h3>
              <button
                @click="showSchemePanel = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div class="max-h-96 overflow-y-auto">
              <div v-if="schemes.length === 0" class="p-8 text-center text-gray-400">
                <div class="text-4xl mb-2">📭</div>
                <p class="text-sm">暂无保存的方案</p>
                <p class="text-xs mt-1">点击"保存方案"按钮创建</p>
              </div>

              <div v-else class="p-2 space-y-1">
                <div
                  v-for="scheme in schemes"
                  :key="scheme.id"
                  :class="[
                    'group relative p-3 rounded-lg border transition-all cursor-pointer',
                    currentSchemeId === scheme.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  ]"
                  @click="handleApplyScheme(scheme.id)"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{{ currentSchemeId === scheme.id ? '✅' : '📄' }}</span>
                        <span
                          v-if="editingSchemeId !== scheme.id"
                          class="font-medium text-gray-800 dark:text-white truncate"
                        >
                          {{ scheme.name }}
                        </span>
                        <input
                          v-else
                          v-model="editingName"
                          type="text"
                          @click.stop
                          @blur="handleRenameScheme(scheme.id)"
                          @keyup.enter="handleRenameScheme(scheme.id)"
                          @keyup.esc="cancelRename"
                          class="flex-1 px-2 py-0.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          ref="renameInput"
                        />
                      </div>
                      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        <div class="flex items-center gap-3">
                          <span>📊 {{ scheme.charts.length }} 个图表</span>
                          <span>🔍 {{ scheme.filters.length }} 个筛选</span>
                        </div>
                        <div>更新于 {{ formatDate(scheme.updatedAt) }}</div>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click.stop="openOverwriteModal(scheme)"
                        class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-blue-500"
                        title="覆盖保存"
                      >
                        💾
                      </button>
                      <button
                        @click.stop="startRename(scheme)"
                        class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-yellow-500"
                        title="重命名"
                      >
                        ✏️
                      </button>
                      <button
                        @click.stop="handleDeleteScheme(scheme.id)"
                        class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-red-500"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="currentSchemeId === scheme.id"
                    class="absolute top-2 right-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full"
                  >
                    当前
                  </div>
                </div>
              </div>
            </div>

            <div class="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                @click="openSaveModal"
                class="w-full py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>➕</span>
                <span>保存为新方案</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showSaveModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          @click.self="closeSaveModal"
        >
          <div class="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div class="px-6 py-4 border-b dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                {{ overwriteScheme ? '覆盖方案' : '保存新方案' }}
              </h3>
            </div>

            <div class="p-6 space-y-4">
              <div v-if="overwriteScheme" class="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p class="text-sm text-yellow-800 dark:text-yellow-200">
                  将覆盖现有方案 <strong>"{{ overwriteScheme.name }}"</strong> 的配置。
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  方案名称
                </label>
                <input
                  v-model="schemeName"
                  type="text"
                  :placeholder="overwriteScheme ? overwriteScheme.name : '请输入方案名称'"
                  :disabled="!!overwriteScheme"
                  class="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @keyup.enter="handleSaveScheme"
                  ref="nameInput"
                />
                <p v-if="nameError" class="mt-1 text-sm text-red-500">
                  {{ nameError }}
                </p>
              </div>

              <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
                <div class="font-medium text-gray-700 dark:text-gray-300 mb-2">将保存以下内容：</div>
                <div class="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    <span>📊</span>
                    <span>{{ dashboard.charts.length }} 个图表</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>🔍</span>
                    <span>{{ dashboard.filters.length }} 个筛选条件</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>📋</span>
                    <span>图表展示顺序</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>⚖️</span>
                    <span>{{ compareMode.enabled ? '对比模式' : '单地区模式' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                @click="closeSaveModal"
                class="px-4 py-2 rounded-lg text-sm border hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                @click="handleSaveScheme"
                :disabled="!canSave"
                class="px-6 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {{ overwriteScheme ? '覆盖保存' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          @click.self="showDeleteConfirm = false"
        >
          <div class="w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div class="p-6 text-center">
              <div class="text-5xl mb-4">⚠️</div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                确认删除方案？
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                删除后将无法恢复方案 <strong>"{{ schemeToDelete?.name }}"</strong>
              </p>
            </div>

            <div class="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                @click="showDeleteConfirm = false"
                class="px-4 py-2 rounded-lg text-sm border hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                @click="confirmDeleteScheme"
                class="px-6 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useDashboardStore } from '../stores/dashboard';
import { storeToRefs } from 'pinia';
import type { DashboardScheme } from '../types';

const emit = defineEmits<{
  (e: 'scheme-applied', schemeName: string): void;
  (e: 'scheme-saved', schemeName: string): void;
  (e: 'scheme-deleted', schemeName: string): void;
}>();

const store = useDashboardStore();
const { dashboard, schemes, currentSchemeId, compareMode, schemeLoading } = storeToRefs(store);

const showSchemePanel = ref(false);
const showSaveModal = ref(false);
const schemeName = ref('');
const nameError = ref('');
const overwriteScheme = ref<DashboardScheme | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);

const showDeleteConfirm = ref(false);
const schemeToDelete = ref<DashboardScheme | null>(null);

const editingSchemeId = ref<string | null>(null);
const editingName = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

const canSave = computed(() => {
  if (overwriteScheme.value) return true;
  const name = schemeName.value.trim();
  return name.length > 0 && !nameError.value;
});

watch(showSaveModal, async (val) => {
  if (val) {
    await nextTick();
    nameInput.value?.focus();
  } else {
    schemeName.value = '';
    nameError.value = '';
    overwriteScheme.value = null;
  }
});

watch(editingSchemeId, async (val) => {
  if (val) {
    await nextTick();
    renameInput.value?.focus();
    renameInput.value?.select();
  }
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openSaveModal() {
  showSchemePanel.value = false;
  overwriteScheme.value = null;
  schemeName.value = '';
  nameError.value = '';
  showSaveModal.value = true;
}

function openOverwriteModal(scheme: DashboardScheme) {
  showSchemePanel.value = false;
  overwriteScheme.value = scheme;
  schemeName.value = scheme.name;
  nameError.value = '';
  showSaveModal.value = true;
}

function closeSaveModal() {
  showSaveModal.value = false;
}

function validateName() {
  const name = schemeName.value.trim();
  if (!name) {
    nameError.value = '请输入方案名称';
    return false;
  }
  if (!overwriteScheme.value && store.checkSchemeNameExists(name)) {
    nameError.value = '该名称已存在，请使用其他名称或选择覆盖';
    return false;
  }
  nameError.value = '';
  return true;
}

function handleSaveScheme() {
  if (!validateName()) return;

  const name = overwriteScheme.value ? overwriteScheme.value.name : schemeName.value.trim();
  const result = store.saveScheme(name, !!overwriteScheme.value);

  if (result) {
    emit('scheme-saved', result.name);
    closeSaveModal();
  } else {
    nameError.value = '保存失败，请重试';
  }
}

async function handleApplyScheme(schemeId: string) {
  if (schemeLoading.value) return;

  const scheme = schemes.value.find(s => s.id === schemeId);
  if (!scheme) return;

  showSchemePanel.value = false;
  const success = await store.applyScheme(schemeId);
  if (success) {
    emit('scheme-applied', scheme.name);
  }
}

function handleDeleteScheme(schemeId: string) {
  const scheme = schemes.value.find(s => s.id === schemeId);
  if (scheme) {
    schemeToDelete.value = scheme;
    showDeleteConfirm.value = true;
  }
}

function confirmDeleteScheme() {
  if (!schemeToDelete.value) return;

  const schemeName = schemeToDelete.value.name;
  const success = store.deleteScheme(schemeToDelete.value.id);

  if (success) {
    emit('scheme-deleted', schemeName);
  }

  showDeleteConfirm.value = false;
  schemeToDelete.value = null;
}

function startRename(scheme: DashboardScheme) {
  editingSchemeId.value = scheme.id;
  editingName.value = scheme.name;
}

function cancelRename() {
  editingSchemeId.value = null;
  editingName.value = '';
}

function handleRenameScheme(schemeId: string) {
  const newName = editingName.value.trim();
  if (!newName || newName === schemes.value.find(s => s.id === schemeId)?.name) {
    cancelRename();
    return;
  }

  const success = store.renameScheme(schemeId, newName);
  if (!success) {
    nameError.value = '名称已存在';
  }
  cancelRename();
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
