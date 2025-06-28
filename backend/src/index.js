import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/serve-static';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';

// Initialize Prisma client
export const prisma = new PrismaClient();

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*', // Allow all origins temporarily for debugging
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  console.log('Health check endpoint accessed');
  return c.json({ message: 'Chess API is running' });
});

// Test route
app.get('/api/test', (c) => {
  console.log('Test endpoint accessed');
  return c.json({ success: true, message: 'API is working properly' });
});

// Static file serving for profile pictures
app.use('/uploads/*', serveStatic({ root: './' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/games', gameRoutes);

// Error handling
app.onError((err, c) => {
  console.error('Global error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = process.env.PORT || 3000;

console.log('Starting server with PostgreSQL database');

serve({
  fetch: app.fetch,
  port
}, () => {
  console.log(`Server is running on port ${port}`);
});