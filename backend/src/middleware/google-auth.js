import { OAuth2Client } from 'google-auth-library';
import googleConfig from '../config/google.js';
import GoogleOAuthErrorHandler from '../services/error-handler.js';

const client = new OAuth2Client(googleConfig.clientId);

export const verifyGoogleToken = async (c, next) => {
  try {
    const authHeader = c.req.header('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return c.json({ error: 'Missing Google ID token' }, 401);
    }
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleConfig.clientId,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return c.json({ error: 'Invalid token payload' }, 401);
    }
    
    if (payload.aud !== googleConfig.clientId) {
      return c.json({ error: 'Invalid token audience' }, 401);
    }
    
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      return c.json({ error: 'Invalid token issuer' }, 401);
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return c.json({ error: 'Token has expired' }, 401);
    }
    
    c.set('googleUser', {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
      locale: payload.locale
    });
    
    await next();
  } catch (error) {
    GoogleOAuthErrorHandler.logError(error, 'google_token_verification', { 
      tokenPresent: !!token,
      tokenLength: token?.length 
    });
    
    const errorInfo = GoogleOAuthErrorHandler.handleOAuthError(error, 'google_token_verification');
    const errorResponse = GoogleOAuthErrorHandler.createErrorResponse(errorInfo);
    
    return c.json(errorResponse, errorInfo.statusCode);
  }
};

export const extractGoogleUser = (c) => {
  return c.get('googleUser');
};