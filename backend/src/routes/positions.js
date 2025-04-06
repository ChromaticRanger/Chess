import { Hono } from 'hono';
import { 
  createPosition, 
  getUserPositions, 
  getPositionById,
  updatePosition,
  deletePosition
} from '../controllers/positions.js';
import { authMiddleware } from '../middleware/auth.js';

const router = new Hono();

// All position routes require authentication
router.use('*', authMiddleware);

router.post('/', createPosition);
router.get('/', getUserPositions);
router.get('/:id', getPositionById);
router.put('/:id', updatePosition);
router.delete('/:id', deletePosition);

export default router;
