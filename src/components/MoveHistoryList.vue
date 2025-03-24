<script setup>
import { ref, computed, defineProps, defineEmits, onUpdated } from 'vue';
import { getPieceImagePath } from "../utils/PieceFactory";

const props = defineProps({
  moveHistory: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Reference to the move history panel
const moveHistoryPanel = ref(null);

// Create a formatted move history grouped by move number
const formattedMoveHistoryByNumber = computed(() => {
  const result = {};
  
  props.moveHistory.forEach((move, index) => {
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
      createsCheck: move.createsCheck,
      isCheckmate: move.isCheckmate || false,
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

// Scroll to the bottom when move history updates
onUpdated(() => {
  if (moveHistoryPanel.value) {
    moveHistoryPanel.value.scrollTop = moveHistoryPanel.value.scrollHeight;
  }
});
</script>

<template>
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
</template>

<style scoped>
.h-chess-board {
  height: 820px; /* Match chessboard height + border (800px + 20px) */
}
</style>