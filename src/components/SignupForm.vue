<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useGoogleAuth } from '../composables/useGoogleAuth';
import { useFormValidation } from '../composables/useFormValidation';
import GoogleSSOButton from './GoogleSSOButton.vue';
import GoogleAuthModal from './GoogleAuthModal.vue';
import AuthDivider from './AuthDivider.vue';

const { register, isLoading, error } = useAuth();
const { 
  googleSignup, 
  isGoogleLoading, 
  googleError, 
  googleAuthModal, 
  hideGoogleAuthModal 
} = useGoogleAuth();
const { 
  validateSignupForm, 
  hasFormContent, 
  validateAuthStateConflict 
} = useFormValidation();

const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const localError = ref('');

const emit = defineEmits(['signup-success', 'show-login']);

const handleSignup = async () => {
  // Reset error message
  localError.value = '';
  
  // Comprehensive form validation
  const validation = validateSignupForm(
    { 
      email: email.value, 
      username: username.value, 
      password: password.value, 
      confirmPassword: confirmPassword.value 
    },
    { isTraditionalLoading: isLoading.value, isGoogleLoading: isGoogleLoading.value }
  );
  
  if (!validation.isValid) {
    localError.value = validation.error;
    return;
  }
  
  try {
    // Register user
    const result = await register(email.value, username.value, password.value);
    
    if (result.success) {
      // Success callback handling
      console.log('Traditional signup successful:', result.user);
      
      // Reset form fields
      email.value = '';
      username.value = '';
      password.value = '';
      confirmPassword.value = '';
      localError.value = '';
      
      // Emit success event
      emit('signup-success', result.user);
    } else {
      // Failure callback handling
      console.error('Traditional signup failed:', result.error);
      localError.value = result.error || 'Account creation failed. Please try again.';
    }
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error during signup:', error);
    localError.value = 'An unexpected error occurred. Please try again.';
  }
};

const goToLogin = () => {
  emit('show-login');
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
    const result = await authenticateWithGoogle(credential, true);
    
    if (result.success) {
      console.log('Google signup successful:', result.user);
      
      // Reset form state on success
      email.value = '';
      username.value = '';
      password.value = '';
      confirmPassword.value = '';
      localError.value = '';
      
      // Emit success event with user data
      emit('signup-success', result.user);
    } else {
      console.error('Google signup failed:', result.error);
      localError.value = result.error || 'Google sign-up failed. Please try again.';
    }
  } catch (error) {
    console.error('Unexpected error during Google signup:', error);
    localError.value = 'An unexpected error occurred during Google sign-up. Please try again.';
  }
};

/**
 * Handle Google authentication errors from native button
 */
const handleGoogleAuthError = (error) => {
  console.error('Google auth error:', error);
  localError.value = error.message || 'Google sign-up failed. Please try again.';
};

/**
 * Handle Google SSO signup with comprehensive success/failure handling
 */
const handleGoogleSignup = async () => {
  // Mixed authentication validation
  const authConflict = validateAuthStateConflict(isLoading.value, isGoogleLoading.value, 'google');
  if (!authConflict.isValid) {
    localError.value = authConflict.error;
    return;
  }
  
  // Validate that user hasn't partially filled the form
  const formData = { 
    email: email.value, 
    username: username.value, 
    password: password.value, 
    confirmPassword: confirmPassword.value 
  };
  
  if (hasFormContent(formData)) {
    const shouldProceed = window.confirm(
      'You have entered some account information. Using Google sign-up will clear this form. Do you want to continue?'
    );
    if (!shouldProceed) {
      return;
    }
    // Clear form data if user confirms
    email.value = '';
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
  }
  
  // Clear any existing errors before starting
  localError.value = '';
  
  try {
    const result = await googleSignup();
    
    if (result.success) {
      // Success callback handling
      console.log('Google signup successful:', result.user);
      
      // Reset form state on success
      email.value = '';
      username.value = '';
      password.value = '';
      confirmPassword.value = '';
      localError.value = '';
      
      // Emit success event with user data
      emit('signup-success', result.user);
      
      // Optional: Show success feedback
      // This could be enhanced with a toast/notification system
      
    } else {
      // Failure callback handling
      console.error('Google signup failed:', result.error);
      
      // Set error message for user feedback
      localError.value = result.error || 'Google sign-up failed. Please try again.';
      
      // Optional: Analytics/logging for failed attempts
      // trackAuthEvent('google_signup_failed', { error: result.error });
    }
  } catch (error) {
    // Handle unexpected errors during the OAuth process
    console.error('Unexpected error during Google signup:', error);
    localError.value = 'An unexpected error occurred during Google sign-up. Please try again.';
    
    // Optional: Report to error tracking service
    // reportError('google_signup_unexpected_error', error);
  }
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

</script>

<template>
  <div class="auth-card w-full max-w-md mx-auto p-8 rounded-lg">
    <h2 class="text-2xl font-bold mb-6 text-center text-white">Create Account</h2>

    <form @submit.prevent="handleSignup">
      <!-- Email Field -->
      <div class="mb-4">
        <label for="email" class="block text-gray-300 text-sm font-bold mb-2">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="auth-input w-full py-2 px-3 rounded leading-tight"
          placeholder="Enter your email"
          required
        />
      </div>

      <!-- Username Field -->
      <div class="mb-4">
        <label for="username" class="block text-gray-300 text-sm font-bold mb-2">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          class="auth-input w-full py-2 px-3 rounded leading-tight"
          placeholder="Choose a username"
          required
        />
      </div>

      <!-- Password Field -->
      <div class="mb-4">
        <label for="password" class="block text-gray-300 text-sm font-bold mb-2">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="auth-input w-full py-2 px-3 rounded leading-tight"
          placeholder="Choose a password"
          required
        />
      </div>

      <!-- Confirm Password Field -->
      <div class="mb-6">
        <label for="confirmPassword" class="block text-gray-300 text-sm font-bold mb-2">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          class="auth-input w-full py-2 px-3 rounded leading-tight"
          placeholder="Confirm your password"
          required
        />
      </div>

      <!-- Error Message -->
      <div v-if="localError || error || googleError" class="mb-4 text-red-400 text-sm">
        {{ localError || error || googleError }}
      </div>

      <!-- Submit Button -->
      <div class="flex items-center justify-between">
        <button
          type="submit"
          class="auth-btn-primary w-full min-h-[44px] font-bold py-2 px-4 rounded transition-colors"
          :disabled="isLoading || isGoogleLoading"
        >
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </div>

      <!-- Authentication Method Divider -->
      <AuthDivider
        text="OR"
        bg-color="bg-[#19233a]"
        aria-label="Choose between creating an account with email/password or Google sign-up"
      />

      <!-- Google SSO Button -->
      <div class="mb-4">
        <GoogleSSOButton
          :is-loading="isGoogleLoading"
          :disabled="isLoading"
          @google-auth-success="handleGoogleAuthSuccess"
          @google-auth-error="handleGoogleAuthError"
          @google-auth-clicked="handleGoogleSignup"
        />
      </div>

      <!-- Login Link -->
      <div class="text-center mt-6">
        <p class="text-gray-400 text-sm">
          Already have an account?
          <a
            @click="goToLogin"
            class="text-[#d2b46e] hover:text-[#e8cc8a] cursor-pointer transition-colors"
          >
            Log In
          </a>
        </p>
      </div>
    </form>
    
    <!-- Google Auth Modal -->
    <GoogleAuthModal 
      :visible="googleAuthModal"
      title="Sign up with Google"
      :is-loading="isGoogleLoading"
      :error="googleError"
      @close="handleGoogleModalClose"
    />
  </div>
</template>

<style scoped>
.auth-card {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border: 1px solid rgba(210, 180, 110, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.auth-input {
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  appearance: none;
}

.auth-input:focus {
  outline: none;
  border-color: rgba(210, 180, 110, 0.6);
  box-shadow: 0 0 0 2px rgba(210, 180, 110, 0.15);
}

.auth-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.auth-btn-primary {
  background-color: #d2b46e;
  color: #1e2a3a;
}

.auth-btn-primary:hover:not(:disabled) {
  background-color: #c4a35f;
}

.auth-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>