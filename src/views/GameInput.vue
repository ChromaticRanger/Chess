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
                    @current-move-index-changed="handleCurrentMoveIndexChange"
                  />
                </div>
              </div>

              <!-- Move History Component -->
              <div style="width: 352px">
                <MoveHistoryList
                  :move-history="moveHistory"
                  :current-move-index="currentMoveIndex"
                  @move-selected="handleMoveSelection"
                  @reset-board="handleResetBoard"
                  @take-back-move="handleTakeBackMove"
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
                @move-to-first="handleMoveSelection(0)"
                @move-to-previous="handlePreviousMove"
                @move-to-next="handleNextMove"
                @move-to-last="handleMoveSelection(-1)"
                @take-back-move="handleTakeBackMove"
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
import { storeToRefs } from "pinia";
import { useGameStore } from "../stores/game";
import Board from "../components/Board.vue";
import MoveHistoryList from "../components/MoveHistoryList.vue";
import MoveControlPanel from "../components/MoveControlPanel.vue";
import BoardStatusPanel from "../components/BoardStatusPanel.vue";
import GameSavePanel from "../components/GameSavePanel.vue";
import SaveGameDialog from "../components/SaveGameDialog.vue";
import { usePositions } from "../composables/usePositions";

// Emits
const emit = defineEmits(["show-modal"]);

// Pinia Store
const gameStore = useGameStore();
const {
  currentTurn,
  moveHistory,
  capturedPieces,
  boardFlipped,
  gameResult,
  pgn,
  isGameOver,
  isCheckmate,
  isStalemate,
} = storeToRefs(gameStore);
const { setHeaders, resetGame, takeBackMove } = gameStore;

// Get functions from composables
const { createGame, error: saveError } = usePositions();

// Local State
const currentMoveIndex = ref(-1);
const viewingPastMove = ref(false);
const boardComponent = ref(null);
const showSaveDialog = ref(false);

// Event Handlers
const handleCurrentMoveIndexChange = (newIndex) => {
  currentMoveIndex.value = newIndex;
  viewingPastMove.value = newIndex !== -1;
  console.log(
    `Current move index changed to ${newIndex}, viewing past move: ${viewingPastMove.value}`
  );
};

// Save Game Logic
const handleSaveGame = () => {
  showSaveDialog.value = true;
};

const saveGame = async (gameData) => {
  console.log(
    "Move history at start of saveGame:",
    JSON.parse(JSON.stringify(moveHistory.value))
  );
  try {
    setHeaders(
      "Event",
      gameData.event || "?",
      "Site",
      gameData.venue || "?",
      "Date",
      gameData.date
        ? new Date(gameData.date).toISOString().split("T")[0].replace(/-/g, ".")
        : "????.??.??",
      "Round",
      gameData.round || "?",
      "White",
      gameData.whitePlayer || "?",
      "Black",
      gameData.blackPlayer || "?",
      "Result",
      gameData.result || "*",
      "WhiteElo",
      gameData.whiteRating || "?",
      "BlackElo",
      gameData.blackRating || "?"
    );

    const finalPgn = pgn.value;
    console.log("Generated PGN:", finalPgn);

    const gameToSave = {
      name: gameData.name,
      date: gameData.date ? new Date(gameData.date).toISOString() : null,
      venue: gameData.venue,
      event: gameData.event,
      round: gameData.round,
      whitePlayer: gameData.whitePlayer,
      blackPlayer: gameData.blackPlayer,
      whiteRating: gameData.whiteRating ? parseInt(gameData.whiteRating) : null,
      blackRating: gameData.blackRating ? parseInt(gameData.blackRating) : null,
      result: gameData.result,
      description: gameData.description,
      moveHistory: moveHistory.value,
      pgn: finalPgn,
    };

    console.log("Saving game data:", gameToSave);
    const result = await createGame(gameToSave);

    if (!result || !result.success) {
      throw new Error(
        result?.error || saveError.value || "Failed to save game"
      );
    }

    showSaveDialog.value = false;
    emit("show-modal", "Success", "Game saved successfully!");
  } catch (error) {
    console.error("Error saving game:", error);
    const errorMessage =
      error.message || "An unexpected error occurred while saving the game.";
    emit("show-modal", "Error", errorMessage);
  }
};

const cancelSave = () => {
  showSaveDialog.value = false;
};

// Actions passed to children
const handleResetBoard = () => {
  resetGame();
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
};

const handleTakeBackMove = () => {
  takeBackMove();
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
};

const handleMoveSelection = (index) => {
  // Use the board component's new method to restore to the selected move
  if (boardComponent.value) {
    boardComponent.value.restoreBoardStateToMove(index);
  }
  handleCurrentMoveIndexChange(index);
};

const handlePreviousMove = () => {
  // If at the latest move and there are moves, go to the last move in history
  if (currentMoveIndex.value === -1 && moveHistory.value.length > 0) {
    handleMoveSelection(moveHistory.value.length - 1);
  }
  // If already at the first move (index 1), go to initial position (index 0)
  else if (currentMoveIndex.value === 1) {
    handleMoveSelection(0);
  }
  // If at the initial position (index 0), do nothing
  else if (currentMoveIndex.value === 0) {
    // Already at the initial position, no previous move
    return;
  }
  // Otherwise go to the previous move
  else if (currentMoveIndex.value > 1) {
    handleMoveSelection(currentMoveIndex.value - 1);
  }
};

const handleNextMove = () => {
  console.log(
    `handleNextMove called with currentMoveIndex: ${currentMoveIndex.value}, moveHistory.length: ${moveHistory.value.length}`
  );

  // If at the initial position (index 0), go to the first move (index 1)
  if (currentMoveIndex.value === 0 && moveHistory.value.length > 0) {
    console.log(`At initial position, going to first move (index 1)`);
    handleMoveSelection(1);
  }
  // If viewing a past move and not at the end of the history
  else if (
    currentMoveIndex.value > 0 &&
    currentMoveIndex.value < moveHistory.value.length
  ) {
    const nextIndex = currentMoveIndex.value + 1;
    console.log(
      `At move ${currentMoveIndex.value}, going to next move (index ${nextIndex})`
    );
    handleMoveSelection(nextIndex);
  }
  // If at the last move in history, return to current position
  else if (currentMoveIndex.value === moveHistory.value.length) {
    console.log(
      `At last move in history, returning to current position (index -1)`
    );
    handleMoveSelection(-1);
  } else {
    console.log(
      `No condition matched for navigation. CurrentMoveIndex: ${currentMoveIndex.value}, moveHistory.length: ${moveHistory.value.length}`
    );
  }
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
