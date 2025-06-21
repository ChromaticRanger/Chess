<script setup>
/**
 * LoginForm.vue - Authentication form with password reveal toggle
 * 
 * Features:
 * - Standard email/password login form
 * - Password visibility toggle with eye icon
 * - Keyboard accessibility (Enter/Space key support)
 * - ARIA labels for screen readers
 * - Responsive design with 44px touch targets
 * - Security: Password visibility resets on navigation/unmount
 * 
 * Password Reveal Implementation:
 * - Eye icon positioned absolutely at right edge of password field
 * - Toggle between 'password' and 'text' input types
 * - Dynamic icon switching (open eye = show, closed eye = hide)
 * - Uses eye-24-regular.svg and eye-off-24-regular.svg assets
 */
import { ref, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth';

// Password reveal SVG imports
import eyeShowSvg from '/src/assets/eye-24-regular.svg';
import eyeHideSvg from '/src/assets/eye-off-24-regular.svg';

const { login, isLoading, error } = useAuth();

const email = ref('');
const password = ref('');
const localError = ref('');

/**
 * Reactive state for password field visibility toggle
 * @type {Ref<boolean>} - true when password is visible as text, false when hidden
 */
const showPassword = ref(false);

const emit = defineEmits(['login-success', 'show-signup']);

const handleLogin = async () => {
  // Input validation
  if (!email.value || !password.value) {
    localError.value = 'Please enter both email and password';
    return;
  }
  
  const result = await login(email.value, password.value);
  
  if (result.success) {
    // Reset form fields
    email.value = '';
    password.value = '';
    localError.value = '';
    
    // Emit success event
    emit('login-success', result.user);
  } else {
    localError.value = result.error;
  }
};

const goToSignup = () => {
  emit('show-signup');
};

/**
 * Toggles the visibility state of the password field
 * Changes between password (hidden) and text (visible) input types
 * Updates the eye icon to reflect current state
 * @function
 */
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

/**
 * Lifecycle hook to clean up password visibility state
 * Resets password to hidden state when component is unmounted for security
 * @function
 */
onUnmounted(() => {
  showPassword.value = false;
});
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Log In</h2>
    
    <form @submit.prevent="handleLogin">
      <!-- Email Field -->
      <div class="mb-4">
        <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Enter your email"
          required
        />
      </div>
      
      <!-- Password Field -->
      <div class="mb-6">
        <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
        <div class="relative">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="shadow appearance-none border rounded w-full py-2 px-3 pr-12 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            @keydown.enter="togglePasswordVisibility"
            @keydown.space.prevent="togglePasswordVisibility"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
          >
            <img :src="showPassword ? eyeHideSvg : eyeShowSvg" alt="" class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="localError || error" class="mb-4 text-red-500 text-sm">
        {{ localError || error }}
      </div>
      
      <!-- Submit Button -->
      <div class="flex items-center justify-between">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </div>
      
      <!-- Sign Up Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 text-sm">
          Don't have an account?
          <a 
            @click="goToSignup" 
            class="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            Sign Up
          </a>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Any additional component-specific styles can go here */
</style>