import { ref, watch, computed } from 'vue';

/**
 * Manages chess game state including turns, move history, and game reset functionality
 * 
 * @param {Object} options - Optional configuration options
 * @param {Function} options.onTurnChanged - Callback when turn changes
 * @param {Function} options.onMoveHistoryUpdated - Callback when move history updates
 * @param {Function} options.onCheckmate - Callback when checkmate occurs
 * @param {Function} options.onStalemate - Callback when stalemate occurs
 * @returns {Object} Game state and methods
 */
export default function useGameState(options = {}) {
  const { 
    onTurnChanged,
    onMoveHistoryUpdated,
    onCheckmate,
    onStalemate
  } = options;

  // Current turn state (White always moves first in chess)
  const currentTurn = ref("White");
  
  // Move history to track all moves made in the game
  // Each entry contains: piece moved, color, origin, destination, captured piece (if any)
  const moveHistory = ref([]);
  
  // Check state tracking
  const whiteInCheck = ref(false);
  const blackInCheck = ref(false);
  
  // Track which kings and rooks have moved (to determine if castling is allowed)
  const movedPieces = ref({
    whiteKing: false,
    whiteRookA: false, // Queen-side rook (a1)
    whiteRookH: false, // King-side rook (h1)
    blackKing: false,
    blackRookA: false, // Queen-side rook (a8)
    blackRookH: false, // King-side rook (h8)
  });
  
  // Track en passant - store the position of a pawn that just moved two squares
  // This will be cleared after one turn
  const enPassantTarget = ref({ 
    row: null, 
    col: null, 
    availableForColor: null 
  });

  // Watch for changes to currentTurn and emit events when it changes
  watch(currentTurn, (newTurn) => {
    if (onTurnChanged) {
      onTurnChanged(newTurn);
    }
  });

  // Watch for changes to moveHistory and emit events when moves are added
  watch(moveHistory, (newHistory) => {
    console.log("Move history updated:", newHistory.length, "moves recorded");
    if (onMoveHistoryUpdated) {
      onMoveHistoryUpdated(newHistory);
    }
  }, { deep: true });

  /**
   * Records a move in the move history
   * 
   * @param {Object} moveDetails - Details of the move to record
   */
  const recordMove = (moveDetails) => {
    moveHistory.value.push({
      ...moveDetails,
      timestamp: new Date().toISOString()
    });
    
    console.log("Move recorded:", moveHistory.value[moveHistory.value.length - 1]);
  };

  /**
   * Switches the current turn
   */
  const switchTurn = () => {
    currentTurn.value = currentTurn.value === "White" ? "Black" : "White";
    console.log(`It's now ${currentTurn.value}'s turn`);
    
    // Only clear the en passant target after the player who can capture had their turn
    // En passant should be available for exactly ONE turn after a pawn moves two squares
    if (enPassantTarget.value && enPassantTarget.value.availableForColor) {
      // If the current turn is NOT the color that can capture en passant,
      // it means the player who could have captured en passant already had their turn
      if (enPassantTarget.value.availableForColor !== currentTurn.value) {
        console.log(`Clearing en passant target because ${enPassantTarget.value.availableForColor} had their turn`);
        clearEnPassantTarget();
      } else {
        console.log(`Keeping en passant target available for ${currentTurn.value}`);
      }
    }
  };
  
  /**
   * Sets an en passant target when a pawn moves two squares
   * 
   * @param {Number} row - The row of the pawn after moving
   * @param {Number} col - The column of the pawn
   * @param {String} color - The color of the pawn that moved
   */
  const setEnPassantTarget = (row, col, color) => {
    // For a white pawn moving from row 6 to 4, the en passant target is row 5, col unchanged
    // For a black pawn moving from row 1 to 3, the en passant target is row 2, col unchanged
    const targetRow = color === "White" ? row + 1 : row - 1;
    
    enPassantTarget.value = {
      row: targetRow,
      col: col,
      // En passant is available to the opposite color
      availableForColor: color === "White" ? "Black" : "White"
    };
    console.log(`En passant target set at ${targetRow},${col} for ${enPassantTarget.value.availableForColor}`);
  };
  
  /**
   * Clears the en passant target
   */
  const clearEnPassantTarget = () => {
    enPassantTarget.value = { 
      row: null, 
      col: null, 
      availableForColor: null 
    };
  };

  /**
   * Updates moved pieces tracking (for castling eligibility)
   * 
   * @param {Object} piece - The piece that moved
   * @param {Number} fromRow - Original row
   * @param {Number} fromCol - Original column
   */
  const updateMovedPiecesTracking = (piece, fromRow, fromCol) => {
    if (piece.type === "King") {
      if (piece.color === "White") {
        movedPieces.value.whiteKing = true;
      } else {
        movedPieces.value.blackKing = true;
      }
    } else if (piece.type === "Rook") {
      if (piece.color === "White") {
        if (fromCol === 0) { // a1 rook
          movedPieces.value.whiteRookA = true;
        } else if (fromCol === 7) { // h1 rook
          movedPieces.value.whiteRookH = true;
        }
      } else { // Black rook
        if (fromCol === 0) { // a8 rook
          movedPieces.value.blackRookA = true;
        } else if (fromCol === 7) { // h8 rook
          movedPieces.value.blackRookH = true;
        }
      }
    }
  };

  /**
   * Handles checkmate, including calling the appropriate callback
   * 
   * @param {String} losingColor - The color that is in checkmate
   */
  const handleCheckmate = (losingColor) => {
    const winner = losingColor === "White" ? "Black" : "White";
    console.log(`Checkmate! ${winner} has won the game`);
    
    if (onCheckmate) {
      onCheckmate(winner);
    }
  };
  
  /**
   * Handles stalemate, including calling the appropriate callback
   * 
   * @param {String} stalematedColor - The color that is in stalemate
   */
  const handleStalemate = (stalematedColor) => {
    console.log(`Stalemate! The game is a draw`);
    
    if (onStalemate) {
      onStalemate(stalematedColor);
    }
  };

  /**
   * Takes back the last move made
   * Returns the board to the previous state and updates all relevant game state
   */
  const takeBackMove = () => {
    // Only allow taking back if we have moves in history
    if (moveHistory.value.length > 0) {
      // Remove the last move from history
      const removedMove = moveHistory.value.pop();
      
      // Switch the turn back
      currentTurn.value = currentTurn.value === "White" ? "Black" : "White";
      
      // Reset check status if needed
      if (whiteInCheck.value || blackInCheck.value) {
        whiteInCheck.value = false;
        blackInCheck.value = false;
      }
      
      // If this was a king or rook's first move, restore their unmoved status
      if (removedMove.piece.type === "King") {
        if (removedMove.piece.color === "White" && !movedPieces.value.whiteKing) {
          movedPieces.value.whiteKing = false;
        } else if (removedMove.piece.color === "Black" && !movedPieces.value.blackKing) {
          movedPieces.value.blackKing = false;
        }
      } else if (removedMove.piece.type === "Rook") {
        const { fromCol } = removedMove;
        if (removedMove.piece.color === "White") {
          if (fromCol === 0) movedPieces.value.whiteRookA = false;
          if (fromCol === 7) movedPieces.value.whiteRookH = false;
        } else {
          if (fromCol === 0) movedPieces.value.blackRookA = false;
          if (fromCol === 7) movedPieces.value.blackRookH = false;
        }
      }
      
      // Notify of turn change
      if (onTurnChanged) {
        onTurnChanged(currentTurn.value);
      }
      
      // Notify of move history update
      if (onMoveHistoryUpdated) {
        onMoveHistoryUpdated(moveHistory.value);
      }
      
      console.log("Move taken back:", removedMove);
      return removedMove;
    }
    return null;
  };

  /**
   * Resets the game state to initial values
   */
  const resetGameState = () => {
    // Reset game state tracking
    currentTurn.value = "White";
    moveHistory.value = [];
    whiteInCheck.value = false;
    blackInCheck.value = false;
    
    // Reset moved piece tracking for castling
    movedPieces.value = {
      whiteKing: false,
      whiteRookA: false,
      whiteRookH: false,
      blackKing: false,
      blackRookA: false,
      blackRookH: false
    };
    
    // Clear en passant target
    clearEnPassantTarget();
    
    // Notify of turn reset
    if (onTurnChanged) {
      onTurnChanged(currentTurn.value);
    }
  };

  /**
   * Sets check status for a color
   * 
   * @param {String} color - Color to set check status for ("White" or "Black")
   * @param {Boolean} inCheck - Whether the king is in check
   */
  const setCheckStatus = (color, inCheck) => {
    if (color === "White") {
      whiteInCheck.value = inCheck;
    } else {
      blackInCheck.value = inCheck;
    }
  };

  return {
    // State
    currentTurn,
    moveHistory,
    whiteInCheck,
    blackInCheck,
    movedPieces,
    enPassantTarget,
    
    // Methods
    recordMove,
    switchTurn,
    updateMovedPiecesTracking,
    handleCheckmate,
    handleStalemate,
    resetGameState,
    takeBackMove,
    setCheckStatus,
    setEnPassantTarget,
    clearEnPassantTarget
  };
}
