<script setup>
import { ref } from 'vue';
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
            />
          </div>
          
          <!-- Chess Board Controls -->
          <div class="flex items-center justify-between mt-4">
            <div class="text-lg font-semibold">
              Current turn: {{ currentTurn }}
            </div>
            
            <button 
              @click="$refs.boardComponent.resetBoard()" 
              class="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Reset Board
            </button>
          </div>
        </div>
        
        <!-- Move History Component -->
        <MoveHistoryList :move-history="moveHistory" />
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