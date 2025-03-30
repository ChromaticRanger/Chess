<script setup>
import { ref, onMounted } from 'vue';
import Board from "./components/Board.vue";
import Modal from "./components/Modal.vue";
import MoveHistoryList from "./components/MoveHistoryList.vue";
import MoveControlPanel from "./components/MoveControlPanel.vue";
import BoardStatusPanel from "./components/BoardStatusPanel.vue";
import { getPieceImagePath } from "./utils/PieceFactory";

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
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col">
      <div class="flex flex-col items-center">
        <!-- Top Row: Board Status Panel (aligned with chess board width) -->
        <div class="flex justify-center w-full mb-2">
          <div class="flex" style="width: 820px;">
            <BoardStatusPanel
              :current-turn="currentTurn"
              :viewing-past-move="viewingPastMove"
              :captured-pieces="capturedPieces"
              :current-move-index="currentMoveIndex"
              position="top"
              class="w-full"
            />
          </div>
          <!-- Empty space for alignment with move history -->
          <div style="width: 352px;" class="ml-6"></div>
        </div>
        
        <!-- Middle Row: Game Board + Move History -->
        <div class="flex justify-center w-full">
          <div class="flex">
            <!-- Chess Board Section -->
            <div class="mr-6" style="width: 820px;">
              <div class="border-brown border-10 rounded shadow-md">
                <Board 
                  ref="boardComponent"
                  @turn-changed="handleTurnChange"
                  @move-history-updated="handleMoveHistoryUpdate"
                  @checkmate="handleCheckmate"
                  @current-move-index-changed="handleCurrentMoveIndexChange"
                  @captured-pieces-updated="handleCapturedPiecesUpdate"
                />
              </div>
            </div>
            
            <!-- Move History Component -->
            <MoveHistoryList 
              :move-history="moveHistory" 
              :current-move-index="currentMoveIndex"
              @move-selected="index => index >= 0 && boardComponent ? boardComponent.handleMoveSelection(index) : null"
              @reset-board="boardComponent ? boardComponent.resetBoard() : null"
              style="width: 352px;"
            />
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
.border-brown {
  border: 10px solid #8B4513; /* SaddleBrown color */
}
.border-10 {
  border-width: 10px;
}
.w-120 {
  width: 30rem; /* 480px */
}
</style>