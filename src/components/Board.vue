<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import Square from "./Square.vue";
import throttle from "lodash/throttle";

const pieces = ref([
  { id: 0, name: "Black Rook", image: "src/assets/R_B.svg", row: 0, col: 0 },
  { id: 1, name: "Black Knight", image: "src/assets/Kn_B.svg", row: 0, col: 1 },
  { id: 2, name: "Black Bishop", image: "src/assets/B_B.svg", row: 0, col: 2 },
  { id: 3, name: "Black Queen", image: "src/assets/Q_B.svg", row: 0, col: 3 },
  { id: 4, name: "Black King", image: "src/assets/K_B.svg", row: 0, col: 4 },
  { id: 5, name: "Black Bishop", image: "src/assets/B_B.svg", row: 0, col: 5 },
  { id: 6, name: "Black Knight", image: "src/assets/Kn_B.svg", row: 0, col: 6 },
  { id: 7, name: "Black Rook", image: "src/assets/R_B.svg", row: 0, col: 7 },
  { id: 8, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 0 },
  { id: 9, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 1 },
  { id: 10, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 2 },
  { id: 11, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 3 },
  { id: 12, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 4 },
  { id: 13, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 5 },
  { id: 14, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 6 },
  { id: 15, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 7 },
  { id: 16, name: "White Rook", image: "src/assets/R_W.svg", row: 7, col: 0 },
  {
    id: 17,
    name: "White Knight",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 1,
  },
  { id: 18, name: "White Bishop", image: "src/assets/B_W.svg", row: 7, col: 2 },
  { id: 19, name: "White Queen", image: "src/assets/Q_W.svg", row: 7, col: 3 },
  { id: 20, name: "White King", image: "src/assets/K_W.svg", row: 7, col: 4 },
  { id: 21, name: "White Bishop", image: "src/assets/B_W.svg", row: 7, col: 5 },
  {
    id: 22,
    name: "White Knight",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 6,
  },
  { id: 23, name: "White Rook", image: "src/assets/R_W.svg", row: 7, col: 7 },
  { id: 24, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 0 },
  { id: 25, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 1 },
  { id: 26, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 2 },
  { id: 27, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 3 },
  { id: 28, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 4 },
  { id: 29, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 5 },
  { id: 30, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 6 },
  { id: 31, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 7 },
]);

const selectedSquare = ref({ row: null, col: null });
const originalPosition = ref({ row: null, col: null });
const draggingPiece = ref(null);
const mouseX = ref(0);
const mouseY = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const validMoves = ref([]);
const attackedSquares = ref([]);
const whiteInCheck = ref(false);
const blackInCheck = ref(false);

const handleSquareClick = (row, col, e) => {
  selectedSquare.value = { row, col };
  const piece = pieces.value.find((p) => p.row === row && p.col === col);
  if (piece) {
    validMoves.value = calculateValidMoves(piece);
  } else {
    validMoves.value = [];
  }
};

const handleMouseDown = (piece, event) => {
  draggingPiece.value = piece;
  originalPosition.value = { row: piece.row, col: piece.col }; // Store the original position
  const pieceElement = event.target;
  pieceElement.style.zIndex = 1000;
  // Calculate and highlight valid moves
  validMoves.value = calculateValidMoves(piece);
};

const handleMouseMove = throttle((e) => {
  if (draggingPiece.value) {
    const diffX = e.clientX - mouseX.value;
    const diffY = e.clientY - mouseY.value;
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    pieceElement.style.position = "absolute";
    const currentLeft = parseInt(pieceElement.style.left || 0, 10);
    const currentTop = parseInt(pieceElement.style.top || 0, 10);
    pieceElement.style.left = `${currentLeft + diffX}px`;
    pieceElement.style.top = `${currentTop + diffY}px`;
  }
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}, 16); // Throttle the function to run at most once every 16 milliseconds

const handleMouseUp = async (event) => {
  if (draggingPiece.value) {
    const movingPiece = checkForExistingPiece(
      originalPosition.value.row,
      originalPosition.value.col
    );
    const pieceElement = document.getElementById(
      `piece-${draggingPiece.value.id}`
    );
    pieceElement.style.zIndex = ""; // Reset the z-index after dragging
    const newRow = Math.floor((event.clientY - offsetY.value) / 100);
    const newCol = Math.floor((event.clientX - offsetX.value) / 100);

    // Check if the new position is a valid move
    const isValidMove = validMoves.value.some(
      (move) => move.row === newRow && move.col === newCol
    );

    if (isValidMove) {
      // TODO: If the existing piece is the King we do not actually take it.

      // Check to see if there is a piece already on the new square
      const existingPiece = checkForExistingPiece(newRow, newCol);
      if (existingPiece) {
        takePiece(existingPiece);
      }
      // Update the moving piece's position in the pieces array
      movePiece(movingPiece, newRow, newCol);
    } else {
      returnPiece(movingPiece);
    }

    draggingPiece.value = null;
    // Unselect any square that was selected after the drag
    // selectedSquare.value = { row: null, col: null };
    validMoves.value = [];

    // Check if the move has put the opponents King in check
    const createsCheck = checkForCheck(movingPiece);

    // Build a list of attacked squares so we can check king
    // when he tries to get out of check
    if (createsCheck) {
      attackedSquares.value = calculatedAttackedSquares(
        movingPiece.name.split(" ")[0]
      );
    }
  }
};

/**
 * Check to see if the last move has put the opponents King in check
 *
 * @param movingPiece - The piece that has just been moved
 */
const checkForCheck = (movingPiece) => {
  whiteInCheck.value = false;
  blackInCheck.value = false;
  const color = movingPiece.name.split(" ")[0];
  // Get all of the same colors pieces
  const ourPieces = pieces.value.filter((p) => p.name.includes(color));
  // loop through each of these pieces and see if it can attack the opponents king
  // or expose a discovered attack on the king.
  let checkFound = false;
  ourPieces.forEach((piece) => {
    if (checkFound) return true;
    const checkingMoves = calculateValidMoves(piece, true);
    checkingMoves.forEach((move) => {
      if (checkFound) return true;
      let attackedPiece = checkForExistingPiece(move.row, move.col);
      if (attackedPiece)
        if (attackedPiece.name.includes("King")) {
          checkFound = true;
          if (color === "Black") {
            whiteInCheck.value = true;
          } else {
            blackInCheck.value = true;
          }
        }
    });
  });

  return checkFound;
};

/**
 * Check to see if there is a piece already on a square
 *
 * @param row - The row of the square to check
 * @param col - The column of the square to check
 * @returns {Object|null} - The piece on the square or null if there is no piece
 */
const checkForExistingPiece = (row, col) => {
  return pieces.value.find((p) => p.row === row && p.col === col) || null;
};

/**
 * Take a piece from the board
 *
 * @param piece - The piece to take
 */
const takePiece = (piece) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  pieces.value.splice(index, 1);
};

/**
 * Move a piece to a new square
 *
 * @param piece - The piece to move
 * @param row - The row to move the piece to
 * @param col - The column to move the piece to
 */
const movePiece = (piece, row, col) => {
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    pieces.value[index].row = row;
    pieces.value[index].col = col;
  }
};

/**
 * Return a piece to its original position
 *
 * @param piece - The piece to return
 * @returns {Promise<void>}
 */
const returnPiece = async (piece) => {
  // Reset the piece to its original position
  const index = pieces.value.findIndex((p) => p.id === piece.id);
  if (index !== -1) {
    pieces.value[index].row = originalPosition.value.row - 1;
    pieces.value[index].col = originalPosition.value.col - 1;
    await nextTick(); // Wait for the DOM to update
    pieces.value[index].row = originalPosition.value.row;
    pieces.value[index].col = originalPosition.value.col;
  }
};

/**
 * Create a list of all the squares that are attacked by our pieces
 *
 * @param color - The color of the pieces to check
 */
const calculatedAttackedSquares = (color) => {
  const ourPieces = pieces.value.filter((p) => p.name.includes(color));
  const attackedSquares = [];

  // Build a list of empty squares that are attacked by our pieces

  // PAWNS
  const ourPawns = ourPieces.filter((p) => p.name.includes("Pawn"));
  ourPawns.forEach((pawn) => {
    const direction = pawn.name.includes("White") ? -1 : 1;

    // Check left diagonal attack if not on left edge
    if (pawn.col > 0) {
      const leftAttack = checkForExistingPiece(
        pawn.row + direction,
        pawn.col - 1
      );
      if (!leftAttack) {
        attackedSquares.push({
          piece: "PAWN",
          row: pawn.row + direction,
          col: pawn.col - 1,
        });
      }
    }

    // Check right diagonal attack if not on right edge
    if (pawn.col < 7) {
      const rightAttack = checkForExistingPiece(
        pawn.row + direction,
        pawn.col + 1
      );
      if (!rightAttack) {
        attackedSquares.push({
          piece: "PAWN",
          row: pawn.row + direction,
          col: pawn.col + 1,
        });
      }
    }
  });

  // KNIGHTS
  const ourKnights = ourPieces.filter((p) => p.name.includes("Knight"));
  ourKnights.forEach((knight) => {
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
    knightMoves.forEach((move) => {
      const newRow = knight.row + move.row;
      const newCol = knight.col + move.col;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (!checkForExistingPiece(newRow, newCol)) {
          attackedSquares.push({ piece: "KNIGHT", row: newRow, col: newCol });
        }
      }
    });
  });

  // BISHOPS
  const ourBishops = ourPieces.filter((p) => p.name.includes("Bishop"));
  ourBishops.forEach((bishop) => {
    // Move diagonally up-left
    for (let i = 1; bishop.row - i >= 0 && bishop.col - i >= 0; i++) {
      if (!checkForExistingPiece(bishop.row - i, bishop.col - i)) {
        attackedSquares.push({
          piece: "BISHOP",
          row: bishop.row - i,
          col: bishop.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally up-right
    for (let i = 1; bishop.row - i >= 0 && bishop.col + i < 8; i++) {
      if (!checkForExistingPiece(bishop.row - i, bishop.col + i)) {
        attackedSquares.push({
          piece: "BISHOP",
          row: bishop.row - i,
          col: bishop.col + i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-left
    for (let i = 1; bishop.row + i < 8 && bishop.col - i >= 0; i++) {
      if (!checkForExistingPiece(bishop.row + i, bishop.col - i)) {
        attackedSquares.push({
          piece: "BISHOP",
          row: bishop.row + i,
          col: bishop.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-right
    for (let i = 1; bishop.row + i < 8 && bishop.col + i < 8; i++) {
      if (!checkForExistingPiece(bishop.row + i, bishop.col + i)) {
        attackedSquares.push({
          piece: "BISHOP",
          row: bishop.row + i,
          col: bishop.col + i,
        });
      } else {
        break;
      }
    }
  });

  // ROOKS
  const ourRooks = ourPieces.filter((p) => p.name.includes("Rook"));
  ourRooks.forEach((rook) => {
    // Move vertically up
    for (let i = rook.row - 1; i >= 0; i--) {
      if (!checkForExistingPiece(i, rook.col)) {
        attackedSquares.push({ piece: "ROOK", row: i, col: rook.col });
      } else {
        break;
      }
    }
    // Move vertically down
    for (let i = rook.row + 1; i < 8; i++) {
      if (!checkForExistingPiece(i, rook.col)) {
        attackedSquares.push({ piece: "ROOK", row: i, col: rook.col });
      } else {
        break;
      }
    }
    // Move horizontally left
    for (let i = rook.col - 1; i >= 0; i--) {
      if (!checkForExistingPiece(rook.row, i)) {
        attackedSquares.push({ piece: "ROOK", row: rook.row, col: i });
      } else {
        break;
      }
    }
    // Move horizontally right
    for (let i = rook.col + 1; i < 8; i++) {
      if (!checkForExistingPiece(rook.row, i)) {
        attackedSquares.push({ piece: "ROOK", row: rook.row, col: i });
      } else {
        break;
      }
    }
  });

  // QUEENS
  const ourQueens = ourPieces.filter((p) => p.name.includes("Queen"));
  ourQueens.forEach((queen) => {
    // Move vertically up
    for (let i = queen.row - 1; i >= 0; i--) {
      if (!checkForExistingPiece(i, queen.col)) {
        attackedSquares.push({ piece: "QUEEN", row: i, col: queen.col });
      } else {
        break;
      }
    }
    // Move vertically down
    for (let i = queen.row + 1; i < 8; i++) {
      if (!checkForExistingPiece(i, queen.col)) {
        attackedSquares.push({ piece: "QUEEN", row: i, col: queen.col });
      } else {
        break;
      }
    }
    // Move horizontally left
    for (let i = queen.col - 1; i >= 0; i--) {
      if (!checkForExistingPiece(queen.row, i)) {
        attackedSquares.push({ piece: "QUEEN", row: queen.row, col: i });
      } else {
        break;
      }
    }
    // Move horizontally right
    for (let i = queen.col + 1; i < 8; i++) {
      if (!checkForExistingPiece(queen.row, i)) {
        attackedSquares.push({ piece: "QUEEN", row: queen.row, col: i });
      } else {
        break;
      }
    }
    // Move diagonally up-left
    for (let i = 1; queen.row - i >= 0 && queen.col - i >= 0; i++) {
      if (!checkForExistingPiece(queen.row - i, queen.col - i)) {
        attackedSquares.push({
          piece: "QUEEN",
          row: queen.row - i,
          col: queen.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally up-right
    for (let i = 1; queen.row - i >= 0 && queen.col + i < 8; i++) {
      if (!checkForExistingPiece(queen.row - i, queen.col + i)) {
        attackedSquares.push({
          piece: "QUEEN",
          row: queen.row - i,
          col: queen.col + i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-left
    for (let i = 1; queen.row + i < 8 && queen.col - i >= 0; i++) {
      if (!checkForExistingPiece(queen.row + i, queen.col - i)) {
        attackedSquares.push({
          piece: "QUEEN",
          row: queen.row + i,
          col: queen.col - i,
        });
      } else {
        break;
      }
    }
    // Move diagonally down-right
    for (let i = 1; queen.row + i < 8 && queen.col + i < 8; i++) {
      if (!checkForExistingPiece(queen.row + i, queen.col + i)) {
        attackedSquares.push({
          piece: "QUEEN",
          row: queen.row + i,
          col: queen.col + i,
        });
      } else {
        break;
      }
    }
  });

  // KINGS
  const ourKing = ourPieces.filter((p) => p.name.includes("King"));
  const directions = [
    { row: -1, col: 0 }, // Up
    { row: 1, col: 0 }, // Down
    { row: 0, col: -1 }, // Left
    { row: 0, col: 1 }, // Right
    { row: -1, col: -1 }, // Up-left
    { row: -1, col: 1 }, // Up-right
    { row: 1, col: -1 }, // Down-left
    { row: 1, col: 1 }, // Down-right
  ];
  directions.forEach((direction) => {
    const newRow = ourKing.row + direction.row;
    const newCol = ourKing.col + direction.col;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      if (!checkForExistingPiece(newRow, newCol)) {
        attackedSquares.push({ piece: "KING", row: newRow, col: newCol });
      }
    }
  });

  return attackedSquares;
};

/**
 * Calculates the valid moves for a given chess piece.
 *
 * @param {Object} piece - The chess piece for which to calculate valid moves.
 * @returns {Array} An array of valid moves for the given piece.
 */
const calculateValidMoves = (piece, isCheckChecking = false) => {
  const moves = [];
  const { row, col, name } = piece;

  // PAWN MOVES
  if (name.includes("Pawn")) {
    const direction = name.includes("White") ? -1 : 1;
    const startRow = name.includes("White") ? 6 : 1;

    // Move forward
    if (!pieces.value.some((p) => p.row === row + direction && p.col === col)) {
      moves.push({ row: row + direction, col });
      if (
        row === startRow &&
        !pieces.value.some(
          (p) => p.row === row + 2 * direction && p.col === col
        )
      ) {
        moves.push({ row: row + 2 * direction, col });
      }
    }

    // Capture diagonally
    if (
      pieces.value.some(
        (p) =>
          p.row === row + direction &&
          p.col === col - 1 &&
          !p.name.includes(name.split(" ")[0])
      )
    ) {
      moves.push({ row: row + direction, col: col - 1 });
    }
    if (
      pieces.value.some(
        (p) =>
          p.row === row + direction &&
          p.col === col + 1 &&
          !p.name.includes(name.split(" ")[0])
      )
    ) {
      moves.push({ row: row + direction, col: col + 1 });
    }
  }

  // ROOK MOVES
  if (name.includes("Rook")) {
    // Move vertically up
    for (let i = row - 1; i >= 0; i--) {
      if (pieces.value.some((p) => p.row === i && p.col === col)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === i &&
              p.col === col &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: i, col });
        }
        break;
      }
      moves.push({ row: i, col });
    }
    // Move vertically down
    for (let i = row + 1; i < 8; i++) {
      if (pieces.value.some((p) => p.row === i && p.col === col)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === i &&
              p.col === col &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: i, col });
        }
        break;
      }
      moves.push({ row: i, col });
    }
    // Move horizontally left
    for (let i = col - 1; i >= 0; i--) {
      if (pieces.value.some((p) => p.row === row && p.col === i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row &&
              p.col === i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row, col: i });
        }
        break;
      }
      moves.push({ row, col: i });
    }
    // Move horizontally right
    for (let i = col + 1; i < 8; i++) {
      if (pieces.value.some((p) => p.row === row && p.col === i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row &&
              p.col === i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row, col: i });
        }
        break;
      }
      moves.push({ row, col: i });
    }
  }

  // BISHOP MOVES
  if (name.includes("Bishop")) {
    // Move diagonally up-left
    for (let i = 1; row - i >= 0 && col - i >= 0; i++) {
      if (pieces.value.some((p) => p.row === row - i && p.col === col - i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row - i &&
              p.col === col - i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row - i, col: col - i });
        }
        break;
      }
      moves.push({ row: row - i, col: col - i });
    }
    // Move diagonally up-right
    for (let i = 1; row - i >= 0 && col + i < 8; i++) {
      if (pieces.value.some((p) => p.row === row - i && p.col === col + i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row - i &&
              p.col === col + i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row - i, col: col + i });
        }
        break;
      }
      moves.push({ row: row - i, col: col + i });
    }
    // Move diagonally down-left
    for (let i = 1; row + i < 8 && col - i >= 0; i++) {
      if (pieces.value.some((p) => p.row === row + i && p.col === col - i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row + i &&
              p.col === col - i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row + i, col: col - i });
        }
        break;
      }
      moves.push({ row: row + i, col: col - i });
    }
    // Move diagonally down-right
    for (let i = 1; row + i < 8 && col + i < 8; i++) {
      if (pieces.value.some((p) => p.row === row + i && p.col === col + i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row + i &&
              p.col === col + i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row + i, col: col + i });
        }
        break;
      }
      moves.push({ row: row + i, col: col + i });
    }
  }

  // QUEEN MOVES
  if (name.includes("Queen")) {
    // Combine Rook and Bishop moves

    // Rook-like moves
    // Move vertically up
    for (let i = row - 1; i >= 0; i--) {
      if (pieces.value.some((p) => p.row === i && p.col === col)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === i &&
              p.col === col &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: i, col });
        }
        break;
      }
      moves.push({ row: i, col });
    }
    // Move vertically down
    for (let i = row + 1; i < 8; i++) {
      if (pieces.value.some((p) => p.row === i && p.col === col)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === i &&
              p.col === col &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: i, col });
        }
        break;
      }
      moves.push({ row: i, col });
    }
    // Move horizontally left
    for (let i = col - 1; i >= 0; i--) {
      if (pieces.value.some((p) => p.row === row && p.col === i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row &&
              p.col === i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row, col: i });
        }
        break;
      }
      moves.push({ row, col: i });
    }
    // Move horizontally right
    for (let i = col + 1; i < 8; i++) {
      if (pieces.value.some((p) => p.row === row && p.col === i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row &&
              p.col === i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row, col: i });
        }
        break;
      }
      moves.push({ row, col: i });
    }

    // Bishop-like moves
    // Move diagonally up-left
    for (let i = 1; row - i >= 0 && col - i >= 0; i++) {
      if (pieces.value.some((p) => p.row === row - i && p.col === col - i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row - i &&
              p.col === col - i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row - i, col: col - i });
        }
        break;
      }
      moves.push({ row: row - i, col: col - i });
    }
    // Move diagonally up-right
    for (let i = 1; row - i >= 0 && col + i < 8; i++) {
      if (pieces.value.some((p) => p.row === row - i && p.col === col + i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row - i &&
              p.col === col + i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row - i, col: col + i });
        }
        break;
      }
      moves.push({ row: row - i, col: col + i });
    }
    // Move diagonally down-left
    for (let i = 1; row + i < 8 && col - i >= 0; i++) {
      if (pieces.value.some((p) => p.row === row + i && p.col === col - i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row + i &&
              p.col === col - i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row + i, col: col - i });
        }
        break;
      }
      moves.push({ row: row + i, col: col - i });
    }
    // Move diagonally down-right
    for (let i = 1; row + i < 8 && col + i < 8; i++) {
      if (pieces.value.some((p) => p.row === row + i && p.col === col + i)) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === row + i &&
              p.col === col + i &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: row + i, col: col + i });
        }
        break;
      }
      moves.push({ row: row + i, col: col + i });
    }
  }

  // KING MOVES
  if (name.includes("King")) {
    const directions = [
      { row: -1, col: 0 }, // Up
      { row: 1, col: 0 }, // Down
      { row: 0, col: -1 }, // Left
      { row: 0, col: 1 }, // Right
      { row: -1, col: -1 }, // Up-left
      { row: -1, col: 1 }, // Up-right
      { row: 1, col: -1 }, // Down-left
      { row: 1, col: 1 }, // Down-right
    ];

    directions.forEach((direction) => {
      const newRow = row + direction.row;
      const newCol = col + direction.col;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === newRow &&
              p.col === newCol &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          // only add the move if it is not in the current array of attackedSquares
          if (
            !attackedSquares.value.some(
              (p) => p.row === newRow && p.col === newCol
            )
          ) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
    });
  }

  // KNIGHT MOVES
  if (name.includes("Knight")) {
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

    knightMoves.forEach((move) => {
      const newRow = row + move.row;
      const newCol = col + move.col;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        if (
          !pieces.value.some(
            (p) =>
              p.row === newRow &&
              p.col === newCol &&
              p.name.includes(name.split(" ")[0])
          )
        ) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    });
  }

  return moves;
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});

// Generate the chessboard pattern
const squares = computed(() => {
  const result = [];
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isBlack = (row + col) % 2 === 1;
      const topLeftLabel = col === 0 ? (8 - row).toString() : null; // Left column (1-8)
      const bottomRightLabel = row === 7 ? files[col] : null; // Bottom row (a-h)
      const piece =
        pieces.value.find((p) => p.row === row && p.col === col) || null;
      const selected =
        selectedSquare.value.row === row && selectedSquare.value.col === col;
      const validMove = validMoves.value.some(
        (move) => move.row === row && move.col === col
      );
      const inCheck =
        (whiteInCheck.value &&
          piece?.name.includes("White") &&
          piece?.name.includes("King")) ||
        (blackInCheck.value &&
          piece?.name.includes("Black") &&
          piece?.name.includes("King"));
      result.push({
        color: isBlack ? "black" : "white",
        row,
        col,
        topLeftLabel,
        bottomRightLabel,
        piece,
        selected,
        validMove,
        inCheck,
      });
    }
  }
  return result;
});
</script>

<template>
  <div class="chessboard">
    <Square
      v-for="(square, index) in squares"
      :key="index"
      :color="square.color"
      :row="square.row"
      :col="square.col"
      :topLeftLabel="square.topLeftLabel"
      :bottomRightLabel="square.bottomRightLabel"
      :piece="square.piece"
      :selected="square.selected"
      :validMove="square.validMove"
      :inCheck="square.inCheck"
      @click="handleSquareClick(square.row, square.col, $event)"
      @mousedown="square.piece && handleMouseDown(square.piece, $event)"
    />
  </div>
</template>

<style lang="css" scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 800px; /* Adjust size as needed */
  height: 800px; /* Adjust size as needed */
}
</style>
