<script setup>
import { ref, onMounted } from 'vue';
import LoginForm from './LoginForm.vue';
import SignupForm from './SignupForm.vue';
import { useAuth } from '../composables/useAuth';

import KB from '../assets/K_B.svg';
import KW from '../assets/K_W.svg';
import QB from '../assets/Q_B.svg';
import QW from '../assets/Q_W.svg';
import RB from '../assets/R_B.svg';
import RW from '../assets/R_W.svg';
import BB from '../assets/B_B.svg';
import BW from '../assets/B_W.svg';
import KnB from '../assets/Kn_B.svg';
import KnW from '../assets/Kn_W.svg';
import PB from '../assets/P_B.svg';
import PW from '../assets/P_W.svg';

const pieceAssets = [KB, KW, QB, QW, RB, RW, BB, BW, KnB, KnW, PB, PW];

const { isAuthenticated, fetchCurrentUser } = useAuth();
const showLogin = ref(true);
const backgroundPieces = ref([]);

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

function generateBackgroundPieces(vw, vh) {
  const pieces = [];
  const placed = []; // stored in pixels for overlap checks
  const count = 44;
  const margin = 8; // minimum gap between pieces in px
  // Center exclusion zone (as percentages): avoid placing pieces here
  const cx = { min: 30, max: 70 };
  const cy = { min: 20, max: 80 };

  function overlaps(x, y, size) {
    for (const p of placed) {
      const minDist = (size + p.size) / 2 + margin;
      if (Math.abs(x - p.x) < minDist && Math.abs(y - p.y) < minDist) return true;
    }
    return false;
  }

  let attempts = 0;
  while (pieces.length < count && attempts < 1000) {
    attempts++;
    const leftPct = Math.random() * 100;
    const topPct = Math.random() * 100;
    if (leftPct > cx.min && leftPct < cx.max && topPct > cy.min && topPct < cy.max) continue;

    const size = Math.floor(Math.random() * 60) + 40;
    const x = (leftPct / 100) * vw;
    const y = (topPct / 100) * vh;
    if (overlaps(x, y, size)) continue;

    placed.push({ x, y, size });
    pieces.push({
      src: pieceAssets[Math.floor(Math.random() * pieceAssets.length)],
      left: `${leftPct}%`,
      top: `${topPct}%`,
      rotation: Math.floor(Math.random() * 360),
      size,
      opacity: 0.8,
    });
  }
  return pieces;
}

// Check if user is already authenticated
onMounted(async () => {
  backgroundPieces.value = generateBackgroundPieces(window.innerWidth, window.innerHeight);
  const result = await fetchCurrentUser();
  if (result.success) {
    emit('auth-success', result.user);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
    <!-- Decorative background pieces -->
    <img
      v-for="(piece, i) in backgroundPieces"
      :key="i"
      :src="piece.src"
      class="bg-piece"
      :style="{
        position: 'absolute',
        left: piece.left,
        top: piece.top,
        width: piece.size + 'px',
        height: piece.size + 'px',
        transform: `rotate(${piece.rotation}deg)`,
        opacity: 0.8,
        userSelect: 'none',
      }"
      aria-hidden="true"
    />
    <div class="w-full max-w-md relative z-10">
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