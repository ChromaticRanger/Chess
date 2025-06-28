import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import jwtTokenService from '../services/jwt-token.js';

export const authMiddleware = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwtTokenService.verifyToken(token);
      
      // Get token metadata for additional security checks
      const tokenMetadata = jwtTokenService.getTokenMetadata(token);
      
      if (!tokenMetadata.valid || tokenMetadata.expired) {
        return c.json({ error: 'Unauthorized: Token expired or invalid' }, 401);
      }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          username: true,
          authProvider: true,
          profilePictureUrl: true,
          googleId: true
        }
      });
      
      if (!user) {
        return c.json({ error: 'Unauthorized: User not found' }, 401);
      }
      
      // Add token metadata to user context
      c.set('user', user);
      c.set('tokenMetadata', tokenMetadata);
      c.set('authProvider', decoded.authProvider);
      c.set('isGoogleAuth', tokenMetadata.hasGoogleAuth);
      
      await next();
    } catch (error) {
      console.error('Token verification error:', error);
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
