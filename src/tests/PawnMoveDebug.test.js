import { describe, it, expect, beforeEach } from 'vitest';
import useMoveValidation from '../composables/useMoveValidation';

describe('Pawn Move D2 to D3 Validation Bug', () => {
  // Define the board state with the position from the user's example
  const boardState = [
    {
      "id": 0,
      "type": "Rook",
      "color": "Black",
      "row": 0,
      "col": 0
    },
    {
      "id": 1,
      "type": "Knight",
      "color": "Black",
      "row": 0,
      "col": 1
    },
    {
      "id": 2,
      "type": "Bishop",
      "color": "Black",
      "row": 0,
      "col": 2
    },
    {
      "id": 4,
      "type": "King",
      "color": "Black",
      "row": 0,
      "col": 5
    },
    {
      "id": 8,
      "type": "Pawn",
      "color": "Black",
      "row": 3,
      "col": 1
    },
    {
      "id": 9,
      "type": "Pawn",
      "color": "Black",
      "row": 1,
      "col": 1
    },
    {
      "id": 10,
      "type": "Pawn",
      "color": "Black",
      "row": 1,
      "col": 2
    },
    {
      "id": 11,
      "type": "Pawn",
      "color": "Black",
      "row": 1,
      "col": 3
    },
    {
      "id": 12,
      "type": "Pawn",
      "color": "Black",
      "row": 5,
      "col": 6
    },
    {
      "id": 13,
      "type": "Pawn",
      "color": "Black",
      "row": 1,
      "col": 5
    },
    {
      "id": 14,
      "type": "Pawn",
      "color": "Black",
      "row": 2,
      "col": 6
    },
    {
      "id": 16,
      "type": "Rook",
      "color": "White",
      "row": 7,
      "col": 0
    },
    {
      "id": 17,
      "type": "Knight",
      "color": "White",
      "row": 7,
      "col": 1
    },
    {
      "id": 18,
      "type": "Bishop",
      "color": "White",
      "row": 7,
      "col": 2
    },
    {
      "id": 20,
      "type": "King",
      "color": "White",
      "row": 7,
      "col": 4
    },
    {
      "id": 21,
      "type": "Bishop",
      "color": "White",
      "row": 4,
      "col": 4
    },
    {
      "id": 22,
      "type": "Knight",
      "color": "White",
      "row": 5,
      "col": 5
    },
    {
      "id": 24,
      "type": "Pawn",
      "color": "White",
      "row": 6,
      "col": 0
    },
    {
      "id": 25,
      "type": "Pawn",
      "color": "White",
      "row": 6,
      "col": 1
    },
    {
      "id": 26,
      "type": "Pawn",
      "color": "White",
      "row": 4,
      "col": 2
    },
    {
      "id": 27,
      "type": "Pawn",
      "color": "White",
      "row": 6,
      "col": 3
    },
    {
      "id": 30,
      "type": "Pawn",
      "color": "White",
      "row": 6,
      "col": 6
    }
  ];

  let moveValidator;
  let movedPieces = { value: { whiteKing: false, blackKing: false, whiteRookA: false, whiteRookH: false, blackRookA: false, blackRookH: false } };

  beforeEach(() => {
    // Set up necessary helper functions
    const getPieceAtPosition = (row, col) => {
      return boardState.find(p => p.row === row && p.col === col) || null;
    };

    // Create the move validator
    moveValidator = useMoveValidation({
      getPieceAtPosition,
      getPiecesByColor: () => boardState,
      movedPieces
    });
  });

  it('should correctly validate D2 to D3 pawn move', () => {
    // Find the D2 pawn (row 6, col 3)
    const pawn = boardState.find(p => p.type === "Pawn" && p.color === "White" && p.row === 6 && p.col === 3);
    expect(pawn).toBeDefined();

    // Get raw moves (without check validation)
    const rawMoves = moveValidator.calculateRawMoves(pawn);
    console.log('Raw moves for pawn at D2:', rawMoves);

    // Check if D3 (row 5, col 3) is in the raw moves
    const targetMove = { row: 5, col: 3 };
    const isRawValid = rawMoves.some(move => move.row === targetMove.row && move.col === targetMove.col);
    expect(isRawValid).toBe(true);

    // Check if the move would leave the king in check
    const leavesInCheck = moveValidator.moveWouldLeaveInCheck(pawn, targetMove);
    console.log('Would move to D3 leave king in check?', leavesInCheck);
    expect(leavesInCheck).toBe(false);

    // Get all valid moves
    const validMoves = moveValidator.calculateValidMoves(pawn);
    console.log('All valid moves for pawn at D2:', validMoves);

    // Check if D3 is in the valid moves
    const isFullyValid = validMoves.some(move => move.row === targetMove.row && move.col === targetMove.col);
    expect(isFullyValid).toBe(true);
  });

  it('should debug the simulation used in moveWouldLeaveInCheck', () => {
    // Get the D2 pawn and the target square D3
    const pawn = boardState.find(p => p.type === "Pawn" && p.color === "White" && p.row === 6 && p.col === 3);
    const targetMove = { row: 5, col: 3 };

    // Manual simulation to debug what's happening
    const simulatedPieces = [...boardState.map(p => ({...p}))];
    const pawnIndex = simulatedPieces.findIndex(p => p.id === pawn.id);
    
    if (pawnIndex !== -1) {
      console.log(`Found pawn at index ${pawnIndex} with ID ${pawn.id}`);
      
      // Move the pawn in the simulation
      simulatedPieces[pawnIndex] = {
        ...simulatedPieces[pawnIndex],
        row: targetMove.row,
        col: targetMove.col
      };
      
      // Find the White King
      const whiteKing = simulatedPieces.find(p => p.type === "King" && p.color === "White");
      console.log(`White king is at row ${whiteKing.row}, col ${whiteKing.col}`);
      
      // Check if any Black piece can attack the King
      const blackPieces = simulatedPieces.filter(p => p.color === "Black");
      console.log(`Found ${blackPieces.length} black pieces`);
      
      // Custom check function from the code
      const checkPosition = (row, col) => {
        return simulatedPieces.find(p => p.row === row && p.col === col);
      };
      
      let foundCheck = false;
      for (const blackPiece of blackPieces) {
        // Only checking the Black Bishop (id: 2) to debug
        if (blackPiece.id === 2) {
          const { row, col, type } = blackPiece;
          console.log(`Checking if Black ${type} at (${row},${col}) can attack White King at (${whiteKing.row},${whiteKing.col})`);
          
          // Specific check for bishops
          if (type === "Bishop") {
            const isDiagonal = Math.abs(whiteKing.row - row) === Math.abs(whiteKing.col - col);
            console.log(`Is on diagonal: ${isDiagonal}`);
            
            if (isDiagonal) {
              // Check if path is clear
              const rowStep = whiteKing.row > row ? 1 : -1;
              const colStep = whiteKing.col > col ? 1 : -1;
              
              let pathIsClear = true;
              let squaresInBetween = [];
              
              for (let r = row + rowStep, c = col + colStep; 
                   r !== whiteKing.row || c !== whiteKing.col; 
                   r += rowStep, c += colStep) {
                squaresInBetween.push({ row: r, col: c });
                if (checkPosition(r, c)) {
                  pathIsClear = false;
                  const blockingPiece = checkPosition(r, c);
                  console.log(`Path is blocked by ${blockingPiece.color} ${blockingPiece.type} at (${r},${c})`);
                  break;
                }
              }
              
              console.log(`Squares between: ${JSON.stringify(squaresInBetween)}`);
              console.log(`Path is clear: ${pathIsClear}`);
              
              if (pathIsClear) {
                foundCheck = true;
                console.log(`Found check! Bishop at (${row},${col}) can attack king at (${whiteKing.row},${whiteKing.col})`);
              }
            }
          }
        }
      }
      
      expect(foundCheck).toBe(false);
    } else {
      console.log(`Failed to find pawn with ID ${pawn.id} in the simulated pieces`);
    }
  });
});