<script setup>
import { ref } from "vue";

const props = defineProps({
    id: Number,
    name: String,
    image: String,
    left: Number,
    top: Number
});
</script>

<template>
    <img
        :alt="props.name"
        :src="props.image"    
        :style="{
          left: `${props.left}px`,
          top: `${props.top}px`
        }"
        draggable="false"
    />
</template>

<style lang="css" scoped>
img {
  cursor: grab;
  position: relative;
  width: 100px;
  height: 100px;
}
</style>
