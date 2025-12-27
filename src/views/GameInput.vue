<template>
  <div class="game-input-view">
    <div
      class="flex-grow flex items-center justify-center"
      style="min-height: calc(100vh - 160px)"
    >
      <div class="flex flex-col">
        <div class="game-container game-layout">
          <!-- Game Save Panel -->
          <div class="panel-save">
            <GameSavePanel @save-game="handleSaveGame" @flip-board="handleFlipBoard" />
          </div>

          <!-- Top Board Status Panel (black side) -->
          <div class="panel-status-top">
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

          <!-- Chess Board -->
          <div class="panel-board">
            <div class="board-border relative">
              <Board
                ref="boardComponent"
                @current-move-index-changed="handleCurrentMoveIndexChange"
              />
              <!-- Annotation Editor Overlay -->
              <MoveAnnotationEditor
                :visible="annotationEditor.visible"
                :move-index="annotationEditor.moveIndex"
                :move-number="annotationEditor.moveNumber"
                :move-notation="annotationEditor.notation"
                :move-color="annotationEditor.color"
                :existing-note="annotationEditor.existingNote"
                @save="handleSaveAnnotation"
                @close="handleCloseAnnotation"
              />
            </div>
          </div>

          <!-- Bottom Board Status Panel (white side) -->
          <div class="panel-status-bottom">
            <BoardStatusPanel
              :current-turn="currentTurn"
              :viewing-past-move="viewingPastMove"
              :captured-pieces="capturedPieces"
              :current-move-index="currentMoveIndex"
              :board-flipped="boardFlipped"
              position="bottom"
              class="w-full"
            />
          </div>

          <!-- Move History -->
          <div class="panel-history">
            <MoveHistoryList
              :move-history="moveHistory"
              :current-move-index="currentMoveIndex"
              @move-selected="handleMoveSelection"
              @reset-board="handleResetBoard"
              @take-back-move="handleTakeBackMove"
              @open-annotation="handleOpenAnnotation"
            />
          </div>

          <!-- Move Control Panel -->
          <div class="panel-controls">
            <MoveControlPanel
              :move-history="moveHistory"
              :current-move-index="currentMoveIndex"
              @move-to-first="handleMoveSelection(0)"
              @move-to-previous="handlePreviousMove"
              @move-to-next="handleNextMove"
              @move-to-last="handleMoveSelection(-1)"
              @take-back-move="handleTakeBackMove"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Save Game Dialog -->
    <SaveGameDialog
      v-if="showSaveDialog"
      :move-history="moveHistory"
      :existing-game-data="gameStore.currentGameMetadata"
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
import MoveAnnotationEditor from "../components/MoveAnnotationEditor.vue";
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
const { setHeaders } = gameStore;
// Don't destructure resetGame and takeBackMove - call on store directly for proper reactivity

// Get functions from composables
const { createGame, updateGame, error: saveError } = usePositions();

// Local State
const currentMoveIndex = ref(-1);
const viewingPastMove = ref(false);
const boardComponent = ref(null);
const showSaveDialog = ref(false);

// Annotation editor state
const annotationEditor = ref({
  visible: false,
  moveIndex: 0,
  moveNumber: 0,
  notation: "",
  color: "White",
  existingNote: "",
});

// Event Handlers
const handleCurrentMoveIndexChange = (newIndex) => {
  currentMoveIndex.value = newIndex;
  viewingPastMove.value = newIndex !== -1;
};

// Save Game Logic
const handleSaveGame = () => {
  showSaveDialog.value = true;
};

const saveGame = async (gameData) => {
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

    // Create the game object to send to the API
    const gameToSave = {
      name: gameData.name,
      description: gameData.description || "",
      date: gameData.date,
      venue: gameData.venue,
      event: gameData.event,
      round: gameData.round,
      whitePlayer: gameData.whitePlayer,
      whiteRating: gameData.whiteRating,
      blackPlayer: gameData.blackPlayer,
      blackRating: gameData.blackRating,
      result: gameData.result,
      moveHistory: moveHistory.value,
      pgn: finalPgn
    };

    let result;
    const isUpdate = typeof gameStore.currentGameId === 'number' && gameStore.currentGameId > 0;

    if (isUpdate) {
      // Update existing game
      result = await updateGame(gameStore.currentGameId, gameToSave);
      // Update the metadata to reflect the latest saved data
      gameStore.currentGameMetadata = gameToSave;
    } else {
      // Create new game
      result = await createGame(gameToSave);

      // Store the game ID and metadata for future incremental saves
      if (result && result.success && result.game && result.game.id) {
        gameStore.currentGameId = result.game.id;
        gameStore.currentGameMetadata = gameToSave;
      }
    }

    if (!result || !result.success) {
      throw new Error(
        result?.error || saveError.value || `Failed to ${isUpdate ? 'update' : 'save'} game`
      );
    }

    showSaveDialog.value = false;
    emit("show-modal", "Success", isUpdate ? "Game updated successfully!" : "Game saved successfully!");
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
  gameStore.resetGame();
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
};

const handleTakeBackMove = () => {
  gameStore.takeBackMove();
  currentMoveIndex.value = -1;
  viewingPastMove.value = false;
};

const handleFlipBoard = () => {
  if (boardComponent.value) {
    boardComponent.value.flipBoard();
  }
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
  // If at the initial position (index 0), go to the first move (index 1)
  if (currentMoveIndex.value === 0 && moveHistory.value.length > 0) {
    handleMoveSelection(1);
  }
  // If viewing a past move and not at the end of the history
  else if (
    currentMoveIndex.value > 0 &&
    currentMoveIndex.value < moveHistory.value.length - 1
  ) {
    const nextIndex = currentMoveIndex.value + 1;
    handleMoveSelection(nextIndex);
  }
  // If at the second-to-last move, go to current position (-1) instead of last move index
  else if (currentMoveIndex.value === moveHistory.value.length - 1) {
    handleMoveSelection(-1);
  }
};

// Annotation editor handlers
const handleOpenAnnotation = (data) => {
  annotationEditor.value = {
    visible: true,
    moveIndex: data.moveIndex,
    moveNumber: data.moveNumber,
    notation: data.notation,
    color: data.color,
    existingNote: data.existingNote || "",
  };
};

const handleSaveAnnotation = (data) => {
  gameStore.updateMoveAnnotation(data.moveIndex, data.annotation);
  annotationEditor.value.visible = false;
};

const handleCloseAnnotation = () => {
  annotationEditor.value.visible = false;
};
</script>

<style scoped>
/* Mobile-first approach */
.game-container {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
}

/* Mobile: Flexbox column layout with order */
.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

/* Mobile order - DOM order is: save, status-top, board, status-bottom, history, controls */
/* Desired mobile order: save(1), status-top(2), board(3), status-bottom(4), history(5), controls(6) */
.panel-save { order: 1; }
.panel-status-top { order: 2; }
.panel-board { order: 3; }
.panel-status-bottom { order: 4; }
.panel-history { order: 5; }
.panel-controls { order: 6; }

/* Mobile: Viewport-based width with padding, max 508px */
.panel-save,
.panel-status-top,
.panel-status-bottom,
.panel-history,
.panel-controls {
  width: calc(100vw - 24px);  /* 12px padding each side */
  max-width: 508px;
}

.panel-board {
  width: calc(100vw - 24px);  /* 12px padding each side */
  max-width: 508px;
}

.board-border {
  border: 4px solid #2563eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.game-input-view {
  padding-top: 0.5rem;
}

/* Tablet and Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .game-container {
    padding: 0 1rem;
  }

  /* Desktop: CSS Grid with 2 columns, 3 rows */
  .game-layout {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto;
    gap: 1.5rem 1.5rem;
    justify-content: center;
  }

  /* Reset order for grid placement */
  .panel-save,
  .panel-status-top,
  .panel-board,
  .panel-status-bottom,
  .panel-history,
  .panel-controls {
    order: 0;
  }

  /* Grid placement: Left column = board-related, Right column = side panels */
  .panel-status-top { grid-column: 1; grid-row: 1; }
  .panel-save { grid-column: 2; grid-row: 1; }
  .panel-board { grid-column: 1; grid-row: 2; }
  .panel-history { grid-column: 2; grid-row: 2; }
  .panel-status-bottom { grid-column: 1; grid-row: 3; }
  .panel-controls { grid-column: 2; grid-row: 3; }

  /* Desktop widths */
  .panel-status-top,
  .panel-board,
  .panel-status-bottom {
    width: calc(min(800px, 90vh, calc(100vw - 450px)) + 20px);
    max-width: none;
  }

  .panel-save,
  .panel-history,
  .panel-controls {
    width: calc(min(800px, 90vh, calc(100vw - 450px)) * 0.43);
    max-width: none;
  }

  .board-border {
    border: clamp(6px, 1vw, 10px) solid #2563eb;
  }

  .game-input-view {
    padding-top: 2rem;
  }
}
</style>
