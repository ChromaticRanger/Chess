import GoogleOAuthErrorHandler from '../services/error-handler.js';

export const validateGoogleAuthRequest = async (c, next) => {
  try {
    const authHeader = c.req.header('authorization');
    
    // Check if authorization header exists
    if (!authHeader) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'authorization', 
        null, 
        'Missing authorization header'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    // Check if header has correct format
    if (!authHeader.startsWith('Bearer ')) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'authorization', 
        authHeader, 
        'Authorization header must start with "Bearer "'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token exists
    if (!token) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'token', 
        null, 
        'Missing Google ID token'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    // Basic token format validation (JWT should have 3 parts)
    if (token.split('.').length !== 3) {
      const errorInfo = GoogleOAuthErrorHandler.handleValidationError(
        'token', 
        token.substring(0, 20) + '...', 
        'Invalid JWT token format'
      );
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    await next();
  } catch (error) {
    GoogleOAuthErrorHandler.logError(error, 'google_auth_validation');
    const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'validation');
    return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
  }
};

export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsernameFormat = (username) => {
  // Username: 3-30 characters, letters, numbers, underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

export const validateGoogleUserData = (googleUser) => {
  const errors = [];
  
  if (!googleUser) {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'google_user', 
      null, 
      'Missing Google user data'
    ));
    return errors;
  }
  
  // Validate Google ID
  if (!googleUser.googleId) {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'google_id', 
      null, 
      'Missing Google ID'
    ));
  }
  
  // Validate email
  if (!googleUser.email) {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'email', 
      null, 
      'Missing email address'
    ));
  } else if (!validateEmailFormat(googleUser.email)) {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'email', 
      googleUser.email, 
      'Invalid email format'
    ));
  }
  
  // Validate name (optional but should be string if present)
  if (googleUser.name && typeof googleUser.name !== 'string') {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'name', 
      googleUser.name, 
      'Name must be a string'
    ));
  }
  
  // Validate picture URL format (optional)
  if (googleUser.picture && typeof googleUser.picture !== 'string') {
    errors.push(GoogleOAuthErrorHandler.handleValidationError(
      'picture', 
      googleUser.picture, 
      'Picture URL must be a string'
    ));
  }
  
  return errors;
};

// Rate limiting middleware for Google OAuth endpoints
export const googleOAuthRateLimit = () => {
  const attempts = new Map();
  const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 10; // Max 10 attempts per window
  
  return async (c, next) => {
    try {
      const clientIP = c.req.header('x-forwarded-for') || 
                       c.req.header('x-real-ip') || 
                       'unknown';
      
      const now = Date.now();
      const windowStart = now - WINDOW_SIZE;
      
      // Clean old entries
      for (const [ip, data] of attempts.entries()) {
        if (data.lastAttempt < windowStart) {
          attempts.delete(ip);
        }
      }
      
      // Check current attempts
      const clientAttempts = attempts.get(clientIP) || { count: 0, lastAttempt: now };
      
      if (clientAttempts.lastAttempt < windowStart) {
        // Reset if outside window
        clientAttempts.count = 1;
        clientAttempts.lastAttempt = now;
      } else {
        // Increment if within window
        clientAttempts.count++;
        clientAttempts.lastAttempt = now;
      }
      
      attempts.set(clientIP, clientAttempts);
      
      if (clientAttempts.count > MAX_ATTEMPTS) {
        const errorInfo = {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
          userAction: 'wait_and_retry',
          statusCode: 429
        };
        
        GoogleOAuthErrorHandler.logError(
          new Error('Rate limit exceeded'), 
          'rate_limiting', 
          { clientIP, attempts: clientAttempts.count }
        );
        
        return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), 429);
      }
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', MAX_ATTEMPTS.toString());
      c.header('X-RateLimit-Remaining', (MAX_ATTEMPTS - clientAttempts.count).toString());
      c.header('X-RateLimit-Reset', (windowStart + WINDOW_SIZE).toString());
      
      await next();
    } catch (error) {
      GoogleOAuthErrorHandler.logError(error, 'rate_limiting');
      // Continue with request if rate limiting fails
      await next();
    }
  };
};

// Middleware to validate Google OAuth configuration
export const validateGoogleOAuthConfig = async (c, next) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      const errorInfo = GoogleOAuthErrorHandler.handleConfigurationError('GOOGLE_CLIENT_ID');
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      const errorInfo = GoogleOAuthErrorHandler.handleConfigurationError('GOOGLE_CLIENT_SECRET');
      return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
    }
    
    await next();
  } catch (error) {
    GoogleOAuthErrorHandler.logError(error, 'config_validation');
    const errorInfo = GoogleOAuthErrorHandler.handleConfigurationError('general');
    return c.json(GoogleOAuthErrorHandler.createErrorResponse(errorInfo), errorInfo.statusCode);
  }
};