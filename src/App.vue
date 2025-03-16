<script setup>
import Board from "./components/Board.vue";

</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="border-brown border-10 rounded">
      <Board />
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