import { ref, computed } from 'vue';
import { createFullChessSet } from '../utils/PieceFactory';

/**
 * Manages chess pieces, their creation, movement, and capture
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Piece management state and methods
 */
export default function usePieceManagement() {
  // Initial pieces configuration from PieceFactory
  const initialPieces = createFullChessSet();

  // Current pieces on the board
  const pieces = ref(JSON.parse(JSON.stringify(initialPieces)));

  /**
   * Resets pieces to their initial positions
   */
  const resetPieces = () => {
    pieces.value = JSON.parse(JSON.stringify(initialPieces));
  };

  /**
   * Checks if a piece exists at the specified position
   * 
   * @param {Number} row - Row index
   * @param {Number} col - Column index
   * @returns {Object|null} - The piece at the position or null if empty
   */
  const getPieceAtPosition = (row, col) => {
    return pieces.value.find((p) => p.row === row && p.col === col) || null;
  };

  /**
   * Remove a piece from the board
   * 
   * @param {Object} piece - The piece to remove
   * @returns {Object} - The captured piece
   */
  const capturePiece = (piece) => {
    const index = pieces.value.findIndex((p) => p.id === piece.id);
    if (index !== -1) {
      const capturedPiece = {...pieces.value[index]};
      pieces.value.splice(index, 1);
      return capturedPiece;
    }
    return null;
  };

  /**
   * Move a piece to a new position
   * 
   * @param {Object} piece - The piece to move
   * @param {Number} row - Destination row
   * @param {Number} col - Destination column
   * @returns {Object} - Information about the move
   */
  const movePiece = (piece, row, col) => {
    const index = pieces.value.findIndex((p) => p.id === piece.id);
    if (index !== -1) {
      // Store original position before updating
      const fromRow = piece.row;
      const fromCol = piece.col;
      
      // Update piece position
      pieces.value[index].row = row;
      pieces.value[index].col = col;
      
      return {
        piece: pieces.value[index],
        fromRow,
        fromCol
      };
    }
    return null;
  };

  /**
   * Get all pieces of a specific color
   * 
   * @param {String} color - The color to filter by ("White" or "Black")
   * @returns {Array} - Array of pieces matching the color
   */
  const getPiecesByColor = (color) => {
    return pieces.value.filter((p) => p.color === color);
  };

  /**
   * Find a specific piece type by color
   * 
   * @param {String} type - The piece type (King, Queen, etc.)
   * @param {String} color - The piece color
   * @returns {Object|null} - The matching piece or null
   */
  const findPiece = (type, color) => {
    return pieces.value.find((p) => p.type === type && p.color === color) || null;
  };

  return {
    pieces,
    initialPieces,
    resetPieces,
    getPieceAtPosition,
    capturePiece,
    movePiece,
    getPiecesByColor,
    findPiece
  };
}