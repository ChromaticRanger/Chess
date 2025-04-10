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
  },
  showActions: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  confirmClass: {
    type: String,
    default: 'bg-blue-600 hover:bg-blue-700'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
});

const emit = defineEmits(['close', 'confirm']);

const handleClose = () => {
  emit('close');
};

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

// Determine if icon should be displayed
const hasIcon = computed(() => !!props.icon);
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" @click.self="handleClose">
    <div class="bg-white rounded-md shadow-lg w-96 max-w-[90%]">
      <div class="flex justify-between items-center p-3 bg-blue-600 text-white rounded-t-md">
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
      <div v-if="showActions" class="p-3 bg-gray-100 rounded-b-md flex justify-end space-x-2">
        <button 
          class="px-4 py-2 rounded text-sm font-medium bg-gray-300 hover:bg-gray-400 transition-colors"
          @click="handleClose"
        >
          {{ cancelText }}
        </button>
        <button 
          class="px-4 py-2 rounded text-sm font-medium text-white transition-colors"
          :class="confirmClass"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>