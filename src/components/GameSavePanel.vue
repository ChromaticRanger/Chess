<script setup>
import { ref } from 'vue';
import disketteSvg from '/src/assets/diskette.svg';
import swapSvg from '/src/assets/swap.svg';
import { useAuth } from '../composables/useAuth';

// Get auth state
const { isAuthenticated } = useAuth();

// Define props
const props = defineProps({
  // Add any necessary props here
});

// Define emits
const emit = defineEmits(['save-game', 'flip-board']);

// Handle save game button click
const handleSaveGame = () => {
  emit('save-game');
};

// Handle flip board button click
const handleFlipBoard = () => {
  emit('flip-board');
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
  @apply flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md w-full;
  min-height: 44px;
}

.control-button {
  @apply rounded-md bg-gray-200 hover:bg-gray-300 transition-colors;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.control-icon {
  width: 24px;
  height: 24px;
}

/* Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .save-panel-container {
    height: 58px;
  }

  .control-button {
    padding: 0.5rem;
    min-width: auto;
    min-height: auto;
  }

  .control-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
