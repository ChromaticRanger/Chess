class GoogleOAuthErrorHandler {
  /**
   * Handle Google OAuth errors with user-friendly messages
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @returns {Object} Formatted error response
   */
  static handleOAuthError(error, context = 'oauth') {
    console.error(`Google OAuth error in ${context}:`, error);

    // Token verification errors
    if (error.message.includes('Token used too late') || 
        error.message.includes('Token has expired')) {
      return {
        code: 'TOKEN_EXPIRED',
        message: 'Your Google authentication has expired. Please sign in again.',
        userAction: 'retry_auth',
        statusCode: 401
      };
    }

    if (error.message.includes('Invalid token signature') ||
        error.message.includes('Wrong number of segments') ||
        error.message.includes('Malformed token')) {
      return {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token. Please try signing in again.',
        userAction: 'retry_auth',
        statusCode: 401
      };
    }

    if (error.message.includes('Invalid token audience') ||
        error.message.includes('Invalid token issuer')) {
      return {
        code: 'TOKEN_SECURITY_ERROR',
        message: 'Authentication token security validation failed. Please try again.',
        userAction: 'retry_auth',
        statusCode: 401
      };
    }

    // Network and API errors
    if (error.message.includes('Failed to download image') ||
        error.message.includes('Download stream error')) {
      return {
        code: 'PROFILE_PICTURE_DOWNLOAD_FAILED',
        message: 'Could not download your Google profile picture, but your account was created successfully.',
        userAction: 'continue',
        statusCode: 200,
        severity: 'warning'
      };
    }

    if (error.message.includes('Profile fetch failed') ||
        error.message.includes('Token exchange failed')) {
      return {
        code: 'GOOGLE_API_ERROR',
        message: 'Unable to connect to Google services. Please check your internet connection and try again.',
        userAction: 'retry_auth',
        statusCode: 503
      };
    }

    if (error.message.includes('Code exchange failed')) {
      return {
        code: 'OAUTH_CODE_EXCHANGE_FAILED',
        message: 'Authentication with Google failed. Please try signing in again.',
        userAction: 'retry_auth',
        statusCode: 400
      };
    }

    // Account linking errors
    if (error.message.includes('Email addresses do not match')) {
      return {
        code: 'EMAIL_MISMATCH',
        message: 'The email address from Google does not match your account. Please use the correct Google account.',
        userAction: 'use_correct_account',
        statusCode: 400
      };
    }

    if (error.message.includes('Google account is already linked')) {
      return {
        code: 'ACCOUNT_ALREADY_LINKED',
        message: 'This Google account is already linked to another user account.',
        userAction: 'contact_support',
        statusCode: 409
      };
    }

    if (error.message.includes('Cannot unlink Google account')) {
      return {
        code: 'CANNOT_UNLINK_GOOGLE',
        message: 'Cannot unlink Google account as it\'s your only sign-in method. Please set a password first.',
        userAction: 'set_password',
        statusCode: 400
      };
    }

    // Database and server errors
    if (error.message.includes('Unique constraint failed') ||
        error.message.includes('duplicate key value')) {
      return {
        code: 'DUPLICATE_ACCOUNT',
        message: 'An account with this email address already exists. Please try signing in instead.',
        userAction: 'try_login',
        statusCode: 409
      };
    }

    if (error.message.includes('Connection refused') ||
        error.message.includes('ECONNREFUSED')) {
      return {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Unable to connect to our servers. Please try again in a moment.',
        userAction: 'retry_later',
        statusCode: 503
      };
    }

    // File system errors
    if (error.message.includes('ENOSPC') || error.message.includes('No space left')) {
      return {
        code: 'STORAGE_FULL',
        message: 'Server storage is full. Your account was created but profile picture could not be saved.',
        userAction: 'continue',
        statusCode: 200,
        severity: 'warning'
      };
    }

    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      return {
        code: 'PERMISSION_ERROR',
        message: 'Server permission error. Your account was created but some features may not work properly.',
        userAction: 'continue',
        statusCode: 200,
        severity: 'warning'
      };
    }

    // Rate limiting errors
    if (error.message.includes('Too Many Requests') ||
        error.message.includes('Rate limit exceeded')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please wait a few minutes before trying again.',
        userAction: 'wait_and_retry',
        statusCode: 429
      };
    }

    // Google service unavailable
    if (error.message.includes('Service Unavailable') ||
        error.message.includes('Bad Gateway')) {
      return {
        code: 'GOOGLE_SERVICE_UNAVAILABLE',
        message: 'Google authentication services are temporarily unavailable. Please try again later.',
        userAction: 'retry_later',
        statusCode: 503
      };
    }

    // Default fallback error
    return {
      code: 'UNKNOWN_OAUTH_ERROR',
      message: 'An unexpected error occurred during authentication. Please try again.',
      userAction: 'retry_auth',
      statusCode: 500,
      originalError: error.message
    };
  }

  /**
   * Handle validation errors
   * @param {string} field - Field that failed validation
   * @param {string} value - Value that failed validation
   * @param {string} reason - Reason for validation failure
   * @returns {Object} Formatted validation error
   */
  static handleValidationError(field, value, reason) {
    const errors = {
      email: {
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
        userAction: 'correct_email'
      },
      google_id: {
        code: 'INVALID_GOOGLE_ID',
        message: 'Invalid Google account information received.',
        userAction: 'retry_auth'
      },
      username: {
        code: 'INVALID_USERNAME',
        message: 'Username must be between 3 and 30 characters and contain only letters, numbers, and underscores.',
        userAction: 'correct_username'
      },
      client_id: {
        code: 'INVALID_CLIENT_ID',
        message: 'Google authentication is not properly configured. Please contact support.',
        userAction: 'contact_support'
      }
    };

    return {
      ...errors[field] || {
        code: 'VALIDATION_ERROR',
        message: `Invalid ${field}: ${reason}`,
        userAction: 'correct_input'
      },
      field,
      statusCode: 400
    };
  }

  /**
   * Handle configuration errors
   * @param {string} config - Configuration item that failed
   * @returns {Object} Formatted configuration error
   */
  static handleConfigurationError(config) {
    return {
      code: 'CONFIGURATION_ERROR',
      message: 'Google authentication is not properly configured. Please contact support.',
      userAction: 'contact_support',
      statusCode: 500,
      configItem: config
    };
  }

  /**
   * Create standardized error response
   * @param {Object} errorInfo - Error information from handler methods
   * @param {string} requestId - Optional request ID for tracking
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(errorInfo, requestId = null) {
    const response = {
      error: true,
      code: errorInfo.code,
      message: errorInfo.message,
      userAction: errorInfo.userAction,
      timestamp: new Date().toISOString()
    };

    if (requestId) {
      response.requestId = requestId;
    }

    if (errorInfo.severity) {
      response.severity = errorInfo.severity;
    }

    if (errorInfo.field) {
      response.field = errorInfo.field;
    }

    // Include original error in development only
    if (process.env.NODE_ENV === 'development' && errorInfo.originalError) {
      response.originalError = errorInfo.originalError;
    }

    return response;
  }

  /**
   * Log error with context
   * @param {Error} error - Original error
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional metadata
   */
  static logError(error, context, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      metadata
    };

    console.error('Google OAuth Error:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Check if error is retryable
   * @param {Object} errorInfo - Error information
   * @returns {boolean} True if error is retryable
   */
  static isRetryableError(errorInfo) {
    const retryableCodes = [
      'GOOGLE_API_ERROR',
      'GOOGLE_SERVICE_UNAVAILABLE',
      'DATABASE_CONNECTION_ERROR',
      'PROFILE_PICTURE_DOWNLOAD_FAILED'
    ];

    return retryableCodes.includes(errorInfo.code);
  }

  /**
   * Get retry delay for retryable errors
   * @param {Object} errorInfo - Error information
   * @param {number} attemptNumber - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  static getRetryDelay(errorInfo, attemptNumber = 1) {
    if (!this.isRetryableError(errorInfo)) {
      return 0;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }
}

export default GoogleOAuthErrorHandler;