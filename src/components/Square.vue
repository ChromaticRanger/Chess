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
});

const squareClasses = computed(() => {
  return ["square", props.color, { selected: props.selected }];
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
</style>
