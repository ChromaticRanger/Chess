<script setup>
import { ref, onMounted, computed } from 'vue';
import Board from "./components/Board.vue";
import Modal from "./components/Modal.vue";
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

// Reference to the move history panel
const moveHistoryPanel = ref(null);

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
  
  // Scroll to the bottom after the DOM updates
  setTimeout(() => {
    if (moveHistoryPanel.value) {
      moveHistoryPanel.value.scrollTop = moveHistoryPanel.value.scrollHeight;
    }
  }, 50);
};

// Create a formatted move history grouped by move number
const formattedMoveHistoryByNumber = computed(() => {
  const result = {};
  
  moveHistory.value.forEach((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = move.color === "White";
    
    if (!result[moveNumber]) {
      result[moveNumber] = { white: null, black: null };
    }
    
    // Determine if the current move is a checkmate by checking if this is the last move
    // and if it creates check
    const isLastMove = index === moveHistory.value.length - 1;
    const isCheckmate = move.createsCheck && isLastMove && 
                        (moveHistory.value.length % 2 === 1 ? 
                          currentTurn.value === "Black" : 
                          currentTurn.value === "White");
    
    const moveData = {
      piece: move.piece,
      color: move.color,
      from: move.from.notation,
      to: move.to.notation,
      pieceImage: getPieceImagePath(move.piece, move.color),
      createsCheck: move.createsCheck, // Add check status
      isCheckmate: isCheckmate,
      isCastling: move.isCastling || false,
      castlingSide: move.castlingSide || null,
      capturedPiece: null
    };
    
    // Add captured piece data if applicable
    if (move.capturedPiece) {
      moveData.capturedPiece = {
        piece: move.capturedPiece.type,
        color: move.capturedPiece.color,
        image: getPieceImagePath(move.capturedPiece.type, move.capturedPiece.color)
      };
    }
    
    if (isWhiteMove) {
      result[moveNumber].white = moveData;
    } else {
      result[moveNumber].black = moveData;
    }
  });
  
  return result;
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
        
        <!-- Move History Panel -->
        <div ref="moveHistoryPanel" class="w-88 h-chess-board border border-gray-300 rounded-md overflow-y-auto bg-white shadow-md">
          <div class="p-3 bg-amber-800 text-white font-semibold sticky top-0 z-20">
            Move History
          </div>
          
          <!-- Column Headers - Sticky -->
          <div class="grid grid-cols-2 text-sm font-bold border-b border-gray-300 divide-x divide-gray-300 sticky top-12 z-10">
            <div class="p-2 text-center bg-gray-100">White</div>
            <div class="p-2 text-center bg-gray-100">Black</div>
          </div>
          
          <!-- Move History Content -->
          <div v-if="Object.keys(formattedMoveHistoryByNumber).length === 0" class="text-gray-500 text-center py-4">
            No moves yet
          </div>
          
          <div class="divide-y divide-gray-200">
            <div 
              v-for="(moves, moveNumber) in formattedMoveHistoryByNumber" 
              :key="moveNumber"
              class="grid grid-cols-2 text-sm divide-x divide-gray-300"
              :class="{'bg-gray-50': parseInt(moveNumber) % 2 === 1}"
            >
              <!-- White's move (left column) -->
              <div v-if="moves.white" class="p-3 flex items-center">
                <span class="mr-2 w-6 text-gray-500">{{ moveNumber }}.</span>
                <img 
                  :src="moves.white.pieceImage" 
                  :alt="`${moves.white.color} ${moves.white.piece}`" 
                  class="w-5 h-5 mr-1" 
                />
                
                <!-- Castling move -->
                <template v-if="moves.white.isCastling">
                  <span class="font-semibold">
                    {{ moves.white.castlingSide === 'kingside' ? 'O-O' : 'O-O-O' }}
                    <template v-if="moves.white.createsCheck">{{ moves.white.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
                
                <!-- Regular move (non-capture) -->
                <template v-else-if="!moves.white.capturedPiece">
                  <span class="font-semibold">
                    {{ moves.white.from }} → {{ moves.white.to }}
                    <template v-if="moves.white.createsCheck">{{ moves.white.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
                
                <!-- Capture move -->
                <template v-else>
                  <span class="font-semibold">{{ moves.white.from }} × </span>
                  <img 
                    :src="moves.white.capturedPiece.image" 
                    :alt="`${moves.white.capturedPiece.color} ${moves.white.capturedPiece.piece}`" 
                    class="w-5 h-5 mx-1" 
                  />
                  <span class="font-semibold">
                    {{ moves.white.to }}
                    <template v-if="moves.white.createsCheck">{{ moves.white.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
              </div>
              <div v-else class="p-3"></div>
              
              <!-- Black's move (right column) -->
              <div v-if="moves.black" class="p-3 flex items-center">
                <img 
                  :src="moves.black.pieceImage" 
                  :alt="`${moves.black.color} ${moves.black.piece}`" 
                  class="w-5 h-5 mr-1" 
                />
                
                <!-- Castling move -->
                <template v-if="moves.black.isCastling">
                  <span>
                    {{ moves.black.castlingSide === 'kingside' ? 'O-O' : 'O-O-O' }}
                    <template v-if="moves.black.createsCheck">{{ moves.black.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
                
                <!-- Regular move (non-capture) -->
                <template v-else-if="!moves.black.capturedPiece">
                  <span>
                    {{ moves.black.from }} → {{ moves.black.to }}
                    <template v-if="moves.black.createsCheck">{{ moves.black.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
                
                <!-- Capture move -->
                <template v-else>
                  <span>{{ moves.black.from }} × </span>
                  <img 
                    :src="moves.black.capturedPiece.image" 
                    :alt="`${moves.black.capturedPiece.color} ${moves.black.capturedPiece.piece}`" 
                    class="w-5 h-5 mx-1" 
                  />
                  <span>
                    {{ moves.black.to }}
                    <template v-if="moves.black.createsCheck">{{ moves.black.isCheckmate ? '++' : '+' }}</template>
                  </span>
                </template>
              </div>
              <div v-else class="p-3"></div>
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
.border-brown {
  border: 10px solid #8B4513; /* SaddleBrown color */
}
.border-10 {
  border-width: 10px;
}
.w-120 {
  width: 30rem; /* 480px */
}
.h-chess-board {
  height: 820px; /* Match chessboard height + border (800px + 20px) */
}
</style>