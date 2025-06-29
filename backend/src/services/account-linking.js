import { prisma } from '../index.js';
import profilePictureService from './profile-picture.js';

class AccountLinkingService {
  /**
   * Link Google account to existing email account
   * @param {Object} existingUser - Existing user from database
   * @param {Object} googleUser - Google user information
   * @returns {Promise<Object>} Updated user with linked Google account
   */
  async linkGoogleAccount(existingUser, googleUser) {
    try {
      if (!existingUser || !googleUser) {
        throw new Error('Missing user information for account linking');
      }

      // Verify email addresses match
      if (existingUser.email !== googleUser.email) {
        throw new Error('Email addresses do not match for account linking');
      }

      // Check if Google account is already linked to another user
      const googleUserExists = await prisma.user.findUnique({
        where: { googleId: googleUser.googleId }
      });

      if (googleUserExists && googleUserExists.id !== existingUser.id) {
        throw new Error('Google account is already linked to another user');
      }

      // Determine new auth provider based on current state
      let newAuthProvider;
      if (existingUser.authProvider === 'EMAIL') {
        newAuthProvider = 'BOTH';
      } else if (existingUser.authProvider === 'GOOGLE') {
        // Already has Google, just update data
        newAuthProvider = 'GOOGLE';
      } else {
        // Already BOTH, keep as BOTH
        newAuthProvider = 'BOTH';
      }

      // Process and store profile picture
      let profilePictureResult = null;
      if (googleUser.picture) {
        profilePictureResult = await profilePictureService.processGoogleProfilePicture(
          existingUser.id,
          googleUser.picture,
          {
            name: googleUser.name,
            givenName: googleUser.givenName,
            familyName: googleUser.familyName,
            locale: googleUser.locale,
            emailVerified: googleUser.emailVerified,
            lastUpdated: new Date().toISOString()
          }
        );
      }

      // Update user with Google information
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: googleUser.googleId,
          authProvider: newAuthProvider,
          profilePictureUrl: profilePictureResult?.success ? profilePictureResult.pictureUrl : googleUser.picture,
          googleProfileData: {
            name: googleUser.name,
            givenName: googleUser.givenName,
            familyName: googleUser.familyName,
            locale: googleUser.locale,
            emailVerified: googleUser.emailVerified,
            lastUpdated: new Date().toISOString(),
            profilePictureMetadata: profilePictureResult ? {
              localCopy: profilePictureResult.localCopy,
              originalGoogleUrl: googleUser.picture,
              processedAt: new Date().toISOString()
            } : undefined
          }
        },
        select: {
          id: true,
          email: true,
          username: true,
          authProvider: true,
          profilePictureUrl: true,
          googleId: true,
          createdAt: true
        }
      });

      // Note: No cleanup needed - using external URLs now

      return {
        user: updatedUser,
        linked: true,
        previousAuthProvider: existingUser.authProvider,
        newAuthProvider: newAuthProvider
      };
    } catch (error) {
      console.error('Account linking error:', error);
      throw new Error(`Account linking failed: ${error.message}`);
    }
  }

  /**
   * Check if accounts can be linked
   * @param {Object} existingUser - Existing user from database
   * @param {Object} googleUser - Google user information
   * @returns {Object} Linking eligibility information
   */
  canLinkAccounts(existingUser, googleUser) {
    const reasons = [];
    let canLink = true;

    if (!existingUser || !googleUser) {
      canLink = false;
      reasons.push('Missing user information');
    }

    if (existingUser && googleUser && existingUser.email !== googleUser.email) {
      canLink = false;
      reasons.push('Email addresses do not match');
    }

    if (existingUser && existingUser.googleId && existingUser.googleId !== googleUser.googleId) {
      canLink = false;
      reasons.push('User already linked to different Google account');
    }

    return {
      canLink,
      reasons,
      linkingType: this.determineLinkingType(existingUser, googleUser)
    };
  }

  /**
   * Determine the type of account linking needed
   * @param {Object} existingUser - Existing user from database
   * @param {Object} googleUser - Google user information
   * @returns {string} Type of linking needed
   */
  determineLinkingType(existingUser, googleUser) {
    if (!existingUser) {
      return 'NEW_ACCOUNT';
    }

    if (existingUser.googleId === googleUser.googleId) {
      return 'EXISTING_GOOGLE_ACCOUNT';
    }

    if (existingUser.email === googleUser.email && !existingUser.googleId) {
      return 'LINK_EMAIL_TO_GOOGLE';
    }

    if (existingUser.email === googleUser.email && existingUser.googleId) {
      return 'UPDATE_GOOGLE_INFO';
    }

    return 'NO_LINKING_POSSIBLE';
  }

  /**
   * Find user for Google authentication
   * @param {Object} googleUser - Google user information
   * @returns {Promise<Object>} User search results
   */
  async findUserForGoogleAuth(googleUser) {
    try {
      // Search by Google ID first (most specific)
      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.googleId }
      });

      if (user) {
        return {
          user,
          matchType: 'GOOGLE_ID',
          canAuthenticate: true
        };
      }

      // Search by email
      user = await prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      if (user) {
        const linkingInfo = this.canLinkAccounts(user, googleUser);
        return {
          user,
          matchType: 'EMAIL',
          canAuthenticate: linkingInfo.canLink,
          linkingType: linkingInfo.linkingType,
          reasons: linkingInfo.reasons
        };
      }

      // No existing user found
      return {
        user: null,
        matchType: 'NONE',
        canAuthenticate: false,
        requiresSignup: true
      };
    } catch (error) {
      console.error('User search error:', error);
      throw new Error(`User search failed: ${error.message}`);
    }
  }

  /**
   * Unlink Google account from user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user without Google linking
   */
  async unlinkGoogleAccount(userId) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (!existingUser.googleId) {
        throw new Error('User does not have a linked Google account');
      }

      // Check if user has password for email authentication
      if (!existingUser.password && existingUser.authProvider === 'GOOGLE') {
        throw new Error('Cannot unlink Google account: no password set for email authentication');
      }

      // Update user to remove Google linking
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          googleId: null,
          authProvider: 'EMAIL',
          profilePictureUrl: null,
          googleProfileData: null
        },
        select: {
          id: true,
          email: true,
          username: true,
          authProvider: true,
          profilePictureUrl: true
        }
      });

      return {
        user: updatedUser,
        unlinked: true,
        message: 'Google account successfully unlinked'
      };
    } catch (error) {
      console.error('Account unlinking error:', error);
      throw new Error(`Account unlinking failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new AccountLinkingService();