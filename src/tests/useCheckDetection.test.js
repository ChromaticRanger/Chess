import { describe, it, expect, beforeEach } from 'vitest';
import useCheckDetection from '../composables/useCheckDetection';

describe('useCheckDetection', () => {
  let checkDetection;
  let pieces = [];
  let gameState;
  
  // Mock functions
  const getPieceAtPosition = (row, col) => {
    return pieces.find(p => p.row === row && p.col === col) || null;
  };
  
  const getPiecesByColor = () => pieces;
  
  // Setup test board positions
  beforeEach(() => {
    // Reset game state
    gameState = {
      setCheckStatus: (color, status) => {
        if (color === 'White') {
          gameState.whiteInCheck = status;
        } else {
          gameState.blackInCheck = status;
        }
      },
      whiteInCheck: false,
      blackInCheck: false
    };
    
    // Mock implementation of calculateRawMoves
    const calculateRawMoves = (piece) => {
      const moves = [];
      const { row, col, type, color } = piece;
      
      const addMovesInDirection = (startRow, startCol, rowInc, colInc) => {
        let r = startRow + rowInc;
        let c = startCol + colInc;
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const pieceAtPosition = getPieceAtPosition(r, c);
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
        case 'Pawn': {
          const direction = color === 'White' ? -1 : 1;
          
          // Forward moves (not needed for check detection)
          if (!getPieceAtPosition(row + direction, col)) {
            moves.push({ row: row + direction, col });
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
        case 'Rook': {
          addMovesInDirection(row, col, -1, 0); // Up
          addMovesInDirection(row, col, 1, 0);  // Down
          addMovesInDirection(row, col, 0, -1); // Left
          addMovesInDirection(row, col, 0, 1);  // Right
          break;
        }
        case 'Knight': {
          const knightMoves = [
            { row: -2, col: -1 }, { row: -2, col: 1 },
            { row: -1, col: -2 }, { row: -1, col: 2 },
            { row: 1, col: -2 }, { row: 1, col: 2 },
            { row: 2, col: -1 }, { row: 2, col: 1 }
          ];
          
          knightMoves.forEach(move => {
            const newRow = row + move.row;
            const newCol = col + move.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const pieceAtPosition = getPieceAtPosition(newRow, newCol);
              if (!pieceAtPosition || pieceAtPosition.color !== color) {
                moves.push({ row: newRow, col: newCol });
              }
            }
          });
          break;
        }
        case 'Bishop': {
          addMovesInDirection(row, col, -1, -1); // Up-left
          addMovesInDirection(row, col, -1, 1);  // Up-right
          addMovesInDirection(row, col, 1, -1);  // Down-left
          addMovesInDirection(row, col, 1, 1);   // Down-right
          break;
        }
        case 'Queen': {
          // Combines Rook and Bishop moves
          addMovesInDirection(row, col, -1, 0);  // Up
          addMovesInDirection(row, col, 1, 0);   // Down
          addMovesInDirection(row, col, 0, -1);  // Left
          addMovesInDirection(row, col, 0, 1);   // Right
          addMovesInDirection(row, col, -1, -1); // Up-left
          addMovesInDirection(row, col, -1, 1);  // Up-right
          addMovesInDirection(row, col, 1, -1);  // Down-left
          addMovesInDirection(row, col, 1, 1);   // Down-right
          break;
        }
        case 'King': {
          const kingMoves = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
          ];
          
          kingMoves.forEach(move => {
            const newRow = row + move.row;
            const newCol = col + move.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
              const pieceAtPosition = getPieceAtPosition(newRow, newCol);
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
    
    // Initialize the checkDetection composable with our mocks
    checkDetection = useCheckDetection({
      getPieceAtPosition,
      getPiecesByColor,
      calculateRawMoves,
      gameState
    });
  });
  
  describe('isKingInCheck', () => {
    it('should detect direct check by a rook', () => {
      // Set up board with White King at E1 and Black Rook at E8
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 4 }  // Black Rook at E8
      ];
      
      // Simulate empty board between them
      expect(checkDetection.isKingInCheck('White')).toBe(true);
      expect(checkDetection.isKingInCheck('Black')).toBe(false);
    });
    
    it('should detect direct check by a bishop', () => {
      // Set up board with White King at E1 and Black Bishop at H4 (diagonal check)
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Bishop', color: 'Black', row: 4, col: 7 }  // Black Bishop at H4
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(true);
    });
    
    it('should detect direct check by a knight', () => {
      // Set up board with White King at E1 and Black Knight at F3
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Knight', color: 'Black', row: 5, col: 5 }  // Black Knight at F3
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(true);
    });
    
    it('should detect direct check by a queen', () => {
      // Set up board with White King at E1 and Black Queen at A5 (diagonal check)
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Queen', color: 'Black', row: 3, col: 0 }  // Black Queen at A5
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(true);
    });
    
    it('should detect direct check by a pawn', () => {
      // Set up board with White King at E1 and Black Pawn at F2
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Pawn', color: 'Black', row: 6, col: 5 }  // Black Pawn at F2
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(true);
    });
    
    it('should not detect check if there is a piece blocking', () => {
      // Set up board with White King at E1, Black Rook at E8, and White Knight blocking at E2
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 4 }, // Black Rook at E8
        { id: 3, type: 'Knight', color: 'White', row: 6, col: 4 } // White Knight at E2
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(false);
    });
    
    it('should not detect check for the wrong color king', () => {
      // Set up board with Black King at E8 under attack, but we check White King
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'King', color: 'Black', row: 0, col: 4 }, // Black King at E8
        { id: 3, type: 'Rook', color: 'White', row: 0, col: 0 }  // White Rook at A8
      ];
      
      expect(checkDetection.isKingInCheck('White')).toBe(false);
      expect(checkDetection.isKingInCheck('Black')).toBe(true);
    });
  });
  
  describe('updateCheckStatus', () => {
    it('should update game state correctly when check is detected', () => {
      // Set up board with White King at E1 and Black Rook at E8
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 4 }  // Black Rook at E8
      ];
      
      // Simulate Black just moved the rook to create check
      const result = checkDetection.updateCheckStatus(pieces[1]);
      
      expect(result).toBe(true);
      expect(gameState.whiteInCheck).toBe(true);
      expect(gameState.blackInCheck).toBe(false);
    });
    
    it('should return false when no check is created', () => {
      // Set up board with White King at E1 and Black Rook at A8 (not checking)
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 0 }  // Black Rook at A8
      ];
      
      // Simulate Black just moved the rook
      const result = checkDetection.updateCheckStatus(pieces[1]);
      
      expect(result).toBe(false);
      expect(gameState.whiteInCheck).toBe(false);
      expect(gameState.blackInCheck).toBe(false);
    });
  });
  
  describe('getCheckingPieces', () => {
    it('should return all pieces checking the king', () => {
      // Set up board with White King at E1 under check from two pieces
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 7, col: 0 }, // Black Rook at A1
        { id: 3, type: 'Knight', color: 'Black', row: 5, col: 5 } // Black Knight at F3
      ];
      
      const checkingPieces = checkDetection.getCheckingPieces('White');
      
      expect(checkingPieces.length).toBe(2);
      expect(checkingPieces).toContainEqual(pieces[1]);
      expect(checkingPieces).toContainEqual(pieces[2]);
    });
    
    it('should return an empty array if king is not in check', () => {
      // Set up board with White King at E1 not in check
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 0 } // Black Rook at A8
      ];
      
      const checkingPieces = checkDetection.getCheckingPieces('White');
      
      expect(checkingPieces.length).toBe(0);
    });
  });
  
  describe('getSquaresBetweenCheckingPieceAndKing', () => {
    it('should return squares between a rook and king', () => {
      const king = { id: 1, type: 'King', color: 'White', row: 7, col: 4 }; // E1
      const rook = { id: 2, type: 'Rook', color: 'Black', row: 3, col: 4 }; // E5
      
      const squares = checkDetection.getSquaresBetweenCheckingPieceAndKing(rook, king);
      
      expect(squares.length).toBe(3);
      expect(squares).toContainEqual({ row: 4, col: 4 }); // E4
      expect(squares).toContainEqual({ row: 5, col: 4 }); // E3
      expect(squares).toContainEqual({ row: 6, col: 4 }); // E2
    });
    
    it('should return squares between a bishop and king', () => {
      const king = { id: 1, type: 'King', color: 'White', row: 7, col: 4 }; // E1
      const bishop = { id: 2, type: 'Bishop', color: 'Black', row: 5, col: 2 }; // C3
      
      const squares = checkDetection.getSquaresBetweenCheckingPieceAndKing(bishop, king);
      
      expect(squares.length).toBe(1);
      expect(squares).toContainEqual({ row: 6, col: 3 }); // D2
    });
    
    it('should return an empty array for a knight (no squares between)', () => {
      const king = { id: 1, type: 'King', color: 'White', row: 7, col: 4 }; // E1
      const knight = { id: 2, type: 'Knight', color: 'Black', row: 5, col: 5 }; // F3
      
      const squares = checkDetection.getSquaresBetweenCheckingPieceAndKing(knight, king);
      
      expect(squares.length).toBe(0);
    });
  });
  
  describe('isCheckmate', () => {
    it('should detect a basic back-rank checkmate', () => {
      // The test is failing because the position is not actually a checkmate - the vertical check
      // is blocked by the pawn at E2. Let's set up a proper checkmate with a horizontal Rook check.
      
      // Set up a horizontal back-rank mate position
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 7, col: 0 }, // Black Rook at A1 checking horizontally
        { id: 3, type: 'Pawn', color: 'White', row: 6, col: 3 }, // White pawn at D2
        { id: 4, type: 'Pawn', color: 'White', row: 6, col: 4 }, // White pawn at E2
        { id: 5, type: 'Pawn', color: 'White', row: 6, col: 5 }, // White pawn at F2
      ];
      
      // Debug to show that this position is check
      const whiteKing = pieces.find(p => p.type === 'King' && p.color === 'White');
      const blackRook = pieces.find(p => p.type === 'Rook' && p.color === 'Black');
      
      // Verify the king is in check
      const kingInCheck = pieces.find(p => p.type === 'King' && p.color === 'White');
      
      // Mock calculateValidMoves to return no valid moves for any piece
      const calculateValidMoves = (piece) => {
        // Ensure we're checking valid moves for the right pieces
        expect(piece.color).toBe('White');
        return []; // No valid moves for any piece
      };
      
      // With our mock returning no valid moves, and the king in check, it should be checkmate
      expect(checkDetection.isCheckmate('White', calculateValidMoves)).toBe(true);
    });
    
    it('should return false if king is in check but has escape', () => {
      // Set up position with king in check but able to move
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 4 }, // Black Rook at E8
      ];
      
      // Mock calculateValidMoves to return valid king move
      const calculateValidMoves = (piece) => {
        // Ensure we're checking the right piece
        expect(piece.color).toBe('White');
        // King has a move, pawns don't
        return piece.type === 'King' ? [{ row: 7, col: 3 }] : []; // King can move to D1
      };
      
      expect(checkDetection.isCheckmate('White', calculateValidMoves)).toBe(false);
    });
    
    it('should return false if not in check', () => {
      // Set up position with king not in check
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 0, col: 0 }, // Black Rook at A8
      ];
      
      const calculateValidMoves = (piece) => {
        // Even with no valid moves, if not in check it's not checkmate
        expect(piece.color).toBe('White');
        return []; // No valid moves for any piece
      };
      
      expect(checkDetection.isCheckmate('White', calculateValidMoves)).toBe(false);
    });
  });
  
  describe('isStalemate', () => {
    it('should detect a basic stalemate', () => {
      // Set up a stalemate position for white
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 0 }, // White King at A1
        { id: 2, type: 'Queen', color: 'Black', row: 5, col: 1 }, // Black Queen at B3
      ];
      
      // Mock calculateValidMoves to return no valid moves for any piece
      const calculateValidMoves = (piece) => {
        expect(piece.color).toBe('White');
        return []; // No valid moves for any piece
      };
      
      expect(checkDetection.isStalemate('White', calculateValidMoves)).toBe(true);
    });
    
    it('should return false if king is in check', () => {
      // Set up position with king in check
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
        { id: 2, type: 'Rook', color: 'Black', row: 7, col: 0 }, // Black Rook at A1
      ];
      
      const calculateValidMoves = (piece) => {
        expect(piece.color).toBe('White');
        return []; // No valid moves for any piece
      };
      
      expect(checkDetection.isStalemate('White', calculateValidMoves)).toBe(false);
    });
    
    it('should return false if king has valid moves', () => {
      // Set up position where king can move
      pieces = [
        { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
      ];
      
      // Mock calculateValidMoves to return valid king move
      const calculateValidMoves = (piece) => {
        expect(piece.color).toBe('White');
        expect(piece.type).toBe('King');
        return [{ row: 6, col: 4 }]; // King can move to E2
      };
      
      expect(checkDetection.isStalemate('White', calculateValidMoves)).toBe(false);
    });
  });
});