<template>
  <div class="settings-view p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Settings</h1>

      <!-- Analysis Settings (Active) -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Analysis Settings</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Analysis Depth: {{ localDepth }}
            </label>
            <input
              type="range"
              min="8"
              max="25"
              v-model.number="localDepth"
              @change="saveDepth"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast (8)</span>
              <span>Balanced (15)</span>
              <span>Deep (25)</span>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p class="font-medium mb-2">Depth Guidelines:</p>
            <ul class="space-y-1">
              <li><span class="font-medium">8-12:</span> Quick analysis (~1-2 seconds)</li>
              <li><span class="font-medium">13-18:</span> Balanced analysis (~3-8 seconds)</li>
              <li><span class="font-medium">19-25:</span> Deep analysis (~10-30 seconds)</li>
            </ul>
            <p class="mt-2 text-xs text-gray-500">
              Higher depth provides more accurate evaluations but takes longer to compute.
            </p>
          </div>
        </div>
      </div>

      <!-- Other Settings (Placeholder) -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="opacity-50 pointer-events-none">
          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Display Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="darkMode" class="mr-2" disabled>
                <label for="darkMode">Dark Mode</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="flipOrientation" class="mr-2" disabled>
                <label for="flipOrientation">Default Board Orientation (Black on Bottom)</label>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4">Gameplay Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="showLegalMoves" class="mr-2" disabled checked>
                <label for="showLegalMoves">Show Legal Moves</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="showCheck" class="mr-2" disabled checked>
                <label for="showCheck">Highlight Check</label>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xl font-semibold mb-4">Notification Settings</h2>
            <div class="space-y-4">
              <div class="flex items-center">
                <input type="checkbox" id="soundEffects" class="mr-2" disabled>
                <label for="soundEffects">Sound Effects</label>
              </div>
              <div class="flex items-center">
                <input type="checkbox" id="moveConfirmation" class="mr-2" disabled>
                <label for="moveConfirmation">Confirm Moves</label>
              </div>
            </div>
          </div>
        </div>

        <p class="text-center text-gray-400 text-sm mt-4">
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
  min-height: calc(100vh - 160px);
}
</style>
