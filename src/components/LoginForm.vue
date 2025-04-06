<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const { login, isLoading, error } = useAuth();

const email = ref('');
const password = ref('');
const localError = ref('');

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
        <input
          id="password"
          v-model="password"
          type="password"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Enter your password"
          required
        />
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