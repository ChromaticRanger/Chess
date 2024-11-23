<script setup>
import { ref } from "vue";

const props = defineProps({
  id: Number,
  name: String,
  image: String,
});
</script>

<template>
  <img :alt="props.name" :src="props.image" draggable="false" class="piece" />
</template>

<style lang="css" scoped>
.piece {
  width: 100%;
  height: 100%;
  position: absolute;
}
</style>
