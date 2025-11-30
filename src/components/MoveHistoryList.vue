<script setup>
import { ref, computed, onUpdated, reactive } from "vue";
import { getPieceImagePath } from "../utils/PieceFactory";
import useChessNotation from "../composables/useChessNotation";
import resetSvg from "/src/assets/reset.svg";
import deleteSvg from "/src/assets/delete.svg";
import Modal from "./Modal.vue";

const props = defineProps({
  moveHistory: {
    type: Array,
    required: true,
    default: () => [],
  },
  currentMoveIndex: {
    type: Number,
    default: -1, // -1 indicates we're at the latest move
  },
});

// Define emits for when a move is selected, reset is requested, or a move is taken back
const emit = defineEmits(["move-selected", "reset-board", "take-back-move"]);

// Reference to the move history panel
const moveHistoryPanel = ref(null);

// Initialize the chess notation composable
const chessNotation = useChessNotation();

// Reset confirmation modal state
const resetModal = reactive({
  visible: false,
  message:
    "Are you sure you want to reset the board? All move history will be lost, and a New Game will be started.",
});

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
        from: move.from, // Use the string directly
        to: move.to, // Use the string directly
        pieceImage: getPieceImagePath(move.piece, move.color),
        createsCheck: move.createsCheck,
        isCheckmate: move.isCheckmate,
        isCastling: move.isCastling,
        isEnPassant: move.isEnPassant,
        notation: chessNotation.formatMove(move), // Pass the whole move object
        capturedPieceType: move.captured, // Store captured piece type (string)
      };
    }

    // Process black move if it exists
    if (groupedMoves[moveNumber].black) {
      const move = groupedMoves[moveNumber].black;
      result[moveNumber].black = {
        piece: move.piece,
        color: move.color,
        from: move.from, // Use the string directly
        to: move.to, // Use the string directly
        pieceImage: getPieceImagePath(move.piece, move.color),
        createsCheck: move.createsCheck,
        isCheckmate: move.isCheckmate,
        isCastling: move.isCastling,
        isEnPassant: move.isEnPassant,
        notation: chessNotation.formatMove(move), // Pass the whole move object
        capturedPieceType: move.captured, // Store captured piece type (string)
      };
    }
  }

  return result;
});

// Helper functions to calculate move indices
const getWhiteMoveIndex = (moveNumber) => {
  // Return index for viewMoveAtIndex to show position after white move
  // White move N should show position after moveHistory[(moveNumber-1)*2]
  // So we need to replay (moveNumber-1)*2 + 1 moves
  const index = (parseInt(moveNumber) - 1) * 2 + 1;
  return index;
};

const getBlackMoveIndex = (moveNumber) => {
  // Return index for viewMoveAtIndex to show position after black move
  // Black move N should show position after moveHistory[(moveNumber-1)*2 + 1]
  // So we need to replay (moveNumber-1)*2 + 2 moves
  const index = (parseInt(moveNumber) - 1) * 2 + 2;
  return index;
};

// Function to check if a move is the latest move
const isLatestMove = (moveIndex) => {
  const result =
    props.currentMoveIndex === -1 && moveIndex === props.moveHistory.length - 1;
  return result;
};

// Function to check if a move can be taken back
const canTakeBackMove = (moveIndex) => {
  // moveIndex is from getWhiteMoveIndex/getBlackMoveIndex (1, 2, 3, 4...)
  // The last move in moveHistory has index moveHistory.length
  // So we check if moveIndex equals moveHistory.length
  const result =
    props.currentMoveIndex === -1 &&
    moveIndex === props.moveHistory.length &&
    props.moveHistory.length > 0;
  return result;
};

// Function to check if reset is allowed (only when not viewing past moves)
const canResetBoard = () => {
  // Can only reset when at the current position (not viewing past moves)
  return props.currentMoveIndex === -1;
};

// Function to handle move selection
const selectMove = (moveIndex) => {
  // Special case: If the moveIndex equals props.moveHistory.length,
  // it refers to the position after the last move
  if (moveIndex === props.moveHistory.length) {
    // Simply go to the current position (-1)
    emit("move-selected", -1);
    return;
  }

  if (moveIndex >= 0 && moveIndex <= props.moveHistory.length) {
    // Emit Vue event
    emit("move-selected", moveIndex);

    // Also dispatch a DOM event that can be caught globally
    window.dispatchEvent(
      new CustomEvent("chess-move-selected", {
        detail: moveIndex,
      })
    );
  }
};

// Show reset confirmation modal
const confirmResetBoard = () => {
  resetModal.visible = true;
};

// Close reset confirmation modal
const closeResetModal = () => {
  resetModal.visible = false;
};

// Handler for reset board confirmation
const handleResetBoard = () => {
  emit("reset-board");
  resetModal.visible = false;
};

// Handler for take back move click
const handleTakeBackMove = () => {
  emit("take-back-move");
};

// Scroll to the bottom when move history updates
onUpdated(() => {
  if (moveHistoryPanel.value && props.currentMoveIndex === -1) {
    // Only auto-scroll when we're viewing the latest move
    moveHistoryPanel.value.scrollTop = moveHistoryPanel.value.scrollHeight;
  }
});
</script>

<template>
  <div
    ref="moveHistoryPanel"
    class="w-full h-chess-board border border-gray-300 rounded-md overflow-y-auto bg-white shadow-md"
  >
    <div
      class="flex justify-between items-center p-3 bg-blue-600 text-white font-semibold sticky top-0 z-20"
    >
      <div>Move History</div>
      <button
        @click="confirmResetBoard"
        class="reset-button"
        :disabled="!canResetBoard()"
        :class="{ 'opacity-50 cursor-not-allowed': !canResetBoard() }"
        title="Reset board"
      >
        <img :src="resetSvg" alt="Reset Board" class="w-6 h-6 invert" />
      </button>
    </div>

    <!-- Column Headers - Sticky -->
    <div
      class="grid grid-cols-2 text-sm font-bold border-b border-gray-300 divide-x divide-gray-300 sticky top-12 z-10"
    >
      <div class="p-2 text-center bg-gray-100">White</div>
      <div class="p-2 text-center bg-gray-100">Black</div>
    </div>

    <!-- Move History Content -->
    <div
      v-if="Object.keys(formattedMoveHistoryByNumber).length === 0"
      class="text-gray-500 text-center py-4"
    >
      No moves yet
    </div>

    <div class="divide-y divide-gray-200">
      <div
        v-for="(moves, moveNumber) in formattedMoveHistoryByNumber"
        :key="moveNumber"
        class="grid grid-cols-2 text-sm divide-x divide-gray-300"
        :class="{ 'bg-gray-50': parseInt(moveNumber) % 2 === 1 }"
      >
        <!-- White's move (left column) -->
        <div
          v-if="moves.white"
          class="p-3 flex items-center hover:bg-blue-50 cursor-pointer relative"
          :class="{
            'bg-blue-100':
              getWhiteMoveIndex(moveNumber) === currentMoveIndex,
            'text-red-600': moves.white.createsCheck,
          }"
          @click="selectMove(getWhiteMoveIndex(moveNumber))"
        >
          <span class="mr-2 w-6 text-gray-500">{{ moveNumber }}.</span>
          <img
            :src="moves.white.pieceImage"
            :alt="`${moves.white.color} ${moves.white.piece}`"
            class="w-5 h-5 mr-1"
          />

          <div class="flex-grow">
            <!-- Standard notation format only, which already includes e.p. notation -->
            <span class="font-semibold text-sm">
              {{ moves.white.notation }}
            </span>
          </div>

          <!-- Take back button - only show if this is the latest move and black didn't move yet -->
          <button
            v-if="canTakeBackMove(getWhiteMoveIndex(moveNumber))"
            @click.stop="handleTakeBackMove"
            class="take-back-button absolute right-1 top-1/2 transform -translate-y-1/2"
            title="Take back move"
          >
            <img :src="deleteSvg" alt="Take Back" class="w-4 h-4" />
          </button>
        </div>
        <div v-else class="p-3"></div>

        <!-- Black's move (right column) -->
        <div
          v-if="moves.black"
          class="p-3 flex items-center hover:bg-blue-50 cursor-pointer relative"
          :class="{
            'bg-blue-100':
              getBlackMoveIndex(moveNumber) === currentMoveIndex,
            'text-red-600': moves.black.createsCheck,
          }"
          @click="selectMove(getBlackMoveIndex(moveNumber))"
        >
          <img
            :src="moves.black.pieceImage"
            :alt="`${moves.black.color} ${moves.black.piece}`"
            class="w-5 h-5 mr-1"
          />

          <div class="flex-grow">
            <!-- Standard notation format only, which already includes e.p. notation -->
            <span class="text-sm">
              {{ moves.black.notation }}
            </span>
          </div>

          <!-- Take back button - only show if this is the latest move -->
          <button
            v-if="canTakeBackMove(getBlackMoveIndex(moveNumber))"
            @click.stop="handleTakeBackMove"
            class="take-back-button absolute right-1 top-1/2 transform -translate-y-1/2"
            title="Take back move"
          >
            <img :src="deleteSvg" alt="Take Back" class="w-4 h-4" />
          </button>
        </div>
        <div v-else class="p-3"></div>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <Modal
      :visible="resetModal.visible"
      title="Reset Board"
      :message="resetModal.message"
      icon="/src/assets/reset.svg"
      :showActions="true"
      confirmText="Yes, please reset"
      confirmClass="bg-red-600 hover:bg-red-700"
      cancelText="Cancel"
      @close="closeResetModal"
      @confirm="handleResetBoard"
    />
  </div>
</template>

<style scoped>
/* Mobile-first: Flexible height */
.h-chess-board {
  height: auto;
  max-height: 40vh;
  min-height: 200px;
}

.reset-button {
  @apply p-1 rounded-md hover:bg-blue-500 transition-colors;
}

.take-back-button {
  @apply p-1 rounded-md bg-red-100 hover:bg-red-200 transition-colors opacity-80 hover:opacity-100;
}

.invert {
  filter: invert(1);
}

/* Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .h-chess-board {
    height: calc(min(800px, 90vh, calc(100vw - 450px)) + 20px);
    max-height: none;
    min-height: auto;
  }
}
</style>
