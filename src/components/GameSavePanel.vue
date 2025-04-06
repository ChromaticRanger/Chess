<script setup>
import { ref } from 'vue';
import disketteSvg from '/src/assets/diskette.svg';
import SavedPositionsList from './SavedPositionsList.vue';
import { useAuth } from '../composables/useAuth';

// Get auth state
const { isAuthenticated } = useAuth();

// Local state
const showPositionsList = ref(false);

// Define props
const props = defineProps({
  // Add any necessary props here
});

// Define emits
const emit = defineEmits(['save-game', 'load-position']);

// Handle save game button click
const handleSaveGame = () => {
  emit('save-game');
};

// Toggle positions list visibility
const togglePositionsList = () => {
  showPositionsList.value = !showPositionsList.value;
};

// Handle position loading
const handleLoadPosition = (position) => {
  emit('load-position', position);
  // Close the positions list after loading
  showPositionsList.value = false;
};
</script>

<template>
  <div class="game-save-panel relative">
    <div class="flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md w-full" style="height: 58px;">
      <div class="text-lg font-semibold ml-2">Game Position</div>
      
      <div class="flex space-x-2">
        <!-- Show positions button (only if authenticated) -->
        <button 
          v-if="isAuthenticated"
          @click="togglePositionsList" 
          class="control-button"
          :class="{ 'bg-blue-200 hover:bg-blue-300': showPositionsList }"
          title="View saved positions"
        >
          <span class="text-sm font-medium">Positions</span>
        </button>
        
        <!-- Save button -->
        <button 
          @click="handleSaveGame" 
          class="control-button mr-2"
          title="Save game position"
        >
          <img :src="disketteSvg" alt="Save Game" class="w-6 h-6" />
        </button>
      </div>
    </div>
    
    <!-- Saved positions dropdown -->
    <div v-if="showPositionsList" class="positions-dropdown mt-2 absolute right-0 z-10 w-full">
      <SavedPositionsList @load-position="handleLoadPosition" />
    </div>
  </div>
</template>

<style scoped>
.control-button {
  @apply p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.positions-dropdown {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>