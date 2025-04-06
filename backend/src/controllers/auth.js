import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// Register a new user
export const register = async (c) => {
  try {
    const { email, username, password } = await c.req.json();
    
    // Check if required fields are present
    if (!email || !username || !password) {
      return c.json({ error: 'Email, username and password are required' }, 400);
    }
    
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return c.json({ error: 'Email already in use' }, 400);
      }
      if (existingUser.username === username) {
        return c.json({ error: 'Username already taken' }, 400);
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return c.json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Login a user
export const login = async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Check if required fields are present
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};

// Get the current user
export const getCurrentUser = async (c) => {
  try {
    const user = c.get('user');
    return c.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
};
