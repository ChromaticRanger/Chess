import jwt from 'jsonwebtoken';

class JWTTokenService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.defaultExpiry = '7d';
    
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Generate JWT token for authenticated user
   * @param {Object} user - User object from database
   * @param {Object} options - Token generation options
   * @returns {string} JWT token
   */
  generateToken(user, options = {}) {
    const {
      expiresIn = this.defaultExpiry,
      includeProfile = false,
      authContext = null
    } = options;

    // Base payload with essential user information
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      authProvider: user.authProvider,
      iat: Math.floor(Date.now() / 1000)
    };

    // Add profile information if requested
    if (includeProfile) {
      payload.profile = {
        profilePictureUrl: user.profilePictureUrl,
        hasGoogleAuth: !!user.googleId,
        hasPasswordAuth: !!user.password
      };
    }

    // Add authentication context for Google users
    if (authContext) {
      payload.authContext = {
        loginMethod: authContext.method || 'unknown',
        loginTimestamp: authContext.timestamp || Date.now(),
        linkedAccount: authContext.linkedAccount || false,
        newAccount: authContext.newAccount || false
      };
    }

    // Add Google-specific information for Google users
    if (user.authProvider === 'GOOGLE' || user.authProvider === 'BOTH') {
      payload.google = {
        hasGoogleId: !!user.googleId,
        emailVerified: user.googleProfileData?.emailVerified || false,
        profileDataAvailable: !!user.googleProfileData
      };
    }

    return jwt.sign(payload, this.secret, { expiresIn });
  }

  /**
   * Generate token specifically for Google OAuth authentication
   * @param {Object} user - User object from database
   * @param {Object} googleAuthDetails - Google authentication details
   * @returns {string} JWT token
   */
  generateGoogleAuthToken(user, googleAuthDetails = {}) {
    const authContext = {
      method: 'google_oauth',
      timestamp: Date.now(),
      linkedAccount: googleAuthDetails.accountLinked || false,
      newAccount: googleAuthDetails.newAccount || false,
      previousAuthProvider: googleAuthDetails.previousAuthProvider
    };

    return this.generateToken(user, {
      expiresIn: this.defaultExpiry,
      includeProfile: true,
      authContext
    });
  }

  /**
   * Generate token for email/password authentication
   * @param {Object} user - User object from database
   * @returns {string} JWT token
   */
  generateEmailAuthToken(user) {
    const authContext = {
      method: 'email_password',
      timestamp: Date.now(),
      linkedAccount: false,
      newAccount: false
    };

    return this.generateToken(user, {
      expiresIn: this.defaultExpiry,
      includeProfile: false,
      authContext
    });
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} Decoded token payload
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Token decode failed: ${error.message}`);
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Refresh token with new expiry
   * @param {string} token - Current valid JWT token
   * @param {string} newExpiry - New expiry time (optional)
   * @returns {string} New JWT token
   */
  refreshToken(token, newExpiry = this.defaultExpiry) {
    try {
      const decoded = this.verifyToken(token);
      
      // Remove JWT standard claims to avoid conflicts
      delete decoded.iat;
      delete decoded.exp;
      delete decoded.nbf;
      
      // Add new issued at time
      decoded.iat = Math.floor(Date.now() / 1000);
      
      return jwt.sign(decoded, this.secret, { expiresIn: newExpiry });
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Extract user ID from token
   * @param {string} token - JWT token
   * @returns {number|null} User ID or null if invalid
   */
  extractUserId(token) {
    try {
      const decoded = this.verifyToken(token);
      return decoded.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract authentication provider from token
   * @param {string} token - JWT token
   * @returns {string|null} Auth provider or null if invalid
   */
  extractAuthProvider(token) {
    try {
      const decoded = this.verifyToken(token);
      return decoded.authProvider || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token represents a Google-authenticated user
   * @param {string} token - JWT token
   * @returns {boolean} True if user authenticated with Google
   */
  isGoogleAuthToken(token) {
    try {
      const decoded = this.verifyToken(token);
      return decoded.authProvider === 'GOOGLE' || 
             decoded.authProvider === 'BOTH' ||
             decoded.authContext?.method === 'google_oauth';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token metadata
   * @param {string} token - JWT token
   * @returns {Object} Token metadata
   */
  getTokenMetadata(token) {
    try {
      const decoded = this.verifyToken(token);
      const now = Math.floor(Date.now() / 1000);
      
      return {
        valid: true,
        userId: decoded.id,
        authProvider: decoded.authProvider,
        issuedAt: decoded.iat,
        expiresAt: decoded.exp,
        timeToExpiry: decoded.exp - now,
        expired: decoded.exp < now,
        authMethod: decoded.authContext?.method,
        hasGoogleAuth: decoded.google?.hasGoogleId || false,
        hasProfileData: !!decoded.profile
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new JWTTokenService();