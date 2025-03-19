<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Notification'
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

// Determine if icon should be displayed
const hasIcon = computed(() => !!props.icon);
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" @click.self="handleClose">
    <div class="bg-white rounded-md shadow-lg w-96 max-w-[90%]">
      <div class="flex justify-between items-center p-3 bg-amber-800 text-white rounded-t-md">
        <h3 class="font-semibold text-lg">{{ title }}</h3>
        <button class="text-2xl leading-none hover:text-gray-300" @click="handleClose">×</button>
      </div>
      <div class="p-5 flex items-start">
        <div v-if="hasIcon" class="mr-4 flex-shrink-0">
          <img :src="icon" alt="Notification icon" class="w-8 h-8" />
        </div>
        <div class="flex-grow">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>