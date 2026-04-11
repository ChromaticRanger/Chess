<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Modal from "./components/Modal.vue";
import AuthPage from "./components/AuthPage.vue";
import SaveGameDialog from "./components/SaveGameDialog.vue"; // Import SaveGameDialog
import { useAuth } from "./composables/useAuth";
import { useGameStore } from "./stores/game"; // Import game store
import { usePositions } from "./composables/usePositions"; // Import usePositions for game saving

// Router and Auth state
const router = useRouter();
const route = useRoute();
const { isAuthenticated, user, logout } = useAuth();

// Mobile nav
const mobileMenuOpen = ref(false);
watch(() => route.path, () => { mobileMenuOpen.value = false; });
const isAuthenticatedUser = ref(isAuthenticated.value);
const gameStore = useGameStore(); // Initialize game store
const { createGame, updateGame } = usePositions(); // Initialize positions API

// Modal state
const modalVisible = ref(false);
const modalTitle = ref("Notification");
const modalMessage = ref("");
const modalIcon = ref("");

// Save Game Dialog state
const showSaveGameDialog = ref(false);

// Function to show the modal
const showModal = (title, message, icon = "") => {
  modalTitle.value = title;
  modalMessage.value = message;
  modalIcon.value = icon;
  modalVisible.value = true;
};

// Function to hide the modal
const hideModal = () => {
  modalVisible.value = false;
};

// Handler for authentication success
const handleAuthSuccess = () => {
  isAuthenticatedUser.value = true;
  // Clear any previous game state to ensure clean board for new user
  gameStore.resetGame();
  // Navigate to the game input page after successful authentication
  router.push('/game-input');
};

// Handler for logout
const handleLogout = async () => {
  // Check if there are unsaved changes in the game
  if (gameStore.hasUnsavedChanges) {
    // Show save dialog if there are unsaved changes
    showSaveGameDialog.value = true;
  } else {
    // No unsaved changes, proceed with logout
    gameStore.resetGame(); // Clear game state
    const result = await logout();
    if (result.loggedOut) {
      isAuthenticatedUser.value = false;
    }
  }
};

// Handler for saving game before logout
const handleSaveBeforeLogout = async (gameData) => {
  try {
    // Set headers in the game store
    gameStore.setHeaders(
      "Event",
      gameData.event || "?",
      "Site",
      gameData.venue || "?",
      "Date",
      gameData.date
        ? new Date(gameData.date).toISOString().split("T")[0].replace(/-/g, ".")
        : "????.??.??",
      "Round",
      gameData.round || "?",
      "White",
      gameData.whitePlayer || "?",
      "Black",
      gameData.blackPlayer || "?",
      "Result",
      gameData.result || "*",
      "WhiteElo",
      gameData.whiteRating || "?",
      "BlackElo",
      gameData.blackRating || "?"
    );

    // Create the game object to send to the API
    const gameToSave = {
      name: gameData.name,
      description: gameData.description || "",
      date: gameData.date,
      venue: gameData.venue,
      event: gameData.event,
      round: gameData.round,
      whitePlayer: gameData.whitePlayer,
      whiteRating: gameData.whiteRating,
      blackPlayer: gameData.blackPlayer,
      blackRating: gameData.blackRating,
      result: gameData.result,
      moveHistory: gameStore.moveHistory,
      pgn: gameStore.pgn
    };

    // Determine if this is an update or new save
    const isUpdate = typeof gameStore.currentGameId === 'number' && gameStore.currentGameId > 0;

    let result;
    if (isUpdate) {
      result = await updateGame(gameStore.currentGameId, gameToSave);
      gameStore.currentGameMetadata = gameToSave;
    } else {
      result = await createGame(gameToSave);
      if (result && result.success && result.game && result.game.id) {
        gameStore.currentGameId = result.game.id;
        gameStore.currentGameMetadata = gameToSave;
      }
    }

    if (result && result.success) {
      gameStore.markGameAsSaved();
      showModal("Success", "Game saved successfully!");
    } else {
      showModal("Error", result?.error || "Failed to save game");
    }
  } catch (error) {
    console.error("Error saving game before logout:", error);
    showModal("Error", "An error occurred while saving the game");
  } finally {
    // Close dialog and proceed with logout regardless of save result
    showSaveGameDialog.value = false;
    gameStore.resetGame();
    const logoutResult = await logout();
    if (logoutResult.loggedOut) {
      isAuthenticatedUser.value = false;
    }
  }
};

// Handler for canceling save before logout
const handleCancelSave = async () => {
  showSaveGameDialog.value = false;
  // User chose not to save, clear the game state and proceed with logout
  gameStore.resetGame();
  const result = await logout();
  if (result.loggedOut) {
    isAuthenticatedUser.value = false;
  }
};

// Handle profile picture loading errors
const handleImageError = (event) => {
  // Fallback to initials-based avatar if image fails to load
  const username = user.value?.username || user.value?.email || 'User';
  const initials = username.charAt(0).toUpperCase();
  const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8', '6c757d', 'e83e8c'];
  const colorIndex = user.value?.id ? user.value.id % colors.length : 0;
  const backgroundColor = colors[colorIndex];
  
  event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=ffffff&size=200&bold=true`;
};

// Add debug info when component is mounted
onMounted(() => {
  // Check if user is already authenticated
  isAuthenticatedUser.value = isAuthenticated.value;
});
</script>

<template>
  <!-- Auth page if not authenticated -->
  <AuthPage v-if="!isAuthenticatedUser" @auth-success="handleAuthSuccess" />

  <!-- Chess app if authenticated -->
  <div v-else class="flex flex-col min-h-dvh">
    <!-- Header with user info and logout -->
    <header class="text-white px-4 py-3">
      <div class="w-full flex justify-between items-center">
        <!-- Title on the very left -->
        <h1 class="text-lg font-semibold tracking-tight pl-1">Log My Chess Games</h1>

        <!-- Desktop: user info and logout -->
        <div class="hidden desktop-user-controls items-center gap-3 pr-1">
          <img
            :src="user?.profilePictureUrl || '/default-avatar.png'"
            :alt="user?.username || 'User'"
            class="size-8 rounded-full object-cover border-2 border-white/40 shadow-sm"
            @error="handleImageError"
          />
          <span class="text-sm text-white/80">{{ user?.username }}</span>
          <button
            @click="handleLogout"
            type="button"
            class="border border-white/25 text-white/80 px-3 py-1.5 rounded text-sm hover:bg-white/10 hover:text-white transition"
          >
            Logout
          </button>
        </div>

        <!-- Mobile: user avatar + hamburger -->
        <div class="flex mobile-header-controls items-center gap-2 pr-1">
          <img
            :src="user?.profilePictureUrl || '/default-avatar.png'"
            :alt="user?.username || 'User'"
            class="size-7 rounded-full object-cover border border-white/40"
            @error="handleImageError"
          />
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            type="button"
            class="p-1.5 rounded hover:bg-white/10 transition"
            :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
            aria-haspopup="true"
            :aria-expanded="mobileMenuOpen"
          >
            <!-- Hamburger -->
            <svg v-if="!mobileMenuOpen" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
            </svg>
            <!-- X -->
            <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile nav panel -->
    <div v-show="mobileMenuOpen" class="mobile-nav-panel text-white">
      <router-link
        to="/game-input"
        class="mobile-nav-link"
        :class="{ 'mobile-nav-link-active': $route.path === '/game-input' }"
      >Game Input</router-link>
      <router-link
        to="/game-history"
        class="mobile-nav-link"
        :class="{ 'mobile-nav-link-active': $route.path === '/game-history' }"
      >Game History</router-link>
      <router-link
        to="/settings"
        class="mobile-nav-link"
        :class="{ 'mobile-nav-link-active': $route.path === '/settings' }"
      >Settings</router-link>
      <div class="border-t border-white/10 px-4 py-3 flex items-center justify-between">
        <span class="text-sm text-white/60">{{ user?.username }}</span>
        <button
          @click="handleLogout"
          type="button"
          class="border border-white/25 text-white/70 px-3 py-1.5 rounded text-sm hover:bg-white/10 transition"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Desktop navigation bar -->
    <nav class="text-white shadow-md desktop-nav">
      <div class="w-full flex justify-center items-center">
        <div class="flex">
          <router-link
            to="/game-input"
            class="py-2 px-6 font-medium nav-link transition"
            :class="{ 'nav-link-active': $route.path === '/game-input' }"
          >
            Game Input
          </router-link>
          <router-link
            to="/game-history"
            class="py-2 px-6 font-medium nav-link transition"
            :class="{ 'nav-link-active': $route.path === '/game-history' }"
          >
            Game History
          </router-link>
          <router-link
            to="/settings"
            class="py-2 px-6 font-medium nav-link transition"
            :class="{ 'nav-link-active': $route.path === '/settings' }"
          >
            Settings
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main content with router view -->
    <main class="flex-grow flex flex-col">
      <router-view @show-modal="showModal"></router-view>
    </main>

    <!-- Modal Component -->
    <Modal
      :visible="modalVisible"
      :title="modalTitle"
      :message="modalMessage"
      :icon="modalIcon"
      @close="hideModal"
    />

    <!-- Save Game Dialog Component -->
    <SaveGameDialog
      v-if="showSaveGameDialog"
      :move-history="gameStore.moveHistory"
      :existing-game-data="gameStore.currentGameMetadata"
      :result="gameStore.gameResult"
      @save="handleSaveBeforeLogout"
      @cancel="handleCancelSave"
    />
  </div>
</template>

<style scoped>
header {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border-bottom: 1px solid rgba(210, 180, 110, 0.3);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
}

/* Desktop nav */
.desktop-nav {
  background: #141e2e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-link {
  color: rgba(255, 255, 255, 0.65);
  border-bottom: 3px solid transparent;
  padding-bottom: calc(0.5rem - 3px);
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-link-active {
  color: #fff;
  border-bottom-color: rgba(210, 180, 110, 0.75);
}

/* Mobile nav panel */
.mobile-nav-panel {
  background: #141e2e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-nav-link {
  display: block;
  padding: 0.75rem 1.25rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.9375rem;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s;
}

.mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.mobile-nav-link-active {
  color: #fff;
  border-left-color: rgba(210, 180, 110, 0.75);
  background: rgba(210, 180, 110, 0.06);
}

/* Breakpoint switching: mobile (<= 999px) shows hamburger, desktop shows tabs */
@media (max-width: 999px) {
  .desktop-nav {
    display: none;
  }

  .desktop-user-controls {
    display: none !important;
  }

  .mobile-header-controls {
    display: flex;
  }
}

@media (min-width: 1000px) {
  .mobile-header-controls {
    display: none !important;
  }

  .desktop-user-controls {
    display: flex;
  }

  .mobile-nav-panel {
    display: none !important;
  }
}
</style>
