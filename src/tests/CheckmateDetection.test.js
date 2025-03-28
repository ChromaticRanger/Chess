import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import useMoveValidation from '../composables/useMoveValidation';

describe('Checkmate Detection', () => {
  // Set up a simple checkmate scenario - this is a classic back-rank mate
  const createCheckmatePosition = () => [
    // White pieces - the king is surrounded by its own pieces
    { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
    { id: 3, type: 'Pawn', color: 'White', row: 6, col: 3 }, // White pawn at D2
    { id: 4, type: 'Pawn', color: 'White', row: 6, col: 4 }, // White pawn at E2 - blocks king escape
    { id: 5, type: 'Pawn', color: 'White', row: 6, col: 5 }, // White pawn at F2
    { id: 6, type: 'Rook', color: 'White', row: 7, col: 3 }, // White rook at D1 - blocks king to left
    { id: 7, type: 'Rook', color: 'White', row: 7, col: 5 }, // White rook at F1 - blocks king to right
    
    // Black pieces - rook delivers check
    { id: 2, type: 'Rook', color: 'Black', row: 7, col: 0 }, // Black Rook at A1 giving check horizontally
  ];
  
  let pieces;
  let moveValidator;
  let movedPieces;
  
  beforeEach(() => {
    pieces = createCheckmatePosition();
    movedPieces = ref({
      whiteKing: false,
      blackKing: false,
      whiteRookA: false,
      whiteRookH: false,
      blackRookA: false,
      blackRookH: false
    });
    
    // Set up necessary helper functions
    const getPieceAtPosition = (row, col) => {
      return pieces.find(p => p.row === row && p.col === col) || null;
    };
    
    // Create the move validator
    moveValidator = useMoveValidation({
      getPieceAtPosition,
      getPiecesByColor: () => pieces,
      movedPieces
    });
  });
  
  it('should correctly detect checkmate position', () => {
    // Manually set up a simple checkmate position
    // The rook at A1 is checking the king at E1, and the king has no valid moves
    pieces = [
      { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
      { id: 6, type: 'Pawn', color: 'White', row: 6, col: 3 }, // White pawn at D2
      { id: 7, type: 'Pawn', color: 'White', row: 6, col: 4 }, // White pawn at E2
      { id: 8, type: 'Pawn', color: 'White', row: 6, col: 5 }, // White pawn at F2
      { id: 2, type: 'Rook', color: 'Black', row: 7, col: 1 }, // Black Rook at B1 checking king
    ];
    
    console.log('=== CHECKMATE TEST SETUP ===');
    console.log('Board position:');
    pieces.forEach(p => {
      console.log(`${p.color} ${p.type} at (${p.row},${p.col})`);
    });
    
    // Step 1: Verify the king is in check
    const isInCheck = moveValidator.isKingInCheck('White');
    console.log('Is king in check?', isInCheck);
    
    // Debug the check detection
    const whiteKing = pieces.find(p => p.type === 'King' && p.color === 'White');
    const blackRook = pieces.find(p => p.type === 'Rook' && p.color === 'Black');
    
    console.log('King position:', `(${whiteKing.row},${whiteKing.col})`);
    console.log('Rook position:', `(${blackRook.row},${blackRook.col})`);
    
    // Check if rook can see the king
    const rooksRawMoves = moveValidator.calculateRawMoves(blackRook);
    console.log('Rook raw moves:', rooksRawMoves);
    
    const kingInRooksMoves = rooksRawMoves.some(
      move => move.row === whiteKing.row && move.col === whiteKing.col
    );
    console.log('King in rook moves?', kingInRooksMoves);
    
    // We know from debug output this should be true
    expect(isInCheck).toBe(true);
    
    // Step 2: Check if king has any valid moves
    const kingsValidMoves = moveValidator.calculateValidMoves(whiteKing);
    console.log(`King has ${kingsValidMoves.length} valid moves:`, kingsValidMoves);
    
    // King should have no valid moves
    expect(kingsValidMoves.length).toBe(0);
    
    // Check if pawns can block the check
    const dPawn = pieces.find(p => p.type === 'Pawn' && p.row === 6 && p.col === 3);
    const ePawn = pieces.find(p => p.type === 'Pawn' && p.row === 6 && p.col === 4);
    const fPawn = pieces.find(p => p.type === 'Pawn' && p.row === 6 && p.col === 5);
    
    const dPawnMoves = moveValidator.calculateValidMoves(dPawn);
    const ePawnMoves = moveValidator.calculateValidMoves(ePawn);
    const fPawnMoves = moveValidator.calculateValidMoves(fPawn);
    
    console.log('D pawn moves:', dPawnMoves);
    console.log('E pawn moves:', ePawnMoves);
    console.log('F pawn moves:', fPawnMoves);
    
    // No piece should be able to save the king
    const anyPieceCanSave = kingsValidMoves.length > 0 || 
                            dPawnMoves.length > 0 || 
                            ePawnMoves.length > 0 || 
                            fPawnMoves.length > 0;
    
    expect(anyPieceCanSave).toBe(false);
    
    // Step 3: Verify using the isCheckmate function
    const isCheckmated = moveValidator.isCheckmate('White');
    console.log('Is in checkmate?', isCheckmated);
    
    // This should be true since king is in check and no moves are available
    expect(isCheckmated).toBe(true);
  });
  
  it('should not detect checkmate if the king can move', () => {
    // Modify the position so the king can move
    pieces = [
      // White pieces
      { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
      
      // Black pieces
      { id: 2, type: 'Rook', color: 'Black', row: 0, col: 4 }, // Black Rook at E8 checking the king
    ];
    
    // Verify the king is in check
    const isInCheck = moveValidator.isKingInCheck('White');
    expect(isInCheck).toBe(true);
    
    // Verify the king has valid moves (should be able to move to D1, F1)
    const king = pieces.find(p => p.type === 'King' && p.color === 'White');
    const validMoves = moveValidator.calculateValidMoves(king);
    console.log('King valid moves:', validMoves);
    expect(validMoves.length).toBeGreaterThan(0);
    
    // Verify using the isCheckmate function
    const isCheckmated = moveValidator.isCheckmate('White');
    expect(isCheckmated).toBe(false);
  });
  
  it('should not detect checkmate if a piece can block the check', () => {
    // Create a new set of pieces so we don't interfere with pieces in other tests
    pieces = [
      // White pieces
      { id: 1, type: 'King', color: 'White', row: 7, col: 4 }, // White King at E1
      { id: 8, type: 'Queen', color: 'White', row: 5, col: 2 }, // White Queen at C3 that can block
      
      // Black pieces
      { id: 2, type: 'Rook', color: 'Black', row: 7, col: 0 }, // Black Rook at A1 giving check horizontally
    ];
    
    console.log('=== BLOCK TEST SETUP ===');
    console.log('Board position:');
    pieces.forEach(p => {
      console.log(`${p.color} ${p.type} at (${p.row},${p.col})`);
    });
    
    // Verify the king is in check
    const isInCheck = moveValidator.isKingInCheck('White');
    console.log('Is king in check?', isInCheck);
    
    // Debug the check detection
    const whiteKing = pieces.find(p => p.type === 'King' && p.color === 'White');
    const blackRook = pieces.find(p => p.type === 'Rook' && p.color === 'Black');
    
    console.log('King position:', `(${whiteKing.row},${whiteKing.col})`);
    console.log('Rook position:', `(${blackRook.row},${blackRook.col})`);
    
    // Check if rook can see the king
    const rooksRawMoves = moveValidator.calculateRawMoves(blackRook);
    console.log('Rook raw moves:', rooksRawMoves);
    
    const rooksMoveLandsOnKing = rooksRawMoves.some(
      move => move.row === whiteKing.row && move.col === whiteKing.col
    );
    console.log('Rook move lands on king?', rooksMoveLandsOnKing);
    
    expect(isInCheck).toBe(true);
    
    // Verify the queen has valid moves to block
    const queen = pieces.find(p => p.type === 'Queen' && p.color === 'White');
    const queenRawMoves = moveValidator.calculateRawMoves(queen);
    console.log('Queen raw moves:', queenRawMoves);
    
    // Can queen capture or block the rook?
    const canQueenCaptureRook = queenRawMoves.some(
      move => move.row === blackRook.row && move.col === blackRook.col
    );
    
    const canQueenBlockCheck = queenRawMoves.some(
      move => move.row === 7 && move.col > 0 && move.col < 4
    );
    
    console.log('Can queen capture rook?', canQueenCaptureRook);
    console.log('Can queen block check?', canQueenBlockCheck);
    
    const validMoves = moveValidator.calculateValidMoves(queen);
    console.log('Queen valid moves:', validMoves);
    
    // Should have at least one valid move (blocking or capturing rook)
    const capturingMove = validMoves.find(move => move.row === blackRook.row && move.col === blackRook.col);
    const blockingMoves = validMoves.filter(move => move.row === 7 && move.col > 0 && move.col < 4);
    
    console.log('Blocking moves:', blockingMoves);
    console.log('Capturing move:', capturingMove);
    
    // At least one of these should be defined
    console.log('Has valid defense:', !!capturingMove || blockingMoves.length > 0);
    expect(blockingMoves.length > 0 || capturingMove !== undefined).toBe(true);
    
    // Verify using the isCheckmate function
    const isCheckmated = moveValidator.isCheckmate('White');
    console.log('Is in checkmate?', isCheckmated);
    expect(isCheckmated).toBe(false);
  });
});