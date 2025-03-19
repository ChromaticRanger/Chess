<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, defineExpose } from "vue";
import Square from "./Square.vue";
import throttle from "lodash/throttle";

// Add event emitter
const emit = defineEmits(['turn-changed', 'move-history-updated']);

// Add a turn tracker
const currentTurn = ref("White"); // White always moves first in chess

// Add move history to track all moves made in the game
// Each entry contains: piece moved, color, origin, destination, captured piece (if any)
const moveHistory = ref([]);

// Watch for changes to currentTurn and emit events when it changes
watch(currentTurn, (newTurn) => {
  emit('turn-changed', newTurn);
});

// Watch for changes to moveHistory and emit events when moves are added
watch(moveHistory, (newHistory) => {
  console.log("Move history updated:", newHistory.length, "moves recorded");
  emit('move-history-updated', newHistory);
}, { deep: true });

const initialPieces = [
  // Black pieces
  {
    id: 0,
    type: "Rook",
    color: "Black",
    image: "src/assets/R_B.svg",
    row: 0,
    col: 0,
  },
  {
    id: 1,
    type: "Knight",
    color: "Black",
    image: "src/assets/Kn_B.svg",
    row: 0,
    col: 1,
  },
  {
    id: 2,
    type: "Bishop",
    color: "Black",
    image: "src/assets/B_B.svg",
    row: 0,
    col: 2,
  },
  {
    id: 3,
    type: "Queen",
    color: "Black",
    image: "src/assets/Q_B.svg",
    row: 0,
    col: 3,
  },
  {
    id: 4,
    type: "King",
    color: "Black",
    image: "src/assets/K_B.svg",
    row: 0,
    col: 4,
  },
  {
    id: 5,
    type: "Bishop",
    color: "Black",
    image: "src/assets/B_B.svg",
    row: 0,
    col: 5,
  },
  {
    id: 6,
    type: "Knight",
    color: "Black",
    image: "src/assets/Kn_B.svg",
    row: 0,
    col: 6,
  },
  {
    id: 7,
    type: "Rook",
    color: "Black",
    image: "src/assets/R_B.svg",
    row: 0,
    col: 7,
  },
  {
    id: 8,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 0,
  },
  {
    id: 9,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 1,
  },
  {
    id: 10,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 2,
  },
  {
    id: 11,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 3,
  },
  {
    id: 12,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 4,
  },
  {
    id: 13,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 5,
  },
  {
    id: 14,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 6,
  },
  {
    id: 15,
    type: "Pawn",
    color: "Black",
    image: "src/assets/P_B.svg",
    row: 1,
    col: 7,
  },
  // White pieces
  {
    id: 16,
    type: "Rook",
    color: "White",
    image: "src/assets/R_W.svg",
    row: 7,
    col: 0,
  },
  {
    id: 17,
    type: "Knight",
    color: "White",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 1,
  },
  {
    id: 18,
    type: "Bishop",
    color: "White",
    image: "src/assets/B_W.svg",
    row: 7,
    col: 2,
  },
  {
    id: 19,
    type: "Queen",
    color: "White",
    image: "src/assets/Q_W.svg",
    row: 7,
    col: 3,
  },
  {
    id: 20,
    type: "King",
    color: "White",
    image: "src/assets/K_W.svg",
    row: 7,
    col: 4,
  },
  {
    id: 21,
    type: "Bishop",
    color: "White",
    image: "src/assets/B_W.svg",
    row: 7,
    col: 5,
  },
  {
    id: 22,
    type: "Knight",
    color: "White",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 6,
  },
  {
    id: 23,
    type: "Rook",
    color: "White",
    image: "src/assets/R_W.svg",
    row: 7,
    col: 7,
  },
  {
    id: 24,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 0,
  },
  {
    id: 25,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 1,
  },
  {
    id: 26,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 2,
  },
  {
    id: 27,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 3,
  },
  {
    id: 28,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 4,
  },
  {
    id: 29,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 5,
  },
  {
    id: 30,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 6,
  },
  {
    id: 31,
    type: "Pawn",
    color: "White",
    image: "src/assets/P_W.svg",
    row: 6,
    col: 7,
  },
];

// Turn tracker is defined at the top of the file

// Add a reset function
const resetBoard = () => {
  // Reset the pieces to their initial positions
  pieces.value = JSON.parse(JSON.stringify(initialPieces));
  
  // Reset all game state variables
  selectedSquare.value = { row: null, col: null };
  originalPosition.value = { row: null, col: null };
  draggingPiece.value = null;
  validMoves.value = [];
  attackedSquares.value = [];
  whiteInCheck.value = false;
  blackInCheck.value = false;
  currentTurn.value = "White"; // Reset to White's turn
  moveHistory.value = []; // Clear move history
  emit('turn-changed', currentTurn.value);
};

// Initialize the pieces with a deep copy of initialPieces
// Replace your current pieces declaration with this
const pieces = ref(JSON.parse(JSON.stringify(initialPieces)));

const selectedSquare = ref({ row: null, col: null });
const originalPosition = ref({ row: null, col: null });
const draggingPiece = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const validMoves = ref([]);
const attackedSquares = ref([]);
const whiteInCheck = ref(false);
const blackInCheck = ref(false);

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
      movePiece(movingPiece, newRow, newCol, capturedPiece, createsCheck);

      // Switch turns after a valid move
      currentTurn.value = currentTurn.value === "White" ? "Black" : "White";
      console.log(`It's now ${currentTurn.value}'s turn`);
      
      // Build a list of attacked squares if check is created
      if (createsCheck) {
        attackedSquares.value = calculatedAttackedSquares(movingPiece.color);
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
  whiteInCheck.value = false;
  blackInCheck.value = false;

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
            whiteInCheck.value = true;
          } else {
            blackInCheck.value = true;
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
 */
const movePiece = (piece, row, col, capturedPiece = null, createsCheck = false) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    // Store original position before updating
    const fromRow = piece.row;
    const fromCol = piece.col;
    
    // Update piece position
    pieces.value[index].row = row;
    pieces.value[index].col = col;
    
    // Add move to history
    moveHistory.value.push({
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
      createsCheck: createsCheck, // Add check status
      timestamp: new Date().toISOString()
    });
    
    console.log("Move recorded:", moveHistory.value[moveHistory.value.length - 1]);
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
 * Create a list of all the squares that are attacked by our pieces
 *
 * @param color - The color of the pieces to check
 */
const calculatedAttackedSquares = (color) => {
  const ourPieces = pieces.value.filter((p) => p.color === color);
  const attackedSquares = [];

  // Build a list of empty squares that are attacked by our pieces

  // PAWNS
  const ourPawns = ourPieces.filter((p) => p.type === "Pawn");
  ourPawns.forEach((pawn) => {
    const direction = pawn.color === "White" ? -1 : 1;

    // Check left diagonal attack if not on left edge
    if (pawn.col > 0) {
      const leftAttack = checkForExistingPiece(
        pawn.row + direction,
        pawn.col - 1
      );
      if (!leftAttack) {
        attackedSquares.push({
          row: pawn.row + direction,
          col: pawn.col - 1,
        });
      }
    }

    // Check right diagonal attack if not on right edge
    if (pawn.col < 7) {
      const rightAttack = checkForExistingPiece(
        pawn.row + direction,
        pawn.col + 1
      );
      if (!rightAttack) {
        attackedSquares.push({
          row: pawn.row + direction,
          col: pawn.col + 1,
        });
      }
    }
  });

  // KNIGHTS
  const ourKnights = ourPieces.filter((p) => p.type === "Knight");
  ourKnights.forEach((knight) => {
    const knightMoves = [
      { row: -2, col: -1 },
      { row: -2, col: 1 },
      { row: -1, col: -2 },
      { row: -1, col: 2 },
      { row: 1, col: -2 },
      { row: 1, col: 2 },
      { row: 2, col: -1 },
      { row: 2, col: 1 },
    ];
    knightMoves.forEach((move) => {
      const newRow = knight.row + move.row;
      const newCol = knight.col + move.col;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!checkForExistingPiece(newRow, newCol)) {
          attackedSquares.push({
            row: newRow,
            col: newCol,
          });
        }
      }
    });
  });

  // BISHOPS
  const ourBishops = ourPieces.filter((p) => p.type === "Bishop");
  ourBishops.forEach((bishop) => {
    // Move diagonally up-left
    for (let i = 1; bishop.row - i >= 0 && bishop.col - i >= 0; i++) {
      if (!checkForExistingPiece(bishop.row - i, bishop.col - i)) {
        attackedSquares.push({
          row: bishop.row - i,
          col: bishop.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally up-right
    for (let i = 1; bishop.row - i >= 0 && bishop.col + i < 8; i++) {
      if (!checkForExistingPiece(bishop.row - i, bishop.col + i)) {
        attackedSquares.push({
          row: bishop.row - i,
          col: bishop.col + i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-left
    for (let i = 1; bishop.row + i < 8 && bishop.col - i >= 0; i++) {
      if (!checkForExistingPiece(bishop.row + i, bishop.col - i)) {
        attackedSquares.push({
          row: bishop.row + i,
          col: bishop.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-right
    for (let i = 1; bishop.row + i < 8 && bishop.col + i < 8; i++) {
      if (!checkForExistingPiece(bishop.row + i, bishop.col + i)) {
        attackedSquares.push({
          row: bishop.row + i,
          col: bishop.col + i,
        });
      } else {
        break;
      }
    }
  });

  // ROOKS
  const ourRooks = ourPieces.filter((p) => p.type === "Rook");
  ourRooks.forEach((rook) => {
    // Move vertically up
    for (let i = rook.row - 1; i >= 0; i--) {
      if (!checkForExistingPiece(i, rook.col)) {
        attackedSquares.push({
          row: i,
          col: rook.col,
        });
      } else {
        break;
      }
    }
    // Move vertically down
    for (let i = rook.row + 1; i < 8; i++) {
      if (!checkForExistingPiece(i, rook.col)) {
        attackedSquares.push({
          row: i,
          col: rook.col,
        });
      } else {
        break;
      }
    }
    // Move horizontally left
    for (let i = rook.col - 1; i >= 0; i--) {
      if (!checkForExistingPiece(rook.row, i)) {
        attackedSquares.push({
          row: rook.row,
          col: i,
        });
      } else {
        break;
      }
    }
    // Move horizontally right
    for (let i = rook.col + 1; i < 8; i++) {
      if (!checkForExistingPiece(rook.row, i)) {
        attackedSquares.push({
          row: rook.row,
          col: i,
        });
      } else {
        break;
      }
    }
  });

  // QUEENS
  const ourQueens = ourPieces.filter((p) => p.type === "Queen");
  ourQueens.forEach((queen) => {
    // Move vertically up
    for (let i = queen.row - 1; i >= 0; i--) {
      if (!checkForExistingPiece(i, queen.col)) {
        attackedSquares.push({
          row: i,
          col: queen.col,
        });
      } else {
        break;
      }
    }
    // Move vertically down
    for (let i = queen.row + 1; i < 8; i++) {
      if (!checkForExistingPiece(i, queen.col)) {
        attackedSquares.push({
          row: i,
          col: queen.col,
        });
      } else {
        break;
      }
    }
    // Move horizontally left
    for (let i = queen.col - 1; i >= 0; i--) {
      if (!checkForExistingPiece(queen.row, i)) {
        attackedSquares.push({
          row: queen.row,
          col: i,
        });
      } else {
        break;
      }
    }
    // Move horizontally right
    for (let i = queen.col + 1; i < 8; i++) {
      if (!checkForExistingPiece(queen.row, i)) {
        attackedSquares.push({
          row: queen.row,
          col: i,
        });
      } else {
        break;
      }
    }
    // Move diagonally up-left
    for (let i = 1; queen.row - i >= 0 && queen.col - i >= 0; i++) {
      if (!checkForExistingPiece(queen.row - i, queen.col - i)) {
        attackedSquares.push({
          row: queen.row - i,
          col: queen.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally up-right
    for (let i = 1; queen.row - i >= 0 && queen.col + i < 8; i++) {
      if (!checkForExistingPiece(queen.row - i, queen.col + i)) {
        attackedSquares.push({
          row: queen.row - i,
          col: queen.col + i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-left
    for (let i = 1; queen.row + i < 8 && queen.col - i >= 0; i++) {
      if (!checkForExistingPiece(queen.row + i, queen.col - i)) {
        attackedSquares.push({
          row: queen.row + i,
          col: queen.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-right
    for (let i = 1; queen.row + i < 8 && queen.col + i < 8; i++) {
      if (!checkForExistingPiece(queen.row + i, queen.col + i)) {
        attackedSquares.push({
          row: queen.row + i,
          col: queen.col + i,
        });
      } else {
        break;
      }
    }
  });

  // KINGS
  const ourKing = ourPieces.filter((p) => p.type === "King");
  const directions = [
    { row: -1, col: 0 }, // Up
    { row: 1, col: 0 }, // Down
    { row: 0, col: -1 }, // Left
    { row: 0, col: 1 }, // Right
    { row: -1, col: -1 }, // Up-left
    { row: -1, col: 1 }, // Up-right
    { row: 1, col: -1 }, // Down-left
    { row: 1, col: 1 }, // Down-right
  ];
  directions.forEach((direction) => {
    const newRow = ourKing.row + direction.row;
    const newCol = ourKing.col + direction.col;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (!checkForExistingPiece(newRow, newCol)) {
        attackedSquares.push({
          row: newRow,
          col: newCol,
        });
      }
    }
  });

  return attackedSquares;
};

/**
 * Calculate the valid moves for a piece
 *
 * @param startRow - The starting row
 * @param startCol - The starting column
 * @param rowIncrement - The row increment
 * @param colIncrement - The column increment
 * @param moves - The array of moves
 * @param color - The color of the piece
 */
const addMovesInDirection = (
  startRow,
  startCol,
  rowIncrement,
  colIncrement,
  moves,
  color
) => {
  let row = startRow + rowIncrement;
  let col = startCol + colIncrement;

  while (row >= 0 && row < 8 && col >= 0 && col < 8) {
    const piece = checkForExistingPiece(row, col);
    if (piece) {
      if (piece.color !== color) {
        moves.push({ row, col });
      }
      break;
    }
    moves.push({ row, col });
    row += rowIncrement;
    col += colIncrement;
  }
};

/**
 * Checks if a move would leave the player in check
 * 
 * @param {Object} piece - The piece being moved
 * @param {Object} destination - The destination square {row, col}
 * @returns {Boolean} - True if the move is safe, false if it would leave the king in check
 */
const moveWouldLeaveInCheck = (piece, destination) => {
  // Store original position
  const origRow = piece.row;
  const origCol = piece.col;
  
  // Remember any piece at the destination to restore it later
  const capturedPiece = checkForExistingPiece(destination.row, destination.col);
  let capturedPieceIndex = -1;
  
  if (capturedPiece) {
    capturedPieceIndex = pieces.value.findIndex(p => p.id === capturedPiece.id);
    // Temporarily remove the captured piece
    if (capturedPieceIndex !== -1) {
      pieces.value.splice(capturedPieceIndex, 1);
    }
  }
  
  // Temporarily move the piece
  const pieceIndex = pieces.value.findIndex(p => p.id === piece.id);
  if (pieceIndex !== -1) {
    pieces.value[pieceIndex].row = destination.row;
    pieces.value[pieceIndex].col = destination.col;
  }
  
  // Check if our king is in check after this move
  const kingInCheck = isKingInCheck(piece.color);
  
  // Restore the original board state
  if (pieceIndex !== -1) {
    pieces.value[pieceIndex].row = origRow;
    pieces.value[pieceIndex].col = origCol;
  }
  
  // Restore captured piece if there was one
  if (capturedPiece && capturedPieceIndex !== -1) {
    pieces.value.splice(capturedPieceIndex, 0, capturedPiece);
  }
  
  return kingInCheck;
};

/**
 * Check if the king of a specific color is in check
 * 
 * @param {String} kingColor - The color of the king to check
 * @returns {Boolean} - True if the king is in check, false otherwise
 */
const isKingInCheck = (kingColor) => {
  // Find our king
  const king = pieces.value.find(p => p.type === "King" && p.color === kingColor);
  if (!king) return false;
  
  // Get opponent's color
  const opponentColor = kingColor === "White" ? "Black" : "White";
  
  // Get all opponent pieces
  const opponentPieces = pieces.value.filter(p => p.color === opponentColor);
  
  // Check if any opponent piece can attack our king
  for (const piece of opponentPieces) {
    const attackMoves = calculateRawMoves(piece);
    if (attackMoves.some(move => move.row === king.row && move.col === king.col)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Calculate raw moves without check validation
 * This is used internally by isKingInCheck to avoid infinite recursion
 */
const calculateRawMoves = (piece) => {
  const moves = [];
  const { row, col, type, color } = piece;

  switch (type) {
    case "Pawn": {
      const direction = color === "White" ? -1 : 1;
      const startRow = color === "White" ? 6 : 1;

      // Forward moves
      if (!pieces.value.some((p) => p.row === row + direction && p.col === col)) {
        moves.push({ row: row + direction, col });
        if (
          row === startRow &&
          !pieces.value.some(
            (p) => p.row === row + 2 * direction && p.col === col
          )
        ) {
          moves.push({ row: row + 2 * direction, col });
        }
      }

      // Diagonal captures
      if (
        pieces.value.some(
          (p) =>
            p.row === row + direction && p.col === col - 1 && p.color !== color
        )
      ) {
        moves.push({ row: row + direction, col: col - 1 });
      }
      if (
        pieces.value.some(
          (p) =>
        p.row === row + direction && p.col === col + 1 && p.color !== color
        )
      ) {
        moves.push({ row: row + direction, col: col + 1 });
      }
      break;
    }
    case "Rook": {
      addMovesInDirection(row, col, -1, 0, moves, color);
      addMovesInDirection(row, col, 1, 0, moves, color);
      addMovesInDirection(row, col, 0, -1, moves, color);
      addMovesInDirection(row, col, 0, 1, moves, color);
      break;
    }
    case "Bishop": {
      addMovesInDirection(row, col, -1, -1, moves, color);
      addMovesInDirection(row, col, -1, 1, moves, color);
      addMovesInDirection(row, col, 1, -1, moves, color);
      addMovesInDirection(row, col, 1, 1, moves, color);
      break;
    }
    case "Queen": {
      addMovesInDirection(row, col, -1, 0, moves, color);
      addMovesInDirection(row, col, 1, 0, moves, color);
      addMovesInDirection(row, col, 0, -1, moves, color);
      addMovesInDirection(row, col, 0, 1, moves, color);
      addMovesInDirection(row, col, -1, -1, moves, color);
      addMovesInDirection(row, col, -1, 1, moves, color);
      addMovesInDirection(row, col, 1, -1, moves, color);
      addMovesInDirection(row, col, 1, 1, moves, color);
      break;
    }
    case "Knight": {
      const knightMoves = [
        { row: -2, col: -1 },
        { row: -2, col: 1 },
        { row: -1, col: -2 },
        { row: -1, col: 2 },
        { row: 1, col: -2 },
        { row: 1, col: 2 },
        { row: 2, col: -1 },
        { row: 2, col: 1 },
      ];
      knightMoves.forEach(({ row: r, col: c }) => {
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
          const piece = checkForExistingPiece(newRow, newCol);
          if (!piece || piece.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      });
      break;
    }
    case "King": {
      const kingMoves = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
        { row: -1, col: -1 },
        { row: -1, col: 1 },
        { row: 1, col: -1 },
        { row: 1, col: 1 },
      ];
      kingMoves.forEach(({ row: r, col: c }) => {
        const newRow = row + r;
        const newCol = col + c;
        if (
          newRow >= 0 &&
          newRow < 8 &&
          newCol >= 0 &&
          newCol < 8 
        ) {
          const existingPiece = checkForExistingPiece(newRow, newCol);
          if (!existingPiece || existingPiece.color !== color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      });
      break;
    }
  }

  return moves;
};

/**
 * Calculates the valid moves for a given chess piece.
 *
 * @param {Object} piece - The chess piece for which to calculate valid moves.
 * @param {Boolean} ignoreCheck - If true, don't filter out moves that would leave the king in check
 * @returns {Array} An array of valid moves for the given piece.
 */
const calculateValidMoves = (piece, ignoreCheck = false) => {
  // Get all possible moves without check validation
  const allMoves = calculateRawMoves(piece);
  
  // If we're ignoring check (e.g., when determining if a king is in check),
  // return all possible moves
  if (ignoreCheck) {
    return allMoves;
  }
  
  // Filter out moves that would leave the king in check
  return allMoves.filter(move => !moveWouldLeaveInCheck(piece, move));
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

// Expose the resetBoard method, currentTurn, and moveHistory to the parent component
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
