<script setup>
import { ref } from 'vue';
import disketteSvg from '/src/assets/diskette.svg';
import { useAuth } from '../composables/useAuth';

// Get auth state
const { isAuthenticated } = useAuth();

// Define props
const props = defineProps({
  // Add any necessary props here
});

// Define emits
const emit = defineEmits(['save-game']);

// Handle save game button click
const handleSaveGame = () => {
  emit('save-game');
};
</script>

<template>
  <div class="game-save-panel">
    <div class="flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md w-full" style="height: 58px;">
      <div class="text-lg font-semibold ml-2"></div>
      
      <div class="flex">
        <!-- Save button -->
        <button 
          @click="handleSaveGame" 
          class="control-button"
          title="Save game"
        >
          <img :src="disketteSvg" alt="Save Game" class="w-6 h-6" />
        </button>
      </div>
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

</style>
