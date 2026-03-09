import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../index.js';

const router = new Hono();

// All settings routes require authentication
router.use('*', authMiddleware);

// GET /api/settings - Fetch user settings (create default if not exists)
router.get('/', async (c) => {
  try {
    const user = c.get('user');

    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id }
      });
    }

    return c.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PATCH /api/settings - Update user settings
router.patch('/', async (c) => {
  try {
    const user = c.get('user');
    const { analysisDepth } = await c.req.json();

    // Validate analysisDepth if provided
    if (analysisDepth !== undefined) {
      if (typeof analysisDepth !== 'number' || analysisDepth < 8 || analysisDepth > 25) {
        return c.json({ error: 'analysisDepth must be a number between 8 and 25' }, 400);
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { analysisDepth },
      create: { userId: user.id, analysisDepth }
    });

    return c.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;
