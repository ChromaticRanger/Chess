import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import useMoveValidation from '../composables/useMoveValidation';

describe('useMoveValidation', () => {
  // Define test pieces
  const createTestPieces = () => [
    { id: 'wk', type: 'King', color: 'White', row: 7, col: 4 },
    { id: 'wq', type: 'Queen', color: 'White', row: 7, col: 3 },
    { id: 'bk', type: 'King', color: 'Black', row: 0, col: 4 },
    // Place the black pawn along one of the Queen's diagonal move paths
    { id: 'bp1', type: 'Pawn', color: 'Black', row: 5, col: 1 }, // Pawn that can be captured by Queen diagonally
  ];

  let pieces;
  let moveValidator;
  let movedPieces;

  beforeEach(() => {
    pieces = createTestPieces();
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

  describe('calculateRawMoves', () => {
    it('should calculate correct raw moves for the Queen', () => {
      const queen = pieces.find(p => p.id === 'wq');
      const rawMoves = moveValidator.calculateRawMoves(queen);
      
      // The Queen can move diagonally up-left and capture the pawn at (5,2)
      const captureMove = rawMoves.find(move => move.row === 5 && move.col === 1);
      expect(captureMove).toBeDefined();

      // Log all the moves for debugging
      console.log('Queen raw moves:', rawMoves);
      
      // Check total number of moves
      expect(rawMoves.length).toBeGreaterThan(0);
    });
  });

  describe('moveWouldLeaveInCheck', () => {
    it('should allow Queen to capture when it does not leave King in check', () => {
      const queen = pieces.find(p => p.id === 'wq');
      const destination = { row: 5, col: 2 }; // Position of the black pawn
      
      const leavesInCheck = moveValidator.moveWouldLeaveInCheck(queen, destination);
      expect(leavesInCheck).toBe(false);
    });
  });

  describe('calculateValidMoves', () => {
    it('should include capturing moves for the Queen', () => {
      const queen = pieces.find(p => p.id === 'wq');
      
      // Debug the issue step by step
      const rawMoves = moveValidator.calculateRawMoves(queen);
      console.log('Raw moves for Queen:', rawMoves);
      
      // Check if raw moves contain the pawn capture
      const rawCaptureMove = rawMoves.find(move => move.row === 5 && move.col === 1);
      console.log('Raw capture move found:', rawCaptureMove);
      
      // Check if the move would leave the king in check
      if (rawCaptureMove) {
        const leavesInCheck = moveValidator.moveWouldLeaveInCheck(queen, { row: 5, col: 1 });
        console.log('Would capturing the pawn leave king in check?', leavesInCheck);
      }
      
      const validMoves = moveValidator.calculateValidMoves(queen);
      console.log('Valid moves for Queen:', validMoves);
      
      // Look for the specific capture move
      const captureMove = validMoves.find(move => move.row === 5 && move.col === 1);
      console.log('Capture move in valid moves:', captureMove);
      
      // Instead of failing immediately, let's log what's happening
      if (!captureMove) {
        console.log('ERROR: Queen cannot capture pawn at (5,1) - This is likely our bug!');
        
        // Find all moves for Queen that were filtered out during validation
        const filteredMoves = rawMoves.filter(rawMove => 
          !validMoves.some(validMove => 
            validMove.row === rawMove.row && validMove.col === rawMove.col
          )
        );
        console.log('Moves filtered out during validation:', filteredMoves);
      }
      
      expect(captureMove).toBeDefined();
    });

    // Add a more specific test for the bug scenario
    it('should properly validate capture moves', () => {
      const queen = pieces.find(p => p.id === 'wq');
      
      // Add a helper function to validate a specific move
      const canMove = (piece, dest) => {
        return !moveValidator.moveWouldLeaveInCheck(piece, dest);
      };
      
      // Try to capture the pawn at (5,1)
      const canCapturePawn = canMove(queen, { row: 5, col: 1 });
      console.log('Can queen capture pawn?', canCapturePawn);
      expect(canCapturePawn).toBe(true);
    });
  });

  describe('isKingInCheck', () => {
    it('should correctly identify when the King is not in check', () => {
      const inCheck = moveValidator.isKingInCheck('White');
      expect(inCheck).toBe(false);
    });

    it('should correctly identify when the King is in check', () => {
      // Add a black queen that puts the white king in check
      pieces.push({ id: 'bq', type: 'Queen', color: 'Black', row: 5, col: 4 });
      
      const inCheck = moveValidator.isKingInCheck('White');
      expect(inCheck).toBe(true);
    });
  });
});
