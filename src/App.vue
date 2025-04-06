<script setup>
import { ref, onMounted } from 'vue';
import Board from "./components/Board.vue";
import Modal from "./components/Modal.vue";
import MoveHistoryList from "./components/MoveHistoryList.vue";
import MoveControlPanel from "./components/MoveControlPanel.vue";
import BoardStatusPanel from "./components/BoardStatusPanel.vue";
import GameSavePanel from "./components/GameSavePanel.vue";
import AuthPage from "./components/AuthPage.vue";
import { getPieceImagePath } from "./utils/PieceFactory";
import { useAuth } from "./composables/useAuth";
import { usePositions } from "./composables/usePositions";

// Auth state
const { isAuthenticated, user, logout } = useAuth();
const { createGame } = usePositions();
const isAuthenticatedUser = ref(isAuthenticated.value);

// Track the current turn
const currentTurn = ref("White");

// Modal state
const modalVisible = ref(false);
const modalTitle = ref('Notification');
const modalMessage = ref('');
const modalIcon = ref('');

// Function to show the modal
const showModal = (title, message, icon = '') => {
  modalTitle.value = title;
  modalMessage.value = message;
  modalIcon.value = icon;
  modalVisible.value = true;
};

// Function to hide the modal
const hideModal = () => {
  modalVisible.value = false;
};

// Track the move history
const moveHistory = ref([]);

// Track the currently viewed move index
const currentMoveIndex = ref(-1);

// Track whether we're viewing a past move
const viewingPastMove = ref(false);

// Track captured pieces
const capturedPieces = ref([]);

// Track board orientation (true = flipped, black at bottom)
const boardFlipped = ref(false);

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};

// Handler for checkmate
const handleCheckmate = (winner) => {
  const winnerKingImage = getPieceImagePath("King", winner);
  showModal("Checkmate", `${winner} has won the game.`, winnerKingImage);
};

// Handler for stalemate
const handleStalemate = (stalematedColor) => {
  // Use both kings to represent a draw
  const whiteKingImage = getPieceImagePath("King", "White");
  showModal("Stalemate", `The game is a draw by stalemate.`, whiteKingImage);
};

// Handler for move history updates
const handleMoveHistoryUpdate = (newHistory) => {
  moveHistory.value = newHistory;
  console.log("Move history updated in App.vue:", moveHistory.value.length, "moves");
};

// Handler for current move index changes
const handleCurrentMoveIndexChange = (newIndex) => {
  currentMoveIndex.value = newIndex;
  viewingPastMove.value = newIndex !== -1;
  console.log(`Current move index changed to ${newIndex}, viewing past move: ${viewingPastMove.value}`);
};

// Handler for captured pieces updates
const handleCapturedPiecesUpdate = (newCapturedPieces) => {
  capturedPieces.value = newCapturedPieces;
  console.log("Captured pieces updated:", newCapturedPieces);
};

// Handler for board orientation changes
const handleBoardOrientationChange = (isFlipped) => {
  boardFlipped.value = isFlipped;
  console.log("Board orientation changed, flipped:", isFlipped);
};

// Create a ref for the board component
const boardComponent = ref(null);

// Handler for move selection from the history list
const handleMoveSelection = (moveIndex) => {
  console.log('handleMoveSelection called with index:', moveIndex);
  console.log('boardComponent ref:', boardComponent.value);
  
  if (boardComponent.value) {
    // Use the exposed method
    boardComponent.value.handleMoveSelection(moveIndex);
  } else {
    console.error('Board component reference not available');
  }
};

// Function to directly handle move selection from board
const goToMove = (index) => {
  console.log(`Direct goToMove called with index: ${index}`);
  if (boardComponent.value) {
    boardComponent.value.handleMoveSelection(index);
  } else {
    console.error('Board component not available for direct move selection');
  }
};

// Handler for saving the game
const handleSaveGame = async () => {
  if (!isAuthenticated.value) {
    // Show login prompt if not authenticated
    showModal('Authentication Required', 'Please log in or sign up to save games.');
    return;
  }
  
  try {
    // Open save game dialog
    const gameName = prompt('Enter a name for this game:');
    
    if (!gameName) return; // User cancelled
    
    const gameData = {
      name: gameName,
      description: '',
      moveHistory: moveHistory.value
    };
    
    const result = await createGame(gameData);
    
    if (result.success) {
      showModal('Success', 'Game saved successfully!');
    } else {
      showModal('Error', `Failed to save game: ${result.error}`);
    }
  } catch (error) {
    console.error('Error saving game:', error);
    showModal('Error', 'An error occurred while saving the game.');
  }
};

// Handler for loading a saved game
const handleLoadGame = async (game) => {
  try {
    if (!boardComponent.value) {
      showModal('Error', 'Board component not available.');
      return;
    }
    
    // TODO: Implement a loadGameHistory method in Board.vue
    // For now, we'll just reset the board and show a message
    showModal('Feature Coming Soon', 'Game loading will be implemented in the next update.');
    
    console.log('Game to load:', game);
  } catch (error) {
    console.error('Error loading game:', error);
    showModal('Error', 'An error occurred while loading the game.');
  }
};

// Handler for authentication success
const handleAuthSuccess = (authUser) => {
  console.log('Authentication successful:', authUser);
  isAuthenticatedUser.value = true;
};

// Handler for logout
const handleLogout = () => {
  logout();
  isAuthenticatedUser.value = false;
};

// Add debug info when component is mounted
onMounted(() => {
  console.log('App mounted, boardComponent ref:', boardComponent.value);
  
  // Add a global event listener to handle move selections
  window.addEventListener('chess-move-selected', (event) => {
    console.log('Received chess-move-selected event:', event.detail);
    if (boardComponent.value && event.detail !== undefined) {
      boardComponent.value.handleMoveSelection(event.detail);
    }
  });
  
  // Check if user is already authenticated
  isAuthenticatedUser.value = isAuthenticated.value;
});
</script>

<template>
  <!-- Auth page if not authenticated -->
  <AuthPage 
    v-if="!isAuthenticatedUser" 
    @auth-success="handleAuthSuccess" 
  />
  
  <!-- Chess app if authenticated -->
  <div v-else class="flex flex-col min-h-screen">
    <!-- Header with user info and logout -->
    <header class="bg-blue-600 text-white p-4">
      <div class="w-full flex justify-between items-center">
        <!-- Title on the very left -->
        <h1 class="text-xl font-bold pl-2">Log My Chess Games</h1>
        
        <!-- User info and logout on right -->
        <div class="flex items-center pr-2">
          <span class="mr-2">{{ user?.username }}</span>
          <button 
            @click="handleLogout"
            class="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
    
    <!-- Main content -->
    <div class="flex-grow flex items-center justify-center">
      <div class="flex flex-col">
        <div class="flex flex-col items-center">
          <!-- Top Row: Board Status Panel + Game Save Panel -->
          <div class="flex justify-center w-full mb-2">
            <!-- Left: Board Status Panel - aligned with chess board width -->
            <div class="mr-6" style="width: 820px;">
              <BoardStatusPanel
                :current-turn="currentTurn"
                :viewing-past-move="viewingPastMove"
                :captured-pieces="capturedPieces"
                :current-move-index="currentMoveIndex"
                :board-flipped="boardFlipped"
                position="top"
                class="w-full"
              />
            </div>
            
            <!-- Right: Game Save Panel - aligned with Move History width -->
            <div style="width: 352px;">
              <GameSavePanel
                @save-game="handleSaveGame"
                @load-game="handleLoadGame"
              />
            </div>
          </div>
          
          <!-- Middle Row: Game Board + Move History -->
          <div class="flex justify-center w-full">
            <div class="flex">
              <!-- Chess Board Section -->
              <div class="mr-6" style="width: 820px;">
                <div class="border-blue-600 border-10 rounded shadow-md">
                  <Board 
                    ref="boardComponent"
                    @turn-changed="handleTurnChange"
                    @move-history-updated="handleMoveHistoryUpdate"
                    @checkmate="handleCheckmate"
                    @stalemate="handleStalemate"
                    @current-move-index-changed="handleCurrentMoveIndexChange"
                    @captured-pieces-updated="handleCapturedPiecesUpdate"
                    @board-orientation-changed="handleBoardOrientationChange"
                  />
                </div>
              </div>
              
              <!-- Move History Component -->
              <div style="width: 352px;">
                <MoveHistoryList 
                  :move-history="moveHistory" 
                  :current-move-index="currentMoveIndex"
                  @move-selected="index => index >= 0 && boardComponent ? boardComponent.handleMoveSelection(index) : null"
                  @reset-board="boardComponent ? boardComponent.resetBoard() : null"
                />
              </div>
            </div>
          </div>
          
          <!-- Bottom Row: Board Status Panel + Move Control Panel -->
          <div class="flex justify-center w-full mt-2">
            <div class="flex">
              <!-- Bottom Board Status Panel - aligned with chess board width -->
              <BoardStatusPanel
                :current-turn="currentTurn"
                :viewing-past-move="viewingPastMove"
                :captured-pieces="capturedPieces"
                :current-move-index="currentMoveIndex"
                :board-flipped="boardFlipped"
                position="bottom"
                style="width: 820px;"
                class="mr-6"
              />
              
              <!-- Move Control Panel - aligned with Move History List width -->
              <MoveControlPanel
                :move-history="moveHistory"
                :current-move-index="currentMoveIndex"
                @move-to-first="index => boardComponent ? boardComponent.handleMoveSelection(index) : null"
                @move-to-previous="index => boardComponent ? boardComponent.handleMoveSelection(index) : null"
                @move-to-next="index => boardComponent ? boardComponent.handleMoveSelection(index) : null"
                @move-to-last="index => boardComponent ? boardComponent.handleMoveSelection(index) : null"
                style="width: 352px;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Component -->
    <Modal 
      :visible="modalVisible" 
      :title="modalTitle" 
      :message="modalMessage" 
      :icon="modalIcon"
      @close="hideModal"
    />
  </div>
</template>

<style scoped>
.border-blue-600 {
  border: 10px solid #2563eb; /* TailwindCSS blue-600 */
}
.border-10 {
  border-width: 10px;
}
.w-120 {
  width: 30rem; /* 480px */
}
</style>
