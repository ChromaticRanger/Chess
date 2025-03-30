<script setup>
import { defineProps, defineEmits } from 'vue';
import resetSvg from '/src/assets/reset.svg';

// Define props
const props = defineProps({
  currentTurn: {
    type: String,
    required: true
  },
  viewingPastMove: {
    type: Boolean,
    default: false
  }
});

// Define emits
const emit = defineEmits(['reset-board']);

// Handler for reset button click
const handleResetBoard = () => {
  emit('reset-board');
};
</script>

<template>
  <div class="board-status-panel chess-width flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md mt-2">
    <!-- Current Turn Display -->
    <div class="flex items-center">
      <span class="text-lg font-semibold">Current turn: {{ currentTurn }}</span>
      
      <!-- Past Move Indicator -->
      <span 
        v-if="viewingPastMove" 
        class="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        title="Viewing past board position"
      >
        Viewing Past Moves
      </span>
    </div>
    
    <!-- Reset Board Button -->
    <button 
      @click="handleResetBoard" 
      class="control-button"
      title="Reset board"
    >
      <img :src="resetSvg" alt="Reset Board" class="w-6 h-6" />
    </button>
  </div>
</template>

<style scoped>
.control-button {
  @apply p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.chess-width {
  width: 820px; /* 800px for the board + 20px for the borders */
}
</style>