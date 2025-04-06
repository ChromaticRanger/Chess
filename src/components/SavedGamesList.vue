<script setup>
import { ref, onMounted, watch } from 'vue';
import { usePositions } from '../composables/usePositions';

const { games, isLoading, error, fetchGames, deleteGame } = usePositions();

const emit = defineEmits(['load-position']);

// Local state
const selectedGameId = ref(null);
const deleteConfirmId = ref(null);
const loadingState = ref({});

// Load games when component is mounted
onMounted(async () => {
  await loadGames();
});

// Fetch all games
const loadGames = async () => {
  await fetchGames();
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Handle game selection
const selectGame = (id) => {
  selectedGameId.value = id;
};

// Load the selected game
const loadGame = async (game) => {
  loadingState.value[game.id] = true;
  
  try {
    emit('load-position', game);
  } catch (err) {
    console.error('Error loading game:', err);
  } finally {
    loadingState.value[game.id] = false;
  }
};

// Show delete confirmation
const confirmDelete = (id, event) => {
  event.stopPropagation();
  deleteConfirmId.value = id;
};

// Cancel delete
const cancelDelete = (event) => {
  event.stopPropagation();
  deleteConfirmId.value = null;
};

// Handle game deletion
const handleDelete = async (id, event) => {
  event.stopPropagation();
  loadingState.value[id] = true;
  
  try {
    await deleteGame(id);
    deleteConfirmId.value = null;
    
    // If the deleted game was selected, clear the selection
    if (selectedGameId.value === id) {
      selectedGameId.value = null;
    }
  } catch (err) {
    console.error('Error deleting game:', err);
  } finally {
    loadingState.value[id] = false;
  }
};
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-md p-4 h-full">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Saved Games</h3>
      <button 
        @click="loadGames" 
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Refresh
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading && !games.length" class="text-center py-6">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Loading games...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-6 text-red-500">
      <p>{{ error }}</p>
      <button 
        @click="loadGames" 
        class="mt-2 text-blue-600 hover:text-blue-800"
      >
        Try Again
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!games.length" class="text-center py-8">
      <p class="text-gray-500">You haven't saved any games yet.</p>
      <p class="text-gray-500 mt-1">Create your first game and click "Save"!</p>
    </div>
    
    <!-- Game list -->
    <div v-else class="overflow-y-auto max-h-96">
      <ul class="divide-y divide-gray-200">
        <li 
          v-for="game in games" 
          :key="game.id"
          @click="selectGame(game.id)"
          :class="[
            'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
            selectedGameId === game.id ? 'bg-blue-50' : ''
          ]"
        >
          <div class="flex justify-between">
            <div>
              <h4 class="font-medium text-gray-900">{{ game.name }}</h4>
              <p v-if="game.description" class="text-sm text-gray-600 mt-1">
                {{ game.description }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Saved: {{ formatDate(game.createdAt) }}
              </p>
            </div>
            
            <div class="flex items-start space-x-2">
              <!-- Load button -->
              <button 
                @click="loadGame(game)"
                class="text-blue-600 hover:bg-blue-100 p-1 rounded"
                :disabled="loadingState[game.id]"
              >
                <span v-if="loadingState[game.id]">Loading...</span>
                <span v-else>Load</span>
              </button>
              
              <!-- Delete button/confirmation -->
              <div v-if="deleteConfirmId === game.id">
                <div class="flex items-center space-x-1">
                  <button 
                    @click="handleDelete(game.id, $event)"
                    class="text-red-600 hover:bg-red-100 p-1 rounded text-xs"
                    :disabled="loadingState[game.id]"
                  >
                    Confirm
                  </button>
                  <button 
                    @click="cancelDelete($event)"
                    class="text-gray-600 hover:bg-gray-100 p-1 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button 
                v-else
                @click="confirmDelete(game.id, $event)"
                class="text-gray-400 hover:text-red-600 p-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.max-h-96 {
  max-height: 24rem;
}
</style>