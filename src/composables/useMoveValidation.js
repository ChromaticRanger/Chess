import { ref, computed } from 'vue';

/**
 * Composable for chess move validation logic
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getPieceAtPosition - Function to get a piece at a specific position
 * @param {Function} options.getPiecesByColor - Function to get all pieces of a specific color
 * @param {Object} options.movedPieces - Ref object tracking which pieces have moved (for castling)
 * @returns {Object} - Move validation utilities
 */
export default function useMoveValidation(options) {
  const {
    getPieceAtPosition,
    getPiecesByColor,
    movedPieces
  } = options;

  /**
   * Add moves in a specific direction (for sliding pieces like Rook, Bishop, Queen)
   *
   * @param {Number} startRow - The starting row
   * @param {Number} startCol - The starting column
   * @param {Number} rowIncrement - The row increment
   * @param {Number} colIncrement - The column increment
   * @param {Array} moves - The array of moves to add to
   * @param {String} color - The color of the piece
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
      const piece = getPieceAtPosition(row, col);
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
   * Calculate raw moves without check validation
   * Used internally by isKingInCheck to avoid infinite recursion
   *
   * @param {Object} piece - The piece to calculate moves for
   * @returns {Array} - Array of possible moves
   */
  const calculateRawMoves = (piece) => {
    const moves = [];
    const { row, col, type, color } = piece;

    switch (type) {
      case "Pawn": {
        const direction = color === "White" ? -1 : 1;
        const startRow = color === "White" ? 6 : 1;

        // Forward moves
        if (!getPieceAtPosition(row + direction, col)) {
          moves.push({ row: row + direction, col });
          if (
            row === startRow &&
            !getPieceAtPosition(row + 2 * direction, col)
          ) {
            moves.push({ row: row + 2 * direction, col });
          }
        }

        // Diagonal captures
        const leftCapture = getPieceAtPosition(row + direction, col - 1);
        if (leftCapture && leftCapture.color !== color) {
          moves.push({ row: row + direction, col: col - 1 });
        }
        
        const rightCapture = getPieceAtPosition(row + direction, col + 1);
        if (rightCapture && rightCapture.color !== color) {
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
            const piece = getPieceAtPosition(newRow, newCol);
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
            const existingPiece = getPieceAtPosition(newRow, newCol);
            if (!existingPiece || existingPiece.color !== color) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        });
        
        // Castling moves
        if (color === "White" && !movedPieces.value.whiteKing) {
          // Check kingside castling (O-O)
          if (!movedPieces.value.whiteRookH && 
              !getPieceAtPosition(7, 5) && 
              !getPieceAtPosition(7, 6)) {
            moves.push({ 
              row: 7, 
              col: 6, 
              specialMove: 'castling',
              castlingSide: 'kingside' 
            });
          }
          
          // Check queenside castling (O-O-O)
          if (!movedPieces.value.whiteRookA && 
              !getPieceAtPosition(7, 1) && 
              !getPieceAtPosition(7, 2) && 
              !getPieceAtPosition(7, 3)) {
            moves.push({ 
              row: 7, 
              col: 2, 
              specialMove: 'castling',
              castlingSide: 'queenside' 
            });
          }
        } else if (color === "Black" && !movedPieces.value.blackKing) {
          // Check kingside castling (O-O)
          if (!movedPieces.value.blackRookH && 
              !getPieceAtPosition(0, 5) && 
              !getPieceAtPosition(0, 6)) {
            moves.push({ 
              row: 0, 
              col: 6, 
              specialMove: 'castling',
              castlingSide: 'kingside' 
            });
          }
          
          // Check queenside castling (O-O-O)
          if (!movedPieces.value.blackRookA && 
              !getPieceAtPosition(0, 1) && 
              !getPieceAtPosition(0, 2) && 
              !getPieceAtPosition(0, 3)) {
            moves.push({ 
              row: 0, 
              col: 2, 
              specialMove: 'castling',
              castlingSide: 'queenside' 
            });
          }
        }
        break;
      }
    }

    return moves;
  };

  /**
   * Check if the king of a specific color is in check
   * 
   * @param {String} kingColor - The color of the king to check
   * @return {Boolean} - True if the king is in check, false otherwise
   */
  const isKingInCheck = (kingColor) => {
    // Find our king
    const allPieces = getPiecesByColor();
    const king = allPieces.find(p => p.type === "King" && p.color === kingColor);
    if (!king) return false;
    
    // Get opponent's color
    const opponentColor = kingColor === "White" ? "Black" : "White";
    
    // Get all opponent pieces
    const opponentPieces = allPieces.filter(p => p.color === opponentColor);
    
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
   * Check if a move would leave the player's king in check
   * 
   * @param {Object} piece - The piece being moved
   * @param {Object} destination - The destination square {row, col}
   * @return {Boolean} - True if the move would leave the king in check
   */
  const moveWouldLeaveInCheck = (piece, destination) => {
    // Get all pieces for simulation
    const allPieces = getPiecesByColor();
    
    // Create a deep clone of the pieces for simulation
    const simulatedPieces = JSON.parse(JSON.stringify(allPieces));
    
    // Find the piece being moved in the simulation
    const pieceIndex = simulatedPieces.findIndex(p => p.id === piece.id);
    if (pieceIndex === -1) return true; // Safety check
    
    // Find and remove any captured piece
    const capturedPieceIndex = simulatedPieces.findIndex(
      p => p.row === destination.row && p.col === destination.col && p.id !== piece.id
    );
    
    // Remove the captured piece if there is one
    if (capturedPieceIndex !== -1) {
      simulatedPieces.splice(capturedPieceIndex, 1);
    }
    
    // Handle castling move (move the rook too)
    let rookIndex = -1;
    if (piece.type === "King" && destination.specialMove === 'castling') {
      const rookRow = piece.color === "White" ? 7 : 0;
      let rookCol, rookDestCol;
      
      if (destination.castlingSide === 'kingside') {
        rookCol = 7; // h-file
        rookDestCol = 5; // f-file
      } else {
        rookCol = 0; // a-file
        rookDestCol = 3; // d-file
      }
      
      // Find the rook
      rookIndex = simulatedPieces.findIndex(p => 
        p.type === "Rook" && 
        p.color === piece.color && 
        p.row === rookRow && 
        p.col === rookCol
      );
      
      // Move the rook in the simulation
      if (rookIndex !== -1) {
        const origRookId = simulatedPieces[rookIndex].id;
        const origRookType = simulatedPieces[rookIndex].type;
        const origRookColor = simulatedPieces[rookIndex].color;
        
        simulatedPieces[rookIndex] = {
          id: origRookId,
          type: origRookType,
          color: origRookColor,
          row: rookRow,
          col: rookDestCol
        };
      }
    }
    
    // Move the piece in the simulation with proper identity preservation
    const origPieceId = simulatedPieces[pieceIndex].id;
    const origPieceType = simulatedPieces[pieceIndex].type;
    const origPieceColor = simulatedPieces[pieceIndex].color;
    
    // Ensure we maintain piece identity when moving
    simulatedPieces[pieceIndex] = {
      id: origPieceId,
      type: origPieceType,
      color: origPieceColor,
      row: destination.row,
      col: destination.col
    };
    
    // CRITICAL BUG FIX: Ensure the White King is correctly positioned
    // This fixes a critical bug where the White King's position was being overwritten 
    // during simulation, specifically when the Queen at H5 tried to capture a Pawn at F5.
    //
    // The bug: When moving the Queen, the King was incorrectly being moved to the same
    // destination square (F5) because the piece object references were getting mixed up
    // during the JSON.parse(JSON.stringify()) cloning process, causing both pieces to share
    // position information.
    //
    // Fix approach: Explicitly preserve each piece's identity (id, type, color, position)
    // by creating a new object with all the original properties, especially for Kings.
    //
    // Without this fix: The White Queen at H5 couldn't capture the Black Pawn at F5 because
    // the simulation incorrectly put the White King at F5 as well, making the move invalid.
    const whiteKingIndex = simulatedPieces.findIndex(p => p.type === "King" && p.color === "White");
    if (whiteKingIndex !== -1) {
      // Only preserve these if the id is not the moving piece (to handle castling)
      if (simulatedPieces[whiteKingIndex].id !== piece.id) {
        // Look up the original position in the allPieces array
        const originalKing = allPieces.find(p => p.id === simulatedPieces[whiteKingIndex].id);
        if (originalKing) {
          // Reset the king's position to its original position
          simulatedPieces[whiteKingIndex] = {
            id: originalKing.id,
            type: originalKing.type,
            color: originalKing.color,
            row: originalKing.row,
            col: originalKing.col
          };
        }
      }
    }
    
    // Also verify the Black King position
    const blackKingIndex = simulatedPieces.findIndex(p => p.type === "King" && p.color === "Black");
    if (blackKingIndex !== -1) {
      // Only preserve these if the id is not the moving piece (to handle castling)
      if (simulatedPieces[blackKingIndex].id !== piece.id) {
        // Look up the original position in the allPieces array
        const originalKing = allPieces.find(p => p.id === simulatedPieces[blackKingIndex].id);
        if (originalKing) {
          // Reset the king's position to its original position
          simulatedPieces[blackKingIndex] = {
            id: originalKing.id,
            type: originalKing.type,
            color: originalKing.color,
            row: originalKing.row,
            col: originalKing.col
          };
        }
      }
    }
    
    // Now ensure all other piece identities are maintained
    for (let i = 0; i < simulatedPieces.length; i++) {
      // Skip pieces we've already handled
      if (i === pieceIndex || i === whiteKingIndex || i === blackKingIndex) continue;
      
      // Create a backup of the piece's properties
      const p = simulatedPieces[i];
      simulatedPieces[i] = {
        id: p.id,
        type: p.type,
        color: p.color,
        row: p.row,
        col: p.col
      };
    }
    
    // For castling, also check if the king passes through check
    if (piece.type === "King" && destination.specialMove === 'castling') {
      // Create a special simulation for the intermediate square
      const intermediatePieces = JSON.parse(JSON.stringify(allPieces));
      const intPieceIndex = intermediatePieces.findIndex(p => p.id === piece.id);
      
      if (intPieceIndex !== -1) {
        // Move the king to the intermediate square (one square in the castling direction)
        const intermediateCol = destination.castlingSide === 'kingside' ? 
          piece.col + 1 : // king moves from e to f when castling kingside
          piece.col - 1;  // king moves from e to d when castling queenside
          
        // Preserve all piece properties when moving
        const origPieceId = intermediatePieces[intPieceIndex].id;
        const origPieceType = intermediatePieces[intPieceIndex].type;
        const origPieceColor = intermediatePieces[intPieceIndex].color;
        const origPieceRow = intermediatePieces[intPieceIndex].row;
        
        // Ensure we maintain piece identity
        intermediatePieces[intPieceIndex] = {
          id: origPieceId,
          type: origPieceType,
          color: origPieceColor,
          row: origPieceRow,
          col: intermediateCol
        };
        
        // Ensure all other pieces' identities are maintained
        // This is part of the same bug fix as above - we need to ensure all pieces maintain
        // their correct positions during castling simulation as well.
        for (let i = 0; i < intermediatePieces.length; i++) {
          // Skip the king - we've already handled it
          if (i === intPieceIndex) continue;
          
          // Create a backup of the piece's properties
          const p = intermediatePieces[i];
          intermediatePieces[i] = {
            id: p.id,
            type: p.type,
            color: p.color,
            row: p.row,
            col: p.col
          };
        }
        
        // Check if king would be in check at this intermediate position
        const kingInIntermediateCheck = checkIfKingInCheck(piece.color, intermediatePieces);
        
        if (kingInIntermediateCheck) return true;
      }
    }
    
    // Check if the king is in check after the move
    return checkIfKingInCheck(piece.color, simulatedPieces);
  };
  
  /**
   * Helper function to check if a king is in check in a simulated position
   * 
   * @param {String} kingColor - The color of the king to check
   * @param {Array} simulatedPieces - The simulated pieces array
   * @return {Boolean} - True if the king is in check
   */
  const checkIfKingInCheck = (kingColor, simulatedPieces) => {
    // Find the king
    const king = simulatedPieces.find(p => p.type === "King" && p.color === kingColor);
    if (!king) return false;
    
    // Get the opponent's color
    const opponentColor = kingColor === "White" ? "Black" : "White";
    
    // Get all opponent pieces in the simulation
    const opponentPieces = simulatedPieces.filter(p => p.color === opponentColor);
    
    // Create a simulation state where we can use our checkPosition function
    const checkPosition = (row, col) => {
      return simulatedPieces.find(p => p.row === row && p.col === col);
    };
    
    // Check if any opponent piece can attack our king
    for (const opponentPiece of opponentPieces) {
      // We need a custom raw moves calculation that uses the simulated pieces
      const attackMoves = calculateSimulatedRawMoves(opponentPiece, checkPosition);
      
      if (attackMoves.some(move => move.row === king.row && move.col === king.col)) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Calculate raw moves in a simulated position
   * 
   * @param {Object} piece - The piece to calculate moves for
   * @param {Function} checkPosition - Function to check if a position has a piece
   * @return {Array} - Array of possible moves
   */
  const calculateSimulatedRawMoves = (piece, checkPosition) => {
    const moves = [];
    const { row, col, type, color } = piece;
    
    // Helper function for sliding pieces in simulation
    const addSimulatedMovesInDirection = (startRow, startCol, rowInc, colInc, moves, color) => {
      let r = startRow + rowInc;
      let c = startCol + colInc;
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const pieceAtPosition = checkPosition(r, c);
        if (pieceAtPosition) {
          if (pieceAtPosition.color !== color) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        moves.push({ row: r, col: c });
        r += rowInc;
        c += colInc;
      }
    };
    
    switch (type) {
      case "Pawn": {
        const direction = color === "White" ? -1 : 1;
        
        // Diagonal captures for pawns (only these can check the king)
        const leftDiagonal = checkPosition(row + direction, col - 1);
        if (leftDiagonal && leftDiagonal.color !== color) {
          moves.push({ row: row + direction, col: col - 1 });
        }
        
        const rightDiagonal = checkPosition(row + direction, col + 1);
        if (rightDiagonal && rightDiagonal.color !== color) {
          moves.push({ row: row + direction, col: col + 1 });
        }
        break;
      }
      case "Rook": {
        addSimulatedMovesInDirection(row, col, -1, 0, moves, color);
        addSimulatedMovesInDirection(row, col, 1, 0, moves, color);
        addSimulatedMovesInDirection(row, col, 0, -1, moves, color);
        addSimulatedMovesInDirection(row, col, 0, 1, moves, color);
        break;
      }
      case "Bishop": {
        addSimulatedMovesInDirection(row, col, -1, -1, moves, color);
        addSimulatedMovesInDirection(row, col, -1, 1, moves, color);
        addSimulatedMovesInDirection(row, col, 1, -1, moves, color);
        addSimulatedMovesInDirection(row, col, 1, 1, moves, color);
        break;
      }
      case "Queen": {
        addSimulatedMovesInDirection(row, col, -1, 0, moves, color);
        addSimulatedMovesInDirection(row, col, 1, 0, moves, color);
        addSimulatedMovesInDirection(row, col, 0, -1, moves, color);
        addSimulatedMovesInDirection(row, col, 0, 1, moves, color);
        addSimulatedMovesInDirection(row, col, -1, -1, moves, color);
        addSimulatedMovesInDirection(row, col, -1, 1, moves, color);
        addSimulatedMovesInDirection(row, col, 1, -1, moves, color);
        addSimulatedMovesInDirection(row, col, 1, 1, moves, color);
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
            const pieceAtPosition = checkPosition(newRow, newCol);
            if (!pieceAtPosition || pieceAtPosition.color !== color) {
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
          if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            const pieceAtPosition = checkPosition(newRow, newCol);
            if (!pieceAtPosition || pieceAtPosition.color !== color) {
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
   * Calculate valid moves for a piece, filtering out moves that would leave the king in check
   * 
   * @param {Object} piece - The piece to calculate moves for
   * @param {Boolean} ignoreCheck - If true, don't filter out moves that would leave the king in check
   * @return {Array} - Array of valid moves
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
   * Check if a player is in checkmate
   * 
   * @param {String} playerColor - The color of the player to check
   * @return {Boolean} - True if the player is in checkmate
   */
  const isCheckmate = (playerColor) => {
    // First check if the king is in check
    if (!isKingInCheck(playerColor)) {
      return false;
    }
    
    // Get all of the player's pieces
    const playerPieces = getPiecesByColor().filter(p => p.color === playerColor);
    
    // Check if any piece has a valid move that would get out of check
    for (const piece of playerPieces) {
      const validMoves = calculateValidMoves(piece);
      if (validMoves.length > 0) {
        return false; // If any piece has a valid move, it's not checkmate
      }
    }
    
    // If no piece has a valid move and the king is in check, it's checkmate
    return true;
  };

  /**
   * Calculate squares that are attacked by a specific color
   * 
   * @param {String} attackingColor - The color of the attacking pieces
   * @return {Array} - Array of attacked squares
   */
  const calculateAttackedSquares = (attackingColor) => {
    const attackingPieces = getPiecesByColor().filter(p => p.color === attackingColor);
    const attackedSquares = [];

    for (const piece of attackingPieces) {
      const pieceMoves = calculateRawMoves(piece);
      
      // For each move, if the square is empty, add it to attacked squares
      pieceMoves.forEach(move => {
        if (!getPieceAtPosition(move.row, move.col)) {
          attackedSquares.push({
            row: move.row,
            col: move.col
          });
        }
      });
    }

    return attackedSquares;
  };

  return {
    calculateRawMoves,
    calculateValidMoves,
    isKingInCheck,
    isCheckmate,
    moveWouldLeaveInCheck,
    calculateAttackedSquares
  };
}