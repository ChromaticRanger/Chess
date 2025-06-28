import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';
import googleConfig from '../config/google.js';
import GoogleOAuthErrorHandler from './error-handler.js';

class GoogleOAuthService {
  constructor() {
    this.client = new OAuth2Client(googleConfig.clientId);
  }

  /**
   * Verify Google ID token and extract user information
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object>} User information from Google
   */
  async verifyIdToken(idToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: googleConfig.clientId,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
        locale: payload.locale,
        issuedAt: payload.iat,
        expiresAt: payload.exp
      };
    } catch (error) {
      GoogleOAuthErrorHandler.logError(error, 'token_verification', { idToken: idToken.substring(0, 20) + '...' });
      const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'token_verification');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Exchange authorization code for access token and get user profile
   * @param {string} authCode - Authorization code from Google OAuth flow
   * @returns {Promise<Object>} Access token and user profile
   */
  async exchangeCodeForTokens(authCode) {
    try {
      const tokenResponse = await fetch(googleConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleConfig.clientId,
          client_secret: googleConfig.clientSecret,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: googleConfig.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      return {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type || 'Bearer'
      };
    } catch (error) {
      GoogleOAuthErrorHandler.logError(error, 'code_exchange', { authCode: authCode.substring(0, 10) + '...' });
      const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'code_exchange');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Fetch user profile using access token
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} User profile information
   */
  async fetchUserProfile(accessToken) {
    try {
      const profileResponse = await fetch(googleConfig.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(`Profile fetch failed: ${errorData.error_description || errorData.error}`);
      }

      const profileData = await profileResponse.json();
      
      return {
        googleId: profileData.id,
        email: profileData.email,
        emailVerified: profileData.verified_email,
        name: profileData.name,
        givenName: profileData.given_name,
        familyName: profileData.family_name,
        picture: profileData.picture,
        locale: profileData.locale
      };
    } catch (error) {
      GoogleOAuthErrorHandler.logError(error, 'profile_fetch', { accessToken: accessToken.substring(0, 20) + '...' });
      const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'profile_fetch');
      throw new Error(errorInfo.message);
    }
  }

  /**
   * Complete OAuth flow: exchange code for tokens and fetch profile
   * @param {string} authCode - Authorization code from Google OAuth flow
   * @returns {Promise<Object>} Combined token and profile data
   */
  async completeOAuthFlow(authCode) {
    try {
      const tokenData = await this.exchangeCodeForTokens(authCode);
      
      let userProfile;
      
      // Try to get profile from ID token first (faster)
      if (tokenData.idToken) {
        try {
          userProfile = await this.verifyIdToken(tokenData.idToken);
        } catch (idTokenError) {
          console.warn('ID token verification failed, falling back to profile API:', idTokenError.message);
        }
      }
      
      // Fallback to profile API if ID token fails
      if (!userProfile && tokenData.accessToken) {
        userProfile = await this.fetchUserProfile(tokenData.accessToken);
      }
      
      if (!userProfile) {
        throw new Error('Failed to obtain user profile');
      }

      return {
        tokens: tokenData,
        profile: userProfile
      };
    } catch (error) {
      console.error('OAuth flow error:', error);
      throw new Error(`OAuth flow failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Google refresh token
   * @returns {Promise<Object>} New access token data
   */
  async refreshAccessToken(refreshToken) {
    try {
      const refreshResponse = await fetch(googleConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleConfig.clientId,
          client_secret: googleConfig.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData = await refreshResponse.json();
      
      return {
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type || 'Bearer'
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Validate Google OAuth configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfiguration() {
    try {
      googleConfig.validateConfig();
      return true;
    } catch (error) {
      console.error('Google OAuth configuration invalid:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export default new GoogleOAuthService();