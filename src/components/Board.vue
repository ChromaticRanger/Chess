<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game";
import Square from "./Square.vue";
import PiecePromotion from "./PiecePromotion.vue";
import Modal from "./Modal.vue"; // Import the Modal component
import throttle from "lodash/throttle";
import usePieceManagement from "../composables/usePieceManagement";
import useChessNotation from "../composables/useChessNotation";

const gameStore = useGameStore();
const {
  currentFen, // Use currentFen instead of fen to support viewing past moves
  currentTurn,
  whiteInCheck,
  blackInCheck,
  whiteKingInCheck,
  blackKingInCheck,
  boardFlipped,
  isGameOver,
  showCheckmateModal,
  checkmateModalMessage,
  viewingMoveIndex, // Add the viewingMoveIndex to track which move is being viewed
} = storeToRefs(gameStore);
const {
  makeMove,
  resetGame,
  takeBackMove,
  setBoardOrientation,
  getValidMoves,
  closeCheckmateModal, // Get the function to close the modal
  viewMoveAtIndex, // Add the viewMoveAtIndex function
} = gameStore;

// Add a watcher to log when currentTurn changes
watch(currentTurn, (newTurn, oldTurn) => {
  // Turn change tracking
});

// Also watch the currentFen to track when it changes
watch(currentFen, (newFen) => {
  // FEN change tracking
});

const { toChessNotation, fromChessNotation } = useChessNotation();
const { pieces, getPieceAtPosition } = usePieceManagement(currentFen);

const selectedSquare = ref({ row: null, col: null });
const originalPosition = ref({ row: null, col: null });
const draggingPiece = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const validMoves = ref([]);
const attackedSquares = ref([]);

const showPromotion = ref(false);
const promotionPosition = ref({ row: null, col: null });
const promotionColor = ref(null);
const pendingMove = ref(null);

const currentMoveIndex = ref(-1);
const viewingPastMove = ref(false);

const emit = defineEmits(["current-move-index-changed"]);

const returnPiece = (piece) => {
  if (!piece) return;
  const pieceElement = document.getElementById(`piece-${piece.id}`);
  if (pieceElement) {
    pieceElement.style.position = "";
    pieceElement.style.left = "";
    pieceElement.style.top = "";
    pieceElement.style.zIndex = "";
    // Piece returned to original position
  }
};

const handleMouseDown = (piece, event) => {
  if (showPromotion.value || viewingPastMove.value || isGameOver.value) {
    return;
  }
  if (piece.color !== currentTurn.value) {
    return;
  }

  draggingPiece.value = piece;
  originalPosition.value = { row: piece.row, col: piece.col };
  const pieceElement = event.target;
  pieceElement.style.zIndex = 1000;

  try {
    const sourceSquare = toChessNotation(piece.row, piece.col).toLowerCase();
    const movesFromChessJs = gameStore.getValidMoves(sourceSquare);

    validMoves.value = movesFromChessJs.map((move) => {
      const { row, col } = fromChessNotation(move.to);
      return { row, col, san: move.san };
    });
  } catch (error) {
    console.error("Error getting valid moves from store action:", error);
    validMoves.value = [];
  }
};

const handleMouseMove = throttle((e) => {
  if (showPromotion.value) {
    return;
  }

  if (draggingPiece.value) {
    const diffX = e.clientX - mouseX.value;
    const diffY = e.clientY - mouseY.value;
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    if (pieceElement) {
      pieceElement.style.position = "absolute";
      const currentLeft = parseInt(pieceElement.style.left || 0, 10);
      const currentTop = parseInt(pieceElement.style.top || 0, 10);
      pieceElement.style.left = `${currentLeft + diffX}px`;
      pieceElement.style.top = `${currentTop + diffY}px`;
    }
  }
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}, 16);

const handleMouseUp = async (event) => {
  if (showPromotion.value || !draggingPiece.value) {
    return;
  }

  const movingPiece = draggingPiece.value;
  const pieceElement = document.getElementById(`piece-${movingPiece.id}`);
  if (pieceElement) pieceElement.style.zIndex = "";

  const boardElement = document.querySelector(".chessboard");
  if (!boardElement) return;
  const boardRect = boardElement.getBoundingClientRect();
  offsetX.value = boardRect.left;
  offsetY.value = boardRect.top;
  const squareSize = boardRect.width / 8;
  let visualRow = Math.floor((event.clientY - offsetY.value) / squareSize);
  let visualCol = Math.floor((event.clientX - offsetX.value) / squareSize);

  visualRow = Math.max(0, Math.min(7, visualRow));
  visualCol = Math.max(0, Math.min(7, visualCol));

  const newRow = boardFlipped.value ? 7 - visualRow : visualRow;
  const newCol = boardFlipped.value ? 7 - visualCol : visualCol;

  if (
    newRow === originalPosition.value.row &&
    newCol === originalPosition.value.col
  ) {
    returnPiece(movingPiece);
    draggingPiece.value = null;
    validMoves.value = [];
    return;
  }

  const validMoveTarget = validMoves.value.find(
    (move) => move.row === newRow && move.col === newCol
  );

  if (validMoveTarget && !viewingPastMove.value && !isGameOver.value) {
    const fromSquare = toChessNotation(
      originalPosition.value.row,
      originalPosition.value.col
    ).toLowerCase();
    const toSquare = toChessNotation(newRow, newCol).toLowerCase();

    const isPawn = movingPiece.type === "Pawn";
    const isPromotionRank =
      (movingPiece.color === "White" && newRow === 0) ||
      (movingPiece.color === "Black" && newRow === 7);

    if (isPawn && isPromotionRank) {
      pendingMove.value = {
        piece: movingPiece,
        fromRow: originalPosition.value.row,
        fromCol: originalPosition.value.col,
        toRow: newRow,
        toCol: newCol,
      };
      promotionPosition.value = { row: newRow, col: newCol };
      promotionColor.value = movingPiece.color;
      showPromotion.value = true;
    } else {
      const moveObject = { from: fromSquare, to: toSquare };
      // Attempting move via store
      const moveResult = makeMove(moveObject);

      if (!moveResult) {
        console.warn("Board.vue: Store rejected move, returning piece.");
        returnPiece(movingPiece);
      }
    }
  } else {
    // Invalid move target or game state prevents move
    returnPiece(movingPiece);
  }

  draggingPiece.value = null;
  validMoves.value = [];
};

const handlePromotion = (promotionChoice) => {
  if (!pendingMove.value) return;

  const { fromRow, fromCol, toRow, toCol } = pendingMove.value;
  const fromSquare = toChessNotation(fromRow, fromCol).toLowerCase();
  const toSquare = toChessNotation(toRow, toCol).toLowerCase();
  const promotionCode = promotionChoice.type.toLowerCase().charAt(0);

  const moveObject = {
    from: fromSquare,
    to: toSquare,
    promotion: promotionCode,
  };

  // Attempting promotion move via store
  const moveResult = makeMove(moveObject);

  if (!moveResult) {
    console.error("Board.vue: Store rejected promotion move.");
    returnPiece(pendingMove.value.piece);
  }

  showPromotion.value = false;
  pendingMove.value = null;
  promotionPosition.value = { row: null, col: null };
  promotionColor.value = null;
};

const internalResetBoard = () => {
  resetGame();
  selectedSquare.value = { row: null, col: null };
  originalPosition.value = { row: null, col: null };
  draggingPiece.value = null;
  validMoves.value = [];
  showPromotion.value = false;
  pendingMove.value = null;
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
  emit("current-move-index-changed", -1);
};

const internalTakeBackMove = () => {
  takeBackMove();
  selectedSquare.value = { row: null, col: null };
  originalPosition.value = { row: null, col: null };
  draggingPiece.value = null;
  validMoves.value = [];
  showPromotion.value = false;
  pendingMove.value = null;
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
  emit("current-move-index-changed", -1);
};

const internalFlipBoard = () => {
  setBoardOrientation(!boardFlipped.value);
};

/**
 * Restore the board to a specific move in the history
 * @param {Number} index The index of the move to view (-1 for current position)
 */
const restoreBoardStateToMove = (index) => {
  // Update the viewingPastMove flag
  viewingPastMove.value = index !== -1;

  // Tell the game store to update the board to the given move index
  viewMoveAtIndex(index);

  // Update the local tracking variables
  currentMoveIndex.value = index;

  // Clear any selections or dragging pieces
  selectedSquare.value = { row: null, col: null };
  draggingPiece.value = null;
  validMoves.value = [];

  // Notify parent components about the move change
  emit("current-move-index-changed", index);

  // Board restored to move index
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);

  nextTick(() => {
    const boardElement = document.querySelector(".chessboard");
    if (boardElement) {
      const boardRect = boardElement.getBoundingClientRect();
      offsetX.value = boardRect.left;
      offsetY.value = boardRect.top;
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});

const flipCoordinate = (coord) => {
  return boardFlipped.value ? 7 - coord : coord;
};

const squares = computed(() => {
  const result = [];
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const visualRow = flipCoordinate(row);
      const visualCol = flipCoordinate(col);
      const isBlack = (visualRow + visualCol) % 2 === 1;

      let topLeftLabel, bottomRightLabel;
      if (boardFlipped.value) {
        topLeftLabel = visualCol === 0 ? (visualRow + 1).toString() : null;
        bottomRightLabel = visualRow === 7 ? files[7 - visualCol] : null;
      } else {
        topLeftLabel = visualCol === 0 ? (8 - visualRow).toString() : null;
        bottomRightLabel = visualRow === 7 ? files[visualCol] : null;
      }

      const piece = getPieceAtPosition(row, col);
      const selected =
        selectedSquare.value.row === row && selectedSquare.value.col === col;
      const validMove = validMoves.value.some(
        (move) => move.row === row && move.col === col
      );
      const inCheck =
        (whiteKingInCheck.value &&
          piece?.color === "White" &&
          piece?.type === "King") ||
        (blackKingInCheck.value &&
          piece?.color === "Black" &&
          piece?.type === "King");

      result.push({
        color: isBlack ? "black" : "white",
        row,
        col,
        visualRow,
        visualCol,
        topLeftLabel,
        bottomRightLabel,
        piece,
        selected,
        validMove,
        inCheck,
      });
    }
  }
  result.sort(
    (a, b) => a.visualRow * 8 + a.visualCol - (b.visualRow * 8 + b.visualCol)
  );
  return result;
});

defineExpose({
  resetBoard: internalResetBoard,
  handleTakeBackMove: internalTakeBackMove,
  flipBoard: internalFlipBoard,
  restoreBoardStateToMove, // Expose the new method
});
</script>

<template>
  <div>
    <div class="chessboard-container">
      <div class="chessboard" @mouseup="handleMouseUp">
        <Square
          v-for="(square, index) in squares"
          :key="`${square.row}-${square.col}`"
          :color="square.color"
          :row="square.visualRow"
          :col="square.visualCol"
          :topLeftLabel="square.topLeftLabel"
          :bottomRightLabel="square.bottomRightLabel"
          :piece="square.piece"
          :selected="square.selected"
          :validMove="square.validMove && !viewingPastMove && !isGameOver"
          :inCheck="square.inCheck"
          @mousedown="square.piece && handleMouseDown(square.piece, $event)"
        />
      </div>

      <PiecePromotion
        :color="promotionColor"
        :position="promotionPosition"
        :visible="showPromotion"
        @piece-selected="handlePromotion"
      />

      <Modal
        :visible="showCheckmateModal"
        :message="checkmateModalMessage"
        title="Game Over"
        @close="closeCheckmateModal"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chessboard-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 0 auto;
}

.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  aspect-ratio: 1;
  /* Mobile-first: Fill container, let parent control sizing */
  width: 100%;
  max-width: 500px;
  max-height: 500px;
}

/* Tablet and Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .chessboard {
    width: min(800px, 90vh, calc(100vw - 450px));
    height: min(800px, 90vh, calc(100vw - 450px));
    max-width: none;
    max-height: none;
  }
}
</style>
