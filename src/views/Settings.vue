<template>
  <div class="settings-view p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-semibold tracking-tight mb-6">Settings</h1>

      <!-- Analysis Settings (Active) -->
      <div class="settings-card p-6 rounded-lg mb-5">
        <h2 class="text-lg font-semibold text-white mb-4">Analysis Settings</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">
              Analysis Depth: <span class="text-amber-400 tabular-nums font-semibold">{{ localDepth }}</span>
            </label>
            <input
              type="range"
              min="8"
              max="25"
              v-model.number="localDepth"
              @change="saveDepth"
              class="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500"
              style="background: linear-gradient(to right, rgba(210,180,110,0.7) 0%, rgba(210,180,110,0.7) calc((var(--v, 0) - 8) / 17 * 100%), rgba(255,255,255,0.1) calc((var(--v, 0) - 8) / 17 * 100%), rgba(255,255,255,0.1) 100%)"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>Fast (8)</span>
              <span>Balanced (15)</span>
              <span>Deep (25)</span>
            </div>
          </div>

          <div class="settings-info-box rounded-md p-4 text-sm text-gray-400">
            <p class="font-medium text-gray-300 mb-2">Depth Guidelines</p>
            <ul class="space-y-1 text-pretty">
              <li><span class="font-medium text-gray-200">8–12:</span> Quick analysis (~1–2 seconds)</li>
              <li><span class="font-medium text-gray-200">13–18:</span> Balanced analysis (~3–8 seconds)</li>
              <li><span class="font-medium text-gray-200">19–25:</span> Deep analysis (~10–30 seconds)</li>
            </ul>
            <p class="mt-2 text-xs text-gray-500 text-pretty">
              Higher depth provides more accurate evaluations but takes longer to compute.
            </p>
          </div>
        </div>
      </div>

      <!-- Other Settings (Placeholder) -->
      <div class="settings-card p-6 rounded-lg">
        <div class="opacity-40 pointer-events-none select-none">
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-4">Display Settings</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="darkMode" class="accent-amber-500" disabled>
                <label for="darkMode" class="text-sm text-gray-300">Dark Mode</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="flipOrientation" class="accent-amber-500" disabled>
                <label for="flipOrientation" class="text-sm text-gray-300">Default Board Orientation (Black on Bottom)</label>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-lg font-semibold text-white mb-4">Gameplay Settings</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showLegalMoves" class="accent-amber-500" disabled checked>
                <label for="showLegalMoves" class="text-sm text-gray-300">Show Legal Moves</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="showCheck" class="accent-amber-500" disabled checked>
                <label for="showCheck" class="text-sm text-gray-300">Highlight Check</label>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-white mb-4">Notification Settings</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="soundEffects" class="accent-amber-500" disabled>
                <label for="soundEffects" class="text-sm text-gray-300">Sound Effects</label>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" id="moveConfirmation" class="accent-amber-500" disabled>
                <label for="moveConfirmation" class="text-sm text-gray-300">Confirm Moves</label>
              </div>
            </div>
          </div>
        </div>

        <p class="text-center text-gray-500 text-sm mt-4">
          Additional settings coming in a future update.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
const { analysisDepth } = storeToRefs(gameStore);
const { loadUserSettings, updateAnalysisDepth } = gameStore;

// Local copy for immediate UI updates
const localDepth = ref(15);

onMounted(async () => {
  await loadUserSettings();
  localDepth.value = analysisDepth.value;
});

const saveDepth = async () => {
  await updateAnalysisDepth(localDepth.value);
};
</script>

<style scoped>
.settings-view {
  min-height: calc(100dvh - 160px);
}

.settings-card {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border: 1px solid rgba(210, 180, 110, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.settings-info-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
