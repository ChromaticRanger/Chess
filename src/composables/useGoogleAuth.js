import { ref, computed, onMounted } from 'vue';
import { useAuth } from './useAuth';
import { googleConfig } from '../config/google.js';

// Reactive state for Google authentication
const isGoogleLoading = ref(false);
const googleError = ref('');
const googleAuthModal = ref(false);
const googleInitialized = ref(false);

export function useGoogleAuth() {
  const { googleLogin: authGoogleLogin, googleSignup: authGoogleSignup } = useAuth();

  // Computed properties
  const isGoogleAuthInProgress = computed(() => isGoogleLoading.value);
  const hasGoogleError = computed(() => !!googleError.value);

  // Clear Google auth error
  const clearGoogleError = () => {
    googleError.value = '';
  };

  // Show Google auth modal
  const showGoogleAuthModal = () => {
    googleAuthModal.value = true;
    clearGoogleError();
  };

  // Hide Google auth modal
  const hideGoogleAuthModal = () => {
    googleAuthModal.value = false;
    clearGoogleError();
    isGoogleLoading.value = false;
  };

  // Initialize Google Identity Services
  const initializeGoogleAuth = async () => {
    return new Promise((resolve, reject) => {
      // Check if Google Identity Services is available
      if (typeof window.google === 'undefined') {
        reject(new Error('Google Identity Services library not loaded'));
        return;
      }

      try {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: googleConfig.clientId,
          callback: (response) => {
            // This callback will be handled by the signin methods
            console.log('Google Identity Services callback:', response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleInitialized.value = true;
        resolve(true);
      } catch (error) {
        console.error('Failed to initialize Google Identity Services:', error);
        reject(error);
      }
    });
  };

  // Get Google ID token using Google Identity Services
  const getGoogleCredential = async () => {
    return new Promise((resolve, reject) => {
      // Ensure Google Identity Services is initialized
      if (!googleInitialized.value || typeof window.google === 'undefined') {
        reject(new Error('Google Identity Services not initialized'));
        return;
      }

      try {
        // Create a callback that captures the credential
        const handleCredentialResponse = (response) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('No credential received from Google'));
          }
        };

        // Re-initialize with our callback to get ID token
        window.google.accounts.id.initialize({
          client_id: googleConfig.clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        // Create a hidden button and trigger it programmatically
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-1000px';
        tempDiv.style.left = '-1000px';
        tempDiv.style.opacity = '0';
        tempDiv.style.pointerEvents = 'none';
        document.body.appendChild(tempDiv);

        // Render the Google sign-in button
        window.google.accounts.id.renderButton(tempDiv, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          width: 250,
          click_listener: () => {
            // Button clicked, waiting for credential
          }
        });

        // Simulate a click on the button
        setTimeout(() => {
          const button = tempDiv.querySelector('[role="button"]');
          if (button) {
            button.click();
          } else {
            // Fallback: use prompt instead
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                reject(new Error('Google sign-in prompt was not displayed'));
              }
            });
          }
          
          // Clean up the temporary element
          setTimeout(() => {
            if (document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
          }, 5000);
        }, 100);

      } catch (error) {
        console.error('Error getting Google credential:', error);
        reject(error);
      }
    });
  };

  // Authenticate with backend using Google credential
  const authenticateWithGoogle = async (credential, isSignup = false) => {
    try {
      const result = isSignup ? 
        await authGoogleSignup(credential) : 
        await authGoogleLogin(credential);
      
      if (result.success) {
        return { success: true, user: result.user };
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Authentication with Google failed';
        googleError.value = errorMessage;
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      const errorMessage = error.message || 'Authentication with Google failed';
      googleError.value = errorMessage;
      return { success: false, error: errorMessage };
    }
  };

  // Google login flow (fallback for custom button)
  const googleLogin = async () => {
    isGoogleLoading.value = true;
    clearGoogleError();
    showGoogleAuthModal();

    try {
      // This is now a fallback method - the native Google button should handle most cases
      console.warn('Using fallback Google login method. Consider using native Google button.');
      
      // Return error suggesting to use native button
      googleError.value = 'Please use the Google Sign-In button for authentication';
      return { success: false, error: googleError.value };
    } catch (error) {
      console.error('Google login error:', error);
      googleError.value = error.message || 'Google login failed';
      return { success: false, error: googleError.value };
    } finally {
      isGoogleLoading.value = false;
    }
  };

  // Google signup flow (fallback for custom button)
  const googleSignup = async () => {
    isGoogleLoading.value = true;
    clearGoogleError();
    showGoogleAuthModal();

    try {
      // This is now a fallback method - the native Google button should handle most cases
      console.warn('Using fallback Google signup method. Consider using native Google button.');
      
      // Return error suggesting to use native button
      googleError.value = 'Please use the Google Sign-In button for authentication';
      return { success: false, error: googleError.value };
    } catch (error) {
      console.error('Google signup error:', error);
      googleError.value = error.message || 'Google signup failed';
      return { success: false, error: googleError.value };
    } finally {
      isGoogleLoading.value = false;
    }
  };

  // Cleanup function for component unmounting
  const cleanup = () => {
    hideGoogleAuthModal();
    clearGoogleError();
  };

  return {
    // State
    isGoogleLoading,
    googleError,
    googleAuthModal,
    googleInitialized,
    
    // Computed
    isGoogleAuthInProgress,
    hasGoogleError,
    
    // Methods
    clearGoogleError,
    showGoogleAuthModal,
    hideGoogleAuthModal,
    initializeGoogleAuth,
    getGoogleCredential,
    authenticateWithGoogle,
    googleLogin,
    googleSignup,
    cleanup
  };
}