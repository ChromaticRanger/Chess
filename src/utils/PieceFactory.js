/**
 * PieceFactory.js
 * A utility service for managing chess piece creation and image loading.
 */

/**
 * Maps piece types to their asset file codes
 * @type {Object}
 */
const PIECE_TYPE_MAP = {
  'Pawn': 'P',
  'Rook': 'R',
  'Knight': 'Kn',
  'Bishop': 'B',
  'Queen': 'Q',
  'King': 'K'
};

/**
 * Gets the image path for a chess piece
 * 
 * @param {String} pieceType - The type of piece (Pawn, Rook, Knight, Bishop, Queen, King)
 * @param {String} color - The color of the piece (White or Black)
 * @returns {String} - Path to the piece image
 */
export const getPieceImagePath = (pieceType, color) => {
  if (!PIECE_TYPE_MAP[pieceType]) {
    throw new Error(`Invalid piece type: ${pieceType}. Valid types are: ${Object.keys(PIECE_TYPE_MAP).join(', ')}`);
  }
  
  if (!['White', 'Black'].includes(color)) {
    throw new Error(`Invalid piece color: ${color}. Valid colors are: White, Black`);
  }

  const pieceCode = PIECE_TYPE_MAP[pieceType];
  const colorCode = color.charAt(0).toUpperCase();
  
  return `src/assets/${pieceCode}_${colorCode}.svg`;
};

/**
 * Creates a chess piece object with appropriate attributes
 * 
 * @param {Number} id - Unique identifier for the piece
 * @param {String} type - The type of piece (Pawn, Rook, Knight, Bishop, Queen, King)
 * @param {String} color - The color of the piece (White or Black)
 * @param {Number} row - The row position on the board (0-7)
 * @param {Number} col - The column position on the board (0-7)
 * @returns {Object} - A piece object
 */
export const createPiece = (id, type, color, row, col) => {
  const imagePath = getPieceImagePath(type, color);
  
  return {
    id,
    type,
    color,
    image: imagePath,
    row,
    col
  };
};

/**
 * Creates a complete set of chess pieces for a given color
 * 
 * @param {String} color - The color of the pieces (White or Black)
 * @param {Number} startId - The starting ID for the pieces
 * @returns {Array} - Array of piece objects
 */
export const createPieceSet = (color, startId = 0) => {
  const isWhite = color === 'White';
  const backRank = isWhite ? 7 : 0;
  const pawnRank = isWhite ? 6 : 1;
  const pieces = [];
  
  // Create back rank pieces
  const backRankPieces = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook'];
  
  backRankPieces.forEach((type, col) => {
    pieces.push(createPiece(startId + col, type, color, backRank, col));
  });
  
  // Create pawns
  for (let col = 0; col < 8; col++) {
    pieces.push(createPiece(startId + 8 + col, 'Pawn', color, pawnRank, col));
  }
  
  return pieces;
};

/**
 * Creates a complete chess set with both white and black pieces
 * 
 * @returns {Array} - Array of all chess pieces
 */
export const createFullChessSet = () => {
  const blackPieces = createPieceSet('Black', 0);
  const whitePieces = createPieceSet('White', 16);
  
  return [...blackPieces, ...whitePieces];
};

export default {
  getPieceImagePath,
  createPiece,
  createPieceSet,
  createFullChessSet
};