<script setup>
const props = defineProps({
  text: {
    type: String,
    default: 'OR'
  },
  bgColor: {
    type: String,
    default: 'bg-white'
  },
  ariaLabel: {
    type: String,
    default: 'Alternative authentication methods'
  }
});
</script>

<template>
  <div 
    class="relative flex items-center justify-center my-6 transition-opacity duration-200" 
    role="separator" 
    :aria-label="ariaLabel"
  >
    <!-- Background line -->
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-gray-300 transition-colors duration-200 hover:border-gray-400"></div>
    </div>
    
    <!-- Text with background -->
    <div class="relative flex justify-center px-4" :class="bgColor">
      <span class="text-sm font-medium text-gray-500 uppercase tracking-wider select-none">
        {{ text }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Enhanced visual effects for the divider */
.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}

/* Subtle animation on hover */
div[role="separator"]:hover .border-gray-300 {
  border-color: #9CA3AF; /* gray-400 */
}

div[role="separator"]:hover span {
  color: #6B7280; /* gray-500 -> gray-600 on hover */
}
</style>