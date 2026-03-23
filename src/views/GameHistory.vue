<template>
  <div class="game-history-view p-6">
    <div class="max-w-7xl mx-auto">

      <!-- Header toolbar -->
      <div class="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h1 class="text-2xl font-bold">Game History</h1>

        <div class="flex items-center gap-3">
          <!-- Sort controls (card view only) -->
          <div v-if="viewMode === 'card'" class="flex items-center gap-2">
            <label class="text-sm text-gray-400">Sort:</label>
            <select v-model="sortBy" @change="onSortFieldChange" class="sort-select text-sm px-2 py-1.5 rounded">
              <option value="updatedAt">Last Updated</option>
              <option value="date">Game Date</option>
              <option value="name">Name</option>
              <option value="event">Event</option>
              <option value="whitePlayer">White Player</option>
              <option value="blackPlayer">Black Player</option>
            </select>
            <button @click="toggleSortDir" class="sort-dir-btn px-2 py-1.5 rounded text-sm" :title="sortDir === 'asc' ? 'Ascending' : 'Descending'">
              {{ sortDir === 'asc' ? '↑' : '↓' }}
            </button>
          </div>

          <!-- View toggle -->
          <div class="view-toggle flex rounded overflow-hidden">
            <button
              @click="viewMode = 'card'"
              :class="['view-btn px-3 py-1.5', viewMode === 'card' ? 'view-btn-active' : 'view-btn-inactive']"
              title="Card view"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <rect x="0" y="0" width="7" height="7" rx="1"/>
                <rect x="9" y="0" width="7" height="7" rx="1"/>
                <rect x="0" y="9" width="7" height="7" rx="1"/>
                <rect x="9" y="9" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="['view-btn px-3 py-1.5', viewMode === 'list' ? 'view-btn-active' : 'view-btn-inactive']"
              title="List view"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <rect x="0" y="1" width="16" height="2" rx="1"/>
                <rect x="0" y="7" width="16" height="2" rx="1"/>
                <rect x="0" y="13" width="16" height="2" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="py-10 text-center">
        <p>Loading your game history...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="games.length === 0" class="bg-gray-50 rounded-lg p-8 text-center">
        <h3 class="text-xl font-semibold mb-2">No Games Found</h3>
        <p class="text-gray-600 mb-4">You haven't saved any games yet.</p>
        <router-link
          to="/game-input"
          class="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Create Your First Game
        </router-link>
      </div>

      <!-- Card view -->
      <div v-else-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="game in games" :key="game.id" class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden game-card">
          <div class="game-card-header px-5 py-3 flex justify-between items-center">
            <h3 class="text-base font-semibold text-white">{{ game.name }}</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded game-card-badge">
              {{ game.moveHistory.length }} moves
            </span>
          </div>
          <div class="p-5 pt-3">
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

            <!-- Opening (if available) -->
            <div v-if="game.openingName" class="mb-3 border-b pb-2">
              <div class="flex items-center gap-2">
                <span v-if="game.openingEco" class="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{{ game.openingEco }}</span>
                <span class="text-sm text-amber-900">{{ game.openingName }}</span>
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

      <!-- List view -->
      <div v-else class="overflow-x-auto rounded-lg">
        <table class="list-table w-full">
          <thead>
            <tr>
              <th @click="changeSort('name')" class="sortable-col text-left">
                Name <span class="sort-indicator">{{ sortIndicator('name') }}</span>
              </th>
              <th @click="changeSort('whitePlayer')" class="sortable-col text-left">
                Players <span class="sort-indicator">{{ sortIndicator('whitePlayer') }}</span>
              </th>
              <th class="text-center">Result</th>
              <th @click="changeSort('event')" class="sortable-col text-left">
                Event <span class="sort-indicator">{{ sortIndicator('event') }}</span>
              </th>
              <th class="text-left">Opening</th>
              <th @click="changeSort('date')" class="sortable-col text-left">
                Date <span class="sort-indicator">{{ sortIndicator('date') }}</span>
              </th>
              <th class="text-center">Moves</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="game in games" :key="game.id" class="list-row">
              <td class="font-medium text-gray-100">{{ game.name }}</td>
              <td>
                <div class="flex items-center gap-1 text-sm flex-wrap">
                  <div class="w-2.5 h-2.5 bg-white border border-gray-400 rounded-full flex-shrink-0"></div>
                  <span>{{ game.whitePlayer || '—' }}</span>
                  <span class="text-gray-500 text-xs">vs</span>
                  <div class="w-2.5 h-2.5 bg-gray-600 rounded-full flex-shrink-0"></div>
                  <span>{{ game.blackPlayer || '—' }}</span>
                </div>
              </td>
              <td class="text-center">
                <span v-if="game.result" class="result-badge">{{ game.result }}</span>
                <span v-else class="text-gray-500">—</span>
              </td>
              <td class="text-sm text-gray-300">
                <span>{{ game.event || '—' }}</span>
                <span v-if="game.round" class="text-xs text-gray-500 ml-1">(R{{ game.round }})</span>
              </td>
              <td>
                <div v-if="game.openingName" class="flex items-center gap-1 min-w-0">
                  <span v-if="game.openingEco" class="eco-badge flex-shrink-0">{{ game.openingEco }}</span>
                  <span class="text-sm text-gray-300 truncate max-w-[160px]" :title="game.openingName">{{ game.openingName }}</span>
                </div>
                <span v-else class="text-gray-500">—</span>
              </td>
              <td class="text-sm text-gray-300 whitespace-nowrap">{{ formatDate(game.date, true) || '—' }}</td>
              <td class="text-center text-sm text-gray-300">{{ game.moveHistory.length }}</td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button @click="loadGame(game)" class="action-btn load-btn">Load</button>
                  <button @click="confirmDeleteGame(game.id)" class="action-btn delete-btn">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!isLoading && pagination.totalPages > 1" class="flex flex-col items-center gap-2 mt-6">
        <div class="text-sm text-gray-400">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ pagination.totalCount }} games
        </div>
        <div class="flex items-center gap-1 flex-wrap justify-center">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="page-btn"
            :class="{ 'page-btn-disabled': currentPage === 1 }"
          >
            ← Prev
          </button>
          <template v-for="p in paginationRange" :key="p">
            <span v-if="p === '...'" class="px-2 text-gray-500 select-none">…</span>
            <button
              v-else
              @click="goToPage(p)"
              class="page-btn"
              :class="p === currentPage ? 'page-btn-active' : ''"
            >
              {{ p }}
            </button>
          </template>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === pagination.totalPages"
            class="page-btn"
            :class="{ 'page-btn-disabled': currentPage === pagination.totalPages }"
          >
            Next →
          </button>
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
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { usePositions } from '../composables/usePositions';
import { useGameStore } from '../stores/game';
import Modal from '../components/Modal.vue';

const router = useRouter();
const { games, pagination, gameHistoryViewMode, isLoading, fetchGames, deleteGame } = usePositions();
const gameStore = useGameStore();

// View / sort / page state
const viewMode = gameHistoryViewMode;
const sortBy = ref('updatedAt');
const sortDir = ref('desc');
const currentPage = ref(1);
const pageSize = 12;

// Delete confirmation modal state
const deleteModal = reactive({
  visible: false,
  message: '',
  gameId: null
});

// Central fetch wrapper
const loadGames = async () => {
  await fetchGames({ page: currentPage.value, pageSize, sortBy: sortBy.value, sortDir: sortDir.value });
};

onMounted(loadGames);

// Sort helpers
const changeSort = (field) => {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = field;
    sortDir.value = 'asc';
  }
  currentPage.value = 1;
  loadGames();
};

const onSortFieldChange = () => {
  sortDir.value = 'asc';
  currentPage.value = 1;
  loadGames();
};

const toggleSortDir = () => {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  currentPage.value = 1;
  loadGames();
};

// Returns ↑ / ↓ for the active sort column, empty otherwise
const sortIndicator = (field) => {
  if (sortBy.value !== field) return '';
  return sortDir.value === 'asc' ? '↑' : '↓';
};

// Pagination helpers
const goToPage = (page) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  currentPage.value = page;
  loadGames();
};

const paginationStart = computed(() => (currentPage.value - 1) * pageSize + 1);
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, pagination.value.totalCount));

const paginationRange = computed(() => {
  const total = pagination.value.totalPages;
  const cur = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', cur - 1, cur, cur + 1, '...', total];
});

// Format date for display
const formatDate = (dateString, dateOnly = false) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  if (dateOnly) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Load a game
const loadGame = async (game) => {
  try {
    const headers = {
      Event: game.event || '',
      Site: game.venue || '',
      Date: game.date ? new Date(game.date).toISOString().split('T')[0].replace(/-/g, '.') : '',
      Round: game.round || '',
      White: game.whitePlayer || '',
      Black: game.blackPlayer || '',
      Result: game.result || '*',
      WhiteElo: game.whiteRating || '',
      BlackElo: game.blackRating || '',
    };

    const gameMetadata = {
      name: game.name,
      description: game.description,
      event: game.event,
      venue: game.venue,
      date: game.date,
      round: game.round,
      whitePlayer: game.whitePlayer,
      whiteRating: game.whiteRating,
      blackPlayer: game.blackPlayer,
      blackRating: game.blackRating,
      result: game.result,
      openingName: game.openingName,
      openingEco: game.openingEco,
      openingBase: game.openingBase,
    };

    if (game.pgn) {
      await gameStore.loadPgn(game.pgn, game.id, gameMetadata, headers, game.moveHistory);
    } else {
      gameStore.resetGame();
      gameStore.setHeaders(headers);
    }

    router.push('/game-input');
  } catch (error) {
    console.error('Error loading game:', error);
    router.push('/game-input');
  }
};

// Delete flow
const confirmDeleteGame = (id) => {
  const gameToDelete = games.value.find(game => game.id === id);
  const gameName = gameToDelete?.name || 'this game';
  deleteModal.message = `Are you sure you want to delete "${gameName}"? This action cannot be undone.`;
  deleteModal.gameId = id;
  deleteModal.visible = true;
};

const closeDeleteModal = () => {
  deleteModal.visible = false;
};

const handleDeleteGame = async () => {
  if (deleteModal.gameId) {
    await deleteGame(deleteModal.gameId);
    deleteModal.gameId = null;
    // Go back a page if we deleted the last item on a non-first page
    if (games.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }
    await loadGames();
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Card styles */
.game-card-header {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border-bottom: 1px solid rgba(210, 180, 110, 0.3);
}

.game-card-badge {
  background: rgba(210, 180, 110, 0.15);
  color: rgba(210, 180, 110, 0.9);
  border: 1px solid rgba(210, 180, 110, 0.25);
}

.game-history-view {
  background-color: transparent;
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

/* Sort dropdown */
.sort-select {
  background: #1a2535;
  border: 1px solid rgba(210, 180, 110, 0.25);
  color: #d1d5db;
  cursor: pointer;
  outline: none;
}

.sort-select:focus {
  border-color: rgba(210, 180, 110, 0.5);
}

.sort-dir-btn {
  background: #1a2535;
  border: 1px solid rgba(210, 180, 110, 0.25);
  color: #d2b46e;
  cursor: pointer;
  transition: background 0.15s;
}

.sort-dir-btn:hover {
  background: rgba(210, 180, 110, 0.15);
}

/* View toggle */
.view-toggle {
  border: 1px solid rgba(210, 180, 110, 0.25);
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border: none;
}

.view-btn-active {
  background: rgba(210, 180, 110, 0.2);
  color: #d2b46e;
}

.view-btn-inactive {
  background: #1a2535;
  color: #6b7280;
}

.view-btn-inactive:hover {
  background: rgba(210, 180, 110, 0.08);
  color: #9ca3af;
}

/* List table */
.list-table {
  border-collapse: collapse;
  border: 1px solid rgba(210, 180, 110, 0.15);
}

.list-table thead tr {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border-bottom: 1px solid rgba(210, 180, 110, 0.3);
}

.list-table th {
  padding: 10px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(210, 180, 110, 0.85);
  white-space: nowrap;
}

.sortable-col {
  cursor: pointer;
  user-select: none;
}

.sortable-col:hover {
  color: #d2b46e;
}

.sort-indicator {
  color: #d2b46e;
  margin-left: 2px;
}

.list-row {
  background: #1a2535;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.list-row:hover {
  background: #243347;
}

.list-table td {
  padding: 10px 14px;
  font-size: 0.875rem;
  color: #d1d5db;
}

.result-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(210, 180, 110, 0.12);
  color: rgba(210, 180, 110, 0.9);
  border: 1px solid rgba(210, 180, 110, 0.2);
  white-space: nowrap;
}

.eco-badge {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-family: monospace;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
  white-space: nowrap;
}

/* List action buttons */
.action-btn {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}

.load-btn {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.load-btn:hover {
  background: rgba(59, 130, 246, 0.28);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* Pagination */
.page-btn {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1a2535;
  color: #d1d5db;
  transition: background 0.15s, color 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #243347;
}

.page-btn-active {
  background: rgba(210, 180, 110, 0.2) !important;
  color: #d2b46e !important;
  border-color: rgba(210, 180, 110, 0.4) !important;
}

.page-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
