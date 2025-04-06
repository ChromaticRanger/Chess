<template>
  <div class="game-history-view p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Game History</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Game history cards -->
        <div v-if="isLoading" class="col-span-full">
          <p class="text-center py-10">Loading your game history...</p>
        </div>
        
        <div v-else-if="games.length === 0" class="col-span-full">
          <div class="bg-gray-50 rounded-lg p-8 text-center">
            <h3 class="text-xl font-semibold mb-2">No Games Found</h3>
            <p class="text-gray-600 mb-4">You haven't saved any games yet.</p>
            <router-link 
              to="/game-input" 
              class="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Create Your First Game
            </router-link>
          </div>
        </div>
        
        <div v-else v-for="game in games" :key="game.id" class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-5">
            <h3 class="text-lg font-semibold mb-1">{{ game.name }}</h3>
            <p v-if="game.description" class="text-gray-600 mb-2 text-sm">{{ game.description }}</p>
            
            <div class="flex justify-between items-center mb-3">
              <span class="text-xs text-gray-500">
                Saved: {{ formatDate(game.createdAt) }}
              </span>
              <span class="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {{ game.moveHistory.length }} moves
              </span>
            </div>
            
            <div class="flex justify-between">
              <button 
                @click="loadGame(game)"
                class="text-blue-600 hover:bg-blue-50 py-1 px-3 rounded transition"
              >
                Load Game
              </button>
              
              <button 
                @click="confirmDeleteGame(game.id)"
                class="text-red-600 hover:bg-red-50 py-1 px-3 rounded transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePositions } from '../composables/usePositions';

const router = useRouter();
const { games, isLoading, fetchGames, deleteGame } = usePositions();
const deleteConfirmId = ref(null);

// Fetch games when component is mounted
onMounted(async () => {
  await fetchGames();
});

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Load a game
const loadGame = (game) => {
  console.log('Loading game:', game);
  // TODO: Implement game loading logic
  router.push('/game-input');
};

// Confirm deleting a game
const confirmDeleteGame = (id) => {
  if (confirm('Are you sure you want to delete this game?')) {
    handleDeleteGame(id);
  }
};

// Delete a game
const handleDeleteGame = async (id) => {
  await deleteGame(id);
};
</script>

<style scoped>
/* Any component-specific styles */
</style>