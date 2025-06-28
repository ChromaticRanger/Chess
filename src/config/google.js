export const googleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  
  scope: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' '),
  
  responseType: 'code',
  redirectUri: `${window.location.origin}/auth/google/callback`,
  
  // Google OAuth endpoints
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  
  // UI configuration
  ui: {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left'
  },
  
  validateConfig() {
    if (!this.clientId) {
      throw new Error('Google OAuth client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID environment variable.');
    }
    
    if (!this.clientId.endsWith('.apps.googleusercontent.com')) {
      throw new Error('Invalid Google OAuth client ID format.');
    }
  }
};

try {
  googleConfig.validateConfig();
} catch (error) {
  console.warn('Google OAuth configuration warning:', error.message);
}