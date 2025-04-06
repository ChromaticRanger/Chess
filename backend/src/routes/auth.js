import { Hono } from 'hono';
import { register, login, getCurrentUser } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/auth.js';

const router = new Hono();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export default router;
