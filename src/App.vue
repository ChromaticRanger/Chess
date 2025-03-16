<script setup>
import { ref, onMounted, computed } from 'vue';
import Board from "./components/Board.vue";

// Track the current turn
const currentTurn = ref("White");

// Track the move history
const moveHistory = ref([]);

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};

// Reference to the move history panel
const moveHistoryPanel = ref(null);

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

// Get piece image path based on piece type and color
const getPieceImagePath = (piece, color) => {
  const pieceTypeMap = {
    'Pawn': 'P',
    'Rook': 'R',
    'Knight': 'Kn',
    'Bishop': 'B',
    'Queen': 'Q',
    'King': 'K'
  };
  
  const pieceCode = pieceTypeMap[piece];
  const colorCode = color.charAt(0).toUpperCase();
  
  return `src/assets/${pieceCode}_${colorCode}.svg`;
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
    
    const moveData = {
      piece: move.piece,
      color: move.color,
      from: move.from.notation,
      to: move.to.notation,
      pieceImage: getPieceImagePath(move.piece, move.color),
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
    <div class="flex flex-col items-center mr-6">
      <div class="border-brown border-10 rounded mb-4">
        <Board 
          ref="boardComponent" 
          @turn-changed="handleTurnChange"
          @move-history-updated="handleMoveHistoryUpdate"
        />
      </div>
      
      <div class="mb-4 text-lg font-semibold">
        Current turn: {{ currentTurn }}
      </div>
      
      <button 
        @click="$refs.boardComponent.resetBoard()" 
        class="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        Reset Board
      </button>
    </div>
    
    <!-- Move History Panel -->
    <div ref="moveHistoryPanel" class="w-120 h-96 border border-gray-300 rounded-md overflow-y-auto bg-white shadow-md">
      <div class="p-3 bg-amber-800 text-white font-semibold sticky top-0 z-20">
        Move History
      </div>
      <div>
        <!-- Column Headers - Sticky -->
        <div class="grid grid-cols-2 text-sm font-bold border-b border-gray-300 divide-x divide-gray-300 sticky top-12 z-10">
          <div class="p-2 text-center bg-gray-100">White</div>
          <div class="p-2 text-center bg-gray-100">Black</div>
        </div>

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
              
              <!-- Regular move -->
              <template v-if="!moves.white.capturedPiece">
                <span class="font-semibold">{{ moves.white.from }} → {{ moves.white.to }}</span>
              </template>
              
              <!-- Capture move -->
              <template v-else>
                <span class="font-semibold">{{ moves.white.from }} × </span>
                <img 
                  :src="moves.white.capturedPiece.image" 
                  :alt="`${moves.white.capturedPiece.color} ${moves.white.capturedPiece.piece}`" 
                  class="w-5 h-5 mx-1" 
                />
                <span class="font-semibold">{{ moves.white.to }}</span>
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
              
              <!-- Regular move -->
              <template v-if="!moves.black.capturedPiece">
                <span>{{ moves.black.from }} → {{ moves.black.to }}</span>
              </template>
              
              <!-- Capture move -->
              <template v-else>
                <span>{{ moves.black.from }} × </span>
                <img 
                  :src="moves.black.capturedPiece.image" 
                  :alt="`${moves.black.capturedPiece.color} ${moves.black.capturedPiece.piece}`" 
                  class="w-5 h-5 mx-1" 
                />
                <span>{{ moves.black.to }}</span>
              </template>
            </div>
            <div v-else class="p-3"></div>
          </div>
        </div>
      </div>
    </div>
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