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
        
        <div v-else v-for="game in games" :key="game.id" class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-blue-50 overflow-hidden game-card">
          <div class="p-5">
            <!-- Header with game title and move count -->
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-lg font-semibold">{{ game.name }}</h3>
              <span class="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {{ game.moveHistory.length }} moves
              </span>
            </div>
            
            <!-- Event and date section -->
            <div class="mb-3 border-b pb-2">
              <div v-if="game.event || game.round" class="flex items-center mb-1">
                <span class="text-gray-700 text-sm mr-1">
                  {{ game.event || 'Casual Game' }}
                </span>
                <span v-if="game.round" class="text-xs text-gray-500">
                  (Round {{ game.round }})
                </span>
              </div>
              
              <div class="flex items-center text-sm text-gray-600">
                <div v-if="game.date" class="mr-2">
                  <span class="text-xs font-medium">Date: </span>
                  {{ formatDate(game.date, true) }}
                </div>
                <div v-if="game.venue">
                  <span class="text-xs font-medium">Venue: </span>
                  {{ game.venue }}
                </div>
              </div>
            </div>
            
            <!-- Players section -->
            <div class="mb-3">
              <div class="grid grid-cols-2 gap-2 mb-1">
                <!-- White Player -->
                <div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-white border border-gray-300 rounded-full mr-1"></div>
                    <span class="font-medium text-sm">
                      {{ game.whitePlayer || 'White' }}
                    </span>
                  </div>
                  <span v-if="game.whiteRating" class="text-xs text-gray-500 ml-4">
                    ({{ game.whiteRating }})
                  </span>
                </div>
                
                <!-- Black Player -->
                <div>
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-gray-800 rounded-full mr-1"></div>
                    <span class="font-medium text-sm">
                      {{ game.blackPlayer || 'Black' }}
                    </span>
                  </div>
                  <span v-if="game.blackRating" class="text-xs text-gray-500 ml-4">
                    ({{ game.blackRating }})
                  </span>
                </div>
              </div>
              
              <!-- Result if available -->
              <div v-if="game.result" class="text-center text-sm font-medium mt-1">
                Result: {{ game.result }}
              </div>
            </div>
            
            <!-- Description (if available) -->
            <div v-if="game.description" class="mb-3 text-sm text-gray-600 border-t border-b py-2">
              <div class="line-clamp-2">{{ game.description }}</div>
            </div>
            
            <!-- Actions and timestamps -->
            <div class="flex justify-between items-center mt-3">
              <span class="text-xs text-gray-500">
                Saved: {{ formatDate(game.createdAt) }}
              </span>
              
              <div class="flex space-x-2">
                <button 
                  @click="loadGame(game)"
                  class="text-blue-600 hover:bg-blue-100 py-1 px-3 rounded transition-colors duration-200 text-sm font-medium"
                >
                  Load Game
                </button>
                
                <button 
                  @click="confirmDeleteGame(game.id)"
                  class="text-red-600 hover:bg-red-100 py-1 px-2 rounded transition-colors duration-200 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <Modal
        :visible="deleteModal.visible"
        title="Delete Game"
        :message="deleteModal.message"
        icon="/src/assets/trash.svg"
        :showActions="true"
        confirmText="Yes, please delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        cancelText="Cancel"
        @close="closeDeleteModal"
        @confirm="handleDeleteGame"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { usePositions } from '../composables/usePositions';
import Modal from '../components/Modal.vue';

const router = useRouter();
const { games, isLoading, fetchGames, deleteGame } = usePositions();

// Delete confirmation modal state
const deleteModal = reactive({
  visible: false,
  message: '',
  gameId: null
});

// Fetch games when component is mounted
onMounted(async () => {
  await fetchGames();
});

// Format date for display
const formatDate = (dateString, dateOnly = false) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  if (dateOnly) {
    // Show only the date part: YYYY-MM-DD
    return date.toLocaleDateString();
  } else {
    // Show date and time
    return date.toLocaleString();
  }
};

// Load a game
const loadGame = (game) => {
  console.log('Loading game:', game);
  // TODO: Implement game loading logic
  router.push('/game-input');
};

// Open delete confirmation modal
const confirmDeleteGame = (id) => {
  // Find the game to get its name
  const gameToDelete = games.value.find(game => game.id === id);
  const gameName = gameToDelete?.name || 'this game';
  
  deleteModal.message = `Are you sure you want to delete "${gameName}"? This action cannot be undone.`;
  deleteModal.gameId = id;
  deleteModal.visible = true;
};

// Close delete confirmation modal
const closeDeleteModal = () => {
  deleteModal.visible = false;
};

// Delete a game when confirmation is given
const handleDeleteGame = async () => {
  if (deleteModal.gameId) {
    await deleteGame(deleteModal.gameId);
    deleteModal.gameId = null;
  }
};
</script>

<style scoped>
/* Game card styling */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-history-view {
  background-color: #f9fafb;
}

.game-card {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transform: translateY(0);
  transition: all 0.2s ease;
}

.game-card:hover {
  transform: translateY(-3px);
}
</style>