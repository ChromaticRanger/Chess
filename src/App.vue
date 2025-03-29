<script setup>
import { ref, onMounted } from 'vue';
import Board from "./components/Board.vue";
import Modal from "./components/Modal.vue";
import MoveHistoryList from "./components/MoveHistoryList.vue";
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
      <div class="flex items-start">
        <!-- Chess Board Section -->
        <div class="mr-6 flex flex-col">
          <div class="border-brown border-10 rounded shadow-md">
            <Board 
              ref="boardComponent"
              @turn-changed="handleTurnChange"
              @move-history-updated="handleMoveHistoryUpdate"
              @checkmate="handleCheckmate"
              @current-move-index-changed="handleCurrentMoveIndexChange"
            />
          </div>
          
          <!-- Chess Board Controls -->
          <div class="flex flex-col space-y-2 mt-4">
            <div class="flex justify-between items-center">
              <div class="text-lg font-semibold flex items-center">
                <span>Current turn: {{ currentTurn }}</span>
                
                <!-- Past Move Indicator -->
                <span 
                  v-if="viewingPastMove" 
                  class="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  title="Viewing past board position"
                >
                  Viewing Past Move
                </span>
              </div>
              
              <button 
                @click="boardComponent ? boardComponent.resetBoard() : null" 
                class="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Reset Board
              </button>
            </div>
            
            <!-- Return to current button (only visible when viewing past move) -->
            <div v-if="viewingPastMove" class="flex justify-center">
              <button
                @click="goToMove(-1)"
                class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-4 rounded"
              >
                Return to Current Position
              </button>
            </div>
          </div>
        </div>
        
        <!-- Move History Component -->
        <MoveHistoryList 
          :move-history="moveHistory" 
          :current-move-index="currentMoveIndex"
          @move-selected="index => index >= 0 && boardComponent ? boardComponent.handleMoveSelection(index) : null"
        />
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