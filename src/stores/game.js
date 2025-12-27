// filepath: src/stores/game.js
import { defineStore } from "pinia";
import { Chess } from "chess.js";
import { ref, computed } from "vue";

// Add a mapping from chess.js piece codes to full names
const pieceCodeToName = {
  p: "Pawn",
  r: "Rook",
  n: "Knight",
  b: "Bishop",
  q: "Queen",
  k: "King",
};

export const useGameStore = defineStore("game", () => {
  // --- State ---
  const chessInstance = new Chess(); // Use a plain instance, not a ref
  const fen = ref(chessInstance.fen()); // Get initial FEN from the instance
  const moveHistory = ref([]); // Array of move objects { from, to, san, piece, color, ... }
  const capturedPieces = ref([]); // Track captured pieces { type, color }
  const boardFlipped = ref(false); // Track board orientation
  const gameResult = ref("*"); // PGN result code: '*', '1-0', '0-1', '1/2-1/2'
  const headers = ref(chessInstance.getHeaders()); // Initialize headers from chessInstance
  const isGameSaved = ref(true); // Track if the current game state is saved
  const showLogoutConfirmModal = ref(false); // State for logout confirmation modal

  // Add separate state for tracking check
  const whiteKingInCheck = ref(false);
  const blackKingInCheck = ref(false);

  // Add state for checkmate modal
  const showCheckmateModal = ref(false);
  const checkmateModalMessage = ref("");

  // Use a regular ref for currentTurn instead of a computed property to ensure reactivity
  const currentTurn = ref(chessInstance.turn() === "w" ? "White" : "Black");

  // Add a temporary board state for viewing past moves without affecting the actual game
  const tempBoardState = ref(null);
  const viewingMoveIndex = ref(-1);

  // Track the currently loaded/saved game for incremental updates
  const currentGameId = ref(null);
  const currentGameMetadata = ref(null);

  // --- Getters ---
  const whiteInCheck = computed(() => {
    const isWhiteTurn = chessInstance.turn() === "w";
    const isInCheck = chessInstance.isCheck();
    return isWhiteTurn && isInCheck;
  });

  const blackInCheck = computed(() => {
    const isBlackTurn = chessInstance.turn() === "b";
    const isInCheck = chessInstance.isCheck();
    return isBlackTurn && isInCheck;
  });

  const isCheckmate = computed(() => chessInstance.isCheckmate());
  const isStalemate = computed(() => chessInstance.isStalemate());
  const isGameOver = computed(() => chessInstance.isGameOver());
  const pgn = computed(() => {
    const currentHeaders = headers.value;
    const finalResult = isGameOver.value
      ? isCheckmate.value
        ? currentTurn.value === "White"
          ? "0-1"
          : "1-0"
        : "1/2-1/2"
      : "*";
    chessInstance.setHeader(
      "Result",
      currentHeaders.Result !== "*" ? currentHeaders.Result : finalResult
    );
    return chessInstance.pgn();
  });
  const hasUnsavedChanges = computed(
    () => moveHistory.value.length > 0 && !isGameSaved.value
  );

  // Add a getter to determine which FEN to use (temp or actual)
  const currentFen = computed(() => {
    return tempBoardState.value || fen.value;
  });

  // Check if the current game is a loaded/saved game (for incremental updates)
  const isLoadedGame = computed(() => currentGameId.value !== null);

  // --- Actions ---

  function makeMove(move) {
    try {
      // Log the current turn and FEN before the move
      console.log(
        "Before move - Current turn:",
        chessInstance.turn(),
        "->",
        chessInstance.turn() === "w" ? "White" : "Black"
      );

      const result = chessInstance.move(move);
      if (result) {
        // First, update the currentTurn value based on chess.js's new turn
        currentTurn.value = chessInstance.turn() === "w" ? "White" : "Black";

        // Then update the FEN
        fen.value = chessInstance.fen();

        // Update check status - if the current player is in check, their king is in check
        if (chessInstance.isCheck()) {
          if (chessInstance.turn() === "w") {
            // White's turn and in check means White's king is in check
            whiteKingInCheck.value = true;
            blackKingInCheck.value = false;
            console.log("White king is now in check");
          } else {
            // Black's turn and in check means Black's king is in check
            blackKingInCheck.value = true;
            whiteKingInCheck.value = false;
            console.log("Black king is now in check");
          }
        } else {
          // No one is in check
          whiteKingInCheck.value = false;
          blackKingInCheck.value = false;
        }

        // Determine boolean flags from result.flags
        const isCapture = result.flags.includes("c");
        const isPromotion = result.flags.includes("p");
        const isKingsideCastle = result.flags.includes("k");
        const isQueensideCastle = result.flags.includes("q");
        const isEnPassant = result.flags.includes("e");
        // Check/Checkmate status needs to be determined *after* the move
        const createsCheck = chessInstance.isCheck();
        const currentIsCheckmate = chessInstance.isCheckmate(); // Checkmate status after the move

        const historyEntry = {
          from: result.from,
          to: result.to,
          san: result.san,
          piece: pieceCodeToName[result.piece],
          color: result.color === "w" ? "White" : "Black",
          flags: result.flags, // Keep original flags for reference if needed
          captured: result.captured
            ? pieceCodeToName[result.captured]
            : undefined,
          promotion: result.promotion
            ? pieceCodeToName[result.promotion]
            : undefined,
          timestamp: new Date().toISOString(),
          // Add boolean flags
          isCapture: isCapture,
          isPromotion: isPromotion,
          isKingsideCastle: isKingsideCastle,
          isQueensideCastle: isQueensideCastle,
          isCastling: isKingsideCastle || isQueensideCastle,
          isEnPassant: isEnPassant,
          createsCheck: createsCheck,
          isCheckmate: currentIsCheckmate, // Store checkmate status determined after the move
        };
        moveHistory.value.push(historyEntry);
        isGameSaved.value = false; // Mark game as unsaved after a move

        if (result.captured) {
          const capturedColor = result.color === "w" ? "Black" : "White";
          capturedPieces.value.push({
            type: pieceCodeToName[result.captured],
            color: capturedColor,
          });
        }

        // Update gameResult based on the state *after* the move
        updateGameResult();

        // Check for checkmate and display modal if needed
        if (currentIsCheckmate) {
          const losingColor = chessInstance.turn(); // Current turn after move is the loser
          const winner = losingColor === "w" ? "Black" : "White";
          console.log(`Checkmate! ${winner} has won the game`);

          // Set up the checkmate modal
          checkmateModalMessage.value = `Checkmate! ${winner} has won the game.`;
          showCheckmateModal.value = true;
        }

        // Double check that our currentTurn value matches chess.js's turn
        console.log(
          "Final check - chess.js turn:",
          chessInstance.turn(),
          "currentTurn.value:",
          currentTurn.value
        );

        console.log(
          "Pinia Store: Move made",
          result.san,
          "New FEN:",
          fen.value,
          "Result:",
          gameResult.value
        );
        return result;
      } else {
        console.warn(
          "Pinia Store: Invalid move attempted:",
          move,
          "Current FEN:",
          fen.value
        );
        return null;
      }
    } catch (error) {
      console.warn(
        "Pinia Store: Illegal move attempted:",
        error.message,
        "Move:",
        move,
        "Current FEN:",
        fen.value
      );
      return null;
    }
  }

  function resetGame() {
    chessInstance.reset();
    fen.value = chessInstance.fen();
    currentTurn.value = "White"; // Explicitly set to White on reset
    moveHistory.value = [];
    capturedPieces.value = [];
    gameResult.value = "*";
    headers.value = chessInstance.getHeaders();
    isGameSaved.value = true; // Reset is saved

    // Clear check status indicators (at starting position, no one is in check)
    whiteKingInCheck.value = false;
    blackKingInCheck.value = false;

    // Clear checkmate modal if it was showing
    showCheckmateModal.value = false;
    checkmateModalMessage.value = "";

    // Clear temporary board state for viewing past moves
    tempBoardState.value = null;
    viewingMoveIndex.value = -1;

    // Clear saved game tracking (new game, not a loaded one)
    currentGameId.value = null;
    currentGameMetadata.value = null;

    console.log("Pinia Store: Game reset");
  }

  function takeBackMove() {
    const undoneMove = chessInstance.undo();
    if (undoneMove) {
      fen.value = chessInstance.fen();
      // Explicitly update the turn after taking back a move
      currentTurn.value = chessInstance.turn() === "w" ? "White" : "Black";
      console.log(
        "After takeBack - currentTurn.value updated to:",
        currentTurn.value
      );

      moveHistory.value.pop();

      if (undoneMove.captured) {
        const capturedColor = undoneMove.color === "w" ? "Black" : "White";
        const indexToRemove = capturedPieces.value.findIndex(
          (p) =>
            p.type === pieceCodeToName[undoneMove.captured] &&
            p.color === capturedColor
        );
        if (indexToRemove !== -1) {
          capturedPieces.value.splice(indexToRemove, 1);
        } else {
          console.warn(
            "Pinia Store: Could not find captured piece to remove during takeback:",
            undoneMove
          );
        }
      }

      // Update check status after taking back a move
      if (chessInstance.isCheck()) {
        if (chessInstance.turn() === "w") {
          whiteKingInCheck.value = true;
          blackKingInCheck.value = false;
        } else {
          blackKingInCheck.value = true;
          whiteKingInCheck.value = false;
        }
      } else {
        whiteKingInCheck.value = false;
        blackKingInCheck.value = false;
      }

      gameResult.value = "*";

      console.log("Pinia Store: Move taken back", undoneMove.san);
      return undoneMove;
    }
    console.warn("Pinia Store: Failed to take back move.");
    return null;
  }

  function setBoardOrientation(flipped) {
    boardFlipped.value = flipped;
  }

  function loadPgn(pgnString, gameId = null, gameMetadata = null, initialHeaders = {}, savedMoveHistory = null) {
    try {
      chessInstance.reset();
      chessInstance.loadPgn(pgnString);

      const pgnHeaders = chessInstance.getHeaders();
      const mergedHeaders = { ...initialHeaders, ...pgnHeaders };
      headers.value = mergedHeaders;

      Object.entries(mergedHeaders).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          chessInstance.setHeader(key, value);
        }
      });

      // Store the game ID and metadata if provided (for incremental updates)
      currentGameId.value = gameId;
      currentGameMetadata.value = gameMetadata;

      fen.value = chessInstance.fen();
      // Explicitly update the turn after loading a PGN
      currentTurn.value = chessInstance.turn() === "w" ? "White" : "Black";
      console.log(
        "After loadPgn - currentTurn.value updated to:",
        currentTurn.value
      );

      // Rebuild history with flags
      const historyFromPgn = chessInstance.history({ verbose: true });
      const rebuiltHistory = [];
      const tempChessForFlags = new Chess();

      historyFromPgn.forEach((m) => {
        const moveResult = tempChessForFlags.move({
          from: m.from,
          to: m.to,
          promotion: m.promotion,
        });
        if (moveResult) {
          const isCapture = moveResult.flags.includes("c");
          const isPromotion = moveResult.flags.includes("p");
          const isKingsideCastle = moveResult.flags.includes("k");
          const isQueensideCastle = moveResult.flags.includes("q");
          const isEnPassant = moveResult.flags.includes("e");
          const createsCheck = tempChessForFlags.isCheck();
          const currentIsCheckmate = tempChessForFlags.isCheckmate();

          rebuiltHistory.push({
            from: m.from,
            to: m.to,
            san: m.san,
            piece: pieceCodeToName[m.piece],
            color: m.color === "w" ? "White" : "Black",
            flags: m.flags,
            captured: m.captured ? pieceCodeToName[m.captured] : undefined,
            promotion: m.promotion ? pieceCodeToName[m.promotion] : undefined,
            timestamp: new Date().toISOString(),
            isCapture: isCapture,
            isPromotion: isPromotion,
            isKingsideCastle: isKingsideCastle,
            isQueensideCastle: isQueensideCastle,
            isCastling: isKingsideCastle || isQueensideCastle,
            isEnPassant: isEnPassant,
            createsCheck: createsCheck,
            isCheckmate: currentIsCheckmate,
          });
        } else {
          console.warn(
            "Pinia Store: Could not replay move during PGN load for flag determination:",
            m
          );
        }
      });

      // Merge annotations from savedMoveHistory if provided
      if (savedMoveHistory && Array.isArray(savedMoveHistory)) {
        rebuiltHistory.forEach((move, index) => {
          if (savedMoveHistory[index]?.annotation) {
            move.annotation = savedMoveHistory[index].annotation;
          }
        });
      }

      moveHistory.value = rebuiltHistory;

      rebuildCapturedPieces();
      updateGameResult();
      isGameSaved.value = true; // Game loaded is considered saved initially

      console.log("Pinia Store: PGN loaded successfully.");
    } catch (error) {
      console.error("Pinia Store: Error loading PGN:", error);
      resetGame();
    }
  }

  function setHeaders(...args) {
    // Handle both object format and key-value pairs format
    if (args.length === 1 && typeof args[0] === "object") {
      // Object format
      const newHeaders = args[0];
      Object.entries(newHeaders).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          chessInstance.setHeader(key, String(value));
        }
      });
    } else if (args.length >= 2) {
      // Key-value pairs format (Event, "MyEvent", Site, "MySite", etc.)
      for (let i = 0; i < args.length; i += 2) {
        if (i + 1 < args.length) {
          const key = args[i];
          const value = args[i + 1];
          if (value !== null && value !== undefined) {
            chessInstance.setHeader(key, String(value));
          }
        }
      }
    }

    headers.value = { ...chessInstance.getHeaders() };
  }

  function rebuildCapturedPieces() {
    capturedPieces.value = [];
    const tempChess = new Chess();
    try {
      chessInstance.history({ verbose: true }).forEach((move) => {
        const result = tempChess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        });
        if (result && result.captured) {
          const capturedColor = result.color === "w" ? "Black" : "White";
          capturedPieces.value.push({
            type: pieceCodeToName[result.captured],
            color: capturedColor,
          });
        }
      });
    } catch (e) {
      console.error("Error rebuilding captured pieces:", e);
    }
  }

  function getValidMoves(square) {
    console.log(
      "Pinia Store: Checking chessInstance in getValidMoves:",
      chessInstance
    );
    try {
      if (!chessInstance || typeof chessInstance.moves !== "function") {
        console.error(
          "Pinia Store: chessInstance is invalid or missing .moves() method.",
          chessInstance
        );
        return [];
      }
      return chessInstance.moves({ square: square, verbose: true });
    } catch (error) {
      console.error(
        "Pinia Store: Error calling chessInstance.moves() for",
        square,
        error
      );
      return [];
    }
  }

  function updateGameResult() {
    if (chessInstance.isCheckmate()) {
      gameResult.value = chessInstance.turn() === "b" ? "1-0" : "0-1";
    } else if (
      chessInstance.isStalemate() ||
      chessInstance.isThreefoldRepetition() ||
      chessInstance.isInsufficientMaterial() ||
      chessInstance.isDraw()
    ) {
      gameResult.value = "1/2-1/2";
    } else {
      gameResult.value = "*";
    }
  }

  function markGameAsSaved() {
    isGameSaved.value = true;
  }

  function openLogoutConfirmModal() {
    showLogoutConfirmModal.value = true;
  }

  function closeLogoutConfirmModal() {
    showLogoutConfirmModal.value = false;
  }

  function closeCheckmateModal() {
    showCheckmateModal.value = false;
  }

  /**
   * View a specific move in the history without changing the actual game state
   * @param {Number} index The index of the move to view (-1 for current, 0 for initial position)
   */
  function viewMoveAtIndex(index) {
    console.log(
      `Attempting to view move at index: ${index}, moveHistory length: ${moveHistory.value.length}`
    );
    console.log(`Current moveHistory:`, JSON.stringify(moveHistory.value));

    // Check for valid index range
    if (index < -1 || index > moveHistory.value.length) {
      console.warn(`Invalid move index: ${index}`);
      return;
    }

    // If viewing current position, clear the temporary state
    if (index === -1) {
      tempBoardState.value = null;
      viewingMoveIndex.value = -1;
      console.log("Viewing current position (latest)");
      return;
    }

    // Create a temporary chess instance to replay the moves
    const tempChess = new Chess();

    // If index is 0, show the initial position (before any moves were made)
    if (index === 0) {
      tempBoardState.value = tempChess.fen();
      viewingMoveIndex.value = 0;
      console.log(
        `Viewing initial position (before any moves), FEN: ${tempBoardState.value}`
      );
      return;
    }

    // For positions after moves, we need to replay moves up to the selected index
    // Index 1 shows position after the first move (moveHistory[0])
    let success = true;

    console.log(
      `Need to replay ${index} moves from moveHistory (indices 0 to ${
        index - 1
      })`
    );

    // Replay moves from the moveHistory array
    for (let i = 0; i < index; i++) {
      if (i >= moveHistory.value.length) {
        console.warn(
          `Trying to access move at index ${i} but moveHistory only has ${moveHistory.value.length} moves`
        );
        break;
      }

      const move = moveHistory.value[i];
      console.log(`Replaying move ${i}: ${move.from}-${move.to}`, move);

      const result = tempChess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion
          ? move.promotion.toLowerCase().charAt(0)
          : undefined,
      });

      if (!result) {
        console.error(`Failed to replay move at index ${i}:`, move);
        success = false;
        break;
      } else {
        console.log(
          `Successfully replayed move ${i}, new FEN: ${tempChess.fen()}`
        );
      }
    }

    if (success) {
      tempBoardState.value = tempChess.fen();
      viewingMoveIndex.value = index;
      console.log(
        `Viewing move at index ${index}, FEN: ${tempBoardState.value}`
      );
    } else {
      console.error("Failed to replay moves");
    }
  }

  /**
   * Update the annotation for a specific move
   * @param {Number} moveIndex The 1-based move index (matches getWhiteMoveIndex/getBlackMoveIndex)
   * @param {String} annotation The annotation text to save
   */
  function updateMoveAnnotation(moveIndex, annotation) {
    // Convert from 1-based index to 0-based array index
    const arrayIndex = moveIndex - 1;
    if (arrayIndex >= 0 && arrayIndex < moveHistory.value.length) {
      moveHistory.value[arrayIndex].annotation = annotation;
      isGameSaved.value = false; // Mark as unsaved since annotation changed
      console.log(`Updated annotation for move ${moveIndex}:`, annotation);
    } else {
      console.warn(`Invalid move index for annotation: ${moveIndex}`);
    }
  }

  return {
    // State (Refs)
    fen,
    moveHistory,
    capturedPieces,
    boardFlipped,
    gameResult,
    headers,
    showLogoutConfirmModal,
    isGameSaved,
    showCheckmateModal,
    checkmateModalMessage,
    whiteKingInCheck,
    blackKingInCheck,
    tempBoardState,
    viewingMoveIndex,
    currentGameId,
    currentGameMetadata,
    // Getters (Computed)
    currentTurn,
    whiteInCheck,
    blackInCheck,
    isCheckmate,
    isStalemate,
    isGameOver,
    pgn,
    hasUnsavedChanges,
    currentFen,
    isLoadedGame,
    // Actions (Functions)
    makeMove,
    resetGame,
    takeBackMove,
    setBoardOrientation,
    loadPgn,
    setHeaders,
    getValidMoves,
    markGameAsSaved,
    openLogoutConfirmModal,
    closeLogoutConfirmModal,
    closeCheckmateModal,
    viewMoveAtIndex,
    updateMoveAnnotation,
  };
});
