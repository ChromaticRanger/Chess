<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Sign in with Google'
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'auth-success', 'auth-error']);

const modalRef = ref(null);

const handleClose = () => {
  if (!props.isLoading) {
    emit('close');
  }
};

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget && !props.isLoading) {
    handleClose();
  }
};

// Handle escape key to close modal
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible && !props.isLoading) {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Focus management for accessibility
const focusModal = () => {
  if (modalRef.value && props.visible) {
    modalRef.value.focus();
  }
};

onMounted(() => {
  if (props.visible) {
    focusModal();
  }
});
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    @click="handleOverlayClick"
  >
    <div 
      ref="modalRef"
      class="bg-white rounded-lg shadow-xl w-96 max-w-[95%] max-h-[95%] overflow-y-auto mx-4 sm:mx-0"
      tabindex="-1"
      role="dialog"
      :aria-label="title"
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 class="font-semibold text-lg text-gray-800">{{ title }}</h3>
        <button
          v-if="!isLoading"
          class="text-gray-400 hover:text-gray-600 text-xl leading-none p-2 rounded-full hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          @click="handleClose"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p class="text-gray-600">Authenticating with Google...</p>
          <p class="text-sm text-gray-500 mt-2">Please complete the process in the popup window</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <div class="text-red-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h4 class="text-lg font-medium text-gray-800 mb-2">Authentication Failed</h4>
          <p class="text-red-500 text-sm mb-4">{{ error }}</p>
          <button
            @click="handleClose"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline transition-colors min-h-[44px] touch-manipulation"
          >
            Try Again
          </button>
        </div>
        
        <!-- Success State -->
        <div v-else class="text-center py-8">
          <div class="text-green-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h4 class="text-lg font-medium text-gray-800 mb-2">Authentication Successful</h4>
          <p class="text-gray-600">You have been successfully signed in with Google.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>