<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  defineExpose,
} from "vue";
import { Chess } from "chess.js"; // Import chess.js
// Create global access to board for debugging
window.chessBoard = null;
import Square from "./Square.vue";
import PiecePromotion from "./PiecePromotion.vue";
import throttle from "lodash/throttle";
import useGameState from "../composables/useGameState";
import usePieceManagement from "../composables/usePieceManagement";
import useMoveValidation from "../composables/useMoveValidation";
import useChessNotation from "../composables/useChessNotation";
import { getPieceImagePath, createPiece } from "../utils/PieceFactory";

// Add event emitter
const emit = defineEmits([
  "turn-changed",
  "move-history-updated",
  "checkmate",
  "stalemate",
  "current-move-index-changed",
  "captured-pieces-updated",
  "board-orientation-changed",
  "take-back-move",
]);

// Initialize chess.js instance
const chess = ref(new Chess());

// Initialize game state with callbacks
const gameState = useGameState({
  onTurnChanged: (newTurn) => emit("turn-changed", newTurn),
  onMoveHistoryUpdated: (newHistory) =>
    emit("move-history-updated", newHistory),
  onCheckmate: (winner) => emit("checkmate", winner),
  onStalemate: (stalematedColor) => emit("stalemate", stalematedColor),
});

// Initialize piece management
const pieceManager = usePieceManagement();

// Extract reactive state from the composables
const {
  currentTurn,
  moveHistory,
  whiteInCheck,
  blackInCheck,
  movedPieces,
  enPassantTarget,
  recordMove,
  switchTurn,
  updateMovedPiecesTracking,
  setCheckStatus,
  setEnPassantTarget,
  clearEnPassantTarget,
  takeBackMove,
} = gameState;

const {
  pieces,
  initialPieces,
  resetPieces,
  getPieceAtPosition,
  capturePiece,
  movePiece: movePiecePosition,
  getPiecesByColor,
} = pieceManager;

// Initialize move validation with the necessary methods from pieceManager
const moveValidator = useMoveValidation({
  getPieceAtPosition,
  getPiecesByColor: () => pieces.value,
  movedPieces,
  enPassantTarget,
});

// Extract move validation methods
const {
  calculateRawMoves,
  calculateValidMoves,
  isKingInCheck,
  isCheckmate,
  isStalemate,
  moveWouldLeaveInCheck,
  calculateAttackedSquares,
} = moveValidator;

// Initialize the chess notation composable
const { toChessNotation, fromChessNotation } = useChessNotation();

/**
 * Capture the current board state
 * This is called after each move to build up the history of board states
 */
const captureCurrentBoardState = () => {
  // Create a deep copy of the current pieces
  const boardState = JSON.parse(JSON.stringify(pieces.value));

  // Add the state to our history
  boardStateHistory.value.push(boardState);

  // Trim history if it's longer than our move history
  if (boardStateHistory.value.length > moveHistory.value.length + 1) {
    boardStateHistory.value = boardStateHistory.value.slice(
      0,
      moveHistory.value.length + 1
    );
  }

  // Keep currentMoveIndex at -1 (latest move)
  currentMoveIndex.value = -1;
  emit("current-move-index-changed", currentMoveIndex.value);
};

// Debug functions for board state and move validation
const exportBoardState = () => {
  // Create a copy of the current pieces array with relevant info
  const boardState = pieces.value.map((p) => ({
    id: p.id,
    type: p.type,
    color: p.color,
    row: p.row,
    col: p.col,
  }));

  console.log("Current board state:");
  console.log(JSON.stringify(boardState, null, 2));
  return boardState;
};

// Debug function to test if a specific move would leave the king in check
const debugMoveValidation = (pieceId, destRow, destCol) => {
  // Find the piece by ID
  const piece = pieces.value.find((p) => p.id === pieceId);
  if (!piece) {
    console.error(`Piece with ID ${pieceId} not found`);
    return null;
  }

  const destination = { row: destRow, col: destCol };

  // Check if this is a raw valid move (ignoring check)
  const rawMoves = calculateRawMoves(piece);
  const isRawValid = rawMoves.some(
    (move) => move.row === destRow && move.col === destCol
  );

  // Check if the move would leave the king in check
  const leavesInCheck = moveWouldLeaveInCheck(piece, destination);

  // Get all completely valid moves for this piece
  const validMoves = calculateValidMoves(piece);
  const isFullyValid = validMoves.some(
    (move) => move.row === destRow && move.col === destCol
  );

  const result = {
    piece: {
      id: piece.id,
      type: piece.type,
      color: piece.color,
      position: { row: piece.row, col: piece.col },
    },
    destination: { row: destRow, col: destCol },
    validation: {
      isRawValidMove: isRawValid,
      wouldLeaveInCheck: leavesInCheck,
      isFullyValidMove: isFullyValid,
    },
    debugInfo: {
      allRawMoves: rawMoves,
      allValidMoves: validMoves,
    },
  };

  console.log("Move validation debug info:", JSON.stringify(result, null, 2));
  return result;
};

// Add a reset function
const resetBoard = () => {
  // Reset the pieces using the piece manager
  resetPieces();

  // Reset UI state variables
  selectedSquare.value = { row: null, col: null };
  originalPosition.value = { row: null, col: null };
  draggingPiece.value = null;
  validMoves.value = [];
  attackedSquares.value = [];

  // Reset captured pieces
  capturedPieces.value = [];
  emit("captured-pieces-updated", capturedPieces.value);

  // Reset promotion state
  showPromotion.value = false;
  promotionPosition.value = { row: null, col: null };
  promotionColor.value = null;
  pendingMove.value = null;

  // Reset board history state
  boardStateHistory.value = [];
  currentMoveIndex.value = -1;
  emit("current-move-index-changed", currentMoveIndex.value);

  // Reset game state using the composable
  gameState.resetGameState();

  // Reset the internal chess.js instance
  chess.value.reset();
  console.log("Internal chess.js instance reset.");

  // Capture initial board state after reset
  nextTick(() => {
    captureCurrentBoardState();
  });
};

// The pieces are now managed by usePieceManagement composable

const selectedSquare = ref({ row: null, col: null });
const originalPosition = ref({ row: null, col: null });
const draggingPiece = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const validMoves = ref([]);
const attackedSquares = ref([]);
const capturedPieces = ref([]); // Track captured pieces
const boardFlipped = ref(false); // Track if the board is flipped (black at bottom)

// Pawn promotion state
const showPromotion = ref(false);
const promotionPosition = ref({ row: null, col: null });
const promotionColor = ref(null);
const pendingMove = ref(null);

// Board history state
const boardStateHistory = ref([]); // Stores snapshots of board state after each move
const currentMoveIndex = ref(-1); // -1 means "latest move"
const viewingPastMove = computed(
  () =>
    (currentMoveIndex.value >= 0 &&
      currentMoveIndex.value < moveHistory.value.length) ||
    currentMoveIndex.value === -2
);

/**
 * Handle the MouseDown event
 *
 * @param piece - The piece that is being dragged
 * @param event - The mouse down event
 * @returns {void}
 */
const handleMouseDown = (piece, event) => {
  // Don't allow dragging if promotion UI is active
  if (showPromotion.value) {
    console.log("Promotion in progress, cannot move pieces");
    return;
  }

  // Don't allow dragging if viewing a past move
  if (viewingPastMove.value) {
    console.log("Viewing past move, cannot move pieces");
    return;
  }

  // Only allow pieces of the current turn's color to be moved
  if (piece.color !== currentTurn.value) {
    console.log(`It's ${currentTurn.value}'s turn to move`);
    return; // Don't allow the piece to be dragged
  }

  draggingPiece.value = piece;
  originalPosition.value = { row: piece.row, col: piece.col }; // Store the original position
  const pieceElement = event.target;
  pieceElement.style.zIndex = 1000;
  console.log(
    `MouseDown on ${piece.color} ${piece.type} at (${piece.row},${piece.col}), piece ID: ${piece.id}`
  );

  // Calculate regular valid moves
  try {
    validMoves.value = calculateValidMoves(piece);
  } catch (error) {
    console.error(
      `Error calculating moves for ${piece.type} at (${piece.row},${piece.col}):`,
      error
    );
    validMoves.value = calculateRawMoves(piece);
  }
};

/**
 * Handle the MouseMove event
 *
 * @param event - The mouse move event
 * @returns {void}
 */
const handleMouseMove = throttle((e) => {
  // Don't process mouse move events when promotion UI is active
  if (showPromotion.value) {
    return;
  }

  if (draggingPiece.value) {
    const diffX = e.clientX - mouseX.value;
    const diffY = e.clientY - mouseY.value;
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    pieceElement.style.position = "absolute";
    const currentLeft = parseInt(pieceElement.style.left || 0, 10);
    const currentTop = parseInt(pieceElement.style.top || 0, 10);
    pieceElement.style.left = `${currentLeft + diffX}px`;
    pieceElement.style.top = `${currentTop + diffY}px`;
  }
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}, 16); // Throttle the function to run at most once every 16 milliseconds

/**
 * Handle the MouseUp event
 *
 * @param event - The mouse up event
 * @returns {void}
 */
const handleMouseUp = async (event) => {
  // Don't process mouse up events when promotion UI is active
  if (showPromotion.value) {
    return;
  }

  // Don't process moves when viewing past positions
  if (viewingPastMove.value) {
    if (draggingPiece.value) {
      returnPiece(draggingPiece.value);
      draggingPiece.value = null;
      validMoves.value = [];
    }
    return;
  }

  if (draggingPiece.value) {
    // Use getPieceAtPosition instead of the undefined checkForExistingPiece
    const movingPiece = getPieceAtPosition(
      originalPosition.value.row,
      originalPosition.value.col
    );
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    pieceElement.style.zIndex = ""; // Reset the z-index after dragging

    const boardElement = document.querySelector(".chessboard");
    const boardRect = boardElement.getBoundingClientRect();
    offsetX.value = boardRect.left;
    offsetY.value = boardRect.top;

    let visualRow = Math.floor((event.clientY - offsetY.value) / 100);
    let visualCol = Math.floor((event.clientX - offsetX.value) / 100);

    const newRow = boardFlipped.value ? 7 - visualRow : visualRow;
    const newCol = boardFlipped.value ? 7 - visualCol : visualCol;

    if (
      newRow === originalPosition.value.row &&
      newCol === originalPosition.value.col
    ) {
      returnPiece(movingPiece);
      if (pieceElement) {
        pieceElement.style.position = "";
        pieceElement.style.left = "";
        pieceElement.style.top = "";
      }
      draggingPiece.value = null;
      validMoves.value = [];
      return;
    }

    const isValidMove = validMoves.value.some(
      (move) => move.row === newRow && move.col === newCol
    );

    if (isValidMove) {
      const validMove = validMoves.value.find(
        (move) => move.row === newRow && move.col === newCol
      );
      const isCastling = validMove && validMove.specialMove === "castling";
      let castlingSide = isCastling ? validMove.castlingSide : null;
      const isEnPassant = validMove && validMove.specialMove === "enPassant";

      let san = null;
      try {
        const moveObject = {
          from: toChessNotation(
            originalPosition.value.row,
            originalPosition.value.col
          ).toLowerCase(),
          to: toChessNotation(newRow, newCol).toLowerCase(),
        };
        // Log the FEN before attempting the move
        console.log('FEN before chess.js move:', chess.value.fen()); 
        // Log the move object itself
        console.log('Move object passed to chess.js:', moveObject);
        const chessMoveResult = chess.value.move(moveObject);
        if (chessMoveResult) {
          san = chessMoveResult.san;
        } else {
          console.error(
            "chess.js rejected the move:",
            moveObject,
            "Current FEN:",
            chess.value.fen()
          );
        }
      } catch (e) {
        console.error("Error making move in chess.js:", e);
      }

      movePiece(
        movingPiece,
        newRow,
        newCol,
        null,
        false,
        isCastling,
        castlingSide,
        isEnPassant,
        false,
        null,
        san
      );

      switchTurn();
      const opponentColor = currentTurn.value;
      const isCheckmated = isCheckmate(opponentColor);
      if (isCheckmated) {
        gameState.handleCheckmate(opponentColor);
      } else {
        const isStalemated = isStalemate(opponentColor);
        if (isStalemated) {
          gameState.handleStalemate(opponentColor);
        }
      }

      captureCurrentBoardState();
    } else {
      returnPiece(movingPiece);
    }

    if (draggingPiece.value) {
      const pieceElement = document.getElementById(
        `piece-${draggingPiece.value.id}`
      );
      if (pieceElement) {
        pieceElement.style.position = "";
        pieceElement.style.left = "";
        pieceElement.style.top = "";
      }
      draggingPiece.value = null;
    }
    validMoves.value = [];
  }
};

/**
 * Handle the piece selection for pawn promotion
 *
 * @param {Object} promotionChoice - The selected promotion piece type
 */
const handlePromotion = (promotionChoice) => {
  if (!pendingMove.value) {
    return;
  }

  const { piece, fromRow, fromCol, toRow, toCol } = pendingMove.value;

  const pawnIndex = pieces.value.findIndex((p) => p.id === piece.id);

  if (pawnIndex !== -1) {
    const newPiece = createPiece(
      piece.id,
      promotionChoice.type,
      piece.color,
      toRow,
      toCol
    );

    pieces.value.splice(pawnIndex, 1, newPiece);

    let san = null;
    try {
      const moveObject = {
        from: toChessNotation(fromRow, fromCol).toLowerCase(),
        to: toChessNotation(toRow, toCol).toLowerCase(),
        promotion: promotionChoice.type.toLowerCase().charAt(0),
      };
      // Log the move object itself
      console.log('Promotion move object passed to chess.js:', moveObject);
      const chessMoveResult = chess.value.move(moveObject);
      if (chessMoveResult) {
        san = chessMoveResult.san;
      } else {
        console.error(
          "chess.js rejected the promotion move:",
          moveObject,
          "Current FEN:",
          chess.value.fen()
        );
      }
    } catch (e) {
      console.error("Error making promotion move in chess.js:", e);
    }

    // Log SAN before recording
    console.log("SAN before recordMove (handlePromotion):", san);

    recordMove({
      piece: piece.type,
      color: piece.color,
      from: {
        row: fromRow,
        col: fromCol,
        notation: toChessNotation(fromRow, fromCol),
      },
      to: { row: toRow, col: toCol, notation: toChessNotation(toRow, toCol) },
      isPromotion: true,
      promotedTo: promotionChoice.type,
      san: san,
    });

    const opponentColor = piece.color === "White" ? "Black" : "White";
    const isCheckmated = isCheckmate(opponentColor);
    if (isCheckmated) {
      gameState.handleCheckmate(opponentColor);
    } else {
      const isStalemated = isStalemate(opponentColor);
      if (isStalemated) {
        gameState.handleStalemate(opponentColor);
      }
    }

    switchTurn();
    captureCurrentBoardState();
  }

  showPromotion.value = false;
  pendingMove.value = null;
};

/**
 * Move a piece to a new square
 *
 * @param piece - The piece to move
 * @param row - The row to move the piece to
 * @param col - The column to move the piece to
 * @param capturedPiece - Any piece that was captured during the move
 * @param createsCheck - Whether the move creates check
 * @param isCastling - Whether this is a castling move
 * @param castlingSide - Which side the castling is happening on ('kingside' or 'queenside')
 * @param isEnPassant - Whether this is an en passant capture
 * @param isPromotion - Whether this is a pawn promotion
 * @param promotedTo - If it's a promotion, what piece type the pawn was promoted to
 * @param san - The Standard Algebraic Notation for the move
 */
const movePiece = (
  piece,
  row,
  col,
  capturedPiece = null,
  createsCheck = false,
  isCastling = false,
  castlingSide = null,
  isEnPassant = false,
  isPromotion = false,
  promotedTo = null,
  san = null
) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    const fromRow = piece.row;
    const fromCol = piece.col;

    pieces.value[index].row = row;
    pieces.value[index].col = col;

    if (isPromotion && promotedTo) {
      pieces.value[index].type = promotedTo;
    }

    updateMovedPiecesTracking(piece, fromRow, fromCol);

    if (piece.type === "Pawn" && Math.abs(fromRow - row) === 2) {
      setEnPassantTarget(row, col, piece.color);
    } else if (!isEnPassant) {
      clearEnPassantTarget();
    }

    // Log SAN before recording
    console.log("SAN before recordMove (movePiece):", san);

    recordMove({
      piece: piece.type,
      color: piece.color,
      from: {
        row: fromRow,
        col: fromCol,
        notation: toChessNotation(fromRow, fromCol),
      },
      to: { row: row, col: col, notation: toChessNotation(row, col) },
      createsCheck: createsCheck,
      isCastling: isCastling,
      castlingSide: castlingSide,
      isEnPassant: isEnPassant,
      isPromotion: isPromotion,
      promotedTo: promotedTo,
      san: san,
    });
  }
};

/**
 * Handle taking back the last move
 */
const handleTakeBackMove = () => {
  const chessUndoResult = chess.value.undo();

  if (!chessUndoResult) {
    console.error("Failed to undo move in internal chess.js instance.");
  }

  const removedMove = takeBackMove();

  if (removedMove) {
    const movedPiece = pieces.value.find(
      (p) => p.row === removedMove.to.row && p.col === removedMove.to.col
    );

    if (movedPiece) {
      const pieceIndex = pieces.value.findIndex((p) => p.id === movedPiece.id);
      if (pieceIndex !== -1) {
        pieces.value[pieceIndex].row = removedMove.from.row;
        pieces.value[pieceIndex].col = removedMove.from.col;

        if (removedMove.isPromotion) {
          pieces.value[pieceIndex].type = "Pawn";
        }
      }

      if (removedMove.capturedPiece) {
        const captured = removedMove.capturedPiece;
        const { row, col } = fromChessNotation(captured.position);

        const existingCaptured = pieces.value.find(
          (p) => p.row === row && p.col === col
        );
        if (!existingCaptured) {
          const newId = `restored_${captured.type}_${
            captured.color
          }_${Date.now()}`;
          const restoredPiece = createPiece(
            newId,
            captured.type,
            captured.color,
            row,
            col
          );
          pieces.value.push(restoredPiece);

          const capturedIndex = capturedPieces.value.findIndex(
            (p) => p.type === captured.type && p.color === captured.color
          );
          if (capturedIndex !== -1) {
            capturedPieces.value.splice(capturedIndex, 1);
            emit("captured-pieces-updated", capturedPieces.value);
          }
        }
      }
    }

    const currentKingColor = currentTurn.value;
    const opponentKingColor = currentKingColor === "White" ? "Black" : "White";
    setCheckStatus(currentKingColor, isKingInCheck(currentKingColor));
    setCheckStatus(opponentKingColor, isKingInCheck(opponentKingColor));

    if (boardStateHistory.value.length > 1) {
      boardStateHistory.value.pop();
    }

    currentMoveIndex.value = -1;
    emit("current-move-index-changed", currentMoveIndex.value);

    emit("take-back-move", removedMove);
  }
};

onMounted(() => {
  captureCurrentBoardState();

  window.chessBoard = {
    exportBoardState,
    debugMoveValidation,
    pieces,
    currentTurn,
    moveHistory,
    enPassantTarget,
  };

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  emit("turn-changed", currentTurn.value);

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
  window.removeEventListener("mouseup", handleMouseUp);

  window.chessBoard = null;
});

const flipCoordinate = (coord) => {
  return boardFlipped.value ? 7 - coord : coord;
};

const flipBoard = () => {
  boardFlipped.value = !boardFlipped.value;
  emit("board-orientation-changed", boardFlipped.value);
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

      const piece =
        pieces.value.find((p) => p.row === row && p.col === col) || null;
      const selected =
        selectedSquare.value.row === row && selectedSquare.value.col === col;
      const validMove = validMoves.value.some(
        (move) => move.row === row && move.col === col
      );
      const inCheck =
        (whiteInCheck.value &&
          piece?.color === "White" &&
          piece?.type === "King") ||
        (blackInCheck.value &&
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
  return result;
});

const handleMoveSelection = (moveIndex) => {
  restoreBoardStateToMove(moveIndex);
};

defineExpose({
  resetBoard,
  currentTurn,
  moveHistory,
  enPassantTarget,
  currentMoveIndex,
  handleMoveSelection,
  handleTakeBackMove,
  flipBoard,
  boardFlipped,
  exportBoardState,
  debugMoveValidation,
  getCurrentFen: () => chess.value.fen(),
  getPgn: () => chess.value.pgn(), // Expose PGN getter
});
</script>

<template>
  <div>
    <div class="chessboard-container">
      <div
        class="flip-board-button"
        @click="flipBoard"
        title="Flip board orientation"
      >
        <img src="/src/assets/swap.svg" alt="Flip Board" />
      </div>

      <div class="chessboard">
        <Square
          v-for="(square, index) in squares"
          :key="index"
          :color="square.color"
          :row="square.visualRow"
          :col="square.visualCol"
          :topLeftLabel="square.topLeftLabel"
          :bottomRightLabel="square.bottomRightLabel"
          :piece="square.piece"
          :selected="square.selected"
          :validMove="square.validMove && !viewingPastMove"
          :inCheck="square.inCheck"
          @mousedown="
            square.piece &&
              !viewingPastMove &&
              handleMouseDown(square.piece, $event)
          "
        />
      </div>

      <PiecePromotion
        :color="promotionColor"
        :position="promotionPosition"
        :visible="showPromotion"
        @piece-selected="handlePromotion"
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
  width: 800px;
  height: 800px;
}

.flip-board-button {
  position: absolute;
  left: -60px;
  top: 50%;
  transform: translateY(-50%);
  background-color: transparent;
  border-radius: 5px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 10;
}

.flip-board-button:hover {
  transform: translateY(-50%) scale(1.1);
}

.flip-board-button img {
  width: 32px;
  height: 32px;
}
</style>
