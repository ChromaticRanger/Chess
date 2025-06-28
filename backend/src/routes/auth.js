import { Hono } from 'hono';
import { register, login, getCurrentUser, googleLogin, googleSignup, getUserProfile, refreshToken } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { verifyGoogleToken } from '../middleware/google-auth.js';
import { validateGoogleAuthRequest, googleOAuthRateLimit, validateGoogleOAuthConfig } from '../middleware/validation.js';

const router = new Hono();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes with comprehensive validation and error handling
router.post('/google/login', 
  validateGoogleOAuthConfig,
  googleOAuthRateLimit(),
  validateGoogleAuthRequest,
  verifyGoogleToken, 
  googleLogin
);
router.post('/google/signup', 
  validateGoogleOAuthConfig,
  googleOAuthRateLimit(),
  validateGoogleAuthRequest,
  verifyGoogleToken, 
  googleSignup
);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/refresh', authMiddleware, refreshToken);
router.get('/profile/:userId', getUserProfile);

export default router;
