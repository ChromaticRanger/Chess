<script setup>
import { ref, onMounted } from 'vue';
import Board from "./components/Board.vue";

// Track the current turn
const currentTurn = ref("White");

// Handler for turn changes
const handleTurnChange = (newTurn) => {
  currentTurn.value = newTurn;
  console.log("Turn changed to:", newTurn);
};
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div class="border-brown border-10 rounded mb-4">
      <Board 
        ref="boardComponent" 
        @turn-changed="handleTurnChange"
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
</template>

<style scoped>
.border-brown {
  border: 10px solid #8B4513; /* SaddleBrown color */
}
.border-10 {
  border-width: 10px;
}
</style>