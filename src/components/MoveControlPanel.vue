<script setup>
import { ref, watch, onUnmounted } from "vue";

// Import SVG assets
import firstSvg from "/src/assets/first.svg";
import previousSvg from "/src/assets/previous.svg";
import playSvg from "/src/assets/play.svg";
import pauseSvg from "/src/assets/pause.svg";
import nextSvg from "/src/assets/next.svg";
import lastSvg from "/src/assets/last.svg";

// Define props
const props = defineProps({
  moveHistory: {
    type: Array,
    required: true,
    default: () => [],
  },
  currentMoveIndex: {
    type: Number,
    default: -1, // -1 indicates we're at the latest move
  },
});

// Define emits
const emit = defineEmits([
  "move-to-first",
  "move-to-previous",
  "toggle-play",
  "move-to-next",
  "move-to-last",
  "take-back-move",
]);

// State for playback control
const isPlaying = ref(false);
const playbackInterval = ref(null);

// Computed properties for button states
const canGoBack = () =>
  // Only enable if:
  // 1. We're at a move index > 0 (not at initial position)
  // 2. OR we're at the current position with moves in history
  props.currentMoveIndex > 0 ||
  (props.currentMoveIndex === -1 && props.moveHistory.length > 0);

const canGoForward = () => {
  // If at the starting position (index 0) and there are moves
  if (props.currentMoveIndex === 0 && props.moveHistory.length > 0) {
    return true;
  }
  // If viewing a past move and not the latest move
  if (
    props.currentMoveIndex > 0 &&
    props.currentMoveIndex <= props.moveHistory.length - 1
  ) {
    return true;
  }
  return false;
};

// New function to check if we can go to the first move
const canGoToFirstMove = () => {
  // Can only go to first move if:
  // 1. There are moves in the history
  // 2. We are not already at the first move (index 0)
  return props.moveHistory.length > 0 && props.currentMoveIndex !== 0;
};

// New function to check if we can go to the last move
const canGoToLastMove = () => {
  // Can only go to last move if:
  // 1. There are moves in the history
  // 2. We are not already at the current position (index -1)
  // 3. We are not already at the last move (moveHistory.length - 1)
  return (
    props.moveHistory.length > 0 &&
    props.currentMoveIndex !== -1 &&
    props.currentMoveIndex !== props.moveHistory.length
  );
};

// Handler functions
const goToFirstMove = () => {
  if (props.moveHistory.length > 0) {
    stopPlayback(); // Stop playback if running
    // Use index 0 to indicate starting position (before any moves)
    emit("move-to-first", 0);
  }
};

const goToPreviousMove = () => {
  if (canGoBack()) {
    stopPlayback(); // Stop playback if running

    // If at the latest move, go to the last move in history
    if (props.currentMoveIndex === -1 && props.moveHistory.length > 0) {
      emit("move-to-previous", props.moveHistory.length - 1);
    }
    // If at the first move, go to the starting position
    else if (props.currentMoveIndex === 1) {
      emit("move-to-previous", 0); // 0 represents the starting position
    }
    // Otherwise go to the previous move
    else if (props.currentMoveIndex > 1) {
      emit("move-to-previous", props.currentMoveIndex - 1);
    }
  }
};

const goToNextMove = () => {
  if (canGoForward()) {
    stopPlayback(); // Stop playback if running

    // If at the starting position (index 0), go to the first move (index 1)
    if (props.currentMoveIndex === 0) {
      emit("move-to-next", 1);
    }
    // If at the last move in history, go to current position (-1)
    else if (props.currentMoveIndex === props.moveHistory.length - 1) {
      emit("move-to-next", -1);
    }
    // Otherwise just increment the move index
    else {
      const nextIndex = props.currentMoveIndex + 1;
      emit("move-to-next", nextIndex);
    }
  }
};

const goToLastMove = () => {
  stopPlayback(); // Stop playback if running
  emit("move-to-last", -1); // -1 indicates the current position (not viewing past moves)
};

// Toggle playback function
const togglePlayback = () => {
  if (isPlaying.value) {
    stopPlayback();
  } else {
    startPlayback();
  }
};

// Start playback
const startPlayback = () => {
  // Don't start if there are no moves
  if (props.moveHistory.length === 0) {
    return;
  }

  // Don't start if we're already at the latest move
  if (props.currentMoveIndex === -1) {
    return;
  }

  // Don't start if we're at the last move in the history
  if (props.currentMoveIndex >= props.moveHistory.length - 1) {
    return;
  }

  isPlaying.value = true;

  // Clear any existing interval
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
  }

  // Set up the playback interval
  playbackInterval.value = setInterval(() => {
    // Get the current index (it may have changed since the interval was set)
    const currentIndex = props.currentMoveIndex;

    // If we're already at the latest state, stop playback
    if (currentIndex === -1) {
      stopPlayback();
      return;
    }

    // If we've reached the last move in history, go to latest position (-1) to allow adding new moves
    if (currentIndex === props.moveHistory.length - 1) {
      emit("move-to-last", -1);
      stopPlayback();
      return;
    }

    // If we're at the starting position (index 0), move to the first move (1)
    if (currentIndex === 0) {
      emit("move-to-next", 1);
    }
    // If the next move will be the last move, go to the latest position (-1)
    else if (currentIndex === props.moveHistory.length - 2) {
      emit("move-to-last", -1);
      stopPlayback();
    } else {
      // Otherwise, move to the next move
      const nextIndex = currentIndex + 1;
      emit("move-to-next", nextIndex);
    }
  }, 1000); // 1 second interval
};

// Stop playback
const stopPlayback = () => {
  isPlaying.value = false;
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
    playbackInterval.value = null;
  }
};

// Function to take back a move
const takeBackMove = () => {
  // Only allow taking back moves when we're at the latest move
  if (props.currentMoveIndex === -1 && props.moveHistory.length > 0) {
    emit("take-back-move");
  }
};

// Check if take back is possible
const canTakeBack = () => {
  // Only allow taking back when we're at the latest position (not viewing past moves) and have moves
  return props.currentMoveIndex === -1 && props.moveHistory.length > 0;
};

// Watch for changes to the currentMoveIndex
watch(
  () => props.currentMoveIndex,
  (newIndex) => {
    // If we're at the end of the moves and playing, stop playback
    if (newIndex >= props.moveHistory.length - 1 && isPlaying.value) {
      stopPlayback();
    }
  }
);

// Clean up on component unmount
onUnmounted(() => {
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
    playbackInterval.value = null;
  }
});
</script>

<template>
  <div
    class="move-control-panel flex justify-between items-center bg-gray-100 border border-gray-300 rounded-md w-full"
  >
    <button
      @click="goToFirstMove"
      class="control-button"
      :disabled="!canGoToFirstMove()"
      title="Go to start"
    >
      <img :src="firstSvg" alt="First Move" />
    </button>

    <button
      @click="goToPreviousMove"
      class="control-button"
      :disabled="!canGoBack()"
      title="Go to previous move"
    >
      <img :src="previousSvg" alt="Previous Move" />
    </button>

    <button
      @click="togglePlayback"
      class="control-button"
      :disabled="!canGoForward() && !isPlaying"
      title="Play/Pause moves"
    >
      <img
        :src="isPlaying ? pauseSvg : playSvg"
        :alt="isPlaying ? 'Pause' : 'Play'"
      />
    </button>

    <button
      @click="goToNextMove"
      class="control-button"
      :disabled="!canGoForward()"
      title="Go to next move"
    >
      <img :src="nextSvg" alt="Next Move" />
    </button>

    <button
      @click="goToLastMove"
      class="control-button"
      :disabled="!canGoToLastMove()"
      title="Go to last move"
    >
      <img :src="lastSvg" alt="Last Move" />
    </button>
  </div>
</template>

<style scoped>
.move-control-panel {
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  height: 36px;
}

/* Mobile-first: Compact buttons */
.control-button {
  @apply rounded-md transition-colors;
  min-width: 36px;
  min-height: 36px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

.control-button img {
  width: 20px;
  height: 20px;
}

/* Desktop (≥ 1000px) */
@media (min-width: 1000px) {
  .move-control-panel {
    gap: 0;
    padding: 0.25rem 0.5rem;
    height: 40px;
  }

  .control-button {
    min-width: auto;
    min-height: auto;
    padding: 6px;
  }

  .control-button img {
    width: 20px;
    height: 20px;
  }
}
</style>
