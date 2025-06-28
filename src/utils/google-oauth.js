/**
 * Google OAuth Utilities for Chess App
 * Handles OAuth popup/redirect flows and Google Identity Services integration
 */

// OAuth configuration
const OAUTH_CONFIG = {
  popup: {
    width: 500,
    height: 600,
    features: 'scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
  },
  timeout: 300000, // 5 minutes
  storageKey: 'google_oauth_state'
};

/**
 * Generates a random state parameter for OAuth security
 * @returns {string} Random state string
 */
export const generateOAuthState = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Stores OAuth state in session storage
 * @param {string} state - OAuth state parameter
 */
export const storeOAuthState = (state) => {
  sessionStorage.setItem(OAUTH_CONFIG.storageKey, state);
};

/**
 * Retrieves and validates OAuth state from session storage
 * @param {string} receivedState - State received from OAuth callback
 * @returns {boolean} True if state is valid
 */
export const validateOAuthState = (receivedState) => {
  const storedState = sessionStorage.getItem(OAUTH_CONFIG.storageKey);
  sessionStorage.removeItem(OAUTH_CONFIG.storageKey); // Clean up
  return storedState === receivedState;
};

/**
 * Creates a centered popup window for OAuth flow
 * @param {string} url - OAuth authorization URL
 * @param {string} name - Window name
 * @returns {Window} Popup window reference
 */
export const createOAuthPopup = (url, name = 'google_oauth') => {
  // Calculate center position
  const screenLeft = window.screenLeft || window.screenX;
  const screenTop = window.screenTop || window.screenY;
  const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height = window.innerHeight || document.documentElement.clientHeight || screen.height;
  
  const left = ((width / 2) - (OAUTH_CONFIG.popup.width / 2)) + screenLeft;
  const top = ((height / 2) - (OAUTH_CONFIG.popup.height / 2)) + screenTop;
  
  const features = `${OAUTH_CONFIG.popup.features},width=${OAUTH_CONFIG.popup.width},height=${OAUTH_CONFIG.popup.height},top=${top},left=${left}`;
  
  return window.open(url, name, features);
};

/**
 * Monitors OAuth popup window for completion
 * @param {Window} popup - Popup window reference
 * @param {string} expectedOrigin - Expected origin for security
 * @returns {Promise} Resolves with OAuth result or rejects with error
 */
export const monitorOAuthPopup = (popup, expectedOrigin) => {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    // Timeout handler
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('OAuth popup timed out'));
      }
    }, OAUTH_CONFIG.timeout);
    
    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener('message', messageHandler);
      if (popup && !popup.closed) {
        popup.close();
      }
    };
    
    // Message handler for popup communication
    const messageHandler = (event) => {
      // Verify origin for security
      if (event.origin !== expectedOrigin) {
        return;
      }
      
      if (!resolved) {
        resolved = true;
        cleanup();
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.credential) {
          resolve(event.data);
        } else {
          reject(new Error('No credential received from OAuth popup'));
        }
      }
    };
    
    // Listen for messages from popup
    window.addEventListener('message', messageHandler);
    
    // Check if popup was blocked
    if (!popup || popup.closed) {
      resolved = true;
      cleanup();
      reject(new Error('OAuth popup was blocked. Please allow popups for this site.'));
      return;
    }
    
    // Monitor popup closure (user manually closed)
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('OAuth popup was closed by user'));
        }
      }
    }, 1000);
  });
};

/**
 * Checks if the current device/browser supports popup-based OAuth
 * @returns {boolean} True if popups are supported
 */
export const supportsPopupAuth = () => {
  // Check if we're in a mobile browser or environment that doesn't support popups
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone; // iOS standalone mode
  
  return !isMobile && !isStandalone && typeof window.open === 'function';
};

/**
 * Determines the appropriate OAuth flow (popup vs redirect) for the current environment
 * @returns {string} 'popup' or 'redirect'
 */
export const getPreferredOAuthFlow = () => {
  return supportsPopupAuth() ? 'popup' : 'redirect';
};

/**
 * Builds OAuth authorization URL with proper parameters
 * @param {Object} params - OAuth parameters
 * @returns {string} Complete authorization URL
 */
export const buildOAuthUrl = (params) => {
  const baseUrl = 'https://accounts.google.com/oauth2/v2/auth';
  const urlParams = new URLSearchParams(params);
  return `${baseUrl}?${urlParams.toString()}`;
};

/**
 * Handles OAuth redirect callback (for redirect flow)
 * @returns {Object|null} OAuth result or null if not a callback
 */
export const handleOAuthRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  if (error) {
    return { error: decodeURIComponent(error) };
  }
  
  if (code && state) {
    // Validate state parameter
    if (!validateOAuthState(state)) {
      return { error: 'Invalid OAuth state parameter' };
    }
    
    return { code, state };
  }
  
  return null; // Not an OAuth callback
};

/**
 * Detects if the current page load is from an OAuth redirect
 * @returns {boolean} True if this is an OAuth redirect
 */
export const isOAuthRedirect = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('code') || urlParams.has('error');
};

/**
 * Cleans up OAuth-related URL parameters after processing
 */
export const cleanupOAuthUrl = () => {
  if (isOAuthRedirect()) {
    const url = new URL(window.location);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    window.history.replaceState({}, document.title, url.toString());
  }
};

/**
 * Error handler for common OAuth errors
 * @param {Error} error - OAuth error
 * @returns {string} User-friendly error message
 */
export const handleOAuthError = (error) => {
  const errorMessage = error.message || 'Unknown error';
  
  // Map common OAuth errors to user-friendly messages
  const errorMap = {
    'popup_blocked': 'Please allow popups for this site and try again.',
    'popup_closed_by_user': 'Sign-in was cancelled. Please try again.',
    'access_denied': 'Google sign-in was cancelled or denied.',
    'invalid_request': 'Invalid sign-in request. Please try again.',
    'timeout': 'Sign-in request timed out. Please try again.',
    'network_error': 'Network error occurred. Please check your connection and try again.'
  };
  
  // Check for specific error patterns
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key)) {
      return message;
    }
  }
  
  // Return generic message for unknown errors
  return 'Google sign-in failed. Please try again or use email/password authentication.';
};