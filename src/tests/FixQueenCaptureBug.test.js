import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import useMoveValidation from '../composables/useMoveValidation';

describe('Fixing Queen Capture Bug', () => {
  // Create a specific board setup to isolate the issue - a clear case where the capture should be valid
  const createTestBoard = () => [
    // White pieces
    { id: 'wk', type: 'King', color: 'White', row: 7, col: 4 },  // King on e1
    { id: 'wq', type: 'Queen', color: 'White', row: 3, col: 3 }, // Queen on d5
    { id: 'wp', type: 'Pawn', color: 'White', row: 7, col: 1 },  // Pawn blocking rook's attack
    
    // Black pieces
    { id: 'bk', type: 'King', color: 'Black', row: 0, col: 4 },  // King on e8 
    { id: 'bb', type: 'Bishop', color: 'Black', row: 2, col: 2 }, // Bishop on c6
    { id: 'br', type: 'Rook', color: 'Black', row: 7, col: 0 },  // Rook on a1 - blocked by white pawn
  ];

  let pieces;
  let moveValidator;
  let movedPieces;
  
  beforeEach(() => {
    pieces = createTestBoard();
    movedPieces = ref({
      whiteKing: false,
      blackKing: false,
      whiteRookA: false,
      whiteRookH: false,
      blackRookA: false,
      blackRookH: false
    });

    // Create helper functions for the move validator
    const getPieceAtPosition = (row, col) => {
      return pieces.find(p => p.row === row && p.col === col);
    };

    const getPiecesByColor = () => pieces;

    // Initialize the move validator
    moveValidator = useMoveValidation({
      getPieceAtPosition,
      getPiecesByColor,
      movedPieces
    });
  });
  
  describe('Testing the bug fix', () => {
    it('should show the bug: Queen cannot capture Bishop due to incorrect check detection', () => {
      // Verify the bug exists - Queen's capture of Bishop should be valid
      const queen = pieces.find(p => p.id === 'wq');
      const validMoves = moveValidator.calculateValidMoves(queen);
      
      // This should include the Bishop capture but currently doesn't due to the bug
      const captureMove = validMoves.find(move => move.row === 2 && move.col === 2);
      
      // Debug the issue
      console.log('Debugging the bug:');
      
      // Check if capturing the bishop would leave the king in check according to current logic
      const leavesInCheck = moveValidator.moveWouldLeaveInCheck(queen, { row: 2, col: 2 });
      console.log('Current implementation says capturing bishop leaves king in check:', leavesInCheck);
      
      // Simulate the capture
      const simulatedPieces = JSON.parse(JSON.stringify(pieces));
      
      // Remove the bishop
      const bishopIndex = simulatedPieces.findIndex(p => p.id === 'bb');
      if (bishopIndex !== -1) simulatedPieces.splice(bishopIndex, 1);
      
      // Move the queen
      const queenIndex = simulatedPieces.findIndex(p => p.id === 'wq');
      if (queenIndex !== -1) {
        simulatedPieces[queenIndex].row = 2;
        simulatedPieces[queenIndex].col = 2;
      }
      
      // Verify this state with direct calculation
      // We're going to manually check if the rook can attack the king after the move
      const king = simulatedPieces.find(p => p.id === 'wk');
      const rook = simulatedPieces.find(p => p.id === 'br');
      
      console.log('After capture, King at:', `(${king.row},${king.col})`);
      console.log('After capture, Rook at:', `(${rook.row},${rook.col})`);
      
      // Can the rook attack the king?
      const rookCanAttackKing = rook.row === king.row || rook.col === king.col;
      // Is there any piece between the rook and king?
      let pieceInBetween = false;
      
      if (rook.row === king.row) {
        // Check horizontally
        const minCol = Math.min(rook.col, king.col);
        const maxCol = Math.max(rook.col, king.col);
        for (let col = minCol + 1; col < maxCol; col++) {
          if (simulatedPieces.some(p => p.row === rook.row && p.col === col)) {
            pieceInBetween = true;
            break;
          }
        }
      } else if (rook.col === king.col) {
        // Check vertically
        const minRow = Math.min(rook.row, king.row);
        const maxRow = Math.max(rook.row, king.row);
        for (let row = minRow + 1; row < maxRow; row++) {
          if (simulatedPieces.some(p => p.row === row && p.col === rook.col)) {
            pieceInBetween = true;
            break;
          }
        }
      }
      
      const rookActuallyChecksKing = rookCanAttackKing && !pieceInBetween;
      console.log('Rook can attack king:', rookCanAttackKing);
      console.log('Piece in between:', pieceInBetween);
      console.log('Rook should actually check king:', rookActuallyChecksKing);
      
      // The bug has been fixed! 
      // Queen should be able to capture the Bishop as there is a piece
      // blocking the Rook's attack on the White King
      expect(captureMove).toBeDefined();
      // Verify the capture move matches the Bishop's position
      expect(captureMove).toEqual({ row: 2, col: 2 });
    });
  });
});