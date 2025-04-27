/**
 * Composable for handling chess notation and move formatting
 * Provides utilities for converting board positions to chess notation
 * and formatting moves in a standard chess notation format
 */
export default function useChessNotation() {
  /**
   * Convert row and column indices to chess notation (e.g., 0,0 -> A8)
   *
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   * @returns {String} Chess notation (e.g., "E4")
   */
  const toChessNotation = (row, col) => {
    const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
    // Chess notation has row 0 as 8, row 7 as 1
    return `${files[col]}${8 - row}`;
  };

  /**
   * Convert chess notation to row and column indices (e.g., "E4" -> {row: 4, col: 4})
   *
   * @param {String} notation - Chess notation (e.g., "E4")
   * @returns {Object} Position object with row and col properties
   */
  const fromChessNotation = (notation) => {
    const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const file = notation.charAt(0).toUpperCase();
    const rank = parseInt(notation.charAt(1));

    const col = files.indexOf(file);
    const row = 8 - rank;

    return { row, col };
  };

  /**
   * Format a move in standard chess notation
   *
   * @param {Object} move - Move object containing piece, from (string), to (string), etc.
   * @returns {String} Formatted move in chess notation
   */
  const formatMove = (move) => {
    // Handle castling notation
    // Use the boolean flags stored in the move object
    if (move.isCastling) {
      return move.isKingsideCastle ? "O-O" : "O-O-O";
    }

    // Get piece symbol
    let notation = getPieceSymbol(move.piece);

    // Add source square file for pawn captures or disambiguation if needed (simplified for now)
    if (move.piece === "Pawn" && move.isCapture) {
      // For pawn captures, show the starting file
      notation += move.from.charAt(0).toLowerCase(); // Use move.from directly
    } else if (move.piece !== "Pawn") {
      // Basic SAN usually omits the full 'from' square unless needed for disambiguation
      // For simplicity here, we'll omit it for non-pawns unless it's a capture
      // A full SAN generator would need access to the board state to check for ambiguity
      if (move.isCapture) {
        // Could add move.from logic here if needed, but SAN often omits
      }
    }

    // Add capture symbol if applicable
    if (move.isCapture) {
      notation += "x";
    } else if (move.piece === "Pawn") {
      // Skip the piece symbol for simple pawn moves
      notation = "";
    }

    // Add destination square - Use move.to directly
    notation += move.to.toLowerCase();

    // Add promotion notation if applicable
    if (move.isPromotion && move.promotion) {
      // Check move.promotion (full name)
      notation += "=" + getPieceSymbol(move.promotion);
    }

    // Add en passant annotation (optional, but helpful for clarity)
    // The 'x' for capture and destination square are usually enough in SAN
    // if (move.isEnPassant) {
    //   notation += ' e.p.';
    // }

    // Add check or checkmate symbol using boolean flags
    if (move.isCheckmate) {
      notation += "#";
    } else if (move.createsCheck) {
      notation += "+";
    }

    // Return the standard algebraic notation (SAN) from chess.js if available
    // This is often more reliable than reconstructing it manually
    if (move.san) {
      return move.san;
    }

    // Fallback to the manually constructed notation if SAN isn't present (e.g., during PGN load issues)
    console.warn("Using fallback notation formatting for move:", move);
    return notation;
  };

  /**
   * Get the standard symbol for a chess piece
   *
   * @param {String} pieceType - Type of the piece (e.g., "King", "Queen")
   * @returns {String} Symbol for the piece in standard notation
   */
  const getPieceSymbol = (pieceType) => {
    switch (pieceType) {
      case "King":
        return "K";
      case "Queen":
        return "Q";
      case "Rook":
        return "R";
      case "Bishop":
        return "B";
      case "Knight":
        return "N";
      case "Pawn":
        return "";
      default:
        return "";
    }
  };

  /**
   * Group move history by move number (1.e4 e5, 2.Nf3 Nc6, etc.)
   *
   * @param {Array} moveHistory - Array of move objects
   * @returns {Object} Moves grouped by move number with white and black moves
   */
  const groupMovesByNumber = (moveHistory) => {
    const result = {};

    moveHistory.forEach((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const isWhiteMove = move.color === "White";

      if (!result[moveNumber]) {
        result[moveNumber] = { white: null, black: null };
      }

      if (isWhiteMove) {
        result[moveNumber].white = move;
      } else {
        result[moveNumber].black = move;
      }
    });

    return result;
  };

  /**
   * Format the entire move history into standard chess notation (PGN-like)
   *
   * @param {Array} moveHistory - Array of move objects
   * @returns {String} Formatted move history
   */
  const formatMoveHistory = (moveHistory) => {
    const groupedMoves = groupMovesByNumber(moveHistory);
    let result = "";

    for (const moveNumber in groupedMoves) {
      const { white, black } = groupedMoves[moveNumber];

      result += `${moveNumber}.`;

      if (white) {
        result += ` ${formatMove(white)}`;
      }

      if (black) {
        result += ` ${formatMove(black)}`;
      }

      result += " ";
    }

    return result.trim();
  };

  return {
    toChessNotation,
    fromChessNotation,
    formatMove,
    getPieceSymbol,
    groupMovesByNumber,
    formatMoveHistory,
  };
}
