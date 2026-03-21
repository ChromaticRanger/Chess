<script setup>
import { ref } from 'vue';
import disketteSvg from '/src/assets/diskette.svg';
import swapSvg from '/src/assets/swap.svg';
import { useAuth } from '../composables/useAuth';

// Get auth state
const { isAuthenticated } = useAuth();

// Define props
const props = defineProps({
  currentTurn: {
    type: String,
    default: 'White',
  },
});

// Define emits
const emit = defineEmits(['save-game', 'flip-board', 'resign']);

// Handle save game button click
const handleSaveGame = () => {
  emit('save-game');
};

// Handle flip board button click
const handleFlipBoard = () => {
  emit('flip-board');
};

// Handle resign button click
const handleResign = () => {
  emit('resign');
};
</script>

<template>
  <div class="game-save-panel">
    <div class="save-panel-container">
      <div class="flex">
        <!-- Flip board button -->
        <button
          @click="handleFlipBoard"
          class="control-button"
          title="Flip board orientation"
        >
          <img :src="swapSvg" alt="Flip Board" class="control-icon" />
        </button>
      </div>

      <div class="flex">
        <!-- Resign button -->
        <button
          @click="handleResign"
          class="control-button"
          :title="`${currentTurn} resigns`"
        >
          <svg
            class="control-icon"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Flag pole -->
            <line x1="5" y1="3" x2="5" y2="21" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
            <!-- Flag body -->
            <polygon
              points="5,4 19,8 5,13"
              :fill="currentTurn === 'White' ? '#ffffff' : '#1a1a1a'"
              :stroke="currentTurn === 'White' ? '#6b7280' : '#6b7280'"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="flex">
        <!-- Save button -->
        <button
          @click="handleSaveGame"
          class="control-button"
          title="Save game"
        >
          <img :src="disketteSvg" alt="Save Game" class="control-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Mobile-first */
.save-panel-container {
  @apply flex justify-between items-center bg-gray-100 border border-gray-300 rounded-md w-full;
  padding: 0.25rem 0.5rem;
  height: 36px;
}

.control-button {
  @apply rounded-md transition-colors;
  min-width: 36px;
  min-height: 36px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.control-icon {
  width: 20px;
  height: 20px;
}

/* Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .save-panel-container {
    padding: 0.25rem 0.5rem;
    height: 40px;
  }

  .control-button {
    padding: 6px;
    min-width: auto;
    min-height: auto;
  }

  .control-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
