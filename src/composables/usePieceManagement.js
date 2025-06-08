import { ref, watch } from "vue";
import { createPiece } from "../utils/PieceFactory";

/**
 * Composable for managing the visual representation of pieces based on a FEN string.
 */
export default function usePieceManagement(fenRef) {
  const pieces = ref([]);

  const parseFen = (fen) => {
    const newPieces = [];
    const [piecePlacement, turn, ...restOfFen] = fen.split(" ");
    const currentTurn = turn === "w" ? "White" : "Black";


    const ranks = piecePlacement.split("/");
    let idCounter = 0; // Simple ID generation for visual pieces

    ranks.forEach((rank, rowIndex) => {
      let colIndex = 0;
      for (const char of rank) {
        if (isNaN(parseInt(char))) {
          // It's a piece
          const color = char === char.toUpperCase() ? "White" : "Black";
          const type = getTypeFromFenChar(char);
          if (type) {
            newPieces.push(
              createPiece(`p${idCounter++}`, type, color, rowIndex, colIndex)
            );
          }
          colIndex++;
        } else {
          // It's a number representing empty squares
          colIndex += parseInt(char);
        }
      }
    });


    pieces.value = newPieces;
  };

  const getTypeFromFenChar = (char) => {
    const lowerChar = char.toLowerCase();
    switch (lowerChar) {
      case "p":
        return "Pawn";
      case "n":
        return "Knight";
      case "b":
        return "Bishop";
      case "r":
        return "Rook";
      case "q":
        return "Queen";
      case "k":
        return "King";
      default:
        return null;
    }
  };

  // Watch the FEN ref passed from the store/component and update pieces
  watch(
    fenRef,
    (newFen) => {
      if (newFen) {
        parseFen(newFen);
      }
    },
    { immediate: true }
  ); // Parse immediately on setup

  // Simplified getPieceAtPosition based on the current visual state
  const getPieceAtPosition = (row, col) => {
    return pieces.value.find((p) => p.row === row && p.col === col);
  };

  return {
    pieces, // The reactive array of piece objects for rendering
    getPieceAtPosition, // Still useful for rendering logic
    // Removed: initialPieces, resetPieces, capturePiece, movePiecePosition, getPiecesByColor
  };
}
