import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { extractGoogleUser } from '../middleware/google-auth.js';
import accountLinkingService from '../services/account-linking.js';
import profilePictureService from '../services/profile-picture.js';
import jwtTokenService from '../services/jwt-token.js';
import GoogleOAuthErrorHandler from '../services/error-handler.js';
import { validateGoogleUserData } from '../middleware/validation.js';

// Register a new user
export const register = async (c) => {
  try {
    const { email, username, password } = await c.req.json();
    
    // Check if required fields are present
    if (!email || !username || !password) {
      return c.json({ error: 'Email, username and password are required' }, 400);
    }
    
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return c.json({ error: 'Email already in use' }, 400);
      }
      if (existingUser.username === username) {
        return c.json({ error: 'Username already taken' }, 400);
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });
    
    // Generate JWT token for email registration
    const token = jwtTokenService.generateEmailAuthToken(user);
    
    return c.json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Login a user
export const login = async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Check if required fields are present
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT token for email login
    const token = jwtTokenService.generateEmailAuthToken(user);
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Google OAuth login for existing users
export const googleLogin = async (c) => {
  try {
    const googleUser = extractGoogleUser(c);
    
    if (!googleUser) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'google_user', 
        null, 
        'Google user information not found'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }

    // Validate Google user data
    const validationErrors = validateGoogleUserData(googleUser);
    if (validationErrors.length > 0) {
      return c.json({
        error: 'Invalid Google user data',
        validationErrors: validationErrors.map(err => GoogleOAuthErrorHandler.createErrorResponse(err))
      }, 400);
    }
    
    // Use account linking service to find and authenticate user
    const searchResult = await accountLinkingService.findUserForGoogleAuth(googleUser);
    
    if (!searchResult.user) {
      return c.json({ 
        error: 'No account found with this email. Please sign up first.',
        suggestSignup: true 
      }, 404);
    }
    
    const existingUser = searchResult.user;
    
    // Handle account linking for email-only accounts
    if (searchResult.matchType === 'EMAIL' && searchResult.canAuthenticate) {
      if (searchResult.linkingType === 'LINK_EMAIL_TO_GOOGLE') {
        const linkingResult = await accountLinkingService.linkGoogleAccount(existingUser, googleUser);
        
        // Generate JWT token for Google account linking
        const token = jwtTokenService.generateGoogleAuthToken(linkingResult.user, {
          accountLinked: true,
          newAccount: false,
          previousAuthProvider: linkingResult.previousAuthProvider
        });
        
        return c.json({
          user: linkingResult.user,
          token,
          accountLinked: true,
          message: 'Google account successfully linked to existing account',
          previousAuthProvider: linkingResult.previousAuthProvider,
          newAuthProvider: linkingResult.newAuthProvider
        });
      }
    }
    
    // Handle existing Google account authentication
    if (searchResult.matchType === 'GOOGLE_ID' || 
        (searchResult.matchType === 'EMAIL' && existingUser.googleId === googleUser.googleId)) {
      
      // Update profile information
      const linkingResult = await accountLinkingService.linkGoogleAccount(existingUser, googleUser);
      
      // Generate JWT token for existing Google account
      const token = jwtTokenService.generateGoogleAuthToken(linkingResult.user, {
        accountLinked: false,
        newAccount: false
      });
      
      return c.json({
        user: linkingResult.user,
        token
      });
    }
    
    // Cannot authenticate
    return c.json({ 
      error: 'Authentication failed',
      reasons: searchResult.reasons 
    }, 401);
    
  } catch (error) {
    GoogleOAuthErrorHandler.logError(error, 'google_login', { 
      userId: googleUser?.email,
      searchResult: searchResult?.matchType 
    });
    
    const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'google_login');
    const errorResponse = GoogleOAuthErrorHandler.createErrorResponse(errorInfo);
    
    return c.json(errorResponse, errorInfo.statusCode);
  }
};

// Google OAuth signup for new users
export const googleSignup = async (c) => {
  try {
    const googleUser = extractGoogleUser(c);
    
    if (!googleUser) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'google_user', 
        null, 
        'Google user information not found'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }

    // Validate Google user data
    const validationErrors = validateGoogleUserData(googleUser);
    if (validationErrors.length > 0) {
      return c.json({
        error: 'Invalid Google user data',
        validationErrors: validationErrors.map(err => GoogleOAuthErrorHandler.createErrorResponse(err))
      }, 400);
    }
    
    // Use account linking service to check for existing accounts
    const searchResult = await accountLinkingService.findUserForGoogleAuth(googleUser);
    
    if (searchResult.user) {
      return c.json({ 
        error: 'Account already exists. Please login instead.',
        suggestLogin: true,
        matchType: searchResult.matchType
      }, 409);
    }
    
    // Generate username from email
    const emailUsername = googleUser.email.split('@')[0];
    let username = emailUsername;
    
    // Check if username is taken and generate unique one
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${emailUsername}${counter}`;
      counter++;
    }
    
    // Create new user with Google authentication (without profile picture first)
    const newUser = await prisma.user.create({
      data: {
        email: googleUser.email,
        username,
        googleId: googleUser.googleId,
        authProvider: 'GOOGLE',
        googleProfileData: {
          name: googleUser.name,
          givenName: googleUser.givenName,
          familyName: googleUser.familyName,
          locale: googleUser.locale,
          emailVerified: googleUser.emailVerified
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        authProvider: true,
        profilePictureUrl: true
      }
    });

    // Process and store profile picture after user creation
    let profilePictureResult = null;
    if (googleUser.picture) {
      profilePictureResult = await profilePictureService.processGoogleProfilePicture(
        newUser.id,
        googleUser.picture,
        {
          name: googleUser.name,
          givenName: googleUser.givenName,
          familyName: googleUser.familyName,
          locale: googleUser.locale,
          emailVerified: googleUser.emailVerified
        }
      );

      // Update user with profile picture URL if processing succeeded
      if (profilePictureResult?.success) {
        await prisma.user.update({
          where: { id: newUser.id },
          data: {
            profilePictureUrl: profilePictureResult.pictureUrl
          }
        });
        newUser.profilePictureUrl = profilePictureResult.pictureUrl;
      }
    }
    
    // Generate JWT token for new Google account
    const token = jwtTokenService.generateGoogleAuthToken(newUser, {
      accountLinked: false,
      newAccount: true
    });
    
    return c.json({
      user: newUser,
      token,
      message: 'Account created successfully with Google authentication',
      profilePictureProcessed: !!profilePictureResult?.success
    });
    
  } catch (error) {
    GoogleOAuthErrorHandler.logError(error, 'google_signup', { 
      userId: googleUser?.email,
      searchResult: searchResult?.matchType 
    });
    
    const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'google_signup');
    const errorResponse = GoogleOAuthErrorHandler.createErrorResponse(errorInfo);
    
    return c.json(errorResponse, errorInfo.statusCode);
  }
};

// Get the current user
export const getCurrentUser = async (c) => {
  try {
    const user = c.get('user');
    
    // Add profile picture with fallback
    const userWithPicture = {
      ...user,
      profilePictureUrl: profilePictureService.getProfilePictureWithFallback(user)
    };
    
    return c.json({ user: userWithPicture });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Refresh JWT token
export const refreshToken = async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header' }, 400);
    }
    
    const currentToken = authHeader.split(' ')[1];
    const user = c.get('user');
    const tokenMetadata = c.get('tokenMetadata');
    const isGoogleAuth = c.get('isGoogleAuth');
    
    // Check if token is close to expiry (refresh if less than 24 hours remaining)
    const oneDay = 24 * 60 * 60; // 24 hours in seconds
    if (tokenMetadata.timeToExpiry > oneDay) {
      return c.json({ 
        message: 'Token still valid, refresh not needed',
        expiresIn: tokenMetadata.timeToExpiry 
      });
    }
    
    let newToken;
    
    if (isGoogleAuth) {
      // Refresh with Google auth context
      newToken = jwtTokenService.generateGoogleAuthToken(user, {
        accountLinked: user.authProvider === 'BOTH',
        newAccount: false
      });
    } else {
      // Refresh with email auth context
      newToken = jwtTokenService.generateEmailAuthToken(user);
    }
    
    const newTokenMetadata = jwtTokenService.getTokenMetadata(newToken);
    
    return c.json({
      token: newToken,
      expiresIn: newTokenMetadata.timeToExpiry,
      authProvider: user.authProvider,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Token refresh failed' }, 500);
  }
};

// Get user profile (public endpoint)
export const getUserProfile = async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    
    if (!userId || isNaN(userId)) {
      return c.json({ error: 'Invalid user ID' }, 400);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
        authProvider: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Add profile picture with fallback
    const userWithPicture = {
      ...user,
      profilePictureUrl: profilePictureService.getProfilePictureWithFallback(user)
    };
    
    return c.json({ user: userWithPicture });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
