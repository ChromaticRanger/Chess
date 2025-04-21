<script setup>
import { computed } from "vue";
import { getPieceImagePath } from "../utils/PieceFactory";

// Define props
const props = defineProps({
  currentTurn: {
    type: String,
    required: true,
  },
  viewingPastMove: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String,
    required: true,
    validator: (value) => ["top", "bottom"].includes(value),
  },
  showCurrentTurn: {
    type: Boolean,
    default: true,
  },
  capturedPieces: {
    type: Array,
    default: () => [],
  },
  currentMoveIndex: {
    type: Number,
    default: -1,
  },
  boardFlipped: {
    type: Boolean,
    default: false,
  },
});

// Define piece values for material balance calculation
const PIECE_VALUES = {
  Pawn: 1,
  Knight: 3,
  Bishop: 3,
  Rook: 5,
  Queen: 9,
  King: 0, // King is not typically assigned a value
};

// Filter captured pieces based on panel position, board orientation, and current move index
const filteredCapturedPieces = computed(() => {
  // Determine which color's pieces to show based on position and board orientation
  let color;
  if (props.boardFlipped) {
    // When flipped, top shows White pieces, bottom shows Black pieces
    color = props.position === "top" ? "White" : "Black";
  } else {
    // Normal orientation, top shows Black pieces, bottom shows White pieces
    color = props.position === "top" ? "Black" : "White";
  }

  // First filter by the capturing side
  const sideFilteredPieces = props.capturedPieces.filter(
    (piece) => piece.capturedBy === color
  );

  // Then filter by move number if viewing a past move
  if (props.currentMoveIndex >= 0) {
    return sideFilteredPieces.filter(
      (piece) => piece.moveNumber <= props.currentMoveIndex + 1
    );
  } else if (props.currentMoveIndex === -2) {
    // Show no pieces at the starting position
    return [];
  } else {
    // At the latest move or unknown state, show all pieces
    return sideFilteredPieces;
  }
});

// Calculate material advantage based on the current game state
const materialAdvantage = computed(() => {
  let whiteScore = 0;
  let blackScore = 0;

  // Get all pieces that have been captured up to this point in the game
  let visibleCapturedPieces = [...props.capturedPieces];

  // Filter by move number if viewing a past move
  if (props.currentMoveIndex >= 0) {
    visibleCapturedPieces = visibleCapturedPieces.filter(
      (piece) => piece.moveNumber <= props.currentMoveIndex + 1
    );
  } else if (props.currentMoveIndex === -2) {
    // At the starting position, no pieces have been captured
    visibleCapturedPieces = [];
  }

  // Calculate score for each captured piece
  visibleCapturedPieces.forEach((piece) => {
    if (piece.color === "White") {
      blackScore += PIECE_VALUES[piece.type] || 0;
    } else {
      whiteScore += PIECE_VALUES[piece.type] || 0;
    }
  });

  // Return the difference
  const advantage = whiteScore - blackScore;

  if (advantage === 0) {
    return { value: 0, text: "Even" };
  } else if (advantage > 0) {
    return { value: advantage, text: `+${advantage} White` };
  } else {
    return { value: advantage, text: `+${Math.abs(advantage)} Black` };
  }
});
</script>

<template>
  <div
    class="board-status-panel flex items-center justify-between bg-gray-100 border border-gray-300 p-2 rounded-md w-full"
  >
    <!-- Left Side Content -->
    <div class="flex items-center h-10">
      <!-- Captured Pieces Display -->
      <div class="flex items-center mr-4">
        <div class="flex items-center overflow-x-auto">
          <div
            v-for="(piece, index) in filteredCapturedPieces"
            :key="index"
            class="relative"
            :title="`Captured ${piece.color} ${piece.type}`"
          >
            <img
              :src="getPieceImagePath(piece.type, piece.color)"
              :alt="`${piece.color} ${piece.type}`"
              class="w-7 h-7 -mr-1"
            />
          </div>
        </div>
      </div>

      <!-- Material Balance Indicator -->
      <div
        v-if="
          filteredCapturedPieces.length > 0 || materialAdvantage.value !== 0
        "
        class="flex items-center mr-4 px-2 py-1 rounded-lg"
        :class="{
          // Favorable position (green) - when the side this panel represents has an advantage
          'bg-green-100 text-green-800':
            (position === 'bottom' &&
              !boardFlipped &&
              materialAdvantage.value > 0) || // White has advantage (white at bottom)
            (position === 'top' &&
              !boardFlipped &&
              materialAdvantage.value < 0) || // Black has advantage (black at top)
            (position === 'bottom' &&
              boardFlipped &&
              materialAdvantage.value < 0) || // Black has advantage (black at bottom)
            (position === 'top' && boardFlipped && materialAdvantage.value > 0), // White has advantage (white at top)
          // Unfavorable position (red) - when the opposing side has an advantage
          'bg-red-100 text-red-800':
            (position === 'bottom' &&
              !boardFlipped &&
              materialAdvantage.value < 0) || // Black has advantage (white at bottom)
            (position === 'top' &&
              !boardFlipped &&
              materialAdvantage.value > 0) || // White has advantage (black at top)
            (position === 'bottom' &&
              boardFlipped &&
              materialAdvantage.value > 0) || // White has advantage (black at bottom)
            (position === 'top' && boardFlipped && materialAdvantage.value < 0), // Black has advantage (white at top)
          // Equal material
          'bg-gray-100 text-gray-800': materialAdvantage.value === 0,
        }"
      >
        <span class="text-sm font-semibold">{{ materialAdvantage.text }}</span>
      </div>

      <!-- Past Move Indicator -->
      <span
        v-if="viewingPastMove"
        class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        title="Viewing past board position"
      >
        Viewing Past Moves
      </span>
    </div>

    <!-- Right Side: Turn Indicator -->
    <div
      v-if="
        showCurrentTurn &&
        // Display turn indicator in the correct panel based on board orientation
        ((boardFlipped &&
          ((position === 'top' && currentTurn === 'White') ||
            (position === 'bottom' && currentTurn === 'Black'))) ||
          (!boardFlipped &&
            ((position === 'top' && currentTurn === 'Black') ||
              (position === 'bottom' && currentTurn === 'White'))))
      "
      class="flex items-center"
    >
      <span class="text-lg font-semibold mr-2">{{ currentTurn }} to Move</span>
      <!-- Visual indicator - colored circle to match the turn color -->
      <div
        class="w-4 h-4 rounded-full"
        :class="{
          'bg-gray-800': currentTurn === 'Black',
          'bg-white border border-gray-400': currentTurn === 'White',
        }"
      ></div>
    </div>
    <div v-else class="w-6 h-6"></div>
  </div>
</template>

<style scoped>
.control-button {
  @apply p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.chess-width {
  width: 820px; /* 800px for the board + 20px for the borders */
}
</style>
