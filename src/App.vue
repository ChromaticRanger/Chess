<script setup>
import { ref, onMounted, computed } from 'vue';
import Board from "./components/Board.vue";

// Track the current turn
const currentTurn = ref("White");

// Track the move history
const moveHistory = ref([]);

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};

// Handler for move history updates
const handleMoveHistoryUpdate = (newHistory) => {
  moveHistory.value = newHistory;
  console.log("Move history updated in App.vue:", moveHistory.value.length, "moves");
};

// Create a formatted move history for display
const formattedMoveHistory = computed(() => {
  return moveHistory.value.map((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = move.color === "White";
    const captureText = move.capturedPiece ? ` takes ${move.capturedPiece.color} ${move.capturedPiece.type}` : "";
    
    return {
      moveNumber,
      color: move.color,
      text: `${moveNumber}${isWhiteMove ? "." : "..."} ${move.color} ${move.piece} ${move.from.notation} → ${move.to.notation}${captureText}`
    };
  });
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center mr-6">
      <div class="border-brown border-10 rounded mb-4">
        <Board 
          ref="boardComponent" 
          @turn-changed="handleTurnChange"
          @move-history-updated="handleMoveHistoryUpdate"
        />
      </div>
      
      <div class="mb-4 text-lg font-semibold">
        Current turn: {{ currentTurn }}
      </div>
      
      <button 
        @click="$refs.boardComponent.resetBoard()" 
        class="bg-amber-800 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        Reset Board
      </button>
    </div>
    
    <!-- Move History Panel -->
    <div class="w-64 h-96 border border-gray-300 rounded-md overflow-y-auto bg-white shadow-md">
      <div class="p-3 bg-amber-800 text-white font-semibold sticky top-0">
        Move History
      </div>
      <div class="p-2">
        <div v-if="formattedMoveHistory.length === 0" class="text-gray-500 text-center py-4">
          No moves yet
        </div>
        <div 
          v-for="(move, index) in formattedMoveHistory" 
          :key="index"
          class="p-2 border-b border-gray-200 last:border-b-0 text-sm"
          :class="{'bg-gray-100': index % 2 === 0}"
        >
          <span :class="{'font-semibold': move.color === 'White'}">{{ move.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-brown {
  border: 10px solid #8B4513; /* SaddleBrown color */
}
.border-10 {
  border-width: 10px;
}
</style>