import { prisma } from '../index.js';

// Create a new position
export const createPosition = async (c) => {
  try {
    const user = c.get('user');
    const { name, description, fenString, moveHistory } = await c.req.json();
    
    // Check if required fields are present
    if (!name || !fenString || !moveHistory) {
      return c.json({ error: 'Name, FEN string, and move history are required' }, 400);
    }
    
    const position = await prisma.position.create({
      data: {
        name,
        description: description || '',
        fenString,
        moveHistory,
        userId: user.id
      }
    });
    
    return c.json({ position });
  } catch (error) {
    console.error('Create position error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Get all positions for the current user
export const getUserPositions = async (c) => {
  try {
    const user = c.get('user');
    
    const positions = await prisma.position.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' }
    });
    
    return c.json({ positions });
  } catch (error) {
    console.error('Get user positions error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Get a specific position by ID
export const getPositionById = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid position ID' }, 400);
    }
    
    const position = await prisma.position.findUnique({
      where: { id }
    });
    
    if (!position) {
      return c.json({ error: 'Position not found' }, 404);
    }
    
    if (position.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    return c.json({ position });
  } catch (error) {
    console.error('Get position by ID error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Update a position
export const updatePosition = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const { name, description, fenString, moveHistory } = await c.req.json();
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid position ID' }, 400);
    }
    
    // Check if position exists and belongs to user
    const existingPosition = await prisma.position.findUnique({
      where: { id }
    });
    
    if (!existingPosition) {
      return c.json({ error: 'Position not found' }, 404);
    }
    
    if (existingPosition.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Update position
    const position = await prisma.position.update({
      where: { id },
      data: {
        name: name || existingPosition.name,
        description: description !== undefined ? description : existingPosition.description,
        fenString: fenString || existingPosition.fenString,
        moveHistory: moveHistory || existingPosition.moveHistory
      }
    });
    
    return c.json({ position });
  } catch (error) {
    console.error('Update position error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Delete a position
export const deletePosition = async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({ error: 'Invalid position ID' }, 400);
    }
    
    // Check if position exists and belongs to user
    const existingPosition = await prisma.position.findUnique({
      where: { id }
    });
    
    if (!existingPosition) {
      return c.json({ error: 'Position not found' }, 404);
    }
    
    if (existingPosition.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    // Delete position
    await prisma.position.delete({
      where: { id }
    });
    
    return c.json({ message: 'Position deleted successfully' });
  } catch (error) {
    console.error('Delete position error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
