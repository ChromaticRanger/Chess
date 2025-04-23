<template>
  <div class="game-input-view">
    <div
      class="flex-grow flex items-center justify-center"
      style="min-height: calc(100vh - 160px)"
    >
      <div class="flex flex-col">
        <div class="flex flex-col items-center">
          <!-- Top Row: Board Status Panel + Game Save Panel -->
          <div class="flex justify-center w-full mb-2">
            <!-- Left: Board Status Panel - aligned with chess board width -->
            <div class="mr-6" style="width: 820px">
              <BoardStatusPanel
                :current-turn="currentTurn"
                :viewing-past-move="viewingPastMove"
                :captured-pieces="capturedPieces"
                :current-move-index="currentMoveIndex"
                :board-flipped="boardFlipped"
                position="top"
                class="w-full"
              />
            </div>

            <!-- Right: Game Save Panel - aligned with Move History width -->
            <div style="width: 352px">
              <GameSavePanel @save-game="handleSaveGame" />
            </div>
          </div>

          <!-- Middle Row: Game Board + Move History -->
          <div class="flex justify-center w-full">
            <div class="flex">
              <!-- Chess Board Section -->
              <div class="mr-6" style="width: 820px">
                <div class="border-blue-600 border-10 rounded shadow-md">
                  <Board
                    ref="boardComponent"
                    @turn-changed="handleTurnChange"
                    @move-history-updated="handleMoveHistoryUpdate"
                    @checkmate="handleCheckmate"
                    @stalemate="handleStalemate"
                    @current-move-index-changed="handleCurrentMoveIndexChange"
                    @captured-pieces-updated="handleCapturedPiecesUpdate"
                    @board-orientation-changed="handleBoardOrientationChange"
                  />
                </div>
              </div>

              <!-- Move History Component -->
              <div style="width: 352px">
                <MoveHistoryList
                  :move-history="moveHistory"
                  :current-move-index="currentMoveIndex"
                  @move-selected="
                    (index) =>
                      index >= 0 && boardComponent
                        ? boardComponent.handleMoveSelection(index)
                        : null
                  "
                  @reset-board="
                    boardComponent ? boardComponent.resetBoard() : null
                  "
                  @take-back-move="
                    boardComponent ? boardComponent.handleTakeBackMove() : null
                  "
                />
              </div>
            </div>
          </div>

          <!-- Bottom Row: Board Status Panel + Move Control Panel -->
          <div class="flex justify-center w-full mt-2">
            <div class="flex">
              <!-- Bottom Board Status Panel - aligned with chess board width -->
              <BoardStatusPanel
                :current-turn="currentTurn"
                :viewing-past-move="viewingPastMove"
                :captured-pieces="capturedPieces"
                :current-move-index="currentMoveIndex"
                :board-flipped="boardFlipped"
                position="bottom"
                style="width: 820px"
                class="mr-6"
              />

              <!-- Move Control Panel - aligned with Move History List width -->
              <MoveControlPanel
                :move-history="moveHistory"
                :current-move-index="currentMoveIndex"
                @move-to-first="
                  (index) =>
                    boardComponent
                      ? boardComponent.handleMoveSelection(index)
                      : null
                "
                @move-to-previous="
                  (index) =>
                    boardComponent
                      ? boardComponent.handleMoveSelection(index)
                      : null
                "
                @move-to-next="
                  (index) =>
                    boardComponent
                      ? boardComponent.handleMoveSelection(index)
                      : null
                "
                @move-to-last="
                  (index) =>
                    boardComponent
                      ? boardComponent.handleMoveSelection(index)
                      : null
                "
                @take-back-move="
                  boardComponent ? boardComponent.handleTakeBackMove() : null
                "
                style="width: 352px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save Game Dialog -->
    <SaveGameDialog
      v-if="showSaveDialog"
      :move-history="moveHistory"
      @save="saveGame"
      @cancel="cancelSave"
      :result="gameResult"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { Chess } from "chess.js"; // Import chess.js
import Board from "../components/Board.vue";
import MoveHistoryList from "../components/MoveHistoryList.vue";
import MoveControlPanel from "../components/MoveControlPanel.vue";
import BoardStatusPanel from "../components/BoardStatusPanel.vue";
import GameSavePanel from "../components/GameSavePanel.vue";
import SaveGameDialog from "../components/SaveGameDialog.vue";
import { getPieceImagePath } from "../utils/PieceFactory";
import { usePositions } from "../composables/usePositions";

// Emits
const emit = defineEmits(["show-modal"]);

// Get functions from composables
const { createGame, error: saveError } = usePositions();

// Track the current turn
const currentTurn = ref("White");

// Track the move history
const moveHistory = ref([]);

// Track the currently viewed move index
const currentMoveIndex = ref(-1);

// Track whether we're viewing a past move
const viewingPastMove = ref(false);

// Track captured pieces
const capturedPieces = ref([]);

// Track board orientation (true = flipped, black at bottom)
const boardFlipped = ref(false);

// Create a ref for the board component
const boardComponent = ref(null);

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};

// Handler for checkmate
const handleCheckmate = (winner) => {
  const winnerKingImage = getPieceImagePath("King", winner);
  // Use standard PGN result codes
  gameResult.value = winner === "White" ? "1-0" : "0-1";
  emit(
    "show-modal",
    "Checkmate",
    `${winner} has won the game.`,
    winnerKingImage
  );
};

// Handler for stalemate
const handleStalemate = (stalematedColor) => {
  // Use both kings to represent a draw
  const whiteKingImage = getPieceImagePath("King", "White");
  // Use standard PGN result code
  gameResult.value = "1/2-1/2";
  emit(
    "show-modal",
    "Stalemate",
    `The game is a draw by stalemate.`,
    whiteKingImage
  );
};

// Handler for move history updates
const handleMoveHistoryUpdate = (newHistory) => {
  moveHistory.value = newHistory;
  console.log(
    "Move history updated in GameInput.vue:",
    moveHistory.value.length,
    "moves"
  );
  // Log the last move object received
  if (moveHistory.value.length > 0) {
    console.log(
      "Last move object in GameInput history:",
      moveHistory.value[moveHistory.value.length - 1]
    );
  }
};

// Handler for current move index changes
const handleCurrentMoveIndexChange = (newIndex) => {
  currentMoveIndex.value = newIndex;
  viewingPastMove.value = newIndex !== -1;
  console.log(
    `Current move index changed to ${newIndex}, viewing past move: ${viewingPastMove.value}`
  );
};

// Handler for captured pieces updates
const handleCapturedPiecesUpdate = (newCapturedPieces) => {
  capturedPieces.value = newCapturedPieces;
  console.log("Captured pieces updated:", newCapturedPieces);
};

// Handler for board orientation changes
const handleBoardOrientationChange = (isFlipped) => {
  boardFlipped.value = isFlipped;
  console.log("Board orientation changed, flipped:", isFlipped);
};

// State to track game result
const gameResult = ref("In Progress");

// Show/hide save game dialog
const showSaveDialog = ref(false);

// Handler for saving the game
const handleSaveGame = () => {
  // Determine game result if not already set (e.g., if saved before checkmate/stalemate)
  if (gameResult.value === "In Progress") {
    // You might want to add logic here if saving mid-game should have a specific result,
    // or leave it as "In Progress" / "*" in PGN.
    // For now, we'll let the SaveGameDialog handle the result input.
  }
  showSaveDialog.value = true;
};

// Handle the actual game saving
const saveGame = async (gameData) => {
  // Log the move history at the start of saveGame
  console.log(
    "Move history at start of saveGame:",
    JSON.parse(JSON.stringify(moveHistory.value))
  );
  try {
    // Generate PGN from move history
    const chess = new Chess();
    moveHistory.value.forEach((move) => {
      // Use the Standard Algebraic Notation (SAN) stored in the move history
      if (move.san) {
        try {
          // Apply the move to the chess.js instance
          // Using sloppy: true can help if the SAN isn't perfectly formatted
          chess.move(move.san, { sloppy: true });
        } catch (e) {
          console.warn(
            `Could not apply move SAN "${move.san}" to chess.js instance during PGN generation:`,
            e
          );
          // Consider adding more robust error handling or fallback if needed
        }
      } else {
        console.warn(
          "Move object missing SAN, cannot generate accurate PGN for move:",
          move
        );
        // If SAN is missing, PGN generation might be incomplete or inaccurate
      }
    });

    // Add PGN headers from gameData provided by SaveGameDialog
    const headers = {
      Event: gameData.event || "?",
      Site: gameData.venue || "?",
      Date: gameData.date
        ? new Date(gameData.date).toISOString().split("T")[0].replace(/-/g, ".")
        : "????.??.??", // Format date as YYYY.MM.DD
      Round: gameData.round || "?",
      White: gameData.whitePlayer || "?",
      Black: gameData.blackPlayer || "?",
      Result: ["1-0", "0-1", "1/2-1/2", "*"].includes(gameData.result)
        ? gameData.result
        : "*",
      WhiteElo: gameData.whiteRating || "?",
      BlackElo: gameData.blackRating || "?",
    };
    chess.header(
      "Event",
      headers.Event,
      "Site",
      headers.Site,
      "Date",
      headers.Date,
      "Round",
      headers.Round,
      "White",
      headers.White,
      "Black",
      headers.Black,
      "Result",
      headers.Result,
      "WhiteElo",
      headers.WhiteElo,
      "BlackElo",
      headers.BlackElo
    );

    const pgn = chess.pgn(); // Generate the PGN string with headers
    console.log("Generated PGN:", pgn);

    // Prepare the data payload for the backend
    const gameToSave = {
      ...gameData, // Includes player names, event, site, date, result, ratings from dialog
      moveHistory: moveHistory.value, // Include the detailed move history array
      pgn: pgn, // Include the generated PGN string
    };

    // Format date to ISO string for the backend API
    if (gameToSave.date) {
      gameToSave.date = new Date(gameToSave.date).toISOString();
    } else {
      // Handle case where date might be missing or invalid
      delete gameToSave.date; // Or set to null, depending on backend requirements
    }

    // Ensure ratings are numbers or null
    gameToSave.whiteRating = gameData.whiteRating
      ? parseInt(gameData.whiteRating)
      : null;
    gameToSave.blackRating = gameData.blackRating
      ? parseInt(gameData.blackRating)
      : null;

    // Call the API composable to save the game
    console.log("Saving game data:", gameToSave);
    const result = await createGame(gameToSave);

    if (!result || !result.success) {
      // Use error from result if available, otherwise use saveError ref or a generic message
      throw new Error(
        result?.error || saveError.value || "Failed to save game"
      );
    }

    // Close the dialog on success
    showSaveDialog.value = false;

    // Show success message via modal
    emit("show-modal", "Success", "Game saved successfully!");
  } catch (error) {
    console.error("Error saving game:", error);
    // Show error message via modal
    const errorMessage =
      error.message || "An unexpected error occurred while saving the game.";
    emit("show-modal", "Error", errorMessage);
    // Keep the dialog open on error? Or close it? Currently, it stays open.
    // showSaveDialog.value = false; // Uncomment to close dialog on error
  }
};

// Cancel save
const cancelSave = () => {
  showSaveDialog.value = false;
};
</script>

<style scoped>
.border-blue-600 {
  border: 10px solid #2563eb; /* TailwindCSS blue-600 */
}
.border-10 {
  border-width: 10px;
}
.w-120 {
  width: 30rem; /* 480px */
}

.game-input-view {
  padding-top: 2rem;
}
</style>
