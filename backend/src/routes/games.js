import { Hono } from 'hono';
import {
  createGame,
  getUserGames,
  getGameById,
  updateGame,
  deleteGame
} from '../controllers/games.js';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = new Hono();

// All game routes require authentication
router.use('*', authMiddleware);

router.post('/', createGame);
router.get('/', getUserGames);
router.get('/:id', getGameById);
router.put('/:id', updateGame);
router.delete('/:id', deleteGame);

// GET /api/games/:gameId/evaluations - Get cached evaluations for a game
router.get('/:gameId/evaluations', async (c) => {
  try {
    const { gameId } = c.req.param();
    const user = c.get('user');

    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
      select: { evaluations: true, userId: true }
    });

    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }

    // Verify ownership
    if (game.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({ evaluations: game.evaluations || {} });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/games/:gameId/evaluations - Save/merge evaluations for a game
router.post('/:gameId/evaluations', async (c) => {
  try {
    const { gameId } = c.req.param();
    const user = c.get('user');
    const { evaluations } = await c.req.json();

    // Validate input
    if (!evaluations || typeof evaluations !== 'object') {
      return c.json({ error: 'evaluations must be an object' }, 400);
    }

    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
      select: { evaluations: true, userId: true }
    });

    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }

    // Verify ownership
    if (game.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Merge new evaluations with existing ones
    const existingEvaluations = game.evaluations || {};
    const mergedEvaluations = { ...existingEvaluations, ...evaluations };

    const updatedGame = await prisma.game.update({
      where: { id: parseInt(gameId) },
      data: { evaluations: mergedEvaluations }
    });

    return c.json({ success: true, evaluations: updatedGame.evaluations });
  } catch (error) {
    console.error('Error saving evaluations:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;
