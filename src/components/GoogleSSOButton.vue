<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { googleConfig } from '../config/google.js';
import googleButton from '/src/assets/web_light_sq_ctn.svg';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['google-auth-success', 'google-auth-error']);

const googleButtonRef = ref(null);
const useNativeButton = ref(false);
const isGoogleAvailable = ref(false);
const isInitializingGoogle = ref(true); // Show loading state while trying to initialize Google

const handleGoogleAuth = () => {
  if (!props.disabled && !props.isLoading && !useNativeButton.value) {
    // Fallback: emit the click event for manual handling
    emit('google-auth-clicked');
  }
};

const handleCredentialResponse = (response) => {
  if (response.credential) {
    emit('google-auth-success', response.credential);
  } else {
    emit('google-auth-error', new Error('No credential received from Google'));
  }
};

onMounted(async () => {
  await nextTick();
  
  console.log('GoogleSSOButton mounted, checking for Google services...');
  
  // Set Google availability
  isGoogleAvailable.value = typeof window.google !== 'undefined' && !!window.google.accounts;
  console.log('window.google available:', isGoogleAvailable.value);
  console.log('googleConfig.clientId:', googleConfig.clientId);
  
  // Check if Google Identity Services is available
  if (isGoogleAvailable.value) {
    try {
      console.log('Initializing Google Identity Services...');
      
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: googleConfig.clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // Disable FedCM for now
      });

      // Wait for the next tick and a bit more for the DOM to be ready
      await nextTick();
      setTimeout(() => {
        console.log('Checking googleButtonRef.value:', !!googleButtonRef.value);
        console.log('props.isLoading:', props.isLoading);
        console.log('props.disabled:', props.disabled);
        
        // Try to render the native Google button
        if (googleButtonRef.value && !props.isLoading && !props.disabled) {
          console.log('Rendering native Google button...');
          try {
            window.google.accounts.id.renderButton(googleButtonRef.value, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              width: 250,
              text: 'signin_with',
              shape: 'rectangular'
            });
            useNativeButton.value = true;
            isGoogleAvailable.value = true; // Make sure this is set
            isInitializingGoogle.value = false; // Done initializing
            console.log('Native Google button rendered successfully');
          } catch (renderError) {
            console.warn('Failed to render Google button:', renderError);
            useNativeButton.value = false;
            isInitializingGoogle.value = false; // Done trying
          }
        } else {
          console.warn('Google button ref not available or component is loading/disabled');
          console.warn('  googleButtonRef.value:', !!googleButtonRef.value);
          console.warn('  props.isLoading:', props.isLoading);
          console.warn('  props.disabled:', props.disabled);
          useNativeButton.value = false;
          isInitializingGoogle.value = false; // Done trying
        }
      }, 200);
      
    } catch (error) {
      console.warn('Failed to initialize Google Identity Services:', error);
      useNativeButton.value = false;
      isInitializingGoogle.value = false; // Done trying
    }
  } else {
    console.warn('Google Identity Services not available');
    useNativeButton.value = false;
    isInitializingGoogle.value = false; // Done trying
  }
});
</script>

<template>
  <div class="w-full flex flex-col items-center">
    <!-- Loading state -->
    <div 
      v-if="isLoading" 
      class="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded shadow bg-white text-sm font-bold text-gray-700 min-h-[40px] focus:outline-none focus:shadow-outline"
    >
      <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-3"></div>
      <span>Signing you in...</span>
    </div>
    
    <!-- Loading Google Services -->
    <div 
      v-else-if="isInitializingGoogle"
      class="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded shadow bg-white text-sm text-gray-700 min-h-[40px]"
    >
      <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-3"></div>
      <span>Loading Google Sign-In...</span>
    </div>
    
    <!-- Fallback: Custom Google SVG Button -->
    <img 
      v-else-if="!useNativeButton"
      :src="googleButton" 
      alt="Continue with Google"
      @click="handleGoogleAuth"
      :class="[
        'w-full max-w-[189px] h-[40px] cursor-pointer transition-all duration-200 rounded focus:outline-none focus:shadow-outline',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-sm'
      ]"
      :tabindex="disabled ? -1 : 0"
      @keydown.enter="handleGoogleAuth"
      @keydown.space.prevent="handleGoogleAuth"
      role="button"
      :aria-disabled="disabled"
    />
    
    <!-- Google Button Container (always present, positioned absolutely) -->
    <div 
      ref="googleButtonRef"
      class="w-full justify-center"
      :class="{ 'flex': useNativeButton, 'hidden': !useNativeButton }"
    >
      <!-- This div will be populated by Google's renderButton -->
    </div>
  </div>
</template>

<style scoped>
/* Loading spinner animation */
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

/* Touch-friendly minimum height for mobile */
button {
  min-height: 44px;
}
</style>