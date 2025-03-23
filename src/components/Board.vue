<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, defineExpose } from "vue";
import Square from "./Square.vue";
import throttle from "lodash/throttle";
import useGameState from "../composables/useGameState";
import usePieceManagement from "../composables/usePieceManagement";
import useMoveValidation from "../composables/useMoveValidation";

// Add event emitter
const emit = defineEmits(['turn-changed', 'move-history-updated', 'checkmate']);

// Initialize game state with callbacks
const gameState = useGameState({
  onTurnChanged: (newTurn) => emit('turn-changed', newTurn),
  onMoveHistoryUpdated: (newHistory) => emit('move-history-updated', newHistory),
  onCheckmate: (winner) => emit('checkmate', winner)
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
  recordMove,
  switchTurn,
  updateMovedPiecesTracking,
  setCheckStatus
} = gameState;

const {
  pieces,
  initialPieces,
  resetPieces,
  getPieceAtPosition,
  capturePiece,
  movePiece: movePiecePosition,
  getPiecesByColor
} = pieceManager;

// Initialize move validation with the necessary methods from pieceManager
const moveValidator = useMoveValidation({
  getPieceAtPosition,
  getPiecesByColor: () => pieces.value,
  movedPieces
});

// Extract move validation methods
const {
  calculateRawMoves,
  calculateValidMoves,
  isKingInCheck,
  isCheckmate,
  moveWouldLeaveInCheck,
  calculateAttackedSquares
} = moveValidator;

// Turn tracker is defined at the top of the file

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
  
  // Reset game state using the composable
  gameState.resetGameState();
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

/**
 * Handle the MouseDown event
 *
 * @param piece - The piece that is being dragged
 * @param event - The mouse down event
 * @returns {void}
 */
const handleMouseDown = (piece, event) => {
  // Only allow pieces of the current turn's color to be moved
  if (piece.color !== currentTurn.value) {
    console.log(`It's ${currentTurn.value}'s turn to move`);
    return; // Don't allow the piece to be dragged
  }
  draggingPiece.value = piece;
  originalPosition.value = { row: piece.row, col: piece.col }; // Store the original position
  const pieceElement = event.target;
  pieceElement.style.zIndex = 1000;
  // Calculate and highlight valid moves
  validMoves.value = calculateValidMoves(piece);
};

/**
 * Handle the MouseMove event
 *
 * @param event - The mouse move event
 * @returns {void}
 */
const handleMouseMove = throttle((e) => {
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
 * Convert row and column indices to chess notation (e.g., 0,0 -> A8)
 * @param {Number} row - Row index (0-7)
 * @param {Number} col - Column index (0-7)
 * @returns {String} Chess notation
 */
 const toChessNotation = (row, col) => {
  const files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  // Chess notation has row 0 as 8, row 7 as 1
  return `${files[col]}${8 - row}`;
};

/**
 * Handle the MouseUp event
 *
 * @param event - The mouse up event
 * @returns {void}
 */
const handleMouseUp = async (event) => {
  if (draggingPiece.value) {
    const movingPiece = checkForExistingPiece(
      originalPosition.value.row,
      originalPosition.value.col
    );
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    pieceElement.style.zIndex = ""; // Reset the z-index after dragging

    // Get board element's position for offset calculation
    const boardElement = document.querySelector('.chessboard');
    const boardRect = boardElement.getBoundingClientRect();
    offsetX.value = boardRect.left;
    offsetY.value = boardRect.top;

    const newRow = Math.floor((event.clientY - offsetY.value) / 100);
    const newCol = Math.floor((event.clientX - offsetX.value) / 100);

    // Check if the piece is dropped in its original position
    if (newRow === originalPosition.value.row && newCol === originalPosition.value.col) {
      console.log('Piece returned to original position:', { 
        notation: toChessNotation(newRow, newCol) 
      });
      
      // Return the piece to the center of its square
      returnPiece(movingPiece);
      
      // Reset the dragging state without further processing
      draggingPiece.value = null;
      validMoves.value = [];
      return;
    }

    console.log('Drop position:', { 
      row: newRow, 
      col: newCol, 
      notation: toChessNotation(newRow, newCol) 
    });

    // Log valid moves with chess notation
    console.log('Valid moves:', validMoves.value.map(move => ({
      ...move,
      notation: toChessNotation(move.row, move.col)
    })));

    // Check if the new position is a valid move
    const isValidMove = validMoves.value.some(
      (move) => move.row === newRow && move.col === newCol
    );

    console.log('Is valid move:', isValidMove);

    if (isValidMove) {
      // TODO: If the existing piece is the King we do not actually take it.

      // Check to see if there is a piece already on the new square
      const existingPiece = checkForExistingPiece(newRow, newCol);
      let capturedPiece = null;
      
      if (existingPiece) {
        capturedPiece = {...existingPiece}; // Save a copy before taking it
        takePiece(existingPiece);
      }
      
      // Check if this is a castling move
      const validMove = validMoves.value.find(
        (move) => move.row === newRow && move.col === newCol
      );
      const isCastling = validMove && validMove.specialMove === 'castling';
      let castlingSide = isCastling ? validMove.castlingSide : null;
      
      // Check if the move will put the opponents King in check (do this BEFORE switching turns)
      // Store the original piece position temporarily
      const origRow = movingPiece.row;
      const origCol = movingPiece.col;
      
      // Temporarily update position to check if it creates check
      const index = pieces.value.findIndex((p) => p.id === movingPiece.id);
      if (index !== -1) {
        pieces.value[index].row = newRow;
        pieces.value[index].col = newCol;
      }
      
      // Check if this move creates check
      const createsCheck = checkForCheck(movingPiece);
      
      // Reset position back until we properly move it
      if (index !== -1) {
        pieces.value[index].row = origRow;
        pieces.value[index].col = origCol;
      }
      
      // Update the moving piece's position in the pieces array and record the move
      movePiece(movingPiece, newRow, newCol, capturedPiece, createsCheck, isCastling, castlingSide);
      
      // If this was a castling move, also move the rook
      if (isCastling) {
        // Determine rook's position and destination based on castling type
        const rookRow = movingPiece.color === "White" ? 7 : 0;
        let rookCol, rookDestCol;
        
        if (castlingSide === 'kingside') {
          rookCol = 7; // h-file
          rookDestCol = 5; // f-file
        } else {
          rookCol = 0; // a-file
          rookDestCol = 3; // d-file
        }
        
        // Find the rook
        const rook = pieces.value.find(p => 
          p.type === "Rook" && 
          p.color === movingPiece.color && 
          p.row === rookRow && 
          p.col === rookCol
        );
        
        if (rook) {
          // Move the rook (don't record this as a separate move in history)
          const rookIndex = pieces.value.findIndex(p => p.id === rook.id);
          if (rookIndex !== -1) {
            pieces.value[rookIndex].row = rookRow;
            pieces.value[rookIndex].col = rookDestCol;
          }
        }
      }

      // Switch turns after a valid move
      switchTurn();
      
      // Check for checkmate and update the last move to indicate it caused checkmate
      const isCheckmated = isCheckmate(currentTurn.value);
      if (isCheckmated) {
        // Update the last move in the move history to indicate it caused checkmate
        const lastMoveIndex = moveHistory.value.length - 1;
        if (lastMoveIndex >= 0) {
          moveHistory.value[lastMoveIndex].isCheckmate = true;
        }
        
        gameState.handleCheckmate(currentTurn.value);
      }
      
      // Build a list of attacked squares if check is created
      if (createsCheck) {
        attackedSquares.value = calculateAttackedSquares(movingPiece.color);
      }
    } else {
      returnPiece(movingPiece);
    }

    draggingPiece.value = null;
    // Unselect any square that was selected after the drag
    // selectedSquare.value = { row: null, col: null };
    validMoves.value = [];
  }
};

/**
 * Check to see if the last move has put the opponents King in check
 *
 * @param movingPiece - The piece that has just been moved
 */
const checkForCheck = (movingPiece) => {
  // Reset check state
  setCheckStatus("White", false);
  setCheckStatus("Black", false);

  // Get all of the same colors pieces
  const ourPieces = pieces.value.filter((p) => p.color === movingPiece.color);

  // loop through each of these pieces and see if it can attack the opponents king
  // or expose a discovered attack on the king.
  let checkFound = false;
  ourPieces.forEach((piece) => {
    if (checkFound) return true;
    const checkingMoves = calculateValidMoves(piece, true);
    checkingMoves.forEach((move) => {
      if (checkFound) return true;
      let attackedPiece = checkForExistingPiece(move.row, move.col);
      if (attackedPiece)
        if (attackedPiece.type === "King") {
          checkFound = true;
          if (piece.color === "Black") {
            setCheckStatus("White", true);
          } else {
            setCheckStatus("Black", true);
          }
        }
    });
  });

  return checkFound;
};

/**
 * Check to see if there is a piece already on a square
 *
 * @param row - The row of the square to check
 * @param col - The column of the square to check
 * @returns {Object|null} - The piece on the square or null if there is no piece
 */
const checkForExistingPiece = (row, col) => {
  return pieces.value.find((p) => p.row === row && p.col === col) || null;
};

/**
 * Take a piece from the board
 *
 * @param piece - The piece to take
 */
const takePiece = (piece) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  pieces.value.splice(index, 1);
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
 */
const movePiece = (piece, row, col, capturedPiece = null, createsCheck = false, isCastling = false, castlingSide = null) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    // Store original position before updating
    const fromRow = piece.row;
    const fromCol = piece.col;
    
    // Update piece position
    pieces.value[index].row = row;
    pieces.value[index].col = col;
    
    // Track if this piece is a king or rook for castling purposes
    updateMovedPiecesTracking(piece, fromRow, fromCol);
    
    // Record move in game state
    recordMove({
      piece: piece.type,
      color: piece.color,
      from: {
        row: fromRow,
        col: fromCol,
        notation: toChessNotation(fromRow, fromCol)
      },
      to: {
        row: row,
        col: col,
        notation: toChessNotation(row, col)
      },
      capturedPiece: capturedPiece ? {
        type: capturedPiece.type,
        color: capturedPiece.color,
        position: toChessNotation(capturedPiece.row, capturedPiece.col)
      } : null,
      createsCheck: createsCheck,
      isCastling: isCastling,
      castlingSide: castlingSide
    });
  }
};

/**
 * Return a piece to its original position
 *
 * @param piece - The piece to return
 * @returns {Promise<void>}
 */
const returnPiece = async (piece) => {
  // Reset the piece to its original position
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    pieces.value[index].row = originalPosition.value.row - 1;
    pieces.value[index].col = originalPosition.value.col - 1;
    await nextTick(); // Wait for the DOM to update
    pieces.value[index].row = originalPosition.value.row;
    pieces.value[index].col = originalPosition.value.col;
  }
};








/**
 * Set up mouse events on component mount
 */
onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  // Emit initial turn
  emit('turn-changed', currentTurn.value);

  // Initialize board position
  nextTick(() => {
    const boardElement = document.querySelector('.chessboard');
    if (boardElement) {
      const boardRect = boardElement.getBoundingClientRect();
      offsetX.value = boardRect.left;
      offsetY.value = boardRect.top;
    }
  });
});

/**
 * Remove mouse events on component unmount
 */
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});

// Generate the chessboard pattern
const squares = computed(() => {
  const result = [];
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isBlack = (row + col) % 2 === 1;
      const topLeftLabel = col === 0 ? (8 - row).toString() : null; // Left column (1-8)
      const bottomRightLabel = row === 7 ? files[col] : null; // Bottom row (a-h)
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

// Expose the resetBoard method and game state to the parent component
defineExpose({ resetBoard, currentTurn, moveHistory });
</script>

<template>
  <div>
    <div class="chessboard">
      <Square
        v-for="(square, index) in squares"
        :key="index"
        :color="square.color"
        :row="square.row"
        :col="square.col"
        :topLeftLabel="square.topLeftLabel"
        :bottomRightLabel="square.bottomRightLabel"
        :piece="square.piece"
        :selected="square.selected"
        :validMove="square.validMove"
        :inCheck="square.inCheck"
        @mousedown="square.piece && handleMouseDown(square.piece, $event)"
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

.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 800px; /* Adjust size as needed */
  height: 800px; /* Adjust size as needed */
}
</style>
