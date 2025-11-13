<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Modal from "./components/Modal.vue";
import AuthPage from "./components/AuthPage.vue";
import SaveGameDialog from "./components/SaveGameDialog.vue"; // Import SaveGameDialog
import { useAuth } from "./composables/useAuth";
import { useGameStore } from "./stores/game"; // Import game store
import { usePositions } from "./composables/usePositions"; // Import usePositions for game saving

// Router and Auth state
const router = useRouter();
const { isAuthenticated, user, logout } = useAuth();
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
  <div v-else class="flex flex-col min-h-screen">
    <!-- Header with user info and logout -->
    <header class="bg-blue-600 text-white p-4">
      <div class="w-full flex justify-between items-center">
        <!-- Title on the very left -->
        <h1 class="text-xl font-bold pl-2">Log My Chess Games</h1>

        <!-- User info and logout on right -->
        <div class="flex items-center pr-2">
          <!-- Profile Picture -->
          <img 
            :src="user?.profilePictureUrl || '/default-avatar.png'"
            :alt="user?.username || 'User'"
            class="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white shadow-sm"
            @error="handleImageError"
          />
          <!-- Username -->
          <span class="mr-3">{{ user?.username }}</span>
          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation bar -->
    <nav class="bg-blue-500 text-white shadow-md">
      <div class="w-full flex justify-center items-center">
        <div class="flex">
          <router-link
            to="/game-input"
            class="py-2 px-6 font-medium hover:bg-blue-600 transition"
            :class="{
              'border-b-2 border-white': $route.path === '/game-input',
            }"
          >
            Game Input
          </router-link>
          <router-link
            to="/game-history"
            class="py-2 px-6 font-medium hover:bg-blue-600 transition"
            :class="{
              'border-b-2 border-white': $route.path === '/game-history',
            }"
          >
            Game History
          </router-link>
          <router-link
            to="/settings"
            class="py-2 px-6 font-medium hover:bg-blue-600 transition"
            :class="{ 'border-b-2 border-white': $route.path === '/settings' }"
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
.border-blue-600 {
  border: 10px solid #2563eb; /* TailwindCSS blue-600 */
}
.border-10 {
  border-width: 10px;
}
.w-120 {
  width: 30rem; /* 480px */
}
</style>
