<script setup>
import { defineProps } from 'vue';

// Define props
const props = defineProps({
  currentTurn: {
    type: String,
    required: true
  },
  viewingPastMove: {
    type: Boolean,
    default: false
  },
  position: {
    type: String,
    required: true,
    validator: (value) => ["top", "bottom"].includes(value)
  },
  showCurrentTurn: {
    type: Boolean,
    default: true
  }
});

</script>

<template>
  <div 
    class="board-status-panel flex items-center justify-between bg-gray-100 border border-gray-300 p-2 rounded-md w-full"
  >
    <!-- Left Side Content -->
    <div class="flex items-center h-10">
      <!-- Past Move Indicator -->
      <span 
        v-if="viewingPastMove" 
        class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        title="Viewing past board position"
      >
        Viewing Past Moves
      </span>
    </div>

    <!-- Right Side: Turn Indicator -->
    <div 
      v-if="showCurrentTurn && ((position === 'top' && currentTurn === 'Black') || (position === 'bottom' && currentTurn === 'White'))"
      class="flex items-center"
    >
      <span class="text-lg font-semibold mr-2">{{ currentTurn }} to Move</span>
      <!-- Visual indicator - colored circle to match the turn color -->
      <div 
        class="w-4 h-4 rounded-full" 
        :class="{ 
          'bg-gray-800': currentTurn === 'Black',
          'bg-white border border-gray-400': currentTurn === 'White'
        }"
      ></div>
    </div>
    <div v-else class="w-6 h-6"></div>
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