<template>
  <div class="game-input-view">
    <div class="flex-grow flex items-center justify-center" style="min-height: calc(100vh - 160px);">
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
                  @take-back-move="boardComponent ? boardComponent.handleTakeBackMove() : null"
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
                @take-back-move="boardComponent ? boardComponent.handleTakeBackMove() : null"
                style="width: 352px;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Save Game Dialog -->
    <SaveGameDialog 
      v-if="showSaveDialog" 
      :move-history="moveHistory"
      @save="saveGame"
      @cancel="cancelSave"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Board from "../components/Board.vue";
import MoveHistoryList from "../components/MoveHistoryList.vue";
import MoveControlPanel from "../components/MoveControlPanel.vue";
import BoardStatusPanel from "../components/BoardStatusPanel.vue";
import GameSavePanel from "../components/GameSavePanel.vue";
import SaveGameDialog from "../components/SaveGameDialog.vue";
import { getPieceImagePath } from "../utils/PieceFactory";
import { usePositions } from "../composables/usePositions";

// Emits
const emit = defineEmits(['show-modal']);

// Get functions from composables
const { createGame, error: saveError } = usePositions();

// Track the current turn
const currentTurn = ref("White");

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

// Create a ref for the board component
const boardComponent = ref(null);

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};

// Handler for checkmate
const handleCheckmate = (winner) => {
  const winnerKingImage = getPieceImagePath("King", winner);
  emit('show-modal', "Checkmate", `${winner} has won the game.`, winnerKingImage);
};

// Handler for stalemate
const handleStalemate = (stalematedColor) => {
  // Use both kings to represent a draw
  const whiteKingImage = getPieceImagePath("King", "White");
  emit('show-modal', "Stalemate", `The game is a draw by stalemate.`, whiteKingImage);
};

// Handler for move history updates
const handleMoveHistoryUpdate = (newHistory) => {
  moveHistory.value = newHistory;
  console.log("Move history updated in GameInput.vue:", moveHistory.value.length, "moves");
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

// Show/hide save game dialog
const showSaveDialog = ref(false);

// Handler for saving the game
const handleSaveGame = () => {
  showSaveDialog.value = true;
};

// Handle the actual game saving
const saveGame = async (gameData) => {
  try {
    // Add the move history to the game data
    const gameToSave = {
      ...gameData,
      moveHistory: moveHistory.value
    };
    
    // Format date properly if it exists
    if (gameToSave.date) {
      // Ensure it's in ISO format for the API
      gameToSave.date = new Date(gameToSave.date).toISOString();
    }
    
    // Make sure ratings are stored as integers or null
    if (gameToSave.whiteRating === '') gameToSave.whiteRating = null;
    if (gameToSave.blackRating === '') gameToSave.blackRating = null;
    
    // Convert ratings to numbers if provided
    if (gameToSave.whiteRating) gameToSave.whiteRating = parseInt(gameToSave.whiteRating);
    if (gameToSave.blackRating) gameToSave.blackRating = parseInt(gameToSave.blackRating);
    
    // Call the API to save the game
    console.log('Saving game:', gameToSave);
    const result = await createGame(gameToSave);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save game');
    }
    
    // Close the dialog
    showSaveDialog.value = false;
    
    // Show success message
    emit('show-modal', 'Success', 'Game saved successfully!');
  } catch (error) {
    console.error('Error saving game:', error);
    
    // Get detailed error message if available
    const errorMessage = error.message || 
                        saveError.value || 
                        'Failed to save the game. Please check your connection and try again.';
    
    emit('show-modal', 'Error', errorMessage);
  }
};

// Cancel save
const cancelSave = () => {
  showSaveDialog.value = false;
};

</script>

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

.game-input-view {
  padding-top: 2rem;
}
</style>