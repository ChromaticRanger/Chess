<script setup>
import { ref, defineEmits, defineProps, watch, onUnmounted } from 'vue';

// Import SVG assets
import firstSvg from '/src/assets/first.svg';
import previousSvg from '/src/assets/previous.svg';
import playSvg from '/src/assets/play.svg';
import pauseSvg from '/src/assets/pause.svg';
import nextSvg from '/src/assets/next.svg';
import lastSvg from '/src/assets/last.svg';

// Define props
const props = defineProps({
  moveHistory: {
    type: Array,
    required: true,
    default: () => []
  },
  currentMoveIndex: {
    type: Number,
    default: -1 // -1 indicates we're at the latest move
  }
});

// Define emits
const emit = defineEmits(['move-to-first', 'move-to-previous', 'toggle-play', 'move-to-next', 'move-to-last']);

// State for playback control
const isPlaying = ref(false);
const playbackInterval = ref(null);

// Computed properties for button states
const canGoBack = () => props.currentMoveIndex >= 0 || props.currentMoveIndex === -1 && props.moveHistory.length > 0;
const canGoForward = () => {
  // If at the starting position and there are moves
  if (props.currentMoveIndex === -2 && props.moveHistory.length > 0) {
    return true;
  }
  // If viewing a past move and not the latest move
  if (props.currentMoveIndex >= 0 && props.currentMoveIndex < props.moveHistory.length - 1) {
    return true;
  }
  return false;
};

// Handler functions
const goToFirstMove = () => {
  if (props.moveHistory.length > 0) {
    stopPlayback(); // Stop playback if running
    // Use special index -2 to indicate starting position (before any moves)
    emit('move-to-first', -2);
  }
};

const goToPreviousMove = () => {
  if (canGoBack()) {
    stopPlayback(); // Stop playback if running
    
    // If at the latest move, go to the last move in history
    if (props.currentMoveIndex === -1 && props.moveHistory.length > 0) {
      emit('move-to-previous', props.moveHistory.length - 1);
    } 
    // If at the first move, go to the starting position
    else if (props.currentMoveIndex === 0) {
      emit('move-to-previous', -2); // -2 represents the starting position
    }
    // Otherwise go to the previous move
    else if (props.currentMoveIndex > 0) {
      emit('move-to-previous', props.currentMoveIndex - 1);
    }
  }
};

const goToNextMove = () => {
  if (canGoForward()) {
    stopPlayback(); // Stop playback if running
    
    // If at the starting position (-2), go to the first move (0)
    if (props.currentMoveIndex === -2) {
      emit('move-to-next', 0);
    } 
    // If this will be the last move, go to the latest position (-1) to allow adding new moves
    else if (props.currentMoveIndex === props.moveHistory.length - 2) {
      emit('move-to-last', -1);
    } 
    else {
      emit('move-to-next', props.currentMoveIndex + 1);
    }
  }
};

const goToLastMove = () => {
  stopPlayback(); // Stop playback if running
  emit('move-to-last', -1); // -1 indicates the latest move
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
  // Don't start if we're already at the latest move or if there are no moves
  if (props.currentMoveIndex === -1 || props.moveHistory.length === 0) {
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
      emit('move-to-last', -1);
      stopPlayback();
      return;
    }
    
    // If we're at the starting position (-2), move to the first move (0)
    if (currentIndex === -2) {
      emit('move-to-next', 0);
    }
    // If the next move will be the last move, go to the latest position (-1)
    else if (currentIndex === props.moveHistory.length - 2) {
      emit('move-to-last', -1);
      stopPlayback();
    }
    else {
      // Otherwise, move to the next move
      const nextIndex = currentIndex + 1;
      emit('move-to-next', nextIndex);
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

// Watch for changes to the currentMoveIndex
watch(() => props.currentMoveIndex, (newIndex) => {
  // If we're at the end of the moves and playing, stop playback
  if (newIndex >= props.moveHistory.length - 1 && isPlaying.value) {
    stopPlayback();
  }
});

// Clean up on component unmount
onUnmounted(() => {
  if (playbackInterval.value) {
    clearInterval(playbackInterval.value);
    playbackInterval.value = null;
  }
});
</script>

<template>
  <div class="move-control-panel w-88 flex justify-between items-center bg-gray-100 border border-gray-300 p-2 rounded-md mt-2">
    <button 
      @click="goToFirstMove" 
      class="control-button" 
      :disabled="!props.moveHistory.length"
      title="Go to start"
    >
      <img :src="firstSvg" alt="First Move" class="w-6 h-6" />
    </button>
    
    <button 
      @click="goToPreviousMove" 
      class="control-button" 
      :disabled="!canGoBack()"
      title="Go to previous move"
    >
      <img :src="previousSvg" alt="Previous Move" class="w-6 h-6" />
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
        class="w-6 h-6" 
      />
    </button>
    
    <button 
      @click="goToNextMove" 
      class="control-button" 
      :disabled="!canGoForward()"
      title="Go to next move"
    >
      <img :src="nextSvg" alt="Next Move" class="w-6 h-6" />
    </button>
    
    <button 
      @click="goToLastMove" 
      class="control-button" 
      :disabled="props.currentMoveIndex === -1 || !props.moveHistory.length"
      title="Go to last move"
    >
      <img :src="lastSvg" alt="Last Move" class="w-6 h-6" />
    </button>
  </div>
</template>

<style scoped>
.control-button {
  @apply p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors;
}

.control-button:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-gray-200;
}

/* Match the width of the MoveHistoryList component */
.w-88 {
  width: 22rem; /* 352px */
}
</style>