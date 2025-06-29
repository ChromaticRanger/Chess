import crypto from 'crypto';
import { prisma } from '../index.js';

class ProfilePictureService {
  constructor() {
    // Default avatar settings
    this.defaultAvatarSize = 200;
    this.gravatarBaseUrl = 'https://www.gravatar.com/avatar/';
    this.fallbackAvatarService = 'https://ui-avatars.com/api/';
  }

  /**
   * Generate MD5 hash for Gravatar
   * @param {string} email - Email address
   * @returns {string} MD5 hash
   */
  generateEmailHash(email) {
    return crypto
      .createHash('md5')
      .update(email.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Generate Gravatar URL
   * @param {string} email - Email address
   * @param {number} size - Image size (default 200)
   * @param {string} defaultImage - Default image type (identicon, retro, etc.)
   * @returns {string} Gravatar URL
   */
  generateGravatarUrl(email, size = this.defaultAvatarSize, defaultImage = 'identicon') {
    const hash = this.generateEmailHash(email);
    return `${this.gravatarBaseUrl}${hash}?s=${size}&d=${defaultImage}&r=pg`;
  }

  /**
   * Generate initials-based avatar URL
   * @param {Object} user - User object
   * @param {number} size - Image size (default 200)
   * @returns {string} Avatar URL
   */
  generateInitialsAvatar(user, size = this.defaultAvatarSize) {
    const initials = this.getUserInitials(user);
    const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8', '6c757d', 'e83e8c'];
    const colorIndex = user.id ? user.id % colors.length : 0;
    const backgroundColor = colors[colorIndex];
    
    return `${this.fallbackAvatarService}?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=ffffff&size=${size}&bold=true`;
  }

  /**
   * Update user profile picture in database
   * @param {number} userId - User ID
   * @param {string} pictureUrl - Profile picture URL (local or external)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Update result
   */
  async updateUserProfilePicture(userId, pictureUrl, metadata = {}) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          profilePictureUrl: pictureUrl,
          googleProfileData: metadata.googleProfileData ? {
            ...metadata.googleProfileData,
            profilePictureMetadata: {
              lastUpdated: new Date().toISOString(),
              source: metadata.source || 'google',
              localCopy: metadata.localCopy || false
            }
          } : undefined
        },
        select: {
          id: true,
          email: true,
          username: true,
          profilePictureUrl: true,
          authProvider: true
        }
      });

      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      console.error('Database update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process Google profile picture (store URL only)
   * @param {number} userId - User ID
   * @param {string} googlePictureUrl - Google profile picture URL
   * @param {Object} googleProfileData - Additional Google profile data
   * @returns {Promise<Object>} Processing result
   */
  async processGoogleProfilePicture(userId, googlePictureUrl, googleProfileData = {}) {
    try {
      if (!googlePictureUrl) {
        return {
          success: false,
          error: 'No profile picture URL provided'
        };
      }

      // Store Google URL directly (no downloading)
      const metadata = {
        googleProfileData: {
          ...googleProfileData,
          picture: googlePictureUrl,
          profilePictureMetadata: {
            lastUpdated: new Date().toISOString(),
            source: 'google',
            storageType: 'external_url'
          }
        },
        source: 'google'
      };

      // Update user in database with Google URL
      const updateResult = await this.updateUserProfilePicture(userId, googlePictureUrl, metadata);
      
      return {
        success: updateResult.success,
        user: updateResult.user,
        pictureUrl: googlePictureUrl,
        storageType: 'external_url',
        error: updateResult.error
      };
    } catch (error) {
      console.error('Profile picture processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get profile picture URL for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Profile picture information
   */
  async getUserProfilePicture(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          profilePictureUrl: true,
          googleProfileData: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        profilePictureUrl: user.profilePictureUrl,
        hasLocalCopy: user.googleProfileData?.profilePictureMetadata?.localCopy || false,
        metadata: user.googleProfileData?.profilePictureMetadata
      };
    } catch (error) {
      console.error('Get profile picture error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate default avatar URL
   * @param {Object} user - User object
   * @returns {string} Default avatar URL
   */
  generateDefaultAvatar(user) {
    // Try Gravatar first (for email users), then fallback to initials
    if (user.email && user.authProvider !== 'GOOGLE') {
      return this.generateGravatarUrl(user.email);
    }
    
    // Fallback to initials-based avatar
    return this.generateInitialsAvatar(user);
  }

  /**
   * Get user initials for avatar generation
   * @param {Object} user - User object
   * @returns {string} User initials
   */
  getUserInitials(user) {
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }

  /**
   * Get profile picture URL with fallback
   * @param {Object} user - User object
   * @returns {string} Profile picture URL
   */
  getProfilePictureWithFallback(user) {
    // 1. If user has a profile picture URL, use it
    if (user.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    
    // 2. For Google users, check if there's a picture in profile data
    if (user.authProvider?.includes('GOOGLE') && user.googleProfileData?.picture) {
      return user.googleProfileData.picture;
    }
    
    // 3. For email users, use Gravatar
    if (user.email && user.authProvider === 'EMAIL') {
      return this.generateGravatarUrl(user.email);
    }
    
    // 4. Final fallback to initials avatar
    return this.generateInitialsAvatar(user);
  }

  /**
   * Get comprehensive profile picture info
   * @param {Object} user - User object
   * @returns {Object} Profile picture information
   */
  getProfilePictureInfo(user) {
    const url = this.getProfilePictureWithFallback(user);
    
    let source = 'default';
    let storageType = 'external_url';
    
    if (user.profilePictureUrl) {
      if (user.profilePictureUrl.includes('googleusercontent.com')) {
        source = 'google';
      } else if (user.profilePictureUrl.includes('gravatar.com')) {
        source = 'gravatar';
      } else if (user.profilePictureUrl.includes('ui-avatars.com')) {
        source = 'initials';
      } else if (user.profilePictureUrl.startsWith('/uploads/')) {
        source = 'uploaded';
        storageType = 'local';
      }
    } else if (user.authProvider?.includes('GOOGLE')) {
      source = 'google';
    } else if (user.email) {
      source = 'gravatar';
    } else {
      source = 'initials';
    }
    
    return {
      url,
      source,
      storageType,
      hasCustomPicture: !!user.profilePictureUrl
    };
  }

  /**
   * Migrate user from local storage to URL-based storage
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Migration result
   */
  async migrateUserToUrlStorage(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          profilePictureUrl: true,
          authProvider: true,
          googleProfileData: true
        }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // If user has local profile picture, migrate to appropriate URL
      if (user.profilePictureUrl?.startsWith('/uploads/')) {
        let newUrl;
        
        if (user.authProvider?.includes('GOOGLE') && user.googleProfileData?.picture) {
          // Use Google URL
          newUrl = user.googleProfileData.picture;
        } else if (user.email) {
          // Use Gravatar
          newUrl = this.generateGravatarUrl(user.email);
        } else {
          // Use initials avatar
          newUrl = this.generateInitialsAvatar(user);
        }

        // Update user with new URL
        await prisma.user.update({
          where: { id: userId },
          data: { profilePictureUrl: newUrl }
        });

        return {
          success: true,
          oldUrl: user.profilePictureUrl,
          newUrl,
          migrationType: user.authProvider?.includes('GOOGLE') ? 'google' : 'gravatar'
        };
      }

      return {
        success: true,
        message: 'User already using URL-based storage'
      };
    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new ProfilePictureService();