<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import Piece from './Piece.vue';
import throttle from "lodash/throttle"

const dragging = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);
const selectedIndex = ref(0);

const pieces = ref([
  { id: 0, name: 'Black Rook', image: 'src/assets/R_B.svg', left: 0, top: -800 },
  { id: 1, name: 'Black Knight', image: 'src/assets/Kn_B.svg', left: 100, top: -900 },
  { id: 2, name: 'Black Bishop', image: 'src/assets/B_B.svg', left: 200, top: -1000 },
  { id: 3, name: 'Black Queen', image: 'src/assets/Q_B.svg', left: 300, top: -1100 },
  { id: 4, name: 'Black King', image: 'src/assets/K_B.svg', left: 400, top: -1200 },
  { id: 5, name: 'Black Bishop', image: 'src/assets/B_B.svg', left: 500, top: -1300 },
  { id: 7, name: 'Black Knight', image: 'src/assets/Kn_B.svg', left: 600, top: -1400 },
  { id: 8, name: 'Black Rook', image: 'src/assets/R_B.svg', left: 700, top: -1500 },
  { id: 9, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 0, top: -1500 },
  { id: 10, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 100, top: -1600 },
  { id: 11, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 200, top: -1700 },
  { id: 12, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 300, top: -1800 },
  { id: 13, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 400, top: -1900 },
  { id: 14, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 500, top: -2000 },
  { id: 15, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 600, top: -2100 },
  { id: 16, name: 'Black Pawn', image: 'src/assets/P_B.svg', left: 700, top: -2200 },
  { id: 17, name: 'White Rook', image: 'src/assets/R_W.svg', left: 0, top: -1700 },
  { id: 18, name: 'White Knight', image: 'src/assets/Kn_W.svg', left: 100, top: -1800 },
  { id: 19, name: 'White Bishop', image: 'src/assets/B_W.svg', left: 200, top: -1900 },
  { id: 20, name: 'White Queen', image: 'src/assets/Q_W.svg', left: 300, top: -2000 },
  { id: 21, name: 'White King', image: 'src/assets/K_W.svg', left: 400, top: -2100 },
  { id: 22, name: 'White Bishop', image: 'src/assets/B_W.svg', left: 500, top: -2200 },
  { id: 23, name: 'White Knight', image: 'src/assets/Kn_W.svg', left: 600, top: -2300 },
  { id: 24, name: 'White Rook', image: 'src/assets/R_W.svg', left: 700, top: -2400 },
  { id: 25, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 0, top: -2600 },
  { id: 26, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 100, top: -2700 },
  { id: 27, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 200, top: -2800 },
  { id: 28, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 300, top: -2900 },
  { id: 29, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 400, top: -3000 },
  { id: 30, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 500, top: -3100 },
  { id: 31, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 600, top: -3200 },
  { id: 32, name: 'White Pawn', image: 'src/assets/P_W.svg', left: 700, top: -3300 },
]);

const handleMouseMove = throttle((e) => {
    if (dragging.value) {    
        const diffX = e.clientX - mouseX.value;
        const diffY = e.clientY - mouseY.value;
        pieces.value[selectedIndex.value].left += diffX;
        pieces.value[selectedIndex.value].top += diffY;
    }
    mouseX.value = e.clientX;
    mouseY.value = e.clientY;
}, 16);

const handleMouseUp = () => {
  console.log('The mouse has been released');
  dragging.value = false;
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
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isBlack = (row + col) % 2 === 1;
            result.push({ color: isBlack ? "black": "white" });
        }
    }
    return result;
});
</script>

<template>
    <div class="chessboard">
        <div v-for="(square, index) in squares" :key="index" 
            :class="['square', square.color]">
        </div>
    </div>
    <div class="drag-container">
        <Piece
            v-for="(p, index) in pieces" :key="p.id"
            :class="{ 'z-40': dragging && p.id === selectedIndex }"
            :id="p.id"
            :name="p.name"
            :image="p.image"
            :left="p.left"
            :top="p.top"
            @mousedown="dragging = true; selectedIndex = index"
            :style="{
                cursor: dragging ? 'grabbing' : 'grab'
            }"      
        ></Piece>
    </div>
    {{ mouseX }}, {{ mouseY }}
</template>

<style lang="css" scoped>
.drag-container {
  width: 100;
  height: 100;
}

.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 800px; /* Adjust size as needed */
  height: 800px; /* Adjust size as needed */
}

.square {
  width: 100px;
  height: 100px;
}

.black {
  background-color: #769656;
}

.white {
  background-color: #eeeed2;
}
</style>