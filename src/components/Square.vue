<script setup>
import { computed } from "vue";
import Piece from "./Piece.vue";

const props = defineProps({
  color: String, // 'black' or 'white'
  row: Number,
  col: Number,
  topLeftLabel: String, // Optional label for top left corner of square
  bottomRightLabel: String, // Optional label for bottom right corner of square
  piece: Object, // New prop to hold the piece on the square, if any
  selected: Boolean, // New prop to indicate if the square is selected
  validMove: Boolean, // New prop to indicate if the square is a valid move
});

const squareClasses = computed(() => {
  return [
    "square",
    props.color,
    {
      selected: props.selected,
      validMove: props.validMove,
    },
  ];
});
</script>

<template>
  <div
    :class="squareClasses"
    :style="{
      gridRow: row + 1,
      gridColumn: col + 1,
    }"
  >
    <!-- Optional labels -->
    <span v-if="topLeftLabel" class="label top-left font-semibold">{{
      topLeftLabel
    }}</span>
    <span v-if="bottomRightLabel" class="label bottom-right font-semibold">{{
      bottomRightLabel
    }}</span>
    <!-- Conditionally render the Piece component if a piece is present -->
    <Piece
      v-if="piece"
      :id="piece.id"
      :name="piece.name"
      :image="piece.image"
    />
    <!-- Green circle for valid moves -->
    <div v-if="validMove" class="valid-move-circle"></div>
  </div>
</template>

<style scoped>
.square {
  width: 100px;
  height: 100px;
  position: relative;
}
.label {
  position: absolute;
  font-size: 14px;
  color: rgba(0, 0, 0, 1);
  pointer-events: none;
}
.top-left {
  top: 3px;
  left: 3px;
}
.bottom-right {
  bottom: 0px;
  right: 3px;
}
.black {
  background-color: #769656;
}
.white {
  background-color: #eeeed2;
}
.selected {
  border: 4px solid yellow; /* Highlight the selected square */
}
.valid-move-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 255, 0, 0.8); /* Green color with transparency */
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; /* Ensure the circle does not interfere with mouse events */
}
</style>
