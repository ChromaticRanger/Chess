<script setup>
import { ref, onMounted } from "vue";
import Modal from "./components/Modal.vue";
import AuthPage from "./components/AuthPage.vue";
import SaveGameDialog from "./components/SaveGameDialog.vue"; // Import SaveGameDialog
import { useAuth } from "./composables/useAuth";

// Auth state
const { isAuthenticated, user, logout } = useAuth();
const isAuthenticatedUser = ref(isAuthenticated.value);

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
};

// Handler for logout
const handleLogout = async () => {
  const result = await logout(); // Call the modified logout function

  if (result.showSaveDialog) {
    // If the logout function indicates the save dialog should be shown
    showSaveGameDialog.value = true;
  } else if (result.loggedOut) {
    // If logout proceeded (no game or user chose not to save)
    isAuthenticatedUser.value = false;
    // Navigation is handled within useAuth's logout
  }
};

// Handler for when the Save Game Dialog is closed
const handleSaveDialogClose = async (saved) => {
  showSaveGameDialog.value = false;
  // Whether saved or cancelled, proceed with the actual logout process now
  // The game state should be handled (saved or reset) by now.
  const result = await logout(); // Call logout again to finalize
  if (result.loggedOut) {
    isAuthenticatedUser.value = false;
  }
  // If saving failed within the dialog, the user might still be logged in,
  // but the dialog is closed. Consider if additional error handling is needed here.
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
          <span class="mr-2">{{ user?.username }}</span>
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
    <SaveGameDialog v-if="showSaveGameDialog" @close="handleSaveDialogClose" />
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
