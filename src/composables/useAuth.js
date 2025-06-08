import { ref, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/game"; // Import the game store

const API_URL = "http://localhost:3000/api";
const user = ref(null);
const token = ref(localStorage.getItem("token") || "");
const isLoading = ref(false);
const error = ref("");

// Configure axios with the token
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// Initialize auth header from stored token
setAuthHeader(token.value);

export function useAuth() {
  const router = useRouter();
  const gameStore = useGameStore(); // Get the game store instance
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Register a new user
  const register = async (email, username, password) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        password,
      });

      const { user: userData, token: authToken } = response.data;

      // Update state
      user.value = userData;
      token.value = authToken;

      // Store token in localStorage
      localStorage.setItem("token", authToken);

      // Set auth header for future requests
      setAuthHeader(authToken);

      return { success: true, user: userData };
    } catch (err) {
      console.error("Registration error:", err);
      error.value = err.response?.data?.error || "Registration failed";
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Login a user
  const login = async (email, password) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user: userData, token: authToken } = response.data;

      // Update state
      user.value = userData;
      token.value = authToken;

      // Store token in localStorage
      localStorage.setItem("token", authToken);

      // Set auth header for future requests
      setAuthHeader(authToken);

      // Redirect to the game input view
      router.push({ name: 'GameInput' });

      return { success: true, user: userData };
    } catch (err) {
      console.error("Login error:", err);
      error.value = err.response?.data?.error || "Login failed";
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  // Logout a user
  const logout = async () => {
    error.value = null;
    isLoading.value = true;
    let proceedToLogout = true;
    let showSaveDialog = false;

    // Check if there's an active game
    if (gameStore.moveHistory.length > 0) {
      if (
        window.confirm(
          "You have an unsaved game in progress. Do you want to save it before logging out?"
        )
      ) {
        // User wants to save
        proceedToLogout = false; // Don't log out immediately
        showSaveDialog = true; // Signal UI to show save dialog
      } else {
        // User does not want to save, reset the game state
        gameStore.resetGame();
      }
    }

    if (proceedToLogout) {
      // Clear local storage and state
      localStorage.removeItem("token");
      token.value = null;
      user.value = null;
      // Optionally reset game state again just in case, though handled above
      // gameStore.resetGame();
      router.push("/auth"); // Redirect to login/signup page
    }

    isLoading.value = false;
    // Return an indicator if the save dialog should be shown
    return { loggedOut: proceedToLogout, showSaveDialog: showSaveDialog };
  };

  // Get current user
  const fetchCurrentUser = async () => {
    // If no token or already have user data, return early
    if (!token.value) return { success: false };
    if (user.value) return { success: true, user: user.value };

    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      user.value = response.data.user;
      return { success: true, user: user.value };
    } catch (err) {
      console.error("Fetch user error:", err);
      // If unauthorized, clear token
      if (err.response?.status === 401) {
        logout();
      }
      error.value = err.response?.data?.error || "Failed to fetch user data";
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    fetchCurrentUser,
  };
}
