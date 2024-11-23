<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Square from "./Square.vue";
import throttle from "lodash/throttle";

const dragging = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);
// const selectedIndex = ref(0);
// const selectedSquare = ref({ row: null, col: null });

const pieces = ref([
  { id: 0, name: "Black Rook", image: "src/assets/R_B.svg", row: 0, col: 0 },
  { id: 1, name: "Black Knight", image: "src/assets/Kn_B.svg", row: 0, col: 1 },
  { id: 2, name: "Black Bishop", image: "src/assets/B_B.svg", row: 0, col: 2 },
  { id: 3, name: "Black Queen", image: "src/assets/Q_B.svg", row: 0, col: 3 },
  { id: 4, name: "Black King", image: "src/assets/K_B.svg", row: 0, col: 4 },
  { id: 5, name: "Black Bishop", image: "src/assets/B_B.svg", row: 0, col: 5 },
  { id: 6, name: "Black Knight", image: "src/assets/Kn_B.svg", row: 0, col: 6 },
  { id: 7, name: "Black Rook", image: "src/assets/R_B.svg", row: 0, col: 7 },
  { id: 8, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 0 },
  { id: 9, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 1 },
  { id: 10, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 2 },
  { id: 11, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 3 },
  { id: 12, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 4 },
  { id: 13, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 5 },
  { id: 14, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 6 },
  { id: 15, name: "Black Pawn", image: "src/assets/P_B.svg", row: 1, col: 7 },
  { id: 16, name: "White Rook", image: "src/assets/R_W.svg", row: 7, col: 0 },
  {
    id: 17,
    name: "White Knight",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 1,
  },
  { id: 18, name: "White Bishop", image: "src/assets/B_W.svg", row: 7, col: 2 },
  { id: 19, name: "White Queen", image: "src/assets/Q_W.svg", row: 7, col: 3 },
  { id: 20, name: "White King", image: "src/assets/K_W.svg", row: 7, col: 4 },
  { id: 21, name: "White Bishop", image: "src/assets/B_W.svg", row: 7, col: 5 },
  {
    id: 22,
    name: "White Knight",
    image: "src/assets/Kn_W.svg",
    row: 7,
    col: 6,
  },
  { id: 23, name: "White Rook", image: "src/assets/R_W.svg", row: 7, col: 7 },
  { id: 24, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 0 },
  { id: 25, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 1 },
  { id: 26, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 2 },
  { id: 27, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 3 },
  { id: 28, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 4 },
  { id: 29, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 5 },
  { id: 30, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 6 },
  { id: 31, name: "White Pawn", image: "src/assets/P_W.svg", row: 6, col: 7 },
]);

//const handleSquareClick = ({ row, col }) => {
//  selectedSquare.value = { row, col };
//  console.log(`Clicked on square: Row ${row}, Col ${col}`);
//};

//const handlePieceClick = ({ left, top }) => {
//  const { row, col } = getSquareFromCoordinates(left, top);
//  console.log(`Clicked on piece: Row ${row}, Col ${col}`);
//};

//const getSquareFromCoordinates = (x, y) => {
//  const squareSize = 100; // Assuming each square is 100x100 pixels
//  const row = Math.floor(y / squareSize);
//  const col = Math.floor(x / squareSize);
//  return { row, col };
//};

//const handleMouseMove = throttle((e) => {
//  if (dragging.value) {
//    const diffX = e.clientX - mouseX.value;
//    const diffY = e.clientY - mouseY.value;
//    pieces.value[selectedIndex.value].left += diffX;
//    pieces.value[selectedIndex.value].top += diffY;
//  }
//  mouseX.value = e.clientX;
//  mouseY.value = e.clientY;
//}, 16);

//const handleMouseUp = () => {
//  dragging.value = false;
//};

onMounted(() => {
  //window.addEventListener("mousemove", handleMouseMove);
  //window.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  //window.removeEventListener("mousemove", handleMouseMove);
  //window.removeEventListener("mouseup", handleMouseUp);
});

// Generate the chessboard pattern
const squares = computed(() => {
  const result = [];
  const files = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isBlack = (row + col) % 2 === 1;
      const topLeftLabel = col === 0 ? (8 - row).toString() : null; // Left column (1-8)
      const bottomRightLabel = row === 7 ? files[col] : null; // Bottom row (a-h)
      const piece =
        pieces.value.find((p) => p.row === row && p.col === col) || null;
      result.push({
        color: isBlack ? "black" : "white",
        row,
        col,
        topLeftLabel,
        bottomRightLabel,
        piece,
      });
    }
  }
  return result;
});
</script>

<template>
  <div class="chessboard">
    <Square
      v-for="(square, index) in squares"
      :key="index"
      :color="square.color"
      :row="square.row"
      :col="square.col"
      :topLeftLabel="square.topLeftLabel"
      :bottomRightLabel="square.bottomRightLabel"
      :piece="square.piece"
    />
  </div>
</template>

<style lang="css" scoped>
.chessboard {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  width: 800px; /* Adjust size as needed */
  height: 800px; /* Adjust size as needed */
}
</style>
