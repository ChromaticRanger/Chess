import { Hono } from 'hono';
import { 
  createGame, 
  getUserGames, 
  getGameById,
  updateGame,
  deleteGame
} from '../controllers/games.js';
import { authMiddleware } from '../middleware/auth.js';

const router = new Hono();

// All game routes require authentication
router.use('*', authMiddleware);

router.post('/', createGame);
router.get('/', getUserGames);
router.get('/:id', getGameById);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

export default router;
