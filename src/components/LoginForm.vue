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
import { useGoogleAuth } from '../composables/useGoogleAuth';
import { useFormValidation } from '../composables/useFormValidation';
import GoogleSSOButton from './GoogleSSOButton.vue';
import GoogleAuthModal from './GoogleAuthModal.vue';
import AuthDivider from './AuthDivider.vue';

// Password reveal SVG imports
import eyeShowSvg from '/src/assets/eye-24-regular.svg';
import eyeHideSvg from '/src/assets/eye-off-24-regular.svg';

const { login, isLoading, error } = useAuth();
const { 
  googleLogin, 
  isGoogleLoading, 
  googleError, 
  googleAuthModal, 
  hideGoogleAuthModal 
} = useGoogleAuth();
const { 
  validateLoginForm, 
  hasFormContent, 
  validateAuthStateConflict 
} = useFormValidation();

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
  // Clear any existing errors
  localError.value = '';
  
  // Comprehensive form validation
  const validation = validateLoginForm(
    { email: email.value, password: password.value },
    { isTraditionalLoading: isLoading.value, isGoogleLoading: isGoogleLoading.value }
  );
  
  if (!validation.isValid) {
    localError.value = validation.error;
    return;
  }
  
  try {
    const result = await login(email.value, password.value);
    
    if (result.success) {
      // Success callback handling
      console.log('Traditional login successful:', result.user);
      
      // Reset form fields
      email.value = '';
      password.value = '';
      localError.value = '';
      
      // Emit success event
      emit('login-success', result.user);
    } else {
      // Failure callback handling
      console.error('Traditional login failed:', result.error);
      localError.value = result.error || 'Login failed. Please check your credentials.';
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error during login:', error);
    localError.value = 'An unexpected error occurred. Please try again.';
  }
};

const goToSignup = () => {
  emit('show-signup');
};

/**
 * Handle Google SSO login with comprehensive success/failure handling
 */
const handleGoogleLogin = async () => {
  // Mixed authentication validation
  const authConflict = validateAuthStateConflict(isLoading.value, isGoogleLoading.value, 'google');
  if (!authConflict.isValid) {
    localError.value = authConflict.error;
    return;
  }
  
  // Validate that user hasn't partially filled the form
  if (hasFormContent({ email: email.value, password: password.value })) {
    const shouldProceed = window.confirm(
      'You have entered some login information. Using Google sign-in will clear this form. Do you want to continue?'
    );
    if (!shouldProceed) {
      return;
    }
    // Clear form data if user confirms
    email.value = '';
    password.value = '';
  }
  
  // Clear any existing errors before starting
  localError.value = '';
  
  try {
    const result = await googleLogin();
    
    if (result.success) {
      // Success callback handling
      console.log('Google login successful:', result.user);
      
      // Reset form state on success
      email.value = '';
      password.value = '';
      localError.value = '';
      
      // Emit success event with user data
      emit('login-success', result.user);
      
      // Optional: Show success feedback (could be a toast notification)
      // This could be enhanced with a toast/notification system
      
    } else {
      // Failure callback handling
      console.error('Google login failed:', result.error);
      
      // Set error message for user feedback
      localError.value = result.error || 'Google sign-in failed. Please try again.';
      
      // Optional: Analytics/logging for failed attempts
      // trackAuthEvent('google_login_failed', { error: result.error });
    }
  } catch (error) {
    // Handle unexpected errors during the OAuth process
    console.error('Unexpected error during Google login:', error);
    localError.value = 'An unexpected error occurred during Google sign-in. Please try again.';
    
    // Optional: Report to error tracking service
    // reportError('google_login_unexpected_error', error);
  }
};

/**
 * Handle successful Google authentication from native button
 */
const handleGoogleAuthSuccess = async (credential) => {
  // Clear any existing errors
  localError.value = '';
  
  try {
    // Use the useGoogleAuth composable to authenticate with backend
    const { authenticateWithGoogle } = useGoogleAuth();
    const result = await authenticateWithGoogle(credential, false);
    
    if (result.success) {
      console.log('Google login successful:', result.user);
      
      // Reset form state on success
      email.value = '';
      password.value = '';
      localError.value = '';
      
      // Emit success event with user data
      emit('login-success', result.user);
    } else {
      console.error('Google login failed:', result.error);
      localError.value = result.error || 'Google sign-in failed. Please try again.';
    }
  } catch (error) {
    console.error('Unexpected error during Google login:', error);
    localError.value = 'An unexpected error occurred during Google sign-in. Please try again.';
  }
};

/**
 * Handle Google authentication errors from native button
 */
const handleGoogleAuthError = (error) => {
  console.error('Google auth error:', error);
  localError.value = error.message || 'Google sign-in failed. Please try again.';
};

/**
 * Handle Google Auth Modal close event
 * Provides cleanup and logging for modal closure
 */
const handleGoogleModalClose = () => {
  console.log('Google auth modal closed');
  
  // Clear any pending Google errors when modal is closed
  // This ensures a clean state for the next authentication attempt
  if (googleError.value) {
    console.log('Clearing Google auth error on modal close');
  }
  
  // Call the hide function from useGoogleAuth
  hideGoogleAuthModal();
  
  // Optional: Track modal closure for analytics
  // trackAuthEvent('google_modal_closed', { had_error: !!googleError.value });
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
      <div v-if="localError || error || googleError" class="mb-4 text-red-500 text-sm">
        {{ localError || error || googleError }}
      </div>
      
      <!-- Submit Button -->
      <div class="flex items-center justify-between">
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full min-h-[44px] transition-colors"
          :disabled="isLoading || isGoogleLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </div>
      
      <!-- Authentication Method Divider -->
      <AuthDivider 
        text="OR" 
        aria-label="Choose between email/password login or Google sign-in"
      />
      
      <!-- Google SSO Button -->
      <div class="mb-4">
        <GoogleSSOButton 
          :is-loading="isGoogleLoading"
          :disabled="isLoading"
          @google-auth-success="handleGoogleAuthSuccess"
          @google-auth-error="handleGoogleAuthError"
          @google-auth-clicked="handleGoogleLogin"
        />
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
    
    <!-- Google Auth Modal -->
    <GoogleAuthModal 
      :visible="googleAuthModal"
      title="Sign in with Google"
      :is-loading="isGoogleLoading"
      :error="googleError"
      @close="handleGoogleModalClose"
    />
  </div>
</template>

<style scoped>
/* Any additional component-specific styles can go here */
</style>