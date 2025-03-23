import { describe, test, expect } from 'vitest';
import useMoveValidation from '../composables/useMoveValidation';

describe('Queen Capture Test', () => {
  test('White Queen at H5 should be able to capture Black Pawn at F5', () => {
    // Recreate the board state
    const pieces = [
      { id: 0, type: "Rook", color: "Black", row: 0, col: 0 },
      { id: 1, type: "Knight", color: "Black", row: 0, col: 1 },
      { id: 2, type: "Bishop", color: "Black", row: 0, col: 2 },
      { id: 3, type: "Queen", color: "Black", row: 0, col: 3 },
      { id: 4, type: "King", color: "Black", row: 0, col: 4 },
      { id: 5, type: "Bishop", color: "Black", row: 0, col: 5 },
      { id: 6, type: "Knight", color: "Black", row: 0, col: 6 },
      { id: 7, type: "Rook", color: "Black", row: 0, col: 7 },
      { id: 8, type: "Pawn", color: "Black", row: 1, col: 0 },
      { id: 9, type: "Pawn", color: "Black", row: 1, col: 1 },
      { id: 10, type: "Pawn", color: "Black", row: 1, col: 2 },
      { id: 11, type: "Pawn", color: "Black", row: 1, col: 3 },
      { id: 12, type: "Pawn", color: "Black", row: 1, col: 4 },
      { id: 13, type: "Pawn", color: "Black", row: 3, col: 5 }, // The pawn at F5 that should be captured
      { id: 14, type: "Pawn", color: "Black", row: 2, col: 6 },
      { id: 15, type: "Pawn", color: "Black", row: 1, col: 7 },
      { id: 16, type: "Rook", color: "White", row: 7, col: 0 },
      { id: 17, type: "Knight", color: "White", row: 7, col: 1 },
      { id: 18, type: "Bishop", color: "White", row: 7, col: 2 },
      { id: 19, type: "Queen", color: "White", row: 3, col: 7 }, // The Queen at H5 that should capture
      { id: 20, type: "King", color: "White", row: 7, col: 4 },
      { id: 21, type: "Bishop", color: "White", row: 7, col: 5 },
      { id: 22, type: "Knight", color: "White", row: 7, col: 6 },
      { id: 23, type: "Rook", color: "White", row: 7, col: 7 },
      { id: 24, type: "Pawn", color: "White", row: 6, col: 0 },
      { id: 25, type: "Pawn", color: "White", row: 6, col: 1 },
      { id: 26, type: "Pawn", color: "White", row: 6, col: 2 },
      { id: 27, type: "Pawn", color: "White", row: 6, col: 3 },
      { id: 28, type: "Pawn", color: "White", row: 4, col: 4 },
      { id: 29, type: "Pawn", color: "White", row: 6, col: 5 },
      { id: 30, type: "Pawn", color: "White", row: 6, col: 6 },
      { id: 31, type: "Pawn", color: "White", row: 6, col: 7 }
    ];
    
    // Mock the movedPieces for castling logic
    const movedPiecesRef = { 
      value: {
        whiteKing: false,
        blackKing: false,
        whiteRookA: false,
        whiteRookH: false,
        blackRookA: false,
        blackRookH: false
      }
    };

    // Create helper functions for the validator
    const getPieceAtPosition = (row, col) => {
      return pieces.find(p => p.row === row && p.col === col) || null;
    };

    // Initialize move validator
    const moveValidator = useMoveValidation({
      getPieceAtPosition,
      getPiecesByColor: () => pieces,
      movedPieces: movedPiecesRef
    });

    // Get the white queen
    const whiteQueen = pieces.find(p => p.id === 19);
    expect(whiteQueen).toBeTruthy();
    expect(whiteQueen.type).toBe("Queen");
    expect(whiteQueen.color).toBe("White");

    // Get the black pawn at F5
    const blackPawnF5 = pieces.find(p => p.id === 13);
    expect(blackPawnF5).toBeTruthy();
    expect(blackPawnF5.type).toBe("Pawn");
    expect(blackPawnF5.color).toBe("Black");
    expect(blackPawnF5.row).toBe(3);
    expect(blackPawnF5.col).toBe(5);

    // Calculate raw moves for the queen
    const rawMoves = moveValidator.calculateRawMoves(whiteQueen);
    console.log("Raw moves for white queen:", rawMoves);

    // Check if F5 is in the raw moves
    const canCaptureF5Raw = rawMoves.some(move => move.row === 3 && move.col === 5);
    expect(canCaptureF5Raw).toBe(true);

    // Calculate valid moves (after check validation)
    const validMoves = moveValidator.calculateValidMoves(whiteQueen);
    console.log("Valid moves for white queen:", validMoves);

    // Check if F5 is in the valid moves
    const canCaptureF5Valid = validMoves.some(move => move.row === 3 && move.col === 5);
    expect(canCaptureF5Valid).toBe(true);

    // Debugging for moveWouldLeaveInCheck function
    const moveToF5 = { row: 3, col: 5 };
    const leavesInCheck = moveValidator.moveWouldLeaveInCheck(whiteQueen, moveToF5);
    console.log("Would move to F5 leave in check?", leavesInCheck);
    
    // Simplified debug information - now that we've fixed the issue
    console.log("\n--- DEBUGGING moveWouldLeaveInCheck ---");
    
    // Create a deep clone of the pieces array for simulation
    const simulatedPieces = JSON.parse(JSON.stringify(pieces));
    console.log("Cloned pieces:", simulatedPieces.length);
    
    // Find the piece being moved in the simulation
    const pieceIndex = simulatedPieces.findIndex(p => p.id === whiteQueen.id);
    console.log("Moving piece found:", pieceIndex !== -1, "at index:", pieceIndex);
    
    // Move the Queen to F5
    simulatedPieces[pieceIndex].row = moveToF5.row;
    simulatedPieces[pieceIndex].col = moveToF5.col;
    
    // Remove the pawn at F5
    const pawnIndex = simulatedPieces.findIndex(p => p.id === 13);
    if (pawnIndex !== -1) {
      simulatedPieces.splice(pawnIndex, 1);
    }
    
    // Verify the White King position
    const king = simulatedPieces.find(p => p.type === "King" && p.color === "White");
    console.log("King position after simulation:", king.row, king.col);
    
    console.log("\nRaw moves for the Queen should include F5!");
    
    expect(leavesInCheck).toBe(false);
  });
});