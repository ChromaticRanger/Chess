<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import axios from 'axios';

const { register, isLoading, error } = useAuth();

const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const localError = ref('');

const emit = defineEmits(['signup-success', 'show-login']);

const handleSignup = async () => {
  // Reset error message
  localError.value = '';
  
  // Input validation
  if (!email.value || !username.value || !password.value || !confirmPassword.value) {
    localError.value = 'All fields are required';
    return;
  }
  
  // Password validation
  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match';
    return;
  }
  
  if (password.value.length < 8) {
    localError.value = 'Password must be at least 8 characters long';
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    localError.value = 'Please enter a valid email address';
    return;
  }
  
  // Register user
  const result = await register(email.value, username.value, password.value);
  
  if (result.success) {
    // Reset form fields
    email.value = '';
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
    localError.value = '';
    
    // Emit success event
    emit('signup-success', result.user);
  } else {
    localError.value = result.error;
  }
};

const goToLogin = () => {
  emit('show-login');
};

// Test backend connectivity
const testApiConnectivity = async () => {
  try {
    localError.value = 'Testing API connection...';
    const response = await axios.get('http://localhost:3000/api/test');
    console.log('API test successful:', response.data);
    localError.value = 'API is reachable! You can now try to register.';
  } catch (err) {
    console.error('API test failed:', err);
    localError.value = `API connection error: ${err.message}`;
  }
};

onMounted(() => {
  testApiConnectivity();
});
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
    
    <form @submit.prevent="handleSignup">
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
      
      <!-- Username Field -->
      <div class="mb-4">
        <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Choose a username"
          required
        />
      </div>
      
      <!-- Password Field -->
      <div class="mb-4">
        <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Choose a password"
          required
        />
      </div>
      
      <!-- Confirm Password Field -->
      <div class="mb-6">
        <label for="confirmPassword" class="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Confirm your password"
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
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </div>
      
      <!-- Login Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 text-sm">
          Already have an account?
          <a 
            @click="goToLogin" 
            class="text-blue-500 hover:text-blue-700 cursor-pointer"
          >
            Log In
          </a>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Any additional component-specific styles can go here */
</style>