import { ref, computed } from 'vue';

/**
 * A composable for chess check detection logic
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getPieceAtPosition - Function to get a piece at a position
 * @param {Function} options.getPiecesByColor - Function to get all pieces of a color
 * @param {Function} options.calculateRawMoves - Function to calculate raw moves for a piece 
 * @param {Object} options.gameState - Reference to the game state
 * @returns {Object} Check detection utilities
 */
export default function useCheckDetection(options) {
  const {
    getPieceAtPosition,
    getPiecesByColor,
    calculateRawMoves,
    gameState
  } = options;
  
  /**
   * Determines if a king of the specified color is in check
   * 
   * @param {String} kingColor - Color of the king to check ("White" or "Black")
   * @returns {Boolean} - True if the king is in check
   */
  const isKingInCheck = (kingColor) => {
    // Find the king
    const allPieces = getPiecesByColor();
    const king = allPieces.find(p => p.type === "King" && p.color === kingColor);
    
    if (!king) return false;
    
    // Get opponent color
    const opponentColor = kingColor === "White" ? "Black" : "White";
    
    // Get all opponent pieces
    const opponentPieces = allPieces.filter(p => p.color === opponentColor);
    
    // Check if any opponent piece can attack the king
    for (const piece of opponentPieces) {
      const attackMoves = calculateRawMoves(piece);
      if (attackMoves.some(move => move.row === king.row && move.col === king.col)) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Checks if a checkmate condition exists for a player
   * 
   * @param {String} playerColor - Color to check for checkmate
   * @param {Function} calculateValidMoves - Function to get valid moves for a piece
   * @returns {Boolean} - True if the player is in checkmate
   */
  const isCheckmate = (playerColor, calculateValidMoves) => {
    // First check if the king is in check
    if (!isKingInCheck(playerColor)) {
      return false;
    }
    
    // Get all pieces for the player
    const playerPieces = getPiecesByColor().filter(p => p.color === playerColor);
    
    // Check if any piece has a valid move that would get out of check
    let hasValidMove = false;
    for (const piece of playerPieces) {
      // If we find any valid move, we can exit early
      const validMoves = calculateValidMoves(piece);
      if (validMoves && validMoves.length > 0) {
        hasValidMove = true;
        break;
      }
    }
    
    // If no piece has a valid move and the king is in check, it's checkmate
    return !hasValidMove;
  };
  
  /**
   * Checks if a position is stalemate for a player
   * 
   * @param {String} playerColor - Color to check for stalemate
   * @param {Function} calculateValidMoves - Function to get valid moves for a piece
   * @returns {Boolean} - True if the position is stalemate
   */
  const isStalemate = (playerColor, calculateValidMoves) => {
    // First check if the king is NOT in check
    if (isKingInCheck(playerColor)) {
      return false;
    }
    
    // Get all pieces for the player
    const playerPieces = getPiecesByColor().filter(p => p.color === playerColor);
    
    // Check if any piece has a valid move
    let hasValidMove = false;
    for (const piece of playerPieces) {
      // If we find any valid move, we can exit early
      const validMoves = calculateValidMoves(piece);
      if (validMoves && validMoves.length > 0) {
        hasValidMove = true;
        break;
      }
    }
    
    // If no piece has a valid move and the king is not in check, it's stalemate
    return !hasValidMove;
  };
  
  /**
   * Updates check status after a piece move
   * 
   * @param {Object} movingPiece - The piece that was just moved
   * @returns {Boolean} - True if check was created
   */
  const updateCheckStatus = (movingPiece) => {
    // Reset check status
    gameState.setCheckStatus("White", false);
    gameState.setCheckStatus("Black", false);
    
    // Get opponent color
    const opponentColor = movingPiece.color === "White" ? "Black" : "White";
    
    // Check if opponent's king is now in check
    const inCheck = isKingInCheck(opponentColor);
    
    if (inCheck) {
      gameState.setCheckStatus(opponentColor, true);
    }
    
    return inCheck;
  };
  
  /**
   * Get attacking pieces that are checking the king
   * 
   * @param {String} kingColor - Color of the king
   * @returns {Array} - Array of pieces that are checking the king
   */
  const getCheckingPieces = (kingColor) => {
    // Find the king
    const allPieces = getPiecesByColor();
    const king = allPieces.find(p => p.type === "King" && p.color === kingColor);
    
    if (!king) return [];
    
    // Get opponent color
    const opponentColor = kingColor === "White" ? "Black" : "White";
    
    // Get all opponent pieces
    const opponentPieces = allPieces.filter(p => p.color === opponentColor);
    
    // Find pieces that are checking the king
    const checkingPieces = [];
    
    for (const piece of opponentPieces) {
      const attackMoves = calculateRawMoves(piece);
      if (attackMoves.some(move => move.row === king.row && move.col === king.col)) {
        checkingPieces.push(piece);
      }
    }
    
    return checkingPieces;
  };
  
  /**
   * Calculate squares between a checking piece and the king
   * This is used to determine squares that can be blocked to get out of check
   * 
   * @param {Object} checkingPiece - The piece that is checking the king
   * @param {Object} king - The king that is in check
   * @returns {Array} - Array of positions between the checking piece and king
   */
  const getSquaresBetweenCheckingPieceAndKing = (checkingPiece, king) => {
    const squares = [];
    
    // Only sliding pieces (queen, rook, bishop) can have squares between
    if (!["Queen", "Rook", "Bishop"].includes(checkingPiece.type)) {
      return squares;
    }
    
    const { row: checkRow, col: checkCol } = checkingPiece;
    const { row: kingRow, col: kingCol } = king;
    
    // Determine direction
    const rowDir = kingRow > checkRow ? 1 : kingRow < checkRow ? -1 : 0;
    const colDir = kingCol > checkCol ? 1 : kingCol < checkCol ? -1 : 0;
    
    // For Queen, Rook, and Bishop, collect squares in between
    let r = checkRow + rowDir;
    let c = checkCol + colDir;
    
    while (r !== kingRow || c !== kingCol) {
      squares.push({ row: r, col: c });
      r += rowDir;
      c += colDir;
    }
    
    return squares;
  };
  
  return {
    isKingInCheck,
    isCheckmate,
    isStalemate,
    updateCheckStatus,
    getCheckingPieces,
    getSquaresBetweenCheckingPieceAndKing
  };
}