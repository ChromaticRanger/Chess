import { ref, computed } from 'vue';

export function useFormValidation() {
  // Validation state
  const validationErrors = ref({});
  const isValidating = ref(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {object} Validation result
   */
  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {number} minLength - Minimum password length (default: 8)
   * @returns {object} Validation result
   */
  const validatePassword = (password, minLength = 8) => {
    if (!password || password.trim() === '') {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < minLength) {
      return { isValid: false, error: `Password must be at least ${minLength} characters long` };
    }
    return { isValid: true, error: null };
  };

  /**
   * Validate password confirmation
   * @param {string} password - Original password
   * @param {string} confirmPassword - Password confirmation
   * @returns {object} Validation result
   */
  const validatePasswordConfirmation = (password, confirmPassword) => {
    if (!confirmPassword || confirmPassword.trim() === '') {
      return { isValid: false, error: 'Password confirmation is required' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @param {number} minLength - Minimum username length (default: 3)
   * @returns {object} Validation result
   */
  const validateUsername = (username, minLength = 3) => {
    if (!username || username.trim() === '') {
      return { isValid: false, error: 'Username is required' };
    }
    if (username.trim().length < minLength) {
      return { isValid: false, error: `Username must be at least ${minLength} characters long` };
    }
    // Username should not contain spaces or special characters
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Check if any form fields have content
   * @param {object} fields - Object with field values
   * @returns {boolean} True if any field has content
   */
  const hasFormContent = (fields) => {
    return Object.values(fields).some(value => 
      value && typeof value === 'string' && value.trim() !== ''
    );
  };

  /**
   * Validate authentication state conflicts
   * @param {boolean} isTraditionalLoading - Traditional auth loading state
   * @param {boolean} isGoogleLoading - Google auth loading state
   * @param {string} authType - Type of authentication being attempted
   * @returns {object} Validation result
   */
  const validateAuthStateConflict = (isTraditionalLoading, isGoogleLoading, authType) => {
    if (authType === 'traditional' && isGoogleLoading) {
      return {
        isValid: false,
        error: 'Google authentication is in progress. Please wait or cancel to use email/password authentication.'
      };
    }
    
    if (authType === 'google' && isTraditionalLoading) {
      return {
        isValid: false,
        error: 'Email/password authentication is in progress. Please wait to use Google authentication.'
      };
    }
    
    return { isValid: true, error: null };
  };

  /**
   * Validate complete login form
   * @param {object} formData - Form data object
   * @param {object} loadingStates - Loading states object
   * @returns {object} Validation result
   */
  const validateLoginForm = (formData, loadingStates = {}) => {
    const errors = {};
    let isValid = true;

    // Check for auth state conflicts
    const authConflict = validateAuthStateConflict(
      loadingStates.isTraditionalLoading,
      loadingStates.isGoogleLoading,
      'traditional'
    );
    if (!authConflict.isValid) {
      return { isValid: false, error: authConflict.error, fieldErrors: {} };
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
      isValid = false;
    }

    return {
      isValid,
      error: isValid ? null : 'Please fix the errors below',
      fieldErrors: errors
    };
  };

  /**
   * Validate complete signup form
   * @param {object} formData - Form data object
   * @param {object} loadingStates - Loading states object
   * @returns {object} Validation result
   */
  const validateSignupForm = (formData, loadingStates = {}) => {
    const errors = {};
    let isValid = true;

    // Check for auth state conflicts
    const authConflict = validateAuthStateConflict(
      loadingStates.isTraditionalLoading,
      loadingStates.isGoogleLoading,
      'traditional'
    );
    if (!authConflict.isValid) {
      return { isValid: false, error: authConflict.error, fieldErrors: {} };
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
      isValid = false;
    }

    // Validate username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.error;
      isValid = false;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
      isValid = false;
    }

    // Validate password confirmation
    const confirmPasswordValidation = validatePasswordConfirmation(
      formData.password,
      formData.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      errors.confirmPassword = confirmPasswordValidation.error;
      isValid = false;
    }

    return {
      isValid,
      error: isValid ? null : 'Please fix the errors below',
      fieldErrors: errors
    };
  };

  /**
   * Clear all validation errors
   */
  const clearValidationErrors = () => {
    validationErrors.value = {};
  };

  /**
   * Set validation errors
   * @param {object} errors - Errors object
   */
  const setValidationErrors = (errors) => {
    validationErrors.value = errors;
  };

  // Computed property to check if form has any validation errors
  const hasValidationErrors = computed(() => {
    return Object.keys(validationErrors.value).length > 0;
  });

  return {
    // State
    validationErrors,
    isValidating,
    hasValidationErrors,

    // Individual validators
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validateUsername,
    validateAuthStateConflict,

    // Form validators
    validateLoginForm,
    validateSignupForm,

    // Utilities
    hasFormContent,
    clearValidationErrors,
    setValidationErrors
  };
}