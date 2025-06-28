import fetch from 'node-fetch';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProfilePictureService {
  constructor() {
    // Define storage paths
    this.uploadsDir = join(__dirname, '../../uploads/profile-pictures');
    this.publicPath = '/uploads/profile-pictures';
    
    // Ensure uploads directory exists
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  ensureUploadsDirectory() {
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Download and store Google profile picture
   * @param {string} googlePictureUrl - URL of Google profile picture
   * @param {string} userId - User ID for filename
   * @returns {Promise<Object>} Storage result
   */
  async downloadGoogleProfilePicture(googlePictureUrl, userId) {
    try {
      if (!googlePictureUrl) {
        return {
          success: false,
          error: 'No profile picture URL provided'
        };
      }

      // Generate filename
      const filename = `user-${userId}-${Date.now()}.jpg`;
      const filePath = join(this.uploadsDir, filename);
      const publicUrl = `${this.publicPath}/${filename}`;

      // Download image from Google
      const response = await fetch(googlePictureUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Save image to local storage
      const fileStream = createWriteStream(filePath);
      
      return new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        
        response.body.on('error', (error) => {
          reject(new Error(`Download stream error: ${error.message}`));
        });
        
        fileStream.on('finish', () => {
          resolve({
            success: true,
            localPath: filePath,
            publicUrl: publicUrl,
            filename: filename,
            originalUrl: googlePictureUrl
          });
        });
        
        fileStream.on('error', (error) => {
          reject(new Error(`File write error: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('Profile picture download error:', error);
      return {
        success: false,
        error: error.message,
        fallbackUrl: googlePictureUrl
      };
    }
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
   * Process Google profile picture (download and store)
   * @param {number} userId - User ID
   * @param {string} googlePictureUrl - Google profile picture URL
   * @param {Object} googleProfileData - Additional Google profile data
   * @returns {Promise<Object>} Processing result
   */
  async processGoogleProfilePicture(userId, googlePictureUrl, googleProfileData = {}) {
    try {
      // Try to download and store locally
      const downloadResult = await this.downloadGoogleProfilePicture(googlePictureUrl, userId);
      
      let finalPictureUrl;
      let metadata = {
        googleProfileData,
        source: 'google'
      };

      if (downloadResult.success) {
        // Use local copy
        finalPictureUrl = downloadResult.publicUrl;
        metadata.localCopy = true;
        metadata.originalGoogleUrl = googlePictureUrl;
      } else {
        // Fall back to Google URL
        finalPictureUrl = googlePictureUrl;
        metadata.localCopy = false;
        metadata.downloadError = downloadResult.error;
      }

      // Update user in database
      const updateResult = await this.updateUserProfilePicture(userId, finalPictureUrl, metadata);
      
      return {
        success: updateResult.success,
        user: updateResult.user,
        pictureUrl: finalPictureUrl,
        localCopy: downloadResult.success,
        downloadResult,
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
    // Use a service like Gravatar or generate initials-based avatar
    const initials = this.getUserInitials(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=200`;
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
    if (user.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    
    return this.generateDefaultAvatar(user);
  }

  /**
   * Remove local profile picture file
   * @param {string} filename - Filename to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeLocalProfilePicture(filename) {
    try {
      const { unlink } = await import('fs/promises');
      const filePath = join(this.uploadsDir, filename);
      
      if (existsSync(filePath)) {
        await unlink(filePath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('File removal error:', error);
      return false;
    }
  }

  /**
   * Clean up old profile pictures for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldProfilePictures(userId) {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(this.uploadsDir);
      
      // Find files for this user (excluding current one)
      const userFiles = files.filter(file => 
        file.startsWith(`user-${userId}-`) && 
        file.endsWith('.jpg')
      );
      
      // Keep only the most recent file, remove others
      if (userFiles.length > 1) {
        const sortedFiles = userFiles.sort().reverse(); // Most recent first
        const filesToRemove = sortedFiles.slice(1); // Remove all except first
        
        let removedCount = 0;
        for (const file of filesToRemove) {
          if (await this.removeLocalProfilePicture(file)) {
            removedCount++;
          }
        }
        
        return {
          success: true,
          removedFiles: removedCount,
          keptFile: sortedFiles[0]
        };
      }
      
      return {
        success: true,
        removedFiles: 0,
        message: 'No old files to clean up'
      };
    } catch (error) {
      console.error('Cleanup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new ProfilePictureService();