<script setup>
import { ref } from 'vue';
import disketteSvg from '/src/assets/diskette.svg';
import SavedGamesList from './SavedGamesList.vue';
import { useAuth } from '../composables/useAuth';

// Get auth state
const { isAuthenticated } = useAuth();

// Local state
const showGamesList = ref(false);

// Define props
const props = defineProps({
  // Add any necessary props here
});

// Define emits
const emit = defineEmits(['save-game', 'load-game']);

// Handle save game button click
const handleSaveGame = () => {
  emit('save-game');
};

// Toggle games list visibility
const toggleGamesList = () => {
  showGamesList.value = !showGamesList.value;
};

// Handle game loading
const handleLoadGame = (game) => {
  emit('load-game', game);
  // Close the games list after loading
  showGamesList.value = false;
};
</script>

<template>
  <div class="game-save-panel relative">
    <div class="flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md w-full" style="height: 58px;">
      <div class="text-lg font-semibold ml-2"></div>
      
      <div class="flex space-x-2">
        <!-- Show games button (only if authenticated) -->
        <button 
          v-if="isAuthenticated"
          @click="toggleGamesList" 
          class="control-button"
          :class="{ 'bg-blue-200 hover:bg-blue-300': showGamesList }"
          title="View saved games"
        >
          <span class="text-sm font-medium">Games</span>
        </button>
        
        <!-- Save button -->
        <button 
          @click="handleSaveGame" 
          class="control-button mr-2"
          title="Save game"
        >
          <img :src="disketteSvg" alt="Save Game" class="w-6 h-6" />
        </button>
      </div>
    </div>
    
    <!-- Saved games dropdown -->
    <div v-if="showGamesList" class="games-dropdown mt-2 absolute right-0 z-10 w-full">
      <SavedGamesList @load-position="handleLoadGame" />
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

.games-dropdown {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
