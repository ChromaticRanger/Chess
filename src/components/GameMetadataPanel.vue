<template>
  <div class="game-metadata-panel bg-white rounded-lg shadow-lg p-4 mb-4">
    <!-- Game Title -->
    <div class="mb-2">
      <h2 class="text-xl font-bold text-gray-900">{{ gameMetadata?.name || 'Untitled Game' }}</h2>
    </div>

    <!-- Game Information Grid -->
    <div class="grid grid-cols-4 gap-4 w-full">
      <!-- Column 1: Event and Round -->
      <div class="space-y-1">
        <div v-if="gameMetadata?.event">
          <span class="text-xs text-gray-500">Event:</span>
          <span class="text-sm text-gray-900 ml-1">{{ gameMetadata.event }}</span>
        </div>
        <div v-if="gameMetadata?.round">
          <span class="text-xs text-gray-500">Round:</span>
          <span class="text-sm text-gray-900 ml-1">{{ gameMetadata.round }}</span>
        </div>
      </div>

      <!-- Column 2: Venue and Date -->
      <div class="space-y-1">
        <div v-if="gameMetadata?.venue">
          <span class="text-xs text-gray-500">Venue:</span>
          <span class="text-sm text-gray-900 ml-1">{{ gameMetadata.venue }}</span>
        </div>
        <div v-if="formattedDate">
          <span class="text-xs text-gray-500">Date:</span>
          <span class="text-sm text-gray-900 ml-1">{{ formattedDate }}</span>
        </div>
      </div>

      <!-- Column 3: Players -->
      <div class="space-y-1">
        <!-- White Player -->
        <div class="flex items-center">
          <div class="w-3 h-3 bg-white border border-gray-300 rounded-full mr-2"></div>
          <div class="flex-1">
            <span class="text-sm font-medium text-gray-900">
              {{ gameMetadata?.whitePlayer || 'White' }}
            </span>
            <span v-if="gameMetadata?.whiteRating" class="text-xs text-gray-500 ml-1">
              ({{ gameMetadata.whiteRating }})
            </span>
          </div>
        </div>
        
        <!-- Black Player -->
        <div class="flex items-center">
          <div class="w-3 h-3 bg-gray-800 rounded-full mr-2"></div>
          <div class="flex-1">
            <span class="text-sm font-medium text-gray-900">
              {{ gameMetadata?.blackPlayer || 'Black' }}
            </span>
            <span v-if="gameMetadata?.blackRating" class="text-xs text-gray-500 ml-1">
              ({{ gameMetadata.blackRating }})
            </span>
          </div>
        </div>
      </div>

      <!-- Column 4: Result and Stats -->
      <div class="space-y-1">
        <div v-if="gameMetadata?.result" class="flex items-center">
          <span class="text-sm font-medium" :class="resultColorClass">
            {{ formatResult(gameMetadata.result) }}
          </span>
        </div>
        <div v-if="moveCount" class="text-xs text-gray-500">
          {{ moveCount }} moves played
        </div>
        <div v-if="formattedCreatedAt" class="text-xs text-gray-500">
          Saved: {{ formattedCreatedAt }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '../stores/game';

const gameStore = useGameStore();
const { loadedGameMetadata, moveHistory } = storeToRefs(gameStore);

// Computed properties for formatted display
const gameMetadata = computed(() => loadedGameMetadata.value);

const formattedDate = computed(() => {
  if (!gameMetadata.value?.date) return null;
  try {
    return new Date(gameMetadata.value.date).toLocaleDateString();
  } catch {
    return null;
  }
});

const formattedCreatedAt = computed(() => {
  if (!gameMetadata.value?.createdAt) return null;
  try {
    return new Date(gameMetadata.value.createdAt).toLocaleString();
  } catch {
    return null;
  }
});

const moveCount = computed(() => {
  return moveHistory.value?.length || 0;
});

const resultColorClass = computed(() => {
  const result = gameMetadata.value?.result;
  if (!result || result === '*') return 'text-gray-600';
  
  // Determine winner for color coding
  if (result === '1-0') return 'text-green-600'; // White wins
  if (result === '0-1') return 'text-blue-600'; // Black wins
  if (result === '1/2-1/2') return 'text-yellow-600'; // Draw
  return 'text-gray-600';
});

// Helper function to format game result
const formatResult = (result) => {
  switch (result) {
    case '1-0':
      return 'White wins (1-0)';
    case '0-1':
      return 'Black wins (0-1)';
    case '1/2-1/2':
      return 'Draw (1/2-1/2)';
    case '*':
      return 'Game in progress';
    default:
      return result;
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-metadata-panel {
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .game-metadata-panel {
    padding: 1rem;
  }
  
  .grid {
    gap: 1rem;
  }
}
</style>