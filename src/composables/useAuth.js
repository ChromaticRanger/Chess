import { ref, computed } from "vue";
import axios from "axios";

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

      // Success - navigation will be handled by component

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
    
    // Simple logout - game state management will be handled by components
    localStorage.removeItem("token");
    token.value = null;
    user.value = null;
    
    // Clear auth header
    setAuthHeader(null);
    
    isLoading.value = false;
    return { loggedOut: true, showSaveDialog: false };
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

  // Google OAuth login
  const googleLogin = async (credential) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`${API_URL}/auth/google/login`, {}, {
        headers: {
          'Authorization': `Bearer ${credential}`
        }
      });

      const { user: userData, token: authToken } = response.data;

      // Update state
      user.value = userData;
      token.value = authToken;

      // Store token in localStorage
      localStorage.setItem("token", authToken);

      // Set auth header for future requests
      setAuthHeader(authToken);

      // Success - navigation will be handled by component

      return { success: true, user: userData };
    } catch (err) {
      console.error("Google login error:", err);
      const errorMessage = typeof err.response?.data?.error === 'string' 
        ? err.response.data.error 
        : "Google login failed";
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  // Google OAuth signup
  const googleSignup = async (credential) => {
    isLoading.value = true;
    error.value = "";

    try {
      const response = await axios.post(`${API_URL}/auth/google/signup`, {}, {
        headers: {
          'Authorization': `Bearer ${credential}`
        }
      });

      const { user: userData, token: authToken } = response.data;

      // Update state
      user.value = userData;
      token.value = authToken;

      // Store token in localStorage
      localStorage.setItem("token", authToken);

      // Set auth header for future requests
      setAuthHeader(authToken);

      // Success - navigation will be handled by component

      return { success: true, user: userData };
    } catch (err) {
      console.error("Google signup error:", err);
      const errorMessage = typeof err.response?.data?.error === 'string' 
        ? err.response.data.error 
        : "Google signup failed";
      error.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isLoading.value = false;
    }
  };

  // Authenticate with Google credential (unified method)
  const authenticateWithGoogle = async (credential, isSignup = false) => {
    return isSignup ? googleSignup(credential) : googleLogin(credential);
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
    googleLogin,
    googleSignup,
    authenticateWithGoogle,
  };
}
