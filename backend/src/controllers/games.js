import { prisma } from '../index.js';

// Create a new game
export const createGame = async (c) => {
  try {
    const user = c.get('user');
    const { name, description, moveHistory } = await c.req.json();
    
    // Check if required fields are present
    if (!name || !moveHistory) {
      return c.json({ error: 'Name and move history are required' }, 400);
    }
    
    const game = await prisma.game.create({
      data: {
        name,
        description: description || '',
        moveHistory,
        userId: user.id
      }
    });
    
    return c.json({ game });
  } catch (error) {
    console.error('Create game error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Get all games for the current user
export const getUserGames = async (c) => {
  try {
    const user = c.get('user');
    
    const games = await prisma.game.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    });
    
    return c.json({ games });
  } catch (error) {
    console.error('Get user games error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Get a specific game by ID
export const getGameById = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid game ID' }, 400);
    }
    
    const game = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!game) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    if (game.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    return c.json({ game });
  } catch (error) {
    console.error('Get game by ID error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Update a game
export const updateGame = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const { name, description, moveHistory } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid game ID' }, 400);
    }
    
    // Check if game exists and belongs to user
    const existingGame = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!existingGame) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    if (existingGame.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Update game
    const game = await prisma.game.update({
      where: { id },
      data: {
        name: name || existingGame.name,
        description: description !== undefined ? description : existingGame.description,
        moveHistory: moveHistory || existingGame.moveHistory
      }
    });
    
    return c.json({ game });
  } catch (error) {
    console.error('Update game error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Delete a game
export const deleteGame = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid game ID' }, 400);
    }
    
    // Check if game exists and belongs to user
    const existingGame = await prisma.game.findUnique({
      where: { id }
    });
    
    if (!existingGame) {
      return c.json({ error: 'Game not found' }, 404);
    }
    
    if (existingGame.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Delete game
    await prisma.game.delete({
      where: { id }
    });
    
    return c.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
