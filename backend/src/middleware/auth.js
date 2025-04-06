import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, username: true }
      });
      
      if (!user) {
        return c.json({ error: 'Unauthorized: User not found' }, 401);
      }
      
      c.set('user', user);
      await next();
    } catch (error) {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
