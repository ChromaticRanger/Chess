<script setup>
import { ref, onMounted } from 'vue';
import LoginForm from './LoginForm.vue';
import SignupForm from './SignupForm.vue';
import { useAuth } from '../composables/useAuth';

const { isAuthenticated, fetchCurrentUser } = useAuth();
const showLogin = ref(true);

const emit = defineEmits(['auth-success']);

const handleLoginSuccess = (user) => {
  emit('auth-success', user);
};

const handleSignupSuccess = (user) => {
  emit('auth-success', user);
};

const toggleAuthForm = () => {
  showLogin.value = !showLogin.value;
};

// Check if user is already authenticated
onMounted(async () => {
  const result = await fetchCurrentUser();
  if (result.success) {
    emit('auth-success', result.user);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Log My Chess Games</h1>
        <p class="text-gray-600">Create and Save your Chess Games</p>
      </div>
      
      <!-- Login or Signup Form -->
      <transition name="fade" mode="out-in">
        <LoginForm
          v-if="showLogin"
          @login-success="handleLoginSuccess"
          @show-signup="toggleAuthForm"
        />
        <SignupForm
          v-else
          @signup-success="handleSignupSuccess"
          @show-login="toggleAuthForm"
        />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>