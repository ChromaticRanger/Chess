<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, defineExpose } from "vue";
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
  'turn-changed', 
  'move-history-updated', 
  'checkmate',
  'current-move-index-changed'
]);

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
  enPassantTarget,
  recordMove,
  switchTurn,
  updateMovedPiecesTracking,
  setCheckStatus,
  setEnPassantTarget,
  clearEnPassantTarget
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
  movedPieces,
  enPassantTarget
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

// Debug functions for board state and move validation
const exportBoardState = () => {
  // Create a copy of the current pieces array with relevant info
  const boardState = pieces.value.map(p => ({
    id: p.id,
    type: p.type,
    color: p.color,
    row: p.row,
    col: p.col
  }));
  
  console.log('Current board state:');
  console.log(JSON.stringify(boardState, null, 2));
  return boardState;
};

// Debug function to test if a specific move would leave the king in check
const debugMoveValidation = (pieceId, destRow, destCol) => {
  // Find the piece by ID
  const piece = pieces.value.find(p => p.id === pieceId);
  if (!piece) {
    console.error(`Piece with ID ${pieceId} not found`);
    return null;
  }
  
  const destination = { row: destRow, col: destCol };
  
  // Check if this is a raw valid move (ignoring check)
  const rawMoves = calculateRawMoves(piece);
  const isRawValid = rawMoves.some(move => move.row === destRow && move.col === destCol);
  
  // Check if the move would leave the king in check
  const leavesInCheck = moveWouldLeaveInCheck(piece, destination);
  
  // Get all completely valid moves for this piece
  const validMoves = calculateValidMoves(piece);
  const isFullyValid = validMoves.some(move => move.row === destRow && move.col === destCol);
  
  const result = {
    piece: {
      id: piece.id,
      type: piece.type,
      color: piece.color,
      position: { row: piece.row, col: piece.col }
    },
    destination: { row: destRow, col: destCol },
    validation: {
      isRawValidMove: isRawValid,
      wouldLeaveInCheck: leavesInCheck,
      isFullyValidMove: isFullyValid
    },
    debugInfo: {
      allRawMoves: rawMoves,
      allValidMoves: validMoves
    }
  };
  
  console.log('Move validation debug info:', JSON.stringify(result, null, 2));
  return result;
};

// Helper function to specifically debug the check detection issue
const debugCheckDetection = (pieceId, destRow, destCol) => {
  // Find the piece by ID
  const piece = pieces.value.find(p => p.id === pieceId);
  if (!piece) {
    console.error(`Piece with ID ${pieceId} not found`);
    return null;
  }
  
  const destination = { row: destRow, col: destCol };
  
  // Clone the current pieces for simulation
  const simulatedPieces = JSON.parse(JSON.stringify(pieces.value));
  
  // Find and remove any captured piece at the destination
  const capturedIndex = simulatedPieces.findIndex(
    p => p.row === destRow && p.col === destCol && p.id !== piece.id
  );
  
  if (capturedIndex !== -1) {
    console.log(`Capture detected: removing ${simulatedPieces[capturedIndex].type} at (${destRow},${destCol})`);
    simulatedPieces.splice(capturedIndex, 1);
  }
  
  // Move the piece
  const pieceIndex = simulatedPieces.findIndex(p => p.id === piece.id);
  if (pieceIndex !== -1) {
    const origRow = simulatedPieces[pieceIndex].row;
    const origCol = simulatedPieces[pieceIndex].col;
    
    simulatedPieces[pieceIndex].row = destRow;
    simulatedPieces[pieceIndex].col = destCol;
    
    console.log(`Moved ${piece.type} from (${origRow},${origCol}) to (${destRow},${destCol})`);
  }
  
  // Find our king
  const king = simulatedPieces.find(p => p.type === "King" && p.color === piece.color);
  console.log(`Our ${piece.color} king is at (${king.row},${king.col})`);
  
  // Check if any opponent piece could attack our king
  const opponentColor = piece.color === "White" ? "Black" : "White";
  const opponentPieces = simulatedPieces.filter(p => p.color === opponentColor);
  
  console.log(`Checking ${opponentPieces.length} opponent pieces for potential check...`);
  
  let checksFound = 0;
  let attackingPieces = [];
  
  for (const opponent of opponentPieces) {
    // Custom function to check if this piece can attack our king
    const couldAttack = couldPieceAttackKing(opponent, king, simulatedPieces);
    
    if (couldAttack) {
      checksFound++;
      attackingPieces.push({
        type: opponent.type,
        position: { row: opponent.row, col: opponent.col }
      });
      console.log(`Found check: ${opponent.type} at (${opponent.row},${opponent.col}) could attack king`);
    }
  }
  
  return {
    result: checksFound > 0 ? "KING WOULD BE IN CHECK" : "MOVE IS SAFE",
    attackingPieces,
    kingPosition: { row: king.row, col: king.col },
    simulatedBoardState: simulatedPieces
  };
};

// Helper function to check if a piece could attack the king
const couldPieceAttackKing = (piece, king, boardPieces) => {
  const { row, col, type, color } = piece;
  
  // Check for direct line of sight and if pieces are in the way
  const checkPosition = (r, c) => {
    return boardPieces.find(p => p.row === r && p.col === c);
  };
  
  // Different logic based on piece type
  switch (type) {
    case "Pawn": {
      // Pawns attack diagonally
      const direction = color === "White" ? -1 : 1;
      return (
        (king.row === row + direction && king.col === col - 1) ||
        (king.row === row + direction && king.col === col + 1)
      );
    }
    
    case "Knight": {
      // Knights move in L-shapes
      const knightMoves = [
        { row: -2, col: -1 }, { row: -2, col: 1 },
        { row: -1, col: -2 }, { row: -1, col: 2 },
        { row: 1, col: -2 }, { row: 1, col: 2 },
        { row: 2, col: -1 }, { row: 2, col: 1 }
      ];
      
      return knightMoves.some(move => 
        king.row === row + move.row && king.col === col + move.col
      );
    }
    
    case "Bishop": {
      // Bishops move diagonally
      if (Math.abs(king.row - row) !== Math.abs(king.col - col)) {
        return false; // Not on a diagonal
      }
      
      // Check if path is clear
      const rowStep = king.row > row ? 1 : -1;
      const colStep = king.col > col ? 1 : -1;
      
      for (let r = row + rowStep, c = col + colStep; 
           r !== king.row || c !== king.col; 
           r += rowStep, c += colStep) {
        if (checkPosition(r, c)) {
          return false; // Piece in the way
        }
      }
      
      return true;
    }
    
    case "Rook": {
      // Rooks move horizontally or vertically
      if (king.row !== row && king.col !== col) {
        return false; // Not on same row or column
      }
      
      if (king.row === row) {
        // Check horizontally
        const minCol = Math.min(col, king.col);
        const maxCol = Math.max(col, king.col);
        
        for (let c = minCol + 1; c < maxCol; c++) {
          if (checkPosition(row, c)) {
            return false; // Piece in the way
          }
        }
      } else {
        // Check vertically
        const minRow = Math.min(row, king.row);
        const maxRow = Math.max(row, king.row);
        
        for (let r = minRow + 1; r < maxRow; r++) {
          if (checkPosition(r, col)) {
            return false; // Piece in the way
          }
        }
      }
      
      return true;
    }
    
    case "Queen": {
      // Queens can move like bishops or rooks
      const isDiagonal = Math.abs(king.row - row) === Math.abs(king.col - col);
      const isStraight = king.row === row || king.col === col;
      
      if (!isDiagonal && !isStraight) {
        return false;
      }
      
      if (isDiagonal) {
        // Check diagonally like bishop
        const rowStep = king.row > row ? 1 : -1;
        const colStep = king.col > col ? 1 : -1;
        
        for (let r = row + rowStep, c = col + colStep; 
             r !== king.row || c !== king.col; 
             r += rowStep, c += colStep) {
          if (checkPosition(r, c)) {
            return false; // Piece in the way
          }
        }
      } else {
        // Check straight like rook
        if (king.row === row) {
          // Check horizontally
          const minCol = Math.min(col, king.col);
          const maxCol = Math.max(col, king.col);
          
          for (let c = minCol + 1; c < maxCol; c++) {
            if (checkPosition(row, c)) {
              return false; // Piece in the way
            }
          }
        } else {
          // Check vertically
          const minRow = Math.min(row, king.row);
          const maxRow = Math.max(row, king.row);
          
          for (let r = minRow + 1; r < maxRow; r++) {
            if (checkPosition(r, col)) {
              return false; // Piece in the way
            }
          }
        }
      }
      
      return true;
    }
    
    case "King": {
      // Kings can attack adjacent squares
      return Math.abs(king.row - row) <= 1 && Math.abs(king.col - col) <= 1;
    }
    
    default:
      return false;
  }
};

// Debug functions will be exposed with other component APIs below

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
  
  // Reset promotion state
  showPromotion.value = false;
  promotionPosition.value = { row: null, col: null };
  promotionColor.value = null;
  pendingMove.value = null;
  
  // Reset board history state
  boardStateHistory.value = [];
  currentMoveIndex.value = -1;
  emit('current-move-index-changed', currentMoveIndex.value);
  
  // Reset game state using the composable
  gameState.resetGameState();
  
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

// Pawn promotion state
const showPromotion = ref(false);
const promotionPosition = ref({ row: null, col: null });
const promotionColor = ref(null);
const pendingMove = ref(null);

// Board history state
const boardStateHistory = ref([]); // Stores snapshots of board state after each move
const currentMoveIndex = ref(-1); // -1 means "latest move"
const viewingPastMove = computed(() => currentMoveIndex.value >= 0 && currentMoveIndex.value < moveHistory.value.length);

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
    console.log('Promotion in progress, cannot move pieces');
    return;
  }
  
  // Don't allow dragging if viewing a past move
  if (viewingPastMove.value) {
    console.log('Viewing past move, cannot move pieces');
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
  console.log(`MouseDown on ${piece.color} ${piece.type} at (${piece.row},${piece.col}), piece ID: ${piece.id}`);
  
  // Handle special case for en passant with pawns
  if (piece.type === "Pawn") {
    // Access the target either directly or through .value based on whether it's a ref
    const target = enPassantTarget.value || enPassantTarget;
    
    if (target && target.row !== null && target.availableForColor === piece.color) {
      console.log("Dragging pawn, en passant target is:", target);
      
      // Check if this pawn could potentially capture en passant
      let isEligible = false;
      
      // For white pawns, en passant target is at row 2, pawn should be at row 3
      // For black pawns, en passant target is at row 5, pawn should be at row 4
      if (piece.color === 'White' && piece.row === 3 && target.row === 2) {
        isEligible = true;
        console.log('White pawn is eligible for en passant');
      } else if (piece.color === 'Black' && piece.row === 4 && target.row === 5) {
        isEligible = true;
        console.log('Black pawn is eligible for en passant');
      }
      
      const isAdjacentToTarget = Math.abs(piece.col - target.col) === 1;
      
      if (isEligible && isAdjacentToTarget) {
        console.log("This pawn is positioned to make an en passant capture");
        
        // Get the direction and capture destination
        const direction = piece.color === "White" ? -1 : 1;
        
        // Create an en passant move
        const enPassantMove = {
          row: piece.row + direction, 
          col: target.col,
          specialMove: 'enPassant',
          capturedPawnRow: target.row,
          capturedPawnCol: target.col,
          notation: toChessNotation(piece.row + direction, target.col)
        };
        
        console.log("Adding en passant move:", enPassantMove);
        
        // Calculate regular valid moves
        const regularMoves = calculateValidMoves(piece);
        
        // Check if the en passant move is already in the valid moves
        const enPassantExists = regularMoves.some(move => 
          move.specialMove === 'enPassant' && 
          move.row === enPassantMove.row && 
          move.col === enPassantMove.col
        );
        
        if (!enPassantExists) {
          console.log("En passant move was missing, adding it");
          // Add the en passant move to valid moves
          validMoves.value = [...regularMoves, enPassantMove];
        } else {
          console.log("En passant move already exists in valid moves");
          validMoves.value = regularMoves;
        }
      } else {
        // Calculate regular valid moves
        try {
          validMoves.value = calculateValidMoves(piece);
        } catch (error) {
          console.error(`Error calculating moves for pawn at (${piece.row},${piece.col}):`, error);
          // Fallback - allow basic moves without check validation
          validMoves.value = calculateRawMoves(piece);
          console.log(`Using raw moves as fallback for pawn:`, validMoves.value);
        }
      }
    } else {
      // Regular valid moves calculation
      try {
        validMoves.value = calculateValidMoves(piece);
      } catch (error) {
        console.error(`Error calculating moves for pawn at (${piece.row},${piece.col}):`, error);
        // Fallback - allow basic moves without check validation
        validMoves.value = calculateRawMoves(piece);
        console.log(`Using raw moves as fallback for pawn:`, validMoves.value);
      }
    }
  } else {
    // For non-pawns, just get the regular valid moves
    try {
      const moves = calculateValidMoves(piece);
      console.log(`Valid moves for ${piece.color} ${piece.type} at (${piece.row},${piece.col}):`, moves);
      validMoves.value = moves;
    } catch (error) {
      console.error(`Error calculating moves for ${piece.color} ${piece.type} at (${piece.row},${piece.col}):`, error);
      // Fallback - allow basic moves without check validation
      validMoves.value = calculateRawMoves(piece);
      console.log(`Using raw moves as fallback:`, validMoves.value);
    }
  }
  
  console.log("Valid moves for", piece.type, "at", piece.row, piece.col, ":", validMoves.value);
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

// Initialize the chess notation composable
const { toChessNotation, fromChessNotation } = useChessNotation();

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
      if (pieceElement) {
        pieceElement.style.position = "";
        pieceElement.style.left = "";
        pieceElement.style.top = "";
      }
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
      
      // Check what kind of special move this is (castling, en passant, etc.)
      const validMove = validMoves.value.find(
        (move) => move.row === newRow && move.col === newCol
      );
      const isCastling = validMove && validMove.specialMove === 'castling';
      let castlingSide = isCastling ? validMove.castlingSide : null;
      
      const isEnPassant = validMove && validMove.specialMove === 'enPassant';
      let enPassantCapturedPawn = null;
      
      // Handle en passant capture - the captured pawn is not at the destination square
      if (isEnPassant) {
        console.log("Executing en passant capture");
        console.log("Moving piece:", movingPiece, "Original position:", originalPosition.value);
        console.log("Destination:", { row: newRow, col: newCol });
        
        // In en passant, the captured pawn is ALWAYS at:
        // - The ORIGINAL ROW of the capturing pawn (NOT new row)
        // - The DESTINATION COLUMN of the capturing pawn 
        const capturedPawnRow = originalPosition.value.row; // Same row as original position
        const capturedPawnCol = newCol;                    // Same column as destination
        
        console.log(`Looking for pawn to capture at (${capturedPawnRow},${capturedPawnCol})`);
        
        // Try to find the pawn at this exact location - this is the ONLY correct position
        const opponentColor = movingPiece.color === "White" ? "Black" : "White";
        const capturedPawn = pieces.value.find(p => 
          p.type === "Pawn" && 
          p.color === opponentColor && 
          p.row === capturedPawnRow && 
          p.col === capturedPawnCol
        );
        
        if (capturedPawn) {
          console.log(`Found pawn to capture:`, capturedPawn);
          capturedPiece = {...capturedPawn}; // Save a copy
          
          // Immediately remove the pawn from the board
          console.log(`Removing pawn at (${capturedPawnRow},${capturedPawnCol}) from board`);
          pieces.value = pieces.value.filter(p => p.id !== capturedPawn.id);
        } else {
          console.error(`Could not find a ${opponentColor} pawn at (${capturedPawnRow},${capturedPawnCol}) to capture via en passant!`);
          
          // Debug all pawns of opponent color
          const opponentPawns = pieces.value.filter(p => p.type === "Pawn" && p.color === opponentColor);
          console.log(`All ${opponentColor} pawns on the board:`, opponentPawns);
        }
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
      
      // Check if this is a pawn promotion (pawn reaches the back rank)
      const isPawnPromotion = movingPiece.type === "Pawn" && 
        ((movingPiece.color === "White" && newRow === 0) || 
         (movingPiece.color === "Black" && newRow === 7));
      
      if (isPawnPromotion) {
        console.log(`Pawn promotion detected for ${movingPiece.color} pawn at (${newRow},${newCol})`);
        
        // Store the pending move information to be completed after promotion choice
        pendingMove.value = {
          piece: movingPiece,
          fromRow: originalPosition.value.row,
          fromCol: originalPosition.value.col,
          toRow: newRow,
          toCol: newCol,
          capturedPiece,
          createsCheck,
          isCastling,
          castlingSide,
          isEnPassant
        };
        
        // Update the piece position visually to snap it to the center of the final square
        const pieceIndex = pieces.value.findIndex((p) => p.id === movingPiece.id);
        if (pieceIndex !== -1) {
          // Update the piece position in the data model
          pieces.value[pieceIndex].row = newRow;
          pieces.value[pieceIndex].col = newCol;
          
          // Reset any CSS positioning that might have been applied during drag
          const pieceElement = document.getElementById(`piece-${movingPiece.id}`);
          if (pieceElement) {
            pieceElement.style.position = "";
            pieceElement.style.left = "";
            pieceElement.style.top = "";
          }
        }
        
        // Show the promotion selection UI
        promotionPosition.value = { row: newRow, col: newCol };
        promotionColor.value = movingPiece.color;
        showPromotion.value = true;
        
        // Don't complete the move yet - we'll wait for the promotion choice
        console.log("Waiting for promotion piece selection...");
      } else {
        // For non-promotion moves, complete the move immediately
        movePiece(movingPiece, newRow, newCol, capturedPiece, createsCheck, isCastling, castlingSide, isEnPassant);
      }
      
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

      // For non-promotion moves, switch turns and check for checkmate
      // (Promotion moves handle this in the handlePromotion function)
      if (!isPawnPromotion) {
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
        
        // Capture the board state after the move is completed
        captureCurrentBoardState();
      }
    } else {
      returnPiece(movingPiece);
    }

    // Make sure to clean up any CSS positioning
    if (draggingPiece.value) {
      const pieceElement = document.getElementById(`piece-${draggingPiece.value.id}`);
      if (pieceElement) {
        pieceElement.style.position = "";
        pieceElement.style.left = "";
        pieceElement.style.top = "";
      }
      draggingPiece.value = null;
    }
    
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
 * Handle the piece selection for pawn promotion
 * 
 * @param {Object} promotionChoice - The selected promotion piece type
 */
const handlePromotion = (promotionChoice) => {
  console.log("Promotion piece selected:", promotionChoice);
  
  if (!pendingMove.value) {
    console.error("No pending move found for promotion!");
    return;
  }
  
  const { 
    piece, 
    toRow, 
    toCol, 
    capturedPiece, 
    createsCheck, 
    isCastling, 
    castlingSide, 
    isEnPassant 
  } = pendingMove.value;
  
  // Find the promoting pawn
  const pawnIndex = pieces.value.findIndex(p => p.id === piece.id);
  
  if (pawnIndex !== -1) {
    // Remove the pawn from the board
    const pawn = pieces.value[pawnIndex];
    const { row: fromRow, col: fromCol } = pawn;
    
    console.log("Promoting pawn:", JSON.stringify(pawn));
    
    // Use the factory function to properly create a new piece of the chosen type
    // This ensures all needed properties are set correctly
    const newPiece = createPiece(
      piece.id, // Reuse the pawn's ID 
      promotionChoice.type, 
      piece.color, 
      toRow, 
      toCol
    );
    
    console.log("Created new promoted piece:", JSON.stringify(newPiece));
    
    // Replace the pawn with the new piece
    pieces.value.splice(pawnIndex, 1, newPiece);
    
    console.log("Pieces after promotion:", pieces.value.length);
    
    // Debug all pieces after promotion to see if they look correct
    console.log("All pieces after promotion:");
    pieces.value.forEach(p => {
      console.log(`ID: ${p.id}, ${p.color} ${p.type} at (${p.row},${p.col})`);
    });
    
    // Check if the promotion creates check
    const promotionCreatesCheck = checkForCheck(newPiece) || createsCheck;
    
    // Record the move with promotion
    recordMove({
      piece: piece.type,
      color: piece.color,
      from: {
        row: fromRow,
        col: fromCol,
        notation: toChessNotation(fromRow, fromCol)
      },
      to: {
        row: toRow,
        col: toCol,
        notation: toChessNotation(toRow, toCol)
      },
      capturedPiece: capturedPiece ? {
        type: capturedPiece.type,
        color: capturedPiece.color,
        position: toChessNotation(capturedPiece.row, capturedPiece.col)
      } : null,
      createsCheck: promotionCreatesCheck,
      isCastling: isCastling,
      castlingSide: castlingSide,
      isEnPassant: isEnPassant,
      isPromotion: true,
      promotedTo: promotionChoice.type
    });
    
    // Check for checkmate after promotion
    const opponentColor = piece.color === "White" ? "Black" : "White";
    const isCheckmated = isCheckmate(opponentColor);
    if (isCheckmated) {
      // Update the last move in the move history to indicate it caused checkmate
      const lastMoveIndex = moveHistory.value.length - 1;
      if (lastMoveIndex >= 0) {
        moveHistory.value[lastMoveIndex].isCheckmate = true;
      }
      
      gameState.handleCheckmate(opponentColor);
    }
    
    // Switch turns after promotion
    switchTurn();
    
    // Build a list of attacked squares if check is created
    if (promotionCreatesCheck) {
      attackedSquares.value = calculateAttackedSquares(piece.color);
    }
    
    // Capture the board state after the promotion is completed
    captureCurrentBoardState();
  }
  
  // Hide the promotion UI
  showPromotion.value = false;
  pendingMove.value = null;
  
  // After promotion, make sure other pieces know about the new piece
  // This is important for the move validation system
  nextTick(() => {
    console.log("Promotion complete, performing post-promotion updates");
  });
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
 */
const movePiece = (piece, row, col, capturedPiece = null, createsCheck = false, isCastling = false, castlingSide = null, isEnPassant = false, isPromotion = false, promotedTo = null) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    // Store original position before updating
    const fromRow = piece.row;
    const fromCol = piece.col;
    
    // Update piece position
    pieces.value[index].row = row;
    pieces.value[index].col = col;
    
    // If this is a promotion, change the piece type
    if (isPromotion && promotedTo) {
      pieces.value[index].type = promotedTo;
    }
    
    // Track if this piece is a king or rook for castling purposes
    updateMovedPiecesTracking(piece, fromRow, fromCol);
    
    // Check if this is a pawn moving two squares (for en passant)
    if (piece.type === "Pawn" && Math.abs(fromRow - row) === 2) {
      console.log(`Pawn moved two squares from (${fromRow},${fromCol}) to (${row},${col})`);
      
      // Set en passant target between the start and end positions
      setEnPassantTarget(row, col, piece.color);
      
      // Access the target either directly or through .value based on whether it's a ref
      const target = enPassantTarget.value || enPassantTarget;
      console.log("En passant target set to:", target);
      
      // Debug pawns that might be eligible to capture en passant
      const opponentColor = piece.color === "White" ? "Black" : "White";
      const direction = piece.color === "White" ? 1 : -1; // Direction is reversed from the capturing pawn's perspective
      const enPassantRow = row;
      
      // Check for pawns to the left that could capture en passant
      const leftPawn = getPieceAtPosition(enPassantRow, col - 1);
      if (leftPawn && leftPawn.type === "Pawn" && leftPawn.color === opponentColor) {
        console.log(`Found eligible pawn to the left at (${leftPawn.row},${leftPawn.col})`);
      }
      
      // Check for pawns to the right that could capture en passant
      const rightPawn = getPieceAtPosition(enPassantRow, col + 1);
      if (rightPawn && rightPawn.type === "Pawn" && rightPawn.color === opponentColor) {
        console.log(`Found eligible pawn to the right at (${rightPawn.row},${rightPawn.col})`);
      }
    }
    
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
      castlingSide: castlingSide,
      isEnPassant: isEnPassant,
      isPromotion: isPromotion,
      promotedTo: promotedTo
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
    // Reset CSS positioning first
    const pieceElement = document.getElementById(`piece-${piece.id}`);
    if (pieceElement) {
      pieceElement.style.position = "";
      pieceElement.style.left = "";
      pieceElement.style.top = "";
      pieceElement.style.zIndex = "";
    }
    
    // This technique creates a small animation to make the piece visually return to its original position
    pieces.value[index].row = originalPosition.value.row - 1;
    pieces.value[index].col = originalPosition.value.col - 1;
    await nextTick(); // Wait for the DOM to update
    pieces.value[index].row = originalPosition.value.row;
    pieces.value[index].col = originalPosition.value.col;
  }
};

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
  // This can happen if we undo moves and then make new ones
  if (boardStateHistory.value.length > moveHistory.value.length + 1) {
    boardStateHistory.value = boardStateHistory.value.slice(0, moveHistory.value.length + 1);
  }
  
  // Keep currentMoveIndex at -1 (latest move)
  currentMoveIndex.value = -1;
  emit('current-move-index-changed', currentMoveIndex.value);
};

/**
 * Restore the board to a specific move in history
 * 
 * @param {Number} moveIndex - The index of the move to display:
 *                         -2: starting position (before any moves)
 *                         -1: latest move
 *                         0+: specific move from history
 * @returns {void}
 */
const restoreBoardStateToMove = (moveIndex) => {
  // Validate the move index
  if (moveIndex < -2 || moveIndex >= moveHistory.value.length) {
    console.error(`Invalid move index: ${moveIndex}`);
    return;
  }
  
  // Update current move index
  currentMoveIndex.value = moveIndex;
  emit('current-move-index-changed', currentMoveIndex.value);
  
  // Special case: -2 represents the starting position (before any moves)
  if (moveIndex === -2) {
    // Reset to the initial position
    pieces.value = JSON.parse(JSON.stringify(initialPieces));
    return;
  }
  
  // If we're going to the latest move, use the latest state
  const stateIndex = moveIndex === -1 ? boardStateHistory.value.length - 1 : moveIndex + 1;
  
  // Make sure we have a state for this index
  if (stateIndex >= 0 && stateIndex < boardStateHistory.value.length) {
    // Get the board state at this index
    const boardState = boardStateHistory.value[stateIndex];
    
    // Apply the state to our current pieces
    pieces.value = JSON.parse(JSON.stringify(boardState));
  } else {
    console.error(`No board state found for move index ${moveIndex} (state index ${stateIndex})`);
  }
};








/**
 * Set up mouse events on component mount
 */
onMounted(() => {
  // Capture initial board state
  captureCurrentBoardState();
  
  // Store reference to board for debugging
  window.chessBoard = {
    exportBoardState,
    debugMoveValidation,
    debugCheckDetection,
    pieces,
    currentTurn,
    moveHistory,
    enPassantTarget,
    
    // Test en passant for a specific pawn
    testEnPassantForPawn: (row, col) => {
      // Find the pawn
      const pawn = pieces.value.find(p => 
        p.type === "Pawn" && 
        p.row === row && 
        p.col === col
      );
      
      if (!pawn) {
        console.error(`No pawn found at position (${row},${col})`);
        return null;
      }
      
      console.log(`Testing en passant for ${pawn.color} pawn at (${row},${col})`);
      
      // Get the current en passant target
      const target = enPassantTarget.value || enPassantTarget;
      console.log("Current en passant target:", JSON.stringify(target, null, 2));
      
      // Check if this pawn is eligible for en passant
      if (!target || target.row === null) {
        console.log("No en passant target is currently set");
        return false;
      }
      
      if (target.availableForColor !== pawn.color) {
        console.log(`En passant is only available for ${target.availableForColor} pawns, but this is a ${pawn.color} pawn`);
        return false;
      }
      
      // Check position eligibility
      let isEligible = false;
      
      // For white pawns (moving upward/negative direction), en passant target is at row 2, pawn should be at row 3
      // For black pawns (moving downward/positive direction), en passant target is at row 5, pawn should be at row 4
      if (pawn.color === 'White' && row === 3 && target.row === 2) {
        isEligible = true;
        console.log('White pawn is at the correct rank for en passant');
      } else if (pawn.color === 'Black' && row === 4 && target.row === 5) {
        isEligible = true;
        console.log('Black pawn is at the correct rank for en passant');
      } else {
        console.log(`Pawn's row (${row}) doesn't match required row for en passant capture`);
      }
      
      const isAdjacentToTarget = Math.abs(col - target.col) === 1;
      console.log('Is adjacent to target square:', isAdjacentToTarget);
      
      if (isEligible && isAdjacentToTarget) {
        console.log(`${pawn.color} pawn at (${row},${col}) is eligible for en passant capture`);
        
        // Calculate the en passant move destination
        const direction = pawn.color === "White" ? -1 : 1;
        const captureRow = row + direction;
        const captureCol = target.col;
        
        console.log(`En passant capture would move to (${captureRow},${captureCol})`);
        
        // Get raw moves
        const rawMoves = calculateRawMoves(pawn);
        console.log("Raw moves:", rawMoves);
        
        const enPassantMoves = rawMoves.filter(move => move.specialMove === 'enPassant');
        console.log("En passant moves from raw:", enPassantMoves);
        
        // Get valid moves
        const validMoves = calculateValidMoves(pawn);
        console.log("Valid moves:", validMoves);
        
        const validEnPassantMoves = validMoves.filter(move => move.specialMove === 'enPassant');
        console.log("Valid en passant moves:", validEnPassantMoves);
        
        return {
          pawn,
          isEligible: true,
          target,
          captureDestination: { row: captureRow, col: captureCol },
          rawMoves,
          rawEnPassantMoves: enPassantMoves,
          validMoves,
          validEnPassantMoves
        };
      }
      
      return {
        pawn,
        isEligible: false,
        reason: !isEligible ? "wrong rank" : "not adjacent to target"
      };
    },
    
    // En passant debug function that can be called from the console
    debugEnPassant: () => {
      const target = enPassantTarget.value || enPassantTarget;
      console.log("Current en passant target:", JSON.stringify(target, null, 2));
      
      if (target && target.row !== null) {
        console.log(`En passant is available for ${target.availableForColor} pawns to capture at (${target.row},${target.col})`);
        console.log(`Target square in chess notation: ${toChessNotation(target.row, target.col)}`);
        
        // Find pawns that could potentially capture en passant
        const pawns = pieces.value.filter(p => 
          p.type === "Pawn" && 
          p.color === target.availableForColor &&
          p.row === target.row &&
          Math.abs(p.col - target.col) === 1
        );
        
        console.log(`Found ${pawns.length} pawns eligible for en passant capture:`);
        pawns.forEach(pawn => {
          console.log(`- ${pawn.color} pawn at (${pawn.row},${pawn.col}) [${toChessNotation(pawn.row, pawn.col)}]`);
          
          // Get raw moves (without check validation)
          const rawMoves = calculateRawMoves(pawn);
          
          // Look specifically for en passant moves in raw moves
          const rawEnPassantMoves = rawMoves.filter(move => move.specialMove === 'enPassant');
          console.log(`  Raw en passant moves: ${rawEnPassantMoves.length}`);
          if (rawEnPassantMoves.length > 0) {
            rawEnPassantMoves.forEach(move => {
              console.log(`    - To: (${move.row},${move.col}) [${toChessNotation(move.row, move.col)}], captures pawn at: (${move.capturedPawnRow},${move.capturedPawnCol})`);
            });
          }
          
          // Get valid moves (with check validation)
          const validMoves = calculateValidMoves(pawn);
          console.log(`  Total valid moves: ${validMoves.length}`);
          
          // Check for en passant moves in valid moves
          const enPassantMoves = validMoves.filter(move => move.specialMove === 'enPassant');
          if (enPassantMoves.length > 0) {
            console.log(`  Valid en passant moves: ${enPassantMoves.length}`);
            enPassantMoves.forEach(move => {
              console.log(`    - To: (${move.row},${move.col}) [${toChessNotation(move.row, move.col)}], captures pawn at: (${move.capturedPawnRow},${move.capturedPawnCol})`);
            });
          } else {
            console.log(`  No valid en passant moves found! This could be due to check constraints.`);
            
            // Test if the move would leave in check
            if (rawEnPassantMoves.length > 0) {
              rawEnPassantMoves.forEach(move => {
                const wouldLeaveInCheck = moveWouldLeaveInCheck(pawn, move);
                console.log(`    - Move to ${toChessNotation(move.row, move.col)} would leave in check: ${wouldLeaveInCheck}`);
              });
            }
          }
        });
        
        // Check for the pawn that just moved two squares
        const opponentColor = target.availableForColor === "White" ? "Black" : "White";
        const expectedPawnRow = target.availableForColor === "White" ? target.row + 1 : target.row - 1;
        const expectedPawn = getPieceAtPosition(expectedPawnRow, target.col);
        
        if (expectedPawn && expectedPawn.type === "Pawn" && expectedPawn.color === opponentColor) {
          console.log(`Found ${expectedPawn.color} pawn at (${expectedPawnRow},${target.col}) that just moved two squares`);
        } else {
          console.log(`Did not find a ${opponentColor} pawn at the expected position (${expectedPawnRow},${target.col})`);
        }
        
        // Check if there's a pawn exactly at the en passant target position (shouldn't be one)
        const targetSquarePiece = getPieceAtPosition(target.row, target.col);
        if (targetSquarePiece) {
          console.log(`WARNING: Found a ${targetSquarePiece.type} at the en passant target square. This square should be empty!`);
        } else {
          console.log(`En passant target square is empty as expected.`);
        }
      } else {
        console.log("No en passant target is currently set");
      }
      
      return {
        target,
        eligiblePawns: pieces.value.filter(p => 
          p.type === "Pawn" && 
          target && target.row !== null &&
          p.color === target.availableForColor &&
          p.row === target.row &&
          Math.abs(p.col - target.col) === 1
        ),
        currentTurn: currentTurn.value
      };
    }
  };
  
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
  
  // Clean up global reference when component is unmounted
  window.chessBoard = null;
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

/**
 * Handle selection of a move from the move history list
 * 
 * @param {Number} moveIndex - The index of the move to display, or -1 for latest move
 * @returns {void}
 */
const handleMoveSelection = (moveIndex) => {
  console.log(`Restoring board state to move index ${moveIndex}`);
  restoreBoardStateToMove(moveIndex);
};

// Expose methods and game state to the parent component
defineExpose({
  // Core game functionality
  resetBoard, 
  currentTurn, 
  moveHistory,
  enPassantTarget,
  currentMoveIndex,
  handleMoveSelection,
  
  // Debug functions
  exportBoardState,
  debugMoveValidation,
  debugCheckDetection,

  // Test en passant for a specific pawn
  testEnPassantForPawn: (row, col) => {
    // Find the pawn
    const pawn = pieces.value.find(p => 
      p.type === "Pawn" && 
      p.row === row && 
      p.col === col
    );
    
    if (!pawn) {
      console.error(`No pawn found at position (${row},${col})`);
      return null;
    }
    
    console.log(`Testing en passant for ${pawn.color} pawn at (${row},${col})`);
    
    // Get the current en passant target
    const target = enPassantTarget.value || enPassantTarget;
    console.log("Current en passant target:", JSON.stringify(target, null, 2));
    
    // Check if this pawn is eligible for en passant
    if (!target || target.row === null) {
      console.log("No en passant target is currently set");
      return false;
    }
    
    if (target.availableForColor !== pawn.color) {
      console.log(`En passant is only available for ${target.availableForColor} pawns, but this is a ${pawn.color} pawn`);
      return false;
    }
    
    // Check position eligibility
    let isEligible = false;
    
    // For white pawns (moving upward/negative direction), en passant target is at row 2, pawn should be at row 3
    // For black pawns (moving downward/positive direction), en passant target is at row 5, pawn should be at row 4
    if (pawn.color === 'White' && row === 3 && target.row === 2) {
      isEligible = true;
      console.log('White pawn is at the correct rank for en passant');
    } else if (pawn.color === 'Black' && row === 4 && target.row === 5) {
      isEligible = true;
      console.log('Black pawn is at the correct rank for en passant');
    } else {
      console.log(`Pawn's row (${row}) doesn't match required row for en passant capture`);
    }
    
    const isAdjacentToTarget = Math.abs(col - target.col) === 1;
    console.log('Is adjacent to target square:', isAdjacentToTarget);
    
    if (isEligible && isAdjacentToTarget) {
      console.log(`${pawn.color} pawn at (${row},${col}) is eligible for en passant capture`);
      
      // Calculate the en passant move destination
      const direction = pawn.color === "White" ? -1 : 1;
      const captureRow = row + direction;
      const captureCol = target.col;
      
      console.log(`En passant capture would move to (${captureRow},${captureCol})`);
      
      // Get raw moves
      const rawMoves = calculateRawMoves(pawn);
      console.log("Raw moves:", rawMoves);
      
      const enPassantMoves = rawMoves.filter(move => move.specialMove === 'enPassant');
      console.log("En passant moves from raw:", enPassantMoves);
      
      // Get valid moves
      const validMoves = calculateValidMoves(pawn);
      console.log("Valid moves:", validMoves);
      
      const validEnPassantMoves = validMoves.filter(move => move.specialMove === 'enPassant');
      console.log("Valid en passant moves:", validEnPassantMoves);
      
      return {
        pawn,
        isEligible: true,
        target,
        captureDestination: { row: captureRow, col: captureCol },
        rawMoves,
        rawEnPassantMoves: enPassantMoves,
        validMoves,
        validEnPassantMoves
      };
    }
    
    return {
      pawn,
      isEligible: false,
      reason: !isEligible ? "wrong rank" : "not adjacent to target"
    };
  },
  
  // En passant debug
  debugEnPassant: () => {
    const target = enPassantTarget.value || enPassantTarget;
    console.log("Current en passant target:", JSON.stringify(target, null, 2));
    
    if (target && target.row !== null) {
      console.log(`En passant is available for ${target.availableForColor} pawns to capture at (${target.row},${target.col})`);
      console.log(`Target square in chess notation: ${toChessNotation(target.row, target.col)}`);
      
      // Find pawns that could potentially capture en passant
      const pawns = pieces.value.filter(p => 
        p.type === "Pawn" && 
        p.color === target.availableForColor &&
        p.row === target.row &&
        Math.abs(p.col - target.col) === 1
      );
      
      console.log(`Found ${pawns.length} pawns eligible for en passant capture:`);
      pawns.forEach(pawn => {
        console.log(`- ${pawn.color} pawn at (${pawn.row},${pawn.col}) [${toChessNotation(pawn.row, pawn.col)}]`);
        
        // Get raw moves (without check validation)
        const rawMoves = calculateRawMoves(pawn);
        
        // Look specifically for en passant moves in raw moves
        const rawEnPassantMoves = rawMoves.filter(move => move.specialMove === 'enPassant');
        console.log(`  Raw en passant moves: ${rawEnPassantMoves.length}`);
        
        // Get valid moves (with check validation)
        const validMoves = calculateValidMoves(pawn);
        console.log(`  Total valid moves: ${validMoves.length}`);
        
        // Check for en passant moves in valid moves
        const enPassantMoves = validMoves.filter(move => move.specialMove === 'enPassant');
        if (enPassantMoves.length > 0) {
          console.log(`  Valid en passant moves: ${enPassantMoves.length}`);
        } else {
          console.log(`  No valid en passant moves found! This could be due to check constraints.`);
          
          // Test if the move would leave in check
          if (rawEnPassantMoves.length > 0) {
            rawEnPassantMoves.forEach(move => {
              const wouldLeaveInCheck = moveWouldLeaveInCheck(pawn, move);
              console.log(`    - Move to ${toChessNotation(move.row, move.col)} would leave in check: ${wouldLeaveInCheck}`);
            });
          }
        }
      });
      
      // Return diagnostic data for console use
      return {
        target,
        eligiblePawns: pawns,
        currentTurn: currentTurn.value
      };
    } else {
      console.log("No en passant target is currently set");
      return { target: null, eligiblePawns: [], currentTurn: currentTurn.value };
    }
  }
});
</script>

<template>
  <div>
    <div class="chessboard-container">
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
      
      <!-- Pawn promotion UI -->
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
  width: 800px; /* Adjust size as needed */
  height: 800px; /* Adjust size as needed */
}
</style>
