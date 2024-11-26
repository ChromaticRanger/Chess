<script setup>
import { ref } from "vue";

const props = defineProps({
  id: Number,
  type: String,
  color: String,
  image: String,
});
</script>

<template>
  <img
    :id="`piece-${props.id}`"
    :alt="`${props.color} ${props.type}`"
    :src="props.image"
    class="piece"
    draggable="false"
  />
</template>

<style lang="css" scoped>
.piece {
  width: 100%;
  height: 100%;
  position: absolute;
}
</style>
