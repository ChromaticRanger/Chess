<script setup>
import { ref, computed, defineProps, onUpdated } from 'vue';
import { getPieceImagePath } from "../utils/PieceFactory";
import useChessNotation from "../composables/useChessNotation";

const props = defineProps({
  moveHistory: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Reference to the move history panel
const moveHistoryPanel = ref(null);

// Initialize the chess notation composable
const chessNotation = useChessNotation();

// Create a formatted move history grouped by move number
const formattedMoveHistoryByNumber = computed(() => {
  // Use the groupMovesByNumber function from the composable
  const groupedMoves = chessNotation.groupMovesByNumber(props.moveHistory);
  const result = {};
  
  // Enhance move data with additional display information
  for (const moveNumber in groupedMoves) {
    result[moveNumber] = { white: null, black: null };
    
    // Process white move if it exists
    if (groupedMoves[moveNumber].white) {
      const move = groupedMoves[moveNumber].white;
      result[moveNumber].white = {
        piece: move.piece,
        color: move.color,
        from: move.from.notation,
        to: move.to.notation,
        pieceImage: getPieceImagePath(move.piece, move.color),
        createsCheck: move.createsCheck,
        isCheckmate: move.isCheckmate || false,
        isCastling: move.isCastling || false,
        isEnPassant: move.isEnPassant || false,
        castlingSide: move.castlingSide || null,
        notation: chessNotation.formatMove(move),
        capturedPiece: null
      };
      
      // Add captured piece data if applicable
      if (move.capturedPiece) {
        result[moveNumber].white.capturedPiece = {
          piece: move.capturedPiece.type,
          color: move.capturedPiece.color,
          image: getPieceImagePath(move.capturedPiece.type, move.capturedPiece.color)
        };
      }
    }
    
    // Process black move if it exists
    if (groupedMoves[moveNumber].black) {
      const move = groupedMoves[moveNumber].black;
      result[moveNumber].black = {
        piece: move.piece,
        color: move.color,
        from: move.from.notation,
        to: move.to.notation,
        pieceImage: getPieceImagePath(move.piece, move.color),
        createsCheck: move.createsCheck,
        isCheckmate: move.isCheckmate || false,
        isCastling: move.isCastling || false,
        isEnPassant: move.isEnPassant || false,
        castlingSide: move.castlingSide || null,
        notation: chessNotation.formatMove(move),
        capturedPiece: null
      };
      
      // Add captured piece data if applicable
      if (move.capturedPiece) {
        result[moveNumber].black.capturedPiece = {
          piece: move.capturedPiece.type,
          color: move.capturedPiece.color,
          image: getPieceImagePath(move.capturedPiece.type, move.capturedPiece.color)
        };
      }
    }
  }
  
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
          
          <div>
            <!-- Standard notation format only, which already includes e.p. notation -->
            <span class="font-semibold text-sm">
              {{ moves.white.notation }}
            </span>
            <!-- We removed the separate e.p. span since it's already in the notation -->
          </div>
        </div>
        <div v-else class="p-3"></div>
        
        <!-- Black's move (right column) -->
        <div v-if="moves.black" class="p-3 flex items-center">
          <img 
            :src="moves.black.pieceImage" 
            :alt="`${moves.black.color} ${moves.black.piece}`" 
            class="w-5 h-5 mr-1" 
          />
          
          <div>
            <!-- Standard notation format only, which already includes e.p. notation -->
            <span class="text-sm">
              {{ moves.black.notation }}
            </span>
            <!-- We removed the separate e.p. span since it's already in the notation -->
          </div>
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